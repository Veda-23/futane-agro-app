package com.futaneagro.repository;

import com.futaneagro.entity.Ppd;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PpdRepository extends JpaRepository<Ppd, String> {
}

