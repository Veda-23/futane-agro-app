package com.futaneagro.repository;

import com.futaneagro.entity.PaymentLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentLinkRepository extends JpaRepository<PaymentLink, String> {
    List<PaymentLink> findBySaleId(String saleId);
    Optional<PaymentLink> findByRazorpayPaymentLinkId(String razorpayPaymentLinkId);
    boolean existsByRazorpayPaymentId(String razorpayPaymentId); // idempotency guard
}
