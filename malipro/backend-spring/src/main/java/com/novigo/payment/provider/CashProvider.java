package com.novigo.payment.provider;

import com.novigo.payment.PaymentProvider;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class CashProvider implements PaymentProvider {

    @Override
    public String code() {
        return "CASH";
    }

    @Override
    public String label() {
        return "Espèces";
    }

    @Override
    public PaymentInstruction initiate(PaymentContext ctx) {
        String ext = "CASH-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return new PaymentInstruction(ext, "Paiement à la livraison en espèces.", null);
    }
}
