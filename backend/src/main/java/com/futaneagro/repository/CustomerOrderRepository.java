package com.futaneagro.repository;

import com.futaneagro.entity.CustomerOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * <h1>CustomerOrder Repository</h1>
 * <p>
 * Spring Data JPA repository for the {@link CustomerOrder} entity.
 * Supports B2B storefront order lookups by order number, client mobile tracking queries,
 * paginated filtering by order status, and status tally counts.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Repository
public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, String> {

    Optional<CustomerOrder> findByOrderNumber(String orderNumber);

    List<CustomerOrder> findByCustomerMobileOrderByCreatedAtDesc(String customerMobile);

    List<CustomerOrder> findByOrderStatusOrderByCreatedAtDesc(String orderStatus);

    @Query("SELECT o FROM CustomerOrder o WHERE (:status IS NULL OR o.orderStatus = :status) ORDER BY o.createdAt DESC")
    Page<CustomerOrder> findOrdersFiltered(@Param("status") String status, Pageable pageable);

    long countByOrderStatus(String orderStatus);
}
