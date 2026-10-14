package com.futaneagro.controller;

import com.futaneagro.dto.OrderStatusUpdateRequest;
import com.futaneagro.entity.CustomerOrder;
import com.futaneagro.service.StorefrontService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/erp/web-orders")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ErpWebOrdersController {

    @Autowired
    private StorefrontService storefrontService;

    /**
     * Get paginated customer web orders for the ERP management interface.
     */
    @GetMapping
    public ResponseEntity<Page<CustomerOrder>> listWebOrders(
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<CustomerOrder> result = storefrontService.getOrdersForErp(status, PageRequest.of(page, size));
        return ResponseEntity.ok(result);
    }

    /**
     * Get tracking & details of an order by order number.
     */
    @GetMapping("/{orderNumber}")
    public ResponseEntity<?> getOrderDetails(@PathVariable String orderNumber) {
        try {
            Map<String, Object> details = storefrontService.getOrderTracking(orderNumber);
            return ResponseEntity.ok(details);
        } catch (IllegalArgumentException ex) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", ex.getMessage());
            return ResponseEntity.status(404).body(err);
        }
    }

    /**
     * Update order status (Approve, In Production, Dispatch, Deliver).
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable String id,
            @RequestBody OrderStatusUpdateRequest updateReq
    ) {
        try {
            CustomerOrder updated = storefrontService.updateOrderStatus(id, updateReq);
            return ResponseEntity.ok(updated);
        } catch (Exception ex) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", ex.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    /**
     * Convert an approved web order into an official ERP Sales & Invoice record.
     */
    @PostMapping("/{id}/create-sale")
    public ResponseEntity<?> convertToSale(@PathVariable String id) {
        try {
            Map<String, Object> result = storefrontService.convertOrderToSaleAndInvoice(id);
            return ResponseEntity.ok(result);
        } catch (Exception ex) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", ex.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }
}
