package com.novigo.domain.payment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentProviderConfigRepository extends JpaRepository<PaymentProviderConfig, UUID> {
    Optional<PaymentProviderConfig> findByCode(String code);
    boolean existsByCode(String code);
    List<PaymentProviderConfig> findAllByOrderBySortOrderAsc();
    List<PaymentProviderConfig> findByEnabledTrueOrderBySortOrderAsc();
}
