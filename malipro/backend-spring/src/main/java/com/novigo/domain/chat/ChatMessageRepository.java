package com.novigo.domain.chat;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

    Page<ChatMessage> findByConversationIdOrderByCreatedAtAsc(UUID conversationId, Pageable pageable);

    @Query("select distinct m.conversationId from ChatMessage m "
            + "where m.senderId = :userId or m.recipientId = :userId")
    List<UUID> findConversationIdsForUser(@Param("userId") UUID userId);

    long countByConversationIdAndRecipientIdAndReadFalse(UUID conversationId, UUID recipientId);
}
