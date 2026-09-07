package com.futaneagro.repository;

import com.futaneagro.entity.Transport;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransportRepository extends JpaRepository<Transport, String> {
    @EntityGraph(attributePaths = {"driver"})
    List<Transport> findAll();
}

