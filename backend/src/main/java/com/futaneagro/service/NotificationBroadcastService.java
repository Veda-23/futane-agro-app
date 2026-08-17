package com.futaneagro.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class NotificationBroadcastService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void broadcastUpdate(String module, String action, String description) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("module", module);
        payload.put("action", action);
        payload.put("description", description);
        payload.put("timestamp", LocalDateTime.now().toString());

        messagingTemplate.convertAndSend("/topic/updates", payload);
    }
}
