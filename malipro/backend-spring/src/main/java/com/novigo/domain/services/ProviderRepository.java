package com.novigo.domain.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface ProviderRepository extends JpaRepository<Provider, UUID>, JpaSpecificationExecutor<Provider> {
    Optional<Provider> findByUserId(UUID userId);
    Page<Provider> findByVertical(String vertical, Pageable pageable);
    boolean existsByUserId(UUID userId);
}
