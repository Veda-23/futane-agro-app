package com.futaneagro.repository;

import com.futaneagro.entity.Ppd;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;

@Repository
public interface PpdRepository extends JpaRepository<Ppd, String> {
    @Query("SELECT COALESCE(SUM(p.successful), 0) FROM Ppd p WHERE p.date = :date")
    Integer sumSuccessfulByDate(@Param("date") LocalDate date);

    @Query("SELECT COALESCE(SUM(p.successful), 0) FROM Ppd p WHERE YEAR(p.date) = :year AND MONTH(p.date) = :month")
    Integer sumSuccessfulByYearAndMonth(@Param("year") int year, @Param("month") int month);
}

