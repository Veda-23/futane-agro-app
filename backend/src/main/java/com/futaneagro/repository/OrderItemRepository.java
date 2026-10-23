package com.futaneagro.repository;

import com.futaneagro.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * <h1>OrderItem Repository (B2B Customer Order Line Item Persistence)</h1>
 * <p>
 * Spring Data JPA repository for the {@link OrderItem} entity.
 * Provides query methods for retrieving ordered product line items, crate variants, quantities,
 * and rate totals associated with a parent B2B customer order.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, String> {
    List<OrderItem> findByOrderId(String orderId);
}
