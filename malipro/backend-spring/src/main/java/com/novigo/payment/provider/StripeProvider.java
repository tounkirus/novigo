package com.novigo.payment.provider;

import com.novigo.payment.PaymentProvider;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class StripeProvider implements PaymentProvider {

    @Override
    public String code() {
        return "STRIPE";
    }

    @Override
    public String label() {
        return "Carte bancaire (Stripe)";
    }

    @Override
    public PaymentInstruction initiate(PaymentContext ctx) {
        String ext = "pi_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        String url = "https://checkout.stripe.com/pay/" + ext;
        return new PaymentInstruction(ext, "Redirection vers la page de paiement sécurisée Stripe.", url);
    }
}
