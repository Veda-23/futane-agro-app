package com.futaneagro.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * <h3>Real-Time WebSocket Notification Broadcast Service</h3>
 * <p>
 * Publishes operational state changes and push notifications to connected Angular frontend clients
 * over STOMP/SockJS WebSockets topic {@code "/topic/updates"}.
 * </p>
 *
 * <h4>Core Responsibilities:</h4>
 * <ul>
 *   <li><b>Live Multi-Client Synchronization:</b> Broadcasts entity mutations (e.g. Inventory updates,
 *       Production PPD runs, Sales invoicing) so dashboards and table views refresh without manual polling.</li>
 *   <li><b>Standardized Event Payload:</b> Structures messages with {@code module}, {@code action},
 *       {@code description}, and an ISO timestamp.</li>
 * </ul>
 *
 * @author Futane Agro Core Engineering
 * @version 2.0
 */
@Service
public class NotificationBroadcastService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Broadcasts an asynchronous notification event across the active STOMP broker.
     * <p>
     * <b>How it works:</b>
     * Builds a structured event map and sends it to destination topic {@code "/topic/updates"}.
     * Connected frontend clients subscribed to this topic receive and process the notification immediately.
     * </p>
     * <p>
     * <b>Used by:</b> Production, Sales, Inventory, and Admin controllers when key business entities change.
     * </p>
     *
     * @param module Target functional domain (e.g., "INVENTORY", "PRODUCTION", "SALES")
     * @param action Mutation type (e.g., "CREATED", "UPDATED", "DELETED")
     * @param description Human-readable explanation of the operational change
     */
    public void broadcastUpdate(String module, String action, String description) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("module", module);
        payload.put("action", action);
        payload.put("description", description);
        payload.put("timestamp", LocalDateTime.now().toString());

        messagingTemplate.convertAndSend("/topic/updates", payload);
    }
}

