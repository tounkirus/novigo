package com.novigo.domain.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface BookingRepository extends JpaRepository<Booking, UUID>, JpaSpecificationExecutor<Booking> {
    Optional<Booking> findByRef(String ref);
    Page<Booking> findByCustomerId(UUID customerId, Pageable pageable);
    Page<Booking> findByProviderId(UUID providerId, Pageable pageable);
    boolean existsByRef(String ref);
}
