package com.novigo.domain.platform;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface FavoriteRepository extends JpaRepository<Favorite, UUID> {
    Page<Favorite> findByUserId(UUID userId, Pageable pageable);
    Optional<Favorite> findByUserIdAndTargetTypeAndTargetId(UUID userId, String targetType, UUID targetId);
    boolean existsByUserIdAndTargetTypeAndTargetId(UUID userId, String targetType, UUID targetId);
}
