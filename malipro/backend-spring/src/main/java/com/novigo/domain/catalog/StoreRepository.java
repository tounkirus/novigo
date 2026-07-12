package com.novigo.domain.catalog;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface StoreRepository extends JpaRepository<Store, UUID>, JpaSpecificationExecutor<Store> {
    Optional<Store> findBySlug(String slug);
    Page<Store> findByCategory(String category, Pageable pageable);
    boolean existsBySlug(String slug);
}
