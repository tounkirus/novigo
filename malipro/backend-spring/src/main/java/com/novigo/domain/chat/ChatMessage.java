package com.novigo.domain.chat;

import com.novigo.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

/** Message de chat entre deux utilisateurs, regroupés par conversation. */
@Getter
@Setter
@Entity
@Table(name = "chat_messages")
public class ChatMessage extends BaseEntity {

    @Column(name = "conversation_id", nullable = false)
    private UUID conversationId;

    @Column(name = "sender_id", nullable = false)
    private UUID senderId;

    @Column(name = "recipient_id")
    private UUID recipientId;

    @Column(nullable = false, length = 2000)
    private String body;

    @Column(name = "is_read", nullable = false)
    private boolean read = false;
}
