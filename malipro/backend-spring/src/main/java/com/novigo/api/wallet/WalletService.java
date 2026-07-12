package com.novigo.api.wallet;

import com.novigo.common.exception.ApiException;
import com.novigo.common.exception.NotFoundException;
import com.novigo.config.NovigoProperties;
import com.novigo.domain.commerce.Order;
import com.novigo.domain.identity.User;
import com.novigo.domain.wallet.Transaction;
import com.novigo.domain.wallet.TransactionRepository;
import com.novigo.domain.wallet.Wallet;
import com.novigo.domain.wallet.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Cœur financier : primitives crédit/débit et opérations avancées
 * (retrait, reversement inter-rôles, cashback, règlement de commande avec commission).
 */
@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final NovigoProperties props;

    // ------------------------------------------------------------ primitives
    @Transactional
    public Transaction credit(Wallet w, long amount, String type, String description, String provider) {
        requirePositive(amount);
        if (w.isFrozen()) throw new ApiException(HttpStatus.CONFLICT, "Wallet gelé.");
        w.setBalance(w.getBalance() + amount);
        walletRepository.save(w);
        return record(w, "CREDIT", type, amount, description, provider);
    }

    @Transactional
    public Transaction debit(Wallet w, long amount, String type, String description, String provider) {
        requirePositive(amount);
        if (w.isFrozen()) throw new ApiException(HttpStatus.CONFLICT, "Wallet gelé.");
        if (w.getBalance() < amount) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "Solde insuffisant.");
        }
        w.setBalance(w.getBalance() - amount);
        walletRepository.save(w);
        return record(w, "DEBIT", type, amount, description, provider);
    }

    // ------------------------------------------------------------ advanced
    /** Retrait (cash-out) : débite le wallet et journalise l'opération. */
    @Transactional
    public Transaction withdraw(UUID walletId, long amount, String method) {
        Wallet w = find(walletId);
        return debit(w, amount, "WITHDRAWAL", "Retrait via " + (method == null ? "N/A" : method), method);
    }

    /** Reversement / transfert entre deux wallets (ex: plateforme → commerçant). */
    @Transactional
    public Transaction transfer(UUID fromId, UUID toId, long amount, String reason) {
        if (fromId.equals(toId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Wallets source et destination identiques.");
        }
        Wallet from = find(fromId);
        Wallet to = find(toId);
        Transaction out = debit(from, amount, "TRANSFER_OUT", reason, null);
        credit(to, amount, "TRANSFER_IN", reason, null);
        return out;
    }

    /** Cashback : crédite un pourcentage (cashbackBps) de la base au wallet. Renvoie le montant crédité. */
    @Transactional
    public long applyCashback(Wallet w, long base) {
        long cashback = base * props.getPayments().getCashbackBps() / 10_000;
        if (cashback > 0) {
            credit(w, cashback, "CASHBACK", "Cashback NOVIGO", null);
        }
        return cashback;
    }

    /**
     * Règlement d'une commande payée : commission plateforme retenue sur le sous-total,
     * net crédité au commerçant, frais de livraison crédités au livreur.
     * Renvoie la commission retenue.
     */
    @Transactional
    public long settleOrder(Order order) {
        long commission = order.getSubtotal() * props.getPayments().getCommissionBps() / 10_000;
        long merchantNet = order.getSubtotal() - commission;

        User merchant = order.getStore() == null ? null : order.getStore().getOwner();
        if (merchant != null && merchantNet > 0) {
            Wallet mw = getOrCreate(merchant, "MERCHANT");
            credit(mw, merchantNet, "SALE", "Vente commande " + order.getRef(), null);
        }
        if (order.getDriver() != null && order.getDriver().getUser() != null && order.getDeliveryFee() > 0) {
            Wallet dw = getOrCreate(order.getDriver().getUser(), "DRIVER");
            credit(dw, order.getDeliveryFee(), "DELIVERY_FEE", "Livraison commande " + order.getRef(), null);
        }
        return commission;
    }

    /** Récupère le wallet d'un utilisateur, ou en crée un (rôle donné) s'il n'existe pas. */
    @Transactional
    public Wallet getOrCreate(User owner, String role) {
        return walletRepository.findByOwnerId(owner.getId()).orElseGet(() -> {
            Wallet w = new Wallet();
            w.setOwner(owner);
            w.setOwnerRole(role);
            return walletRepository.save(w);
        });
    }

    public Wallet find(UUID id) {
        return walletRepository.findById(id).orElseThrow(() -> NotFoundException.of("Wallet", id));
    }

    private Transaction record(Wallet w, String direction, String type, long amount,
                               String description, String provider) {
        Transaction t = new Transaction();
        t.setWallet(w);
        t.setType(type == null ? direction : type);
        t.setDirection(direction);
        t.setAmount(amount);
        t.setBalanceAfter(w.getBalance());
        t.setDescription(description);
        t.setProvider(provider);
        t.setReference("TX-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        return transactionRepository.save(t);
    }

    private void requirePositive(long amount) {
        if (amount <= 0) throw new ApiException(HttpStatus.BAD_REQUEST, "Montant invalide.");
    }
}
