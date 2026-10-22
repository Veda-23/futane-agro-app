package com.futaneagro.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket & STOMP Message Broker Configuration.
 * <p>
 * Configures the real-time bidirectional messaging pipeline:
 * <ul>
 *   <li><b>In-Memory Message Broker:</b> Enables {@code /topic} destination prefix for multi-client broadcasting.</li>
 *   <li><b>Application Prefixes:</b> Directs incoming client messages prefixed with {@code /app} to annotated {@code @MessageMapping} controllers.</li>
 *   <li><b>STOMP Endpoint:</b> Registers {@code /ws-erp} with SockJS fallback support to ensure compatibility
 *       across restricted enterprise corporate proxies and legacy browsers.</li>
 * </ul>
 *
 * @author Futane Agro Core Architecture Team
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    /**
     * Configures the simple in-memory message broker destinations and client prefixes.
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    /**
     * Registers the public WebSocket endpoint supporting STOMP handshake and SockJS fallback.
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-erp")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}
