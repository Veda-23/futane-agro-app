package com.futaneagro.repository;

import com.futaneagro.entity.Party;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * <h1>Party Repository (Client & Wholesale Buyer Data Access)</h1>
 * <p>
 * Spring Data JPA repository for the {@link Party} entity.
 * Provides query methods for party lookup by legacy integer identifier, contact phone number, or commercial party name.
 * </p>
 *
 * @author Futane Agro ERP Architecture Team
 * @version 2.0
 */
@Repository
public interface PartyRepository extends JpaRepository<Party, String> {
    Optional<Party> findByPartyId(Integer partyId);
    Optional<Party> findFirstByPartyContact(String partyContact);
    Optional<Party> findFirstByPartyName(String partyName);
}
