package com.novigo.domain.platform;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MediaRepository extends JpaRepository<Media, UUID> {
    List<Media> findByOwnerTypeAndOwnerId(String ownerType, UUID ownerId);
}
