package com.futaneagro.repository;

import com.futaneagro.entity.Dispatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DispatchRepository extends JpaRepository<Dispatch, Integer> {
    Optional<Dispatch> findByDispatchNumber(String dispatchNumber);
}
