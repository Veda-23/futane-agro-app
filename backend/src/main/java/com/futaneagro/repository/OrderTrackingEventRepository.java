package com.futaneagro.repository;

import com.futaneagro.entity.CustomerOrder;
import com.futaneagro.entity.OrderTrackingEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * <h1>OrderTrackingEvent Repository (Storefront Order Status History & Milestones)</h1>
 * <p>
 * Spring Data JPA repository for the {@link OrderTrackingEvent} entity.
 * Provides query methods for retrieving sequential order milestone logs (e.g. {@code ORDER_PLACED},
 * {@code PAYMENT_CONFIRMED}, {@code DISPATCHED}, {@code DELIVERED}) ordered by event timestamp.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Repository
public interface OrderTrackingEventRepository extends JpaRepository<OrderTrackingEvent, String> {
    List<OrderTrackingEvent> findByOrderOrderByEventTimeAsc(CustomerOrder order);
}
