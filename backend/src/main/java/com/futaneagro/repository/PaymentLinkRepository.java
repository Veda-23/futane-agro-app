package com.futaneagro.repository;

import com.futaneagro.entity.PaymentLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * <h1>PaymentLink Repository (Razorpay Payment Links & Webhook Idempotency)</h1>
 * <p>
 * Spring Data JPA repository for the {@link PaymentLink} entity.
 * Provides lookups by sales contract ID, Razorpay payment link ID,
 * and critical idempotency guards ({@link #existsByRazorpayPaymentId(String)}) to prevent duplicate payment settlements.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Repository
public interface PaymentLinkRepository extends JpaRepository<PaymentLink, String> {
    List<PaymentLink> findBySaleId(String saleId);
    Optional<PaymentLink> findByRazorpayPaymentLinkId(String razorpayPaymentLinkId);
    boolean existsByRazorpayPaymentId(String razorpayPaymentId); // idempotency guard
}
