package com.novigo.api.payment;

import com.novigo.api.payment.PaymentDtos.*;
import com.novigo.api.wallet.WalletService;
import com.novigo.common.api.PageResponse;
import com.novigo.common.api.Specs;
import com.novigo.common.exception.ApiException;
import com.novigo.common.exception.NotFoundException;
import com.novigo.domain.commerce.Order;
import com.novigo.domain.commerce.OrderRepository;
import com.novigo.domain.identity.User;
import com.novigo.domain.identity.UserRepository;
import com.novigo.domain.payment.*;
import com.novigo.domain.services.Booking;
import com.novigo.domain.services.BookingRepository;
import com.novigo.domain.wallet.Wallet;
import com.novigo.event.DomainEventPublisher;
import com.novigo.observability.AppMetrics;
import com.novigo.payment.PaymentProvider;
import com.novigo.payment.PaymentProviderRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Orchestration des paiements : initiation, confirmation (callback), échec, et effets métier. */
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository payments;
    private final PaymentProviderConfigRepository providerConfigs;
    private final PaymentProviderRegistry registry;
    private final WalletService walletService;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final BookingRepository bookingRepository;
    private final AppMetrics metrics;
    private final DomainEventPublisher events;

    // ------------------------------------------------------------ providers
    @Cacheable(value = "paymentProviders", key = "#includeDisabled")
    @Transactional(readOnly = true)
    public List<ProviderView> listProviders(boolean includeDisabled) {
        var configs = includeDisabled
                ? providerConfigs.findAllByOrderBySortOrderAsc()
                : providerConfigs.findByEnabledTrueOrderBySortOrderAsc();
        return configs.stream()
                .filter(c -> includeDisabled || registry.isImplemented(c.getCode()))
                .map(c -> new ProviderView(c.getCode(), c.getLabel(), c.isEnabled(), c.getSortOrder(), c.getFeeBps()))
                .toList();
    }

    @CacheEvict(value = "paymentProviders", allEntries = true)
    @Transactional
    public ProviderView toggleProvider(String code, boolean enabled) {
        PaymentProviderConfig cfg = providerConfigs.findByCode(code)
                .orElseThrow(() -> NotFoundException.of("Fournisseur", code));
        cfg.setEnabled(enabled);
        providerConfigs.save(cfg);
        return new ProviderView(cfg.getCode(), cfg.getLabel(), cfg.isEnabled(), cfg.getSortOrder(), cfg.getFeeBps());
    }

    // ------------------------------------------------------------ lifecycle
    @Transactional
    public InitiateResponse initiate(InitiateRequest req) {
        PaymentProvider provider = registry.resolveEnabled(req.provider());

        Payment p = new Payment();
        p.setRef(generateRef());
        p.setProvider(req.provider());
        p.setPurpose(req.purpose() == null ? "RECHARGE" : req.purpose());
        p.setAmount(req.amount());
        if (req.currency() != null) p.setCurrency(req.currency());
        p.setPayerId(req.payerId());
        p.setWalletId(req.walletId());
        p.setTargetType(req.targetType());
        p.setTargetId(req.targetId());
        p.setStatus("PENDING");

        var instruction = provider.initiate(new PaymentProvider.PaymentContext(
                p.getRef(), p.getAmount(), p.getCurrency(), p.getPurpose(), req.payerContact()));
        p.setExternalRef(instruction.externalRef());
        payments.save(p);
        metrics.paymentInitiated();

        return new InitiateResponse(toView(p), instruction.message(), instruction.checkoutUrl());
    }

    @Transactional
    public PaymentView confirm(UUID id) {
        Payment p = find(id);
        if ("PAID".equals(p.getStatus())) return toView(p); // idempotent
        if (!"PENDING".equals(p.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Paiement non confirmable (statut " + p.getStatus() + ").");
        }
        if (!registry.resolveEnabled(p.getProvider()).verify(p.getExternalRef())) {
            return fail(id, "Vérification fournisseur échouée");
        }
        p.setStatus("PAID");
        applyEffects(p);
        payments.save(p);
        metrics.paymentConfirmed();
        events.publish("payment.confirmed", Map.of(
                "ref", p.getRef(), "provider", p.getProvider(), "purpose", p.getPurpose(),
                "amount", p.getAmount(), "commission", p.getCommission()));
        return toView(p);
    }

    @Transactional
    public PaymentView fail(UUID id, String reason) {
        Payment p = find(id);
        p.setStatus("FAILED");
        p.setFailureReason(reason);
        return toView(payments.save(p));
    }

    private void applyEffects(Payment p) {
        switch (p.getPurpose()) {
            case "RECHARGE" -> {
                Wallet wallet = resolveRechargeWallet(p);
                if (wallet != null) {
                    walletService.credit(wallet, p.getAmount(), "RECHARGE",
                            "Recharge via " + p.getProvider(), p.getProvider());
                    walletService.applyCashback(wallet, p.getAmount());
                }
            }
            case "ORDER" -> {
                if (p.getTargetId() != null) {
                    Order order = orderRepository.findById(p.getTargetId())
                            .orElseThrow(() -> NotFoundException.of("Commande", p.getTargetId()));
                    order.setPaymentStatus("PAID");
                    order.setPaymentMethod(p.getProvider());
                    orderRepository.save(order);
                    p.setCommission(walletService.settleOrder(order));
                }
            }
            case "BOOKING" -> {
                if (p.getTargetId() != null) {
                    Booking booking = bookingRepository.findById(p.getTargetId())
                            .orElseThrow(() -> NotFoundException.of("Réservation", p.getTargetId()));
                    booking.setPaymentStatus("PAID");
                    bookingRepository.save(booking);
                }
            }
            default -> { /* SUBSCRIPTION ou autre : aucun effet wallet par défaut */ }
        }
    }

    private Wallet resolveRechargeWallet(Payment p) {
        if (p.getWalletId() != null) return walletService.find(p.getWalletId());
        if (p.getPayerId() != null) {
            User payer = userRepository.findById(p.getPayerId())
                    .orElseThrow(() -> NotFoundException.of("Payeur", p.getPayerId()));
            return walletService.getOrCreate(payer, "CLIENT");
        }
        return null;
    }

    // ------------------------------------------------------------ queries
    @Transactional(readOnly = true)
    public PageResponse<PaymentView> list(String status, String provider, String purpose, Pageable pageable) {
        Page<Payment> page = payments.findAll(Specs.all(
                Specs.eq("status", status), Specs.eq("provider", provider),
                Specs.eq("purpose", purpose)), pageable);
        return PageResponse.of(page, page.getContent().stream().map(this::toView).toList());
    }

    @Transactional(readOnly = true)
    public PaymentView get(UUID id) {
        return toView(find(id));
    }

    private Payment find(UUID id) {
        return payments.findById(id).orElseThrow(() -> NotFoundException.of("Paiement", id));
    }

    private String generateRef() {
        String ref;
        do {
            ref = "PAY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        } while (payments.existsByRef(ref));
        return ref;
    }

    private PaymentView toView(Payment p) {
        return new PaymentView(p.getId(), p.getRef(), p.getProvider(), p.getPurpose(), p.getAmount(),
                p.getCurrency(), p.getStatus(), p.getPayerId(), p.getWalletId(), p.getTargetType(),
                p.getTargetId(), p.getExternalRef(), p.getCommission(), p.getFailureReason(), p.getCreatedAt());
    }
}
