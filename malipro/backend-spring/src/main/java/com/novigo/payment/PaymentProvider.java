package com.novigo.payment;

/**
 * SPI d'un fournisseur de paiement. Chaque implémentation est un bean Spring
 * enregistré automatiquement dans le {@link PaymentProviderRegistry}.
 * En mode démo/dev, l'initiation est simulée (pas d'appel externe réel).
 */
public interface PaymentProvider {

    /** Code stable (ORANGE_MONEY, WAVE, MOOV_MONEY, STRIPE, CASH). */
    String code();

    /** Libellé lisible. */
    String label();

    /** Démarre un paiement et renvoie les instructions/redirection pour le client. */
    PaymentInstruction initiate(PaymentContext context);

    /** Vérifie l'état d'un paiement auprès du fournisseur (simulé : succès en démo). */
    default boolean verify(String externalRef) {
        return true;
    }

    /** Contexte transmis au fournisseur. */
    record PaymentContext(String ref, long amount, String currency, String purpose, String payerContact) {}

    /** Résultat d'initiation renvoyé au client. */
    record PaymentInstruction(String externalRef, String message, String checkoutUrl) {}
}
