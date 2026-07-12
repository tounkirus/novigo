package com.novigo.api.chat;

import com.novigo.api.chat.ChatDtos.ChatMessageView;
import com.novigo.common.api.PageResponse;
import com.novigo.domain.chat.ChatMessage;
import com.novigo.domain.chat.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/** Persistance des messages de chat + diffusion temps réel via le broker STOMP. */
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository repository;
    private final SimpMessagingTemplate broker;

    @Transactional
    public ChatMessageView send(UUID senderId, UUID conversationId, UUID recipientId, String body) {
        ChatMessage m = new ChatMessage();
        m.setConversationId(conversationId);
        m.setSenderId(senderId);
        m.setRecipientId(recipientId);
        m.setBody(body);
        ChatMessageView view = toView(repository.save(m));
        // Diffusion aux abonnés de la conversation.
        broker.convertAndSend("/topic/conversations/" + conversationId, view);
        return view;
    }

    @Transactional(readOnly = true)
    public PageResponse<ChatMessageView> history(UUID conversationId, Pageable pageable) {
        Page<ChatMessage> page = repository.findByConversationIdOrderByCreatedAtAsc(conversationId, pageable);
        return PageResponse.of(page, page.getContent().stream().map(this::toView).toList());
    }

    @Transactional(readOnly = true)
    public List<UUID> conversations(UUID userId) {
        return repository.findConversationIdsForUser(userId);
    }

    private ChatMessageView toView(ChatMessage m) {
        return new ChatMessageView(m.getId(), m.getConversationId(), m.getSenderId(),
                m.getRecipientId(), m.getBody(), m.isRead(), m.getCreatedAt());
    }
}
