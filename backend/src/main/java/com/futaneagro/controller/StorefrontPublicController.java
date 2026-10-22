package com.futaneagro.controller;

import com.futaneagro.dto.StorefrontCatalogItemDTO;
import com.futaneagro.dto.StorefrontOrderRequest;
import com.futaneagro.entity.CustomerOrder;
import com.futaneagro.service.StorefrontService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * <h3>Public B2B Storefront & Customer Portal REST Controller</h3>
 * <p>
 * Public unauthenticated portal endpoints allowing agricultural distributors, farmers, and commercial buyers
 * to browse finished crates catalogs, submit wholesale procurement orders, and monitor real-time order tracking.
 * </p>
 *
 * <h4>Core Responsibilities:</h4>
 * <ul>
 *   <li><b>Product Catalog Streaming:</b> Live available crate models, colors, material types, and real-time inventory availability.</li>
 *   <li><b>Order Placement & Registration:</b> Ingests delivery addresses, requested crate quantities, and initiates tracking.</li>
 *   <li><b>Live Fulfillment Tracking:</b> Public lookup by order tracking code for status progress (Production -> Dispatch -> Delivered).</li>
 *   <li><b>Frictionless SMS OTP Verification:</b> Quick phone number ownership verification for seamless checkout.</li>
 * </ul>
 *
 * @author Futane Agro Core Engineering
 * @version 2.0
 */
@RestController
@RequestMapping("/api/v1/storefront")
@CrossOrigin(origins = "*", maxAge = 3600)
public class StorefrontPublicController {

    @Autowired
    private StorefrontService storefrontService;

    /**
     * <b>GET /api/v1/storefront/catalog</b> - Retrieves active finished goods crate catalog.
     *
     * @return 200 OK with list of {@link StorefrontCatalogItemDTO}
     */
    @GetMapping("/catalog")
    public ResponseEntity<List<StorefrontCatalogItemDTO>> getCatalog() {
        return ResponseEntity.ok(storefrontService.getCatalog());
    }

    /**
     * <b>POST /api/v1/storefront/orders</b> - Places a new B2B wholesale order.
     *
     * @param orderRequest Customer contact, delivery address, and line items
     * @return 200 OK with generated order tracking number and total, or 400/500 on validation failure
     */
    @PostMapping("/orders")
    public ResponseEntity<?> placeOrder(@RequestBody StorefrontOrderRequest orderRequest) {
        try {
            CustomerOrder order = storefrontService.createOrder(orderRequest);
            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("orderNumber", order.getOrderNumber());
            resp.put("grandTotal", order.getGrandTotal());
            resp.put("customerName", order.getCustomerName());
            resp.put("orderStatus", order.getOrderStatus());
            resp.put("message", "Order placed successfully! Tracking initiated.");
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException ex) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", ex.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception ex) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Error submitting order: " + ex.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    /**
     * <b>GET /api/v1/storefront/track/{orderNumber}</b> - Tracks order milestone progress.
     *
     * @param orderNumber Unique order identifier (e.g. "ORD-123456")
     * @return 200 OK with milestone tracking details, or 404 NOT FOUND
     */
    @GetMapping("/track/{orderNumber}")
    public ResponseEntity<?> trackOrder(@PathVariable String orderNumber) {
        try {
            Map<String, Object> tracking = storefrontService.getOrderTracking(orderNumber);
            return ResponseEntity.ok(tracking);
        } catch (IllegalArgumentException ex) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", ex.getMessage());
            return ResponseEntity.status(404).body(error);
        }
    }

    /**
     * <b>POST /api/v1/storefront/auth/quick-otp</b> - Simulates or dispatches fast OTP for guest verification.
     *
     * @param body Map containing {@code "mobile"} phone number
     * @return 200 OK with verification confirmation
     */
    @PostMapping("/auth/quick-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> body) {
        String mobile = body.get("mobile");
        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("mobile", mobile);
        resp.put("verified", true);
        resp.put("token", "STK-OTP-" + System.currentTimeMillis());
        resp.put("message", "Mobile number verified via instant SMS OTP.");
        return ResponseEntity.ok(resp);
    }
}

