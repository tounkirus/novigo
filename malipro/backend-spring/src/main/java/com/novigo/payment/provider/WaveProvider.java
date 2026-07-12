package com.novigo.payment.provider;

import com.novigo.payment.PaymentProvider;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class WaveProvider implements PaymentProvider {

    @Override
    public String code() {
        return "WAVE";
    }

    @Override
    public String label() {
        return "Wave";
    }

    @Override
    public PaymentInstruction initiate(PaymentContext ctx) {
        String ext = "WV-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase();
        String url = "https://pay.wave.com/c/" + ext;
        return new PaymentInstruction(ext, "Ouvrez l'application Wave et confirmez le paiement.", url);
    }
}
