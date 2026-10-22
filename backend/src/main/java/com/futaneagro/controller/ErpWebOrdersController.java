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

/**
 * <h3>ERP Web Orders Management REST Controller</h3>
 * <p>
 * Internal ERP interface for processing, approving, manufacturing, and converting
 * customer web orders placed through the public B2B digital storefront.
 * </p>
 *
 * <h4>Core Responsibilities:</h4>
 * <ul>
 *   <li><b>Order Queue Management:</b> Paginated filtering of incoming orders by operational status (Pending, Approved, In Production, Dispatched, Delivered).</li>
 *   <li><b>Order Tracking Inspection:</b> Detailed milestone tracking and line-item review for warehouse managers.</li>
 *   <li><b>Status Transitions:</b> Updating order lifecycle status with audit annotations.</li>
 *   <li><b>Commercial Conversion:</b> Atomically converting an approved storefront order into an official
 *       ERP commercial {@link com.futaneagro.entity.Sales} record and issuing an invoice.</li>
 * </ul>
 *
 * @author Futane Agro Core Engineering
 * @version 2.0
 */
@RestController
@RequestMapping("/api/erp/web-orders")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ErpWebOrdersController {

    @Autowired
    private StorefrontService storefrontService;

    /**
     * <b>GET /api/erp/web-orders</b> - Retrieves paginated customer web orders for internal ERP review.
     *
     * @param status Filter by status (e.g. ALL, PENDING, APPROVED, IN_PRODUCTION)
     * @param page Zero-based page index (defaults to 0)
     * @param size Page size limit (defaults to 20)
     * @return Paginated {@link Page} of {@link CustomerOrder}
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
     * <b>GET /api/erp/web-orders/{orderNumber}</b> - Retrieves live fulfillment tracking and customer details.
     *
     * @param orderNumber Order tracking identifier (e.g. "ORD-123456")
     * @return 200 OK with tracking milestones and line items, or 404 NOT FOUND
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
     * <b>PUT /api/erp/web-orders/{id}/status</b> - Advances fulfillment status for a customer order.
     *
     * @param id Order entity UUID
     * @param updateReq Request specifying new target status and notes
     * @return 200 OK with updated {@link CustomerOrder}, or 400 Bad Request
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
     * <b>POST /api/erp/web-orders/{id}/create-sale</b> - Converts an approved web order into a commercial ERP Sale & Invoice.
     * <p>
     * <b>How it works:</b>
     * Automatically registers the customer party if not existing, creates a sales order with line items,
     * assigns sequential invoice number, and decrements finished goods warehouse inventory.
     * </p>
     *
     * @param id Order entity UUID to convert
     * @return 200 OK with created sale and invoice summary, or 400 Bad Request on failure
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

