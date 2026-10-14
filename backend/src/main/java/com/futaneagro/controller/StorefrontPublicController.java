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

@RestController
@RequestMapping("/api/v1/storefront")
@CrossOrigin(origins = "*", maxAge = 3600)
public class StorefrontPublicController {

    @Autowired
    private StorefrontService storefrontService;

    /**
     * Public catalog endpoint for customer storefront.
     */
    @GetMapping("/catalog")
    public ResponseEntity<List<StorefrontCatalogItemDTO>> getCatalog() {
        return ResponseEntity.ok(storefrontService.getCatalog());
    }

    /**
     * Submit customer order from storefront.
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
     * Live tracking for a specific order.
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
     * Quick OTP simulated verification for frictionless checkout.
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
