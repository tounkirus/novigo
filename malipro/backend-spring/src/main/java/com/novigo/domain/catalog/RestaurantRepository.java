package com.novigo.domain.catalog;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RestaurantRepository extends JpaRepository<Restaurant, UUID> {
    Optional<Restaurant> findByStoreId(UUID storeId);
    boolean existsByStoreId(UUID storeId);
}
