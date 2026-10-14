package com.futaneagro.repository;

import com.futaneagro.entity.CustomerOrder;
import com.futaneagro.entity.OrderTrackingEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderTrackingEventRepository extends JpaRepository<OrderTrackingEvent, String> {
    List<OrderTrackingEvent> findByOrderOrderByEventTimeAsc(CustomerOrder order);
}
