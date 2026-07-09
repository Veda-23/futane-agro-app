package com.futaneagro.repository;

import com.futaneagro.entity.MachineBreakdown;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MachineBreakdownRepository extends JpaRepository<MachineBreakdown, String> {
}

