package com.futaneagro.service;

import com.futaneagro.entity.Invoice;
import com.futaneagro.entity.PaymentCollection;
import com.futaneagro.entity.Sales;
import com.futaneagro.repository.InvoiceRepository;
import com.futaneagro.repository.PaymentCollectionRepository;
import com.futaneagro.repository.SalesRepository;
import com.futaneagro.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class PaymentService {

    @Autowired
    private PaymentCollectionRepository paymentCollectionRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private SalesRepository salesRepository;

    @Autowired
    private AuditService auditService;

    public List<PaymentCollection> getAllPayments() {
        return paymentCollectionRepository.findAll();
    }

    @Transactional
    public PaymentCollection createPayment(PaymentCollection payment) {
        PaymentCollection saved = paymentCollectionRepository.save(payment);

        // If payment is for a specific invoice, update the corresponding Sales Paid status
        if (payment.getInvoiceNo() != null && !payment.getInvoiceNo().trim().isEmpty()) {
            Optional<Invoice> invOpt = invoiceRepository.findByInvoiceNo(payment.getInvoiceNo());
            if (invOpt.isPresent()) {
                Sales sale = invOpt.get().getSale();
                java.math.BigDecimal newPaid = sale.getPaid().add(payment.getAmountReceived());
                if (newPaid.compareTo(sale.getTotalAmount()) > 0) {
                    throw new IllegalArgumentException("Payment amount exceeds remaining invoice balance.");
                }
                sale.setPaid(newPaid);
                sale.setRemaining(sale.getTotalAmount().subtract(newPaid));
                salesRepository.save(sale);
            }
        }
        auditService.saveAuditLog("Created payment record for party ID: " + saved.getParty().getPartyId(), "Payment_Collection", null, auditService.toJson(saved));
        return saved;
    }

    @Transactional
    public void deletePayment(Integer id) {
        paymentCollectionRepository.findById(id).ifPresent(payment -> {
            String oldState = auditService.toJson(payment);
            
            // Revert payment from Sales Paid status
            if (payment.getInvoiceNo() != null && !payment.getInvoiceNo().trim().isEmpty()) {
                invoiceRepository.findByInvoiceNo(payment.getInvoiceNo()).ifPresent(inv -> {
                    Sales sale = inv.getSale();
                    java.math.BigDecimal newPaid = sale.getPaid().subtract(payment.getAmountReceived());
                    sale.setPaid(newPaid);
                    sale.setRemaining(sale.getTotalAmount().subtract(newPaid));
                    salesRepository.save(sale);
                });
            }
            payment.setIsDeleted(true);
            payment.setDeletedBy(SecurityUtils.getCurrentUser());
            payment.setDeletedDate(LocalDate.now());
            paymentCollectionRepository.save(payment);

            auditService.saveAuditLog("Soft-deleted payment ID: " + id, "Payment_Collection", oldState, null);
        });
    }
}
