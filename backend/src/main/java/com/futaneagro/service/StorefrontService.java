package com.futaneagro.service;

import com.futaneagro.dto.OrderStatusUpdateRequest;
import com.futaneagro.dto.StorefrontCatalogItemDTO;
import com.futaneagro.dto.StorefrontOrderRequest;
import com.futaneagro.entity.*;
import com.futaneagro.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class StorefrontService {

    private static final Logger log = LoggerFactory.getLogger(StorefrontService.class);

    @Autowired
    private CustomerOrderRepository customerOrderRepo;

    @Autowired
    private OrderItemRepository orderItemRepo;

    @Autowired
    private OrderTrackingEventRepository trackingEventRepo;

    @Autowired
    private InventoryRepository inventoryRepo;

    @Autowired
    private PartyRepository partyRepo;

    @Autowired
    private SalesRepository salesRepo;

    @Autowired
    private InvoiceRepository invoiceRepo;

    @Autowired
    private DispatchRepository dispatchRepo;

    /**
     * Retrieves dynamic catalog for public customer storefront.
     */
    @Transactional(readOnly = true)
    public List<StorefrontCatalogItemDTO> getCatalog() {
        List<Inventory> inventoryList = inventoryRepo.findAll();
        List<StorefrontCatalogItemDTO> catalog = new ArrayList<>();

        Map<String, CrateMeta> metaMap = buildCrateMetaCatalog();

        for (Inventory inv : inventoryList) {
            StorefrontCatalogItemDTO item = new StorefrontCatalogItemDTO();
            item.setId(inv.getId());
            item.setCrateType(inv.getCrateType());
            item.setMaterialType(inv.getMaterialType());
            item.setAvailableStock(inv.getCurrentStock() != null ? Math.max(0, inv.getCurrentStock()) : 500);

            CrateMeta meta = metaMap.getOrDefault(inv.getCrateType(), new CrateMeta(
                    BigDecimal.valueOf(350),
                    "Commercial Agro Crates",
                    "Heavy-duty injection moulded polymer crate designed for durable agricultural logistics.",
                    "540 x 360 x 290 mm",
                    "20 - 25 KG",
                    "1.85 KG",
                    "Food Grade HDPE 100% Virgin",
                    "assets/crates/default_crate.webp",
                    Arrays.asList("Agro Emerald", "Royal Blue", "Industrial Red", "Harvest Amber")
            ));

            item.setBasePrice(meta.basePrice);
            item.setCategory(meta.category);
            item.setShortDescription(meta.description);
            item.setDimensions(meta.dimensions);
            item.setLoadCapacity(meta.loadCapacity);
            item.setTareWeight(meta.tareWeight);
            item.setFoodGradeRating(meta.foodGrade);
            item.setImage(meta.image);
            item.setAvailableColors(meta.colors);

            // Tiered Wholesale Pricing
            Map<String, BigDecimal> tiers = new LinkedHashMap<>();
            tiers.put("50 - 200 units", meta.basePrice);
            tiers.put("201 - 1,000 units", meta.basePrice.multiply(BigDecimal.valueOf(0.95)).setScale(2, RoundingMode.HALF_UP));
            tiers.put("1,001 - 3,000 units", meta.basePrice.multiply(BigDecimal.valueOf(0.90)).setScale(2, RoundingMode.HALF_UP));
            tiers.put("3,000+ units (Full Truckload)", meta.basePrice.multiply(BigDecimal.valueOf(0.85)).setScale(2, RoundingMode.HALF_UP));
            item.setVolumeTiers(tiers);

            catalog.add(item);
        }

        // If inventory is empty, provide default rich items
        if (catalog.isEmpty()) {
            for (Map.Entry<String, CrateMeta> entry : metaMap.entrySet()) {
                StorefrontCatalogItemDTO item = new StorefrontCatalogItemDTO();
                item.setId(UUID.randomUUID().toString());
                item.setCrateType(entry.getKey());
                item.setMaterialType("Food-Grade Plastic");
                item.setAvailableStock(1200);
                CrateMeta meta = entry.getValue();
                item.setBasePrice(meta.basePrice);
                item.setCategory(meta.category);
                item.setShortDescription(meta.description);
                item.setDimensions(meta.dimensions);
                item.setLoadCapacity(meta.loadCapacity);
                item.setTareWeight(meta.tareWeight);
                item.setFoodGradeRating(meta.foodGrade);
                item.setImage(meta.image);
                item.setAvailableColors(meta.colors);

                Map<String, BigDecimal> tiers = new LinkedHashMap<>();
                tiers.put("50 - 200 units", meta.basePrice);
                tiers.put("201 - 1,000 units", meta.basePrice.multiply(BigDecimal.valueOf(0.95)).setScale(2, RoundingMode.HALF_UP));
                tiers.put("1,001 - 3,000 units", meta.basePrice.multiply(BigDecimal.valueOf(0.90)).setScale(2, RoundingMode.HALF_UP));
                tiers.put("3,000+ units (Full Truckload)", meta.basePrice.multiply(BigDecimal.valueOf(0.85)).setScale(2, RoundingMode.HALF_UP));
                item.setVolumeTiers(tiers);
                catalog.add(item);
            }
        }

        return catalog;
    }

    /**
     * Places a customer order from the storefront.
     */
    @Transactional
    public CustomerOrder createOrder(StorefrontOrderRequest req) {
        if (req.getItems() == null || req.getItems().isEmpty()) {
            throw new IllegalArgumentException("Order must contain at least one crate item.");
        }
        if (req.getCustomerMobile() == null || req.getCustomerMobile().trim().isEmpty()) {
            throw new IllegalArgumentException("Customer contact mobile number is mandatory.");
        }

        CustomerOrder order = new CustomerOrder();
        String generatedOrderNo = "FA-ORD-" + LocalDate.now().getYear() + "-" + (10000 + (int)(Math.random() * 90000));
        order.setOrderNumber(generatedOrderNo);
        order.setCustomerName(req.getCustomerName() != null ? req.getCustomerName().trim() : "Valued Customer");
        order.setCustomerMobile(req.getCustomerMobile().trim());
        order.setCustomerEmail(req.getCustomerEmail());
        order.setCompanyName(req.getCompanyName());
        order.setGstNumber(req.getGstNumber());
        order.setDeliveryAddress(req.getDeliveryAddress());
        order.setCity(req.getCity());
        order.setState(req.getState());
        order.setPincode(req.getPincode());
        order.setPaymentMethod(req.getPaymentMethod() != null ? req.getPaymentMethod() : "ONLINE_UPI");
        order.setPaymentStatus("PENDING");
        order.setOrderStatus("NEW_ORDER");
        order.setOrderDate(LocalDate.now());
        order.setNotes(req.getNotes());

        // Sync or register Customer into ERP Parties (t_crm_party)
        try {
            syncCustomerWithParty(order);
        } catch (Exception ex) {
            log.warn("Non-fatal party auto-sync notice: {}", ex.getMessage());
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        int totalQuantity = 0;

        for (StorefrontOrderRequest.ItemRequest itemReq : req.getItems()) {
            OrderItem item = new OrderItem();
            item.setCrateType(itemReq.getCrateType());
            item.setMaterialType(itemReq.getMaterialType() != null ? itemReq.getMaterialType() : "Food-Grade Plastic");
            item.setColor(itemReq.getColor() != null ? itemReq.getColor() : "Agro Emerald");
            item.setEmbossingText(itemReq.getEmbossingText());
            item.setQuantity(itemReq.getQuantity() != null ? itemReq.getQuantity() : 50);

            BigDecimal unitPrice = itemReq.getUnitPrice() != null ? itemReq.getUnitPrice() : BigDecimal.valueOf(350);
            item.setUnitPrice(unitPrice);

            BigDecimal lineGross = unitPrice.multiply(BigDecimal.valueOf(item.getQuantity())).setScale(2, RoundingMode.HALF_UP);
            item.setGrossAmount(lineGross);
            item.setInventoryId(itemReq.getInventoryId());

            subtotal = subtotal.add(lineGross);
            totalQuantity += item.getQuantity();

            order.addItem(item);
        }

        order.setSubtotal(subtotal);

        // Strict 18% GST (CGST 9% + SGST 9%)
        BigDecimal taxRate = BigDecimal.valueOf(18.00);
        order.setGstRate(taxRate);
        BigDecimal cgst = subtotal.multiply(BigDecimal.valueOf(9)).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal sgst = subtotal.multiply(BigDecimal.valueOf(9)).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        order.setCgst(cgst);
        order.setSgst(sgst);

        // Freight calculation: Free shipping on Full Truckloads (>= 1,000 crates), otherwise nominal logistics freight
        BigDecimal freight = (totalQuantity >= 1000) ? BigDecimal.ZERO : BigDecimal.valueOf(1200.00);
        order.setFreightCharges(freight);

        BigDecimal grandTotal = subtotal.add(cgst).add(sgst).add(freight).setScale(2, RoundingMode.HALF_UP);
        order.setGrandTotal(grandTotal);

        CustomerOrder savedOrder = customerOrderRepo.save(order);

        // Add first tracking event: ORDER_PLACED
        OrderTrackingEvent initialEvent = new OrderTrackingEvent(
                savedOrder,
                "ORDER_PLACED",
                "Order Placed & Confirmed",
                "Your order has been safely placed. Factory production verification & GST tax invoicing initiated."
        );
        trackingEventRepo.save(initialEvent);

        log.info("🛒 Successfully placed customer web order: {} for customer: {} (Grand Total: ₹{})",
                savedOrder.getOrderNumber(), savedOrder.getCustomerName(), savedOrder.getGrandTotal());

        return savedOrder;
    }

    /**
     * Retrieves an order by its unique order number with tracking history.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getOrderTracking(String orderNumber) {
        CustomerOrder order = customerOrderRepo.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new IllegalArgumentException("Order with number " + orderNumber + " not found."));

        List<OrderTrackingEvent> events = trackingEventRepo.findByOrderOrderByEventTimeAsc(order);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("orderNumber", order.getOrderNumber());
        result.put("customerName", order.getCustomerName());
        result.put("customerMobile", order.getCustomerMobile());
        result.put("orderStatus", order.getOrderStatus());
        result.put("orderDate", order.getOrderDate());
        result.put("subtotal", order.getSubtotal());
        result.put("cgst", order.getCgst());
        result.put("sgst", order.getSgst());
        result.put("freightCharges", order.getFreightCharges());
        result.put("grandTotal", order.getGrandTotal());
        result.put("paymentMethod", order.getPaymentMethod());
        result.put("paymentStatus", order.getPaymentStatus());
        result.put("deliveryAddress", order.getDeliveryAddress());
        result.put("city", order.getCity());
        result.put("state", order.getState());
        result.put("items", order.getItems());
        result.put("trackingEvents", events);
        result.put("erpSaleId", order.getErpSaleId());
        result.put("erpDispatchId", order.getErpDispatchId());

        return result;
    }

    /**
     * Lists orders for ERP Web Orders Management screen.
     */
    @Transactional(readOnly = true)
    public Page<CustomerOrder> getOrdersForErp(String status, Pageable pageable) {
        String queryStatus = (status != null && !status.equalsIgnoreCase("ALL")) ? status : null;
        return customerOrderRepo.findOrdersFiltered(queryStatus, pageable);
    }

    /**
     * Updates order status and logs tracking milestone.
     */
    @Transactional
    public CustomerOrder updateOrderStatus(String orderId, OrderStatusUpdateRequest req) {
        CustomerOrder order = customerOrderRepo.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with id: " + orderId));

        String oldStatus = order.getOrderStatus();
        String newStatus = req.getStatus();
        order.setOrderStatus(newStatus);

        String title;
        String desc;
        switch (newStatus.toUpperCase()) {
            case "APPROVED":
                title = "Order Approved & Stock Reserved";
                desc = req.getNote() != null ? req.getNote() : "Order verified by factory plant manager. Stock reserved in warehouse.";
                break;
            case "IN_PRODUCTION":
                title = "Injection Moulding Scheduled";
                desc = req.getNote() != null ? req.getNote() : "Batch scheduled on injection moulding machines with high-grade virgin polymer.";
                break;
            case "PACKED":
                title = "Quality Checked & Palletized";
                desc = req.getNote() != null ? req.getNote() : "Crates inspected, stacked, shrink-wrapped, and tagged for dispatch.";
                break;
            case "DISPATCHED":
                title = "Dispatched via Logistics Fleet";
                desc = "Vehicle: " + (req.getVehicleNumber() != null ? req.getVehicleNumber() : "Fleet Truck")
                        + " | Driver: " + (req.getDriverName() != null ? req.getDriverName() : "Plant Logistics");
                break;
            case "DELIVERED":
                title = "Successfully Delivered";
                desc = req.getNote() != null ? req.getNote() : "Order delivered at delivery destination. Customer receipt acknowledged.";
                order.setPaymentStatus("PAID");
                break;
            default:
                title = "Status Updated: " + newStatus;
                desc = req.getNote() != null ? req.getNote() : "Order status updated to " + newStatus;
        }

        OrderTrackingEvent event = new OrderTrackingEvent(order, newStatus, title, desc);
        if (req.getVehicleNumber() != null) event.setVehicleNumber(req.getVehicleNumber());
        if (req.getDriverName() != null) event.setDriverName(req.getDriverName());
        if (req.getDriverMobile() != null) event.setDriverMobile(req.getDriverMobile());
        trackingEventRepo.save(event);

        log.info("🔄 Order status changed for {}: {} -> {}", order.getOrderNumber(), oldStatus, newStatus);
        return customerOrderRepo.save(order);
    }

    /**
     * Automatically converts a web order into an official ERP Sales & Invoice record.
     */
    @Transactional
    public Map<String, Object> convertOrderToSaleAndInvoice(String orderId) {
        CustomerOrder order = customerOrderRepo.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with id: " + orderId));

        Party party = null;
        if (order.getPartyId() != null) {
            party = partyRepo.findById(order.getPartyId()).orElse(null);
        }
        if (party == null) {
            party = syncCustomerWithParty(order);
        }

        // Primary Crate Type & Quantity
        String crateType = "Export Grade A Grapes Crate";
        String crateMaterial = "Food-Grade Plastic";
        int totalQty = 0;
        BigDecimal unitRate = BigDecimal.valueOf(350);

        if (!order.getItems().isEmpty()) {
            OrderItem first = order.getItems().get(0);
            crateType = first.getCrateType();
            crateMaterial = first.getMaterialType() != null ? first.getMaterialType() : "Food-Grade Plastic";
            unitRate = first.getUnitPrice();
            for (OrderItem it : order.getItems()) {
                totalQty += it.getQuantity();
            }
        }
        if (totalQty == 0) totalQty = 100;

        Sales sale = new Sales();
        sale.setDate(LocalDate.now());
        sale.setParty(party);
        sale.setCrateType(crateType);
        sale.setCrateMaterial(crateMaterial);
        sale.setQuantity(totalQty);
        sale.setRate(unitRate);
        sale.setGstRate(order.getGstRate());
        sale.setCgst(order.getCgst());
        sale.setSgst(order.getSgst());
        sale.setTotalAmount(order.getGrandTotal());
        sale.setPaid(order.getPaymentStatus().equalsIgnoreCase("PAID") ? order.getGrandTotal() : BigDecimal.ZERO);
        sale.setRemaining(sale.getTotalAmount().subtract(sale.getPaid()));

        Sales savedSale = salesRepo.save(sale);

        // Generate official Invoice
        Invoice invoice = new Invoice();
        invoice.setSale(savedSale);
        invoice.setCreatedDate(LocalDate.now());
        invoice.setInvoiceNo("INV-WEB-" + LocalDate.now().getYear() + "-" + (1000 + (int)(Math.random() * 9000)));
        Invoice savedInvoice = invoiceRepo.save(invoice);

        order.setErpSaleId(savedSale.getId());
        order.setOrderStatus("PACKED");
        customerOrderRepo.save(order);

        OrderTrackingEvent event = new OrderTrackingEvent(
                order,
                "PACKED_INVOICED",
                "Official GST Tax Invoice Generated",
                "Tax Invoice #" + savedInvoice.getInvoiceNo() + " generated. Crates ready for transport dispatch."
        );
        trackingEventRepo.save(event);

        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("saleId", savedSale.getId());
        resp.put("invoiceNo", savedInvoice.getInvoiceNo());
        resp.put("orderNumber", order.getOrderNumber());
        return resp;
    }

    /**
     * Synchronizes web customer with ERP Party master (t_crm_party).
     */
    private Party syncCustomerWithParty(CustomerOrder order) {
        Optional<Party> existingParty = partyRepo.findFirstByPartyContact(order.getCustomerMobile());
        if (existingParty.isPresent()) {
            order.setPartyId(existingParty.get().getId());
            return existingParty.get();
        }

        Party newParty = new Party();
        newParty.setPartyName(order.getCompanyName() != null && !order.getCompanyName().trim().isEmpty()
                ? order.getCompanyName().trim()
                : order.getCustomerName() + " (Direct Web)");
        newParty.setPartyContact(order.getCustomerMobile());
        newParty.setPartyAddress(order.getDeliveryAddress() != null ? order.getDeliveryAddress() : "Direct Storefront Online Order");
        newParty.setCity(order.getCity() != null ? order.getCity() : "Pune");
        newParty.setState(order.getState() != null ? order.getState() : "Maharashtra");
        newParty.setEmail(order.getCustomerEmail() != null ? order.getCustomerEmail() : order.getCustomerMobile() + "@futaneagro.in");
        newParty.setGstNumber(order.getGstNumber());
        newParty.setIsActive(true);
        newParty.setCreatedDate(LocalDate.now());

        Party savedParty = partyRepo.save(newParty);
        order.setPartyId(savedParty.getId());
        return savedParty;
    }

    private Map<String, CrateMeta> buildCrateMetaCatalog() {
        Map<String, CrateMeta> map = new LinkedHashMap<>();

        map.put("Export Grade A Grapes Crate", new CrateMeta(
                BigDecimal.valueOf(380.00),
                "Grapes & Berries Export",
                "Perforated food-grade crate engineered specifically for long-distance cold-chain grape export.",
                "540 x 360 x 290 mm",
                "22 - 25 KG",
                "1.95 KG",
                "100% Virgin Food-Grade HDPE",
                "assets/crates/grapes_crate.webp",
                Arrays.asList("Agro Emerald", "Royal Blue", "Industrial Red", "Harvest Amber")
        ));

        map.put("Fresh Tomato Commercial Tray", new CrateMeta(
                BigDecimal.valueOf(290.00),
                "Field Harvesting",
                "Heavy-duty injection moulded tray with reinforced ribbed corners for intensive daily tomato harvesting.",
                "600 x 400 x 220 mm",
                "25 - 28 KG",
                "1.80 KG",
                "High Impact Polymer",
                "assets/crates/tomato_tray.webp",
                Arrays.asList("Agro Emerald", "Harvest Red", "Cobalt Blue")
        ));

        map.put("Pomegranate Super-Red Crate (5kg)", new CrateMeta(
                BigDecimal.valueOf(320.00),
                "Pomegranate & Citrus",
                "Shock-absorbing ventilated fruit box designed to eliminate rind bruising during transport.",
                "400 x 300 x 160 mm",
                "6 - 8 KG",
                "1.20 KG",
                "UV-Stabilized Food-Grade Plastic",
                "assets/crates/pomegranate_crate.webp",
                Arrays.asList("Crimson Red", "Agro Emerald", "Sun Yellow")
        ));

        map.put("Kesar Mango Export Box (10kg)", new CrateMeta(
                BigDecimal.valueOf(420.00),
                "Mango & Tropical Fruits",
                "Solid sidewall export container with cushioned ventilation vents for international mango airfreight.",
                "500 x 320 x 240 mm",
                "10 - 12 KG",
                "2.10 KG",
                "Solid Polypropylene Board",
                "assets/crates/mango_box.webp",
                Arrays.asList("Harvest Amber", "Agro Emerald", "Royal Blue")
        ));

        map.put("Citrus / Orange Storage Crate", new CrateMeta(
                BigDecimal.valueOf(340.00),
                "Citrus Storage",
                "Air-flow optimized perforated crate for controlled atmosphere orange and lemon cold storage.",
                "540 x 360 x 300 mm",
                "20 - 24 KG",
                "1.90 KG",
                "Perforated Food Grade HDPE",
                "assets/crates/citrus_crate.webp",
                Arrays.asList("Sun Yellow", "Agro Emerald", "Cobalt Blue")
        ));

        map.put("Capsicum & Exotic Veg Box", new CrateMeta(
                BigDecimal.valueOf(360.00),
                "Hydroponics & Exotic Produce",
                "Precision stackable lightweight crate for bell peppers, broccoli, and exotic greenhouse harvests.",
                "600 x 400 x 180 mm",
                "15 - 18 KG",
                "1.60 KG",
                "Virgin Copolymer",
                "assets/crates/veg_box.webp",
                Arrays.asList("Agro Emerald", "Royal Blue", "Charcoal Slate")
        ));

        return map;
    }

    private static class CrateMeta {
        final BigDecimal basePrice;
        final String category;
        final String description;
        final String dimensions;
        final String loadCapacity;
        final String tareWeight;
        final String foodGrade;
        final String image;
        final List<String> colors;

        CrateMeta(BigDecimal basePrice, String category, String description, String dimensions,
                  String loadCapacity, String tareWeight, String foodGrade, String image, List<String> colors) {
            this.basePrice = basePrice;
            this.category = category;
            this.description = description;
            this.dimensions = dimensions;
            this.loadCapacity = loadCapacity;
            this.tareWeight = tareWeight;
            this.foodGrade = foodGrade;
            this.image = image;
            this.colors = colors;
        }
    }
}
