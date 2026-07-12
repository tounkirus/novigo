package com.novigo.payment.provider;

import com.novigo.payment.PaymentProvider;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class OrangeMoneyProvider implements PaymentProvider {

    @Override
    public String code() {
        return "ORANGE_MONEY";
    }

    @Override
    public String label() {
        return "Orange Money";
    }

    @Override
    public PaymentInstruction initiate(PaymentContext ctx) {
        String ext = "OM-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase();
        String msg = String.format("Composez #144*4*%d# puis validez le paiement de %d %s.",
                Math.max(1, ctx.amount() / 100), ctx.amount(), ctx.currency());
        return new PaymentInstruction(ext, msg, null);
    }
}
