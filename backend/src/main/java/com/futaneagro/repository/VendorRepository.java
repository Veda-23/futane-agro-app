package com.futaneagro.repository;

import com.futaneagro.entity.Vendor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * <h1>Vendor Repository (Raw Material Suppliers & Creditors Ledger)</h1>
 * <p>
 * Spring Data JPA repository for the {@link Vendor} entity.
 * Supports supplier lifecycle management, contact details, GSTIN validation,
 * and procurement history tracking for plastic granule and machinery vendors.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Repository
public interface VendorRepository extends JpaRepository<Vendor, String> {
}

