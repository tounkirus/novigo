package com.novigo.domain.platform;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface KycRepository extends JpaRepository<Kyc, UUID> {
    Page<Kyc> findByStatus(String status, Pageable pageable);
}
