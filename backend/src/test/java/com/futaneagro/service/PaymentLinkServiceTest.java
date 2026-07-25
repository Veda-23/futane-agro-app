package com.futaneagro.service;

import com.futaneagro.entity.Invoice;
import com.futaneagro.entity.Party;
import com.futaneagro.entity.PaymentCollection;
import com.futaneagro.entity.PaymentLink;
import com.futaneagro.entity.Sales;
import com.futaneagro.repository.InvoiceRepository;
import com.futaneagro.repository.PaymentCollectionRepository;
import com.futaneagro.repository.PaymentLinkRepository;
import com.futaneagro.repository.SalesRepository;
import com.razorpay.RazorpayClient;
import org.json.JSONObject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PaymentLinkServiceTest {

    @Mock
    private RazorpayClient razorpayClient;

    @Mock
    private PaymentCollectionRepository paymentCollectionRepository;

    @Mock
    private SalesRepository salesRepository;

    @Mock
    private PaymentLinkRepository paymentLinkRepository;

    @InjectMocks
    private PaymentLinkService paymentLinkService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void markSaleAsPaid_ShouldProcessIdempotently() {
        // Arrange
        String linkId = "plink_test123";
        String payId = "pay_test456";

        PaymentLink mockLink = new PaymentLink();
        mockLink.setRazorpayPaymentLinkId(linkId);
        mockLink.setSaleId("sale-id-123");

        Sales mockSale = new Sales();
        mockSale.setId("sale-id-123");
        Party party = new Party();
        party.setId("party-123");
        mockSale.setParty(party);
        mockSale.setTotalAmount(new BigDecimal("1000.00"));
        mockSale.setRemaining(new BigDecimal("1000.00"));

        Invoice mockInvoice = new Invoice();
        mockInvoice.setInvoiceNo("INV-001");
        mockInvoice.setSale(mockSale);

        when(paymentLinkRepository.findByRazorpayPaymentLinkId(linkId)).thenReturn(Optional.of(mockLink));
        when(salesRepository.findById("sale-id-123")).thenReturn(Optional.of(mockSale));
        when(paymentLinkRepository.existsByRazorpayPaymentId(payId)).thenReturn(false);

        // Act
        paymentLinkService.markSaleAsPaid(linkId, payId);

        // Assert
        verify(paymentCollectionRepository, times(1)).save(any(PaymentCollection.class));
        verify(salesRepository, times(1)).save(mockSale);
        assertEquals(new BigDecimal("0.00"), mockSale.getRemaining());
    }

    @Test
    void markSaleAsPaid_ShouldIgnoreDuplicateWebhook() {
        // Arrange
        String linkId = "plink_test123";
        String payId = "pay_test456";

        when(paymentLinkRepository.existsByRazorpayPaymentId(payId)).thenReturn(true);

        // Act
        paymentLinkService.markSaleAsPaid(linkId, payId);

        // Assert
        verify(paymentLinkRepository, never()).findByRazorpayPaymentLinkId(any());
        verify(paymentCollectionRepository, never()).save(any());
    }
}
