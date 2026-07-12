package com.novigo.payment.provider;

import com.novigo.payment.PaymentProvider;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class MoovMoneyProvider implements PaymentProvider {

    @Override
    public String code() {
        return "MOOV_MONEY";
    }

    @Override
    public String label() {
        return "Moov Money";
    }

    @Override
    public PaymentInstruction initiate(PaymentContext ctx) {
        String ext = "MV-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase();
        String msg = String.format("Composez *155# et validez le paiement de %d %s.", ctx.amount(), ctx.currency());
        return new PaymentInstruction(ext, msg, null);
    }
}
