package com.futaneagro.repository;

import com.futaneagro.entity.Ppd;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface PpdRepository extends JpaRepository<Ppd, Integer> {
    @Query("SELECT COALESCE(SUM(p.successful), 0) FROM Ppd p WHERE p.date = :date AND p.isDeleted = false")
    Integer sumSuccessfulByDate(@Param("date") LocalDate date);

    @Query("SELECT COALESCE(SUM(p.successful), 0) FROM Ppd p WHERE MONTH(p.date) = :month AND YEAR(p.date) = :year AND p.isDeleted = false")
    Integer sumSuccessfulByMonthAndYear(@Param("month") int month, @Param("year") int year);
}
