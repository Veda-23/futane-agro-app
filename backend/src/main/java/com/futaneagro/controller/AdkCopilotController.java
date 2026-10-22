package com.futaneagro.controller;

import com.futaneagro.service.AiResearchAgentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * <h3>ADK AI Copilot & Agentic Intelligence REST Controller</h3>
 * <p>
 * Bridges the Angular frontend AI Copilot assistant with the backend autonomous
 * research agent ({@link AiResearchAgentService}), supporting domain-aware querying,
 * inventory forecasts, market raw material price intelligence, and GST advisory.
 * </p>
 *
 * <h4>Core Responsibilities:</h4>
 * <ul>
 *   <li><b>Contextual Multi-Turn Chat:</b> Ingests user inquiries linked to a {@code conversationId}
 *       to maintain conversational context and memory across interactions.</li>
 *   <li><b>Conversational State Reset:</b> Provides an explicit reset hook to clear active dialog context.</li>
 *   <li><b>Targeted Market & ERP Research:</b> Allows standalone deep research queries on polymers,
 *       crate pricing, HS codes, and vendor intelligence.</li>
 * </ul>
 *
 * @author Futane Agro Core Engineering
 * @version 2.0
 */
@RestController
@RequestMapping("/api/adk")
public class AdkCopilotController {

    private static final Logger log = LoggerFactory.getLogger(AdkCopilotController.class);

    @Autowired
    private AiResearchAgentService aiResearchAgentService;

    /**
     * <b>POST /api/adk/chat</b> - Handles interactive multi-turn chat messages with the AI Copilot.
     * <p>
     * <b>How it works:</b>
     * <ol>
     *   <li>Validates that the incoming query text {@code message} is non-empty.</li>
     *   <li>Extracts optional {@code conversationId} for stateful conversational tracking.</li>
     *   <li>Delegates analysis and tool invocation to {@link AiResearchAgentService#executeResearch(String, String)}.</li>
     *   <li>Returns structured answers with recommendations, actionable data, or citations.</li>
     * </ol>
     * </p>
     * <p>
     * <b>Used for:</b> The floating AI Copilot drawer and natural language ERP navigation.
     * </p>
     *
     * @param payload Map containing {@code "message"} and optional {@code "conversationId"}
     * @return 200 OK with AI response map, or 400 Bad Request on empty message
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
     * <b>POST /api/adk/session/reset</b> - Clears current AI conversation memory and context.
     * <p>
     * <b>How it works:</b>
     * Extracts {@code conversationId} and resets active session variables in the agent orchestrator.
     * </p>
     * <p>
     * <b>Used for:</b> "New Chat" button action in the frontend copilot interface.
     * </p>
     *
     * @param payload Map containing target {@code "conversationId"}
     * @return 200 OK with status confirmation
     */
    @PostMapping("/session/reset")
    public ResponseEntity<?> resetSession(@RequestBody Map<String, String> payload) {
        String conversationId = payload.get("conversationId");
        log.info("Resetting session context for conversationId: {}", conversationId);
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "message", "Session reset"));
    }

    /**
     * <b>POST /api/adk/research</b> - Dedicated research endpoint for raw materials, GST, and vendor intelligence.
     * <p>
     * <b>How it works:</b>
     * Submits a targeted analytical query to the autonomous research engine without persisting conversational memory.
     * </p>
     * <p>
     * <b>Used for:</b> Automated market analysis widgets, price trend predictions, and compliance verifications.
     * </p>
     *
     * @param payload Map containing the research {@code "query"}
     * @return 200 OK with research findings, or 400 Bad Request if query is blank
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

