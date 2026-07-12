package com.novigo.api.wallet;

import com.novigo.common.api.PageResponse;
import com.novigo.common.api.Specs;
import com.novigo.common.exception.ApiException;
import com.novigo.common.exception.NotFoundException;
import com.novigo.domain.identity.UserRepository;
import com.novigo.domain.wallet.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

@Tag(name = "Finance — Wallet")
@RestController
@RequestMapping("/api/v1/wallets")
@RequiredArgsConstructor
public class WalletController {

    private final WalletRepository repository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final WalletService walletService;

    public record WalletView(UUID id, UUID ownerId, String ownerRole, long balance, long pendingBalance,
                             String currency, boolean frozen) {}

    public record WalletCreate(@NotNull UUID ownerId, @Size(max = 24) String ownerRole,
                               @Size(max = 8) String currency) {}

    public record MoneyOp(@Positive long amount, @Size(max = 24) String type,
                          @Size(max = 240) String description, @Size(max = 40) String provider) {}

    public record WithdrawOp(@Positive long amount, @Size(max = 40) String method) {}

    public record TransferOp(@NotNull UUID fromWalletId, @NotNull UUID toWalletId,
                             @Positive long amount, @Size(max = 240) String reason) {}

    public record TransactionView(UUID id, UUID walletId, String type, String direction, long amount,
                                  long balanceAfter, String status, String reference, String description,
                                  String provider, Instant createdAt) {}

    @Operation(summary = "Lister les wallets (ADMIN)")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @GetMapping
    @Transactional(readOnly = true)
    public PageResponse<WalletView> list(
            @RequestParam(required = false) String ownerRole,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<Wallet> page = repository.findAll(Specs.all(Specs.eq("ownerRole", ownerRole)), pageable);
        return PageResponse.of(page, page.getContent().stream().map(this::toView).toList());
    }

    @Operation(summary = "Obtenir un wallet")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public WalletView get(@PathVariable UUID id) {
        return toView(find(id));
    }

    @Operation(summary = "Wallet d'un utilisateur")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/by-owner/{ownerId}")
    @Transactional(readOnly = true)
    public WalletView byOwner(@PathVariable UUID ownerId) {
        return toView(repository.findByOwnerId(ownerId)
                .orElseThrow(() -> NotFoundException.of("Wallet (propriétaire)", ownerId)));
    }

    @Operation(summary = "Créer un wallet (ADMIN)")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public WalletView create(@Valid @RequestBody WalletCreate req) {
        if (repository.findByOwnerId(req.ownerId()).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "Ce propriétaire a déjà un wallet.");
        }
        Wallet w = new Wallet();
        w.setOwner(userRepository.findById(req.ownerId())
                .orElseThrow(() -> NotFoundException.of("Utilisateur", req.ownerId())));
        if (req.ownerRole() != null) w.setOwnerRole(req.ownerRole());
        if (req.currency() != null) w.setCurrency(req.currency());
        return toView(repository.save(w));
    }

    @Operation(summary = "Créditer un wallet (recharge/cashback/reversement)")
    @PreAuthorize("isAuthenticated()")
    @PostMapping("/{id}/credit")
    public TransactionView credit(@PathVariable UUID id, @Valid @RequestBody MoneyOp op) {
        return toTx(walletService.credit(find(id), op.amount(),
                op.type() == null ? "CREDIT" : op.type(), op.description(), op.provider()));
    }

    @Operation(summary = "Débiter un wallet (paiement/retrait/commission)")
    @PreAuthorize("isAuthenticated()")
    @PostMapping("/{id}/debit")
    public TransactionView debit(@PathVariable UUID id, @Valid @RequestBody MoneyOp op) {
        return toTx(walletService.debit(find(id), op.amount(),
                op.type() == null ? "DEBIT" : op.type(), op.description(), op.provider()));
    }

    @Operation(summary = "Retrait (cash-out) depuis un wallet")
    @PreAuthorize("isAuthenticated()")
    @PostMapping("/{id}/withdraw")
    public TransactionView withdraw(@PathVariable UUID id, @Valid @RequestBody WithdrawOp op) {
        return toTx(walletService.withdraw(id, op.amount(), op.method()));
    }

    @Operation(summary = "Reversement / transfert entre deux wallets (ADMIN)")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @PostMapping("/transfer")
    public TransactionView transfer(@Valid @RequestBody TransferOp op) {
        return toTx(walletService.transfer(op.fromWalletId(), op.toWalletId(), op.amount(), op.reason()));
    }

    @Operation(summary = "Historique des transactions d'un wallet")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}/transactions")
    @Transactional(readOnly = true)
    public PageResponse<TransactionView> transactions(
            @PathVariable UUID id,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        Page<Transaction> page = transactionRepository.findByWalletId(id, pageable);
        return PageResponse.of(page, page.getContent().stream().map(this::toTx).toList());
    }

    @Operation(summary = "Geler / dégeler un wallet (ADMIN)")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    @PatchMapping("/{id}/freeze")
    @Transactional
    public WalletView setFrozen(@PathVariable UUID id, @RequestParam boolean frozen) {
        Wallet w = find(id);
        w.setFrozen(frozen);
        return toView(repository.save(w));
    }

    private Wallet find(UUID id) {
        return repository.findById(id).orElseThrow(() -> NotFoundException.of("Wallet", id));
    }

    private WalletView toView(Wallet w) {
        return new WalletView(w.getId(), w.getOwner() == null ? null : w.getOwner().getId(),
                w.getOwnerRole(), w.getBalance(), w.getPendingBalance(), w.getCurrency(), w.isFrozen());
    }

    private TransactionView toTx(Transaction t) {
        return new TransactionView(t.getId(), t.getWallet().getId(), t.getType(), t.getDirection(),
                t.getAmount(), t.getBalanceAfter(), t.getStatus(), t.getReference(), t.getDescription(),
                t.getProvider(), t.getCreatedAt());
    }
}
