package com.futaneagro.repository;

import com.futaneagro.entity.Party;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PartyRepository extends JpaRepository<Party, String> {
    Optional<Party> findByPartyId(Integer partyId);
    Optional<Party> findFirstByPartyContact(String partyContact);
    Optional<Party> findFirstByPartyName(String partyName);
}
