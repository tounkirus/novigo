package com.novigo.api.loyalty;

import com.novigo.common.exception.ApiException;
import com.novigo.common.exception.NotFoundException;
import com.novigo.domain.loyalty.LoyaltyAccount;
import com.novigo.domain.loyalty.LoyaltyAccountRepository;
import com.novigo.domain.loyalty.LoyaltyEntry;
import com.novigo.domain.loyalty.LoyaltyEntryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Fidélité NOVIGO (schéma finance). Solde de points par utilisateur, registre des mouvements,
 * catalogue de récompenses et échange. Les points sont crédités par les flux commande (futur) ;
 * ici l'API expose lecture (solde/palier/historique/récompenses) + échange atomique.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LoyaltyService {

    private final LoyaltyAccountRepository accounts;
    private final LoyaltyEntryRepository ledger;

    // Paliers (seuils de points) : Bronze < 500 <= Argent < 2000 <= Or.
    private static final int SILVER_AT = 500;
    private static final int GOLD_AT = 2000;

    // Barème de gain : 1 point par tranche de 100 XOF dépensés.
    private static final long EARN_PER_XOF = 100;

    // Catalogue de récompenses (échangeables contre des points).
    public record Reward(String id, String title, int cost) {}
    private static final List<Reward> REWARDS = List.of(
            new Reward("free_delivery", "Livraison offerte", 200),
            new Reward("discount_1000", "-1 000 FCFA", 500),
            new Reward("free_drink", "Boisson offerte", 350),
            new Reward("voucher_5000", "Bon de 5 000 FCFA", 2000)
    );

    public record AccountView(int points, String tier, int nextTierPoints, String nextTier, int toNext) {}
    public record EntryView(int delta, String label, Instant createdAt) {}
    public record RewardView(String id, String title, int cost, boolean affordable) {}

    @Transactional
    public LoyaltyAccount getOrCreate(UUID userId) {
        return accounts.findByUserId(userId).orElseGet(() -> {
            LoyaltyAccount a = new LoyaltyAccount();
            a.setUserId(userId);
            a.setPoints(0);
            a.setTier("BRONZE");
            return accounts.save(a);
        });
    }

    /**
     * Gain de points sur commande (consommé du bus order.created). Idempotent : une même
     * commande (référence) ne crédite qu'une fois, même en cas de redelivery RabbitMQ.
     */
    @Transactional
    public void creditForOrder(UUID userId, long amount, String reference) {
        if (userId == null || amount <= 0) return;
        int points = (int) (amount / EARN_PER_XOF);
        if (points <= 0) return;
        String label = "Commande " + (reference == null ? "" : reference);
        if (ledger.existsByUserIdAndLabel(userId, label)) {
            log.info("[loyalty] {} déjà crédité pour {}, ignoré", reference, userId);
            return;
        }
        LoyaltyAccount account = getOrCreate(userId);
        account.setPoints(account.getPoints() + points);
        account.setTier(tierFor(account.getPoints()));
        accounts.save(account);

        LoyaltyEntry entry = new LoyaltyEntry();
        entry.setUserId(userId);
        entry.setDelta(points);
        entry.setLabel(label);
        ledger.save(entry);

        log.info("[loyalty] {} : client +{} pts (solde={}, palier={})",
                reference, points, account.getPoints(), account.getTier());
    }

    @Transactional
    public AccountView me(UUID userId) {
        return view(getOrCreate(userId));
    }

    @Transactional(readOnly = true)
    public List<EntryView> history(UUID userId) {
        return ledger.findTop50ByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(e -> new EntryView(e.getDelta(), e.getLabel(), e.getCreatedAt()))
                .toList();
    }

    @Transactional
    public List<RewardView> rewards(UUID userId) {
        int pts = getOrCreate(userId).getPoints();
        return REWARDS.stream()
                .map(r -> new RewardView(r.id(), r.title(), r.cost(), pts >= r.cost()))
                .toList();
    }

    @Transactional
    public AccountView redeem(UUID userId, String rewardId) {
        Reward reward = REWARDS.stream().filter(r -> r.id().equals(rewardId)).findFirst()
                .orElseThrow(() -> NotFoundException.of("Récompense", rewardId));
        LoyaltyAccount account = getOrCreate(userId);
        if (account.getPoints() < reward.cost()) {
            throw new ApiException(HttpStatus.CONFLICT, "Points insuffisants pour « " + reward.title() + " »");
        }
        account.setPoints(account.getPoints() - reward.cost());
        account.setTier(tierFor(account.getPoints()));
        accounts.save(account);

        LoyaltyEntry entry = new LoyaltyEntry();
        entry.setUserId(userId);
        entry.setDelta(-reward.cost());
        entry.setLabel("Échange · " + reward.title());
        ledger.save(entry);

        return view(account);
    }

    // ------------------------------------------------------------ helpers
    private AccountView view(LoyaltyAccount a) {
        int pts = a.getPoints();
        String tier = tierFor(pts);
        // Garde le palier stocké cohérent avec les points.
        if (!tier.equals(a.getTier())) {
            a.setTier(tier);
            accounts.save(a);
        }
        final int nextThreshold;
        final String nextTier;
        if (pts < SILVER_AT) {
            nextThreshold = SILVER_AT;
            nextTier = "SILVER";
        } else if (pts < GOLD_AT) {
            nextThreshold = GOLD_AT;
            nextTier = "GOLD";
        } else {
            nextThreshold = GOLD_AT;
            nextTier = "GOLD"; // palier max atteint
        }
        int toNext = Math.max(0, nextThreshold - pts);
        return new AccountView(pts, tier, nextThreshold, nextTier, toNext);
    }

    private static String tierFor(int points) {
        if (points >= GOLD_AT) return "GOLD";
        if (points >= SILVER_AT) return "SILVER";
        return "BRONZE";
    }
}
