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

@Repository
public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, String> {

    Optional<CustomerOrder> findByOrderNumber(String orderNumber);

    List<CustomerOrder> findByCustomerMobileOrderByCreatedAtDesc(String customerMobile);

    List<CustomerOrder> findByOrderStatusOrderByCreatedAtDesc(String orderStatus);

    @Query("SELECT o FROM CustomerOrder o WHERE (:status IS NULL OR o.orderStatus = :status) ORDER BY o.createdAt DESC")
    Page<CustomerOrder> findOrdersFiltered(@Param("status") String status, Pageable pageable);

    long countByOrderStatus(String orderStatus);
}
