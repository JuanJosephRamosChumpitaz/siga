package com.siga.backend.repository;

import com.siga.backend.model.NotaEntrada;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface NotaEntradaRepository extends JpaRepository<NotaEntrada, Integer> {
    Optional<NotaEntrada> findByNumeroNea(String numeroNea);
    boolean existsByNumeroNeaIgnoreCase(String numeroNea);
    long countByFechaEmisionBetween(LocalDateTime inicio, LocalDateTime fin);

    @Query("SELECT n FROM NotaEntrada n LEFT JOIN FETCH n.proveedor LEFT JOIN FETCH n.responsable ORDER BY n.fechaEmision DESC, n.idNotaEntrada DESC")
    List<NotaEntrada> findAllWithDetails();

    @Query("SELECT n FROM NotaEntrada n LEFT JOIN FETCH n.proveedor LEFT JOIN FETCH n.responsable WHERE n.idNotaEntrada = :id")
    Optional<NotaEntrada> findByIdWithDetails(@Param("id") Integer id);
}