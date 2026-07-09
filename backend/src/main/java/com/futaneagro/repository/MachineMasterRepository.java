package com.futaneagro.repository;

import com.futaneagro.entity.MachineMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MachineMasterRepository extends JpaRepository<MachineMaster, String> {
}

