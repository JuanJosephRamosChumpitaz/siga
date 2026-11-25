package com.siga.backend.repository;

import com.siga.backend.model.InventarioFisico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface InventarioFisicoRepository extends JpaRepository<InventarioFisico, Integer> {
    Optional<InventarioFisico> findByCodigo(String codigo);
    boolean existsByCodigoIgnoreCase(String codigo);
    long countByFechaInicioBetween(LocalDateTime inicio, LocalDateTime fin);

    @Query("SELECT i FROM InventarioFisico i LEFT JOIN FETCH i.responsable ORDER BY i.fechaInicio DESC, i.idInventarioFisico DESC")
    List<InventarioFisico> findAllWithResponsable();

    @Query("SELECT i FROM InventarioFisico i LEFT JOIN FETCH i.responsable WHERE i.idInventarioFisico = :id")
    Optional<InventarioFisico> findByIdWithResponsable(@Param("id") Integer id);
}