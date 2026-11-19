package com.siga.backend.repository;

import com.siga.backend.model.InventarioFisico;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface InventarioFisicoRepository extends JpaRepository<InventarioFisico, Integer> {
    Optional<InventarioFisico> findByCodigo(String codigo);
}