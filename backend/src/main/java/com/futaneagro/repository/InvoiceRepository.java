package com.futaneagro.repository;

import com.futaneagro.entity.Invoice;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, String> {
    @EntityGraph(attributePaths = {"sale", "sale.party"})
    List<Invoice> findAll();

    @EntityGraph(attributePaths = {"sale", "sale.party"})
    Optional<Invoice> findByInvoiceNo(String invoiceNo);
}

