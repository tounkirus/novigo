package com.novigo.api.chat;

import com.novigo.api.chat.ChatDtos.*;
import com.novigo.auth.AuthPrincipal;
import com.novigo.common.api.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Chat — Messagerie temps réel")
@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService service;

    @Operation(summary = "Envoyer un message (REST) — persiste et diffuse sur le WebSocket")
    @PreAuthorize("isAuthenticated()")
    @PostMapping("/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public ChatMessageView send(@AuthenticationPrincipal AuthPrincipal principal,
                                @Valid @RequestBody SendMessage req) {
        return service.send(principal.userId(), req.conversationId(), req.recipientId(), req.body());
    }

    @Operation(summary = "Historique d'une conversation")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/conversations/{conversationId}/messages")
    public PageResponse<ChatMessageView> history(
            @PathVariable UUID conversationId,
            @PageableDefault(size = 50) Pageable pageable) {
        return service.history(conversationId, pageable);
    }

    @Operation(summary = "Mes conversations (identifiants)")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/conversations")
    public List<UUID> conversations(@AuthenticationPrincipal AuthPrincipal principal) {
        return service.conversations(principal.userId());
    }

    /** Entrée WebSocket STOMP : les clients publient sur /app/chat.send. */
    @MessageMapping("/chat.send")
    public void wsSend(WsMessage msg) {
        service.send(msg.senderId(), msg.conversationId(), msg.recipientId(), msg.body());
    }
}
