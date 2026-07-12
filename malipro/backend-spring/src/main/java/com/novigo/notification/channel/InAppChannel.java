package com.novigo.notification.channel;

import com.novigo.domain.identity.UserRepository;
import com.novigo.domain.platform.Notification;
import com.novigo.domain.platform.NotificationRepository;
import com.novigo.notification.NotificationChannel;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Canal in-app : persiste la notification pour l'utilisateur. */
@Component
@RequiredArgsConstructor
public class InAppChannel implements NotificationChannel {

    private final NotificationRepository notifications;
    private final UserRepository users;

    @Override
    public String code() {
        return "IN_APP";
    }

    @Override
    @Transactional
    public void send(NotificationMessage msg) {
        Notification n = new Notification();
        if (msg.userId() != null) users.findById(msg.userId()).ifPresent(n::setUser);
        n.setChannel("IN_APP");
        n.setTitle(msg.title());
        n.setBody(msg.body());
        n.setCategory(msg.category());
        n.setActionUrl(msg.actionUrl());
        notifications.save(n);
    }
}
