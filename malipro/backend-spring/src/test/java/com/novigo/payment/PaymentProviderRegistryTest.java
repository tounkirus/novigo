package com.novigo.payment;

import com.novigo.common.exception.ApiException;
import com.novigo.domain.payment.PaymentProviderConfig;
import com.novigo.domain.payment.PaymentProviderConfigRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class PaymentProviderRegistryTest {

    @Mock PaymentProviderConfigRepository configRepository;

    private final PaymentProvider testProvider = new PaymentProvider() {
        @Override public String code() { return "TEST"; }
        @Override public String label() { return "Test"; }
        @Override public PaymentInstruction initiate(PaymentContext ctx) {
            return new PaymentInstruction("ext-1", "msg", null);
        }
    };

    private PaymentProviderRegistry registry() {
        return new PaymentProviderRegistry(List.of(testProvider), configRepository);
    }

    @Test
    void resolvesEnabledProvider() {
        PaymentProviderConfig cfg = new PaymentProviderConfig();
        cfg.setCode("TEST");
        cfg.setEnabled(true);
        lenient().when(configRepository.findByCode("TEST")).thenReturn(Optional.of(cfg));

        assertThat(registry().resolveEnabled("TEST").code()).isEqualTo("TEST");
    }

    @Test
    void unknownProviderRejectedWith400() {
        assertThatThrownBy(() -> registry().resolveEnabled("BITCOIN"))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).getStatus())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void disabledProviderRejectedWith409() {
        PaymentProviderConfig cfg = new PaymentProviderConfig();
        cfg.setCode("TEST");
        cfg.setEnabled(false);
        lenient().when(configRepository.findByCode("TEST")).thenReturn(Optional.of(cfg));

        assertThatThrownBy(() -> registry().resolveEnabled("TEST"))
                .isInstanceOf(ApiException.class)
                .extracting(e -> ((ApiException) e).getStatus())
                .isEqualTo(HttpStatus.CONFLICT);
    }
}
