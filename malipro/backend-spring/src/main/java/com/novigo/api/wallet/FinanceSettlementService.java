package com.novigo.api.wallet;

import com.novigo.api.loyalty.LoyaltyService;
import com.novigo.config.NovigoProperties;
import com.novigo.domain.identity.User;
import com.novigo.domain.wallet.Wallet;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

/**
 * Règlement financier cross-backend (ADR-5 + P1). Consomme les événements de domaine émis par
 * NestJS (schéma ops) et crédite les wallets Spring (schéma finance) en projetant les identités
 * Nest à la volée. Démontre : commande créée dans Nest -> commerçant crédité dans Spring.
 */
@Service
@RequiredArgsConstructor
public class FinanceSettlementService {

    private static final Logger log = LoggerFactory.getLogger(FinanceSettlementService.class);

    private final UserProjectionService users;
    private final WalletService wallets;
    private final LoyaltyService loyalty;
    private final NovigoProperties props;

    /** order.created (Nest) -> crédite le wallet commerçant (vente - commission plateforme). */
    @Transactional
    public void onOrderCreated(Map<String, Object> d) {
        UUID merchantUserId = uuid(d.get("merchantUserId"));
        UUID customerId = uuid(d.get("customerId"));
        long subtotal = num(d.get("subtotal"));
        String ref = str(d.get("reference"));

        if (merchantUserId == null || subtotal <= 0) {
            log.warn("[settlement] {} ignoré (merchantUserId/subtotal manquant)", ref);
            return;
        }

        long commission = subtotal * props.getPayments().getCommissionBps() / 10_000L;
        long net = subtotal - commission;

        User merchant = users.ensure(merchantUserId, str(d.get("merchantPhone")), "Commerçant");
        Wallet mw = wallets.getOrCreate(merchant, "MERCHANT");
        if (net > 0) {
            wallets.credit(mw, net, "SALE", "Vente commande " + ref, null);
        }

        // Projette aussi le client + son wallet (cohérence, futur débit/cashback)
        // et lui crédite des points de fidélité pour cette commande (gain sur order.created).
        if (customerId != null) {
            User customer = users.ensure(customerId, str(d.get("customerPhone")), "Client");
            wallets.getOrCreate(customer, "CUSTOMER");
            long spent = num(d.get("total"));
            loyalty.creditForOrder(customerId, spent > 0 ? spent : subtotal, ref);
        }

        log.info("[settlement] {} : commerçant +{} XOF (commission {}), solde={}",
                ref, net, commission, mw.getBalance());
    }

    /** delivery.completed (Nest) -> crédite le wallet livreur des frais de livraison. */
    @Transactional
    public void onDeliveryCompleted(Map<String, Object> d) {
        UUID driverUserId = uuid(d.get("driverUserId"));
        long fee = num(d.get("deliveryFee"));
        String ref = str(d.get("reference"));

        if (driverUserId == null || fee <= 0) {
            log.warn("[settlement] livraison {} ignorée (driverUserId/deliveryFee manquant)", ref);
            return;
        }

        User driver = users.ensure(driverUserId, str(d.get("driverPhone")), "Livreur");
        Wallet dw = wallets.getOrCreate(driver, "DRIVER");
        wallets.credit(dw, fee, "DELIVERY_FEE", "Livraison commande " + ref, null);

        log.info("[settlement] {} : livreur +{} XOF, solde={}", ref, fee, dw.getBalance());
    }

    /**
     * delivery.compensated (Nest) -> indemnise le livreur d'une course annulée
     * pour absence du client (cahier des charges v0.75 §3).
     *
     * La course n'a pas été livrée : il n'y a donc aucun frais de livraison à
     * verser, mais le déplacement et l'attente sont dus. On crédite sous une
     * nature distincte (WAIT_COMPENSATION) pour que la comptabilité ne confonde
     * jamais une indemnité avec le produit d'une livraison.
     */
    @Transactional
    public void onDeliveryCompensated(Map<String, Object> d) {
        UUID driverUserId = uuid(d.get("driverUserId"));
        long amount = num(d.get("amount"));
        String ref = str(d.get("reference"));

        if (driverUserId == null || amount <= 0) {
            log.warn("[settlement] compensation {} ignorée (driverUserId/amount manquant)", ref);
            return;
        }

        User driver = users.ensure(driverUserId, str(d.get("driverPhone")), "Livreur");
        Wallet dw = wallets.getOrCreate(driver, "DRIVER");
        wallets.credit(dw, amount, "WAIT_COMPENSATION",
                "Attente client absent — commande " + ref, null);

        log.info("[settlement] {} : livreur indemnisé +{} XOF (attente {} min), solde={}",
                ref, amount, num(d.get("waitedMinutes")), dw.getBalance());
    }

    // ------------------------------------------------------------ helpers
    private static UUID uuid(Object o) {
        try { return o == null ? null : UUID.fromString(o.toString()); }
        catch (IllegalArgumentException e) { return null; }
    }

    private static long num(Object o) {
        if (o instanceof Number n) return n.longValue();
        try { return o == null ? 0 : Long.parseLong(o.toString()); }
        catch (NumberFormatException e) { return 0; }
    }

    private static String str(Object o) { return o == null ? null : o.toString(); }
}
