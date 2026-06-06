package com.futaneagro.repository;

import com.futaneagro.entity.Ppm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PpmRepository extends JpaRepository<Ppm, Integer> {
}
