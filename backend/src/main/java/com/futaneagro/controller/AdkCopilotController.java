package com.futaneagro.controller;

import com.futaneagro.service.AiResearchAgentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/adk")
public class AdkCopilotController {

    private static final Logger log = LoggerFactory.getLogger(AdkCopilotController.class);

    @Autowired
    private AiResearchAgentService aiResearchAgentService;

    /**
     * Primary endpoint invoked by the frontend AiCopilotComponent
     */
    @PostMapping("/chat")
    public ResponseEntity<?> handleCopilotChat(@RequestBody Map<String, String> payload) {
        String message = payload.get("message");
        String conversationId = payload.get("conversationId");

        if (message == null || message.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Query message cannot be empty"));
        }

        Map<String, Object> response = aiResearchAgentService.executeResearch(message, conversationId);
        return ResponseEntity.ok(response);
    }

    /**
     * Session reset endpoint
     */
    @PostMapping("/session/reset")
    public ResponseEntity<?> resetSession(@RequestBody Map<String, String> payload) {
        String conversationId = payload.get("conversationId");
        log.info("Resetting session context for conversationId: {}", conversationId);
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "message", "Session reset"));
    }

    /**
     * Dedicated research endpoint for raw materials, GST, and vendor intelligence
     */
    @PostMapping("/research")
    public ResponseEntity<?> conductResearch(@RequestBody Map<String, String> payload) {
        String query = payload.get("query");
        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Query is required"));
        }

        Map<String, Object> response = aiResearchAgentService.executeResearch(query, null);
        return ResponseEntity.ok(response);
    }
}
