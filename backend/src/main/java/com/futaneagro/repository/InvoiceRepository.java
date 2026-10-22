package com.futaneagro.repository;

import com.futaneagro.entity.Invoice;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * <h1>Invoice Repository</h1>
 * <p>
 * Spring Data JPA repository for the {@link Invoice} entity.
 * Employs deep entity graphs ({@code @EntityGraph(attributePaths = {"sale", "sale.party"})})
 * to fetch invoices alongside parent sales contracts and customer party profiles without N+1 query penalties.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, String> {
    @EntityGraph(attributePaths = {"sale", "sale.party"})
    List<Invoice> findAll();

    @EntityGraph(attributePaths = {"sale", "sale.party"})
    Optional<Invoice> findByInvoiceNo(String invoiceNo);
}

