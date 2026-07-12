package com.novigo.api.wallet;

import com.novigo.domain.identity.User;
import com.novigo.domain.identity.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Projection d'identité (ADR P1) : l'identité canonique vit dans NestJS (schéma ops).
 * Quand un flux finance Spring a besoin d'un utilisateur référencé par un événement Nest,
 * on PROJETTE une ligne minimale dans finance.users avec l'id = UUID Nest (via insert natif,
 * car l'id JPA est @GeneratedValue). Idempotent (ON CONFLICT DO NOTHING).
 */
@Service
@RequiredArgsConstructor
public class UserProjectionService {

    @PersistenceContext
    private EntityManager em;

    private final UserRepository userRepository;

    @Transactional
    public User ensure(UUID id, String phone, String fullName) {
        return userRepository.findById(id).orElseGet(() -> {
            em.createNativeQuery(
                    "INSERT INTO users (id, phone, full_name, status, email_verified, phone_verified, created_at, updated_at) " +
                    "VALUES (:id, :phone, :name, 'ACTIVE', false, false, now(), now()) " +
                    "ON CONFLICT (id) DO NOTHING")
                .setParameter("id", id)
                .setParameter("phone", phone)
                .setParameter("name", (fullName == null || fullName.isBlank()) ? "NOVIGO" : fullName)
                .executeUpdate();
            em.clear(); // force un rechargement propre depuis la base
            return userRepository.findById(id).orElseThrow();
        });
    }
}
