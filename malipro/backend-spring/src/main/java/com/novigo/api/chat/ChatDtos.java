package com.novigo.api.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public final class ChatDtos {

    private ChatDtos() {}

    public record ChatMessageView(UUID id, UUID conversationId, UUID senderId, UUID recipientId,
                                  String body, boolean read, Instant createdAt) {}

    public record SendMessage(@NotNull UUID conversationId, UUID recipientId,
                              @NotBlank @Size(max = 2000) String body) {}

    /** Payload WebSocket (le sender est transmis explicitement en démo). */
    public record WsMessage(UUID conversationId, UUID senderId, UUID recipientId, String body) {}
}
