package com.siga.backend.repository;
import com.siga.backend.model.Pecosa;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;


public interface PecosaRepository extends JpaRepository<Pecosa, Integer> {

    long countByFechaEmisionGreaterThanEqual(Instant desde);
}
