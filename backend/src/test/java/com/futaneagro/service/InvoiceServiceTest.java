package com.futaneagro.service;

import com.futaneagro.entity.Invoice;
import com.futaneagro.repository.InvoiceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class InvoiceServiceTest {

    @Mock
    private InvoiceRepository invoiceRepository;

    @InjectMocks
    private InvoiceService invoiceService;

    private Invoice invoice;

    @BeforeEach
    void setUp() {
        invoice = new Invoice();
        invoice.setInvoiceId(1);
        invoice.setInvoiceNumber("INV-1001");
        invoice.setFilePath("/uploads/inv-1001.pdf");
    }

    @Test
    void testGetAllInvoices() {
        when(invoiceRepository.findAll()).thenReturn(Arrays.asList(invoice));
        
        List<Invoice> list = invoiceService.getAllInvoices();
        
        assertEquals(1, list.size());
        assertEquals("INV-1001", list.get(0).getInvoiceNumber());
        verify(invoiceRepository, times(1)).findAll();
    }
}
