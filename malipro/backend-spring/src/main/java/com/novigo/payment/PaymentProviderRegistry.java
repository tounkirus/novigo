package com.novigo.payment;

import com.novigo.common.exception.ApiException;
import com.novigo.domain.payment.PaymentProviderConfigRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Registre des fournisseurs de paiement disponibles (beans SPI), croisé avec la
 * configuration d'activation en base ({@code payment_providers}).
 */
@Component
public class PaymentProviderRegistry {

    private final Map<String, PaymentProvider> providers;
    private final PaymentProviderConfigRepository configRepository;

    public PaymentProviderRegistry(List<PaymentProvider> providerBeans,
                                   PaymentProviderConfigRepository configRepository) {
        this.providers = providerBeans.stream()
                .collect(Collectors.toMap(PaymentProvider::code, Function.identity()));
        this.configRepository = configRepository;
    }

    /** Résout un fournisseur par code, en vérifiant qu'il est implémenté ET activé. */
    public PaymentProvider resolveEnabled(String code) {
        PaymentProvider provider = providers.get(code);
        if (provider == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Fournisseur de paiement inconnu : " + code);
        }
        boolean enabled = configRepository.findByCode(code)
                .map(cfg -> cfg.isEnabled())
                .orElse(true);
        if (!enabled) {
            throw new ApiException(HttpStatus.CONFLICT, "Fournisseur de paiement désactivé : " + code);
        }
        return provider;
    }

    public boolean isImplemented(String code) {
        return providers.containsKey(code);
    }
}
