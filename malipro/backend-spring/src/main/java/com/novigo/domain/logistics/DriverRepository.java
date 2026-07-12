package com.novigo.domain.logistics;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface DriverRepository extends JpaRepository<Driver, UUID>, JpaSpecificationExecutor<Driver> {
    Optional<Driver> findByUserId(UUID userId);
    boolean existsByUserId(UUID userId);
}
