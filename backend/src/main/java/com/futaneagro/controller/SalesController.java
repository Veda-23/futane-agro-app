package com.futaneagro.controller;

import com.futaneagro.entity.*;
import com.futaneagro.service.InvoiceService;
import com.futaneagro.service.PaymentService;
import com.futaneagro.service.SalesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class SalesController {

    @Autowired
    private SalesService salesService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private InvoiceService invoiceService;

    // --- Sales Endpoints ---
    @GetMapping("/sales")
    public List<Sales> getAllSales() {
        return salesService.getAllSales();
    }

    @PostMapping("/sales")
    public Sales createSale(@RequestBody Sales sale) {
        return salesService.createSale(sale);
    }

    @DeleteMapping("/sales/{id}")
    public void deleteSale(@PathVariable Integer id) {
        salesService.deleteSale(id);
    }

    // --- Payment Collection Endpoints ---
    @GetMapping("/payments")
    public List<PaymentCollection> getAllPayments() {
        return paymentService.getAllPayments();
    }

    @PostMapping("/payments")
    public PaymentCollection createPayment(@RequestBody PaymentCollection payment) {
        return paymentService.createPayment(payment);
    }

    @DeleteMapping("/payments/{id}")
    public void deletePayment(@PathVariable Integer id) {
        paymentService.deletePayment(id);
    }

    // --- Invoice Endpoints ---
    @GetMapping("/invoices")
    public List<Invoice> getAllInvoices() {
        return invoiceService.getAllInvoices();
    }
}
