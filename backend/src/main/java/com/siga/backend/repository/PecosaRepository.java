package com.siga.backend.repository;

import com.siga.backend.model.Pecosa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface PecosaRepository extends JpaRepository<Pecosa, Integer> {
    boolean existsByNumeroPecosaIgnoreCase(String numeroPecosa);
    long countByFechaEmisionBetween(Instant inicio, Instant fin);
    long countByFechaEmisionGreaterThanEqual(Instant fechaEmision);

    @Query("SELECT p FROM Pecosa p " +
            "LEFT JOIN FETCH p.idarea " +
            "LEFT JOIN FETCH p.idpersonaSolicitante " +
            "LEFT JOIN FETCH p.idpersonaAlmacenista " +
            "ORDER BY p.fechaEmision DESC, p.id DESC")
    List<Pecosa> findAllWithDetails();

    @Query("SELECT p FROM Pecosa p " +
            "LEFT JOIN FETCH p.idarea " +
            "LEFT JOIN FETCH p.idpersonaSolicitante " +
            "LEFT JOIN FETCH p.idpersonaAlmacenista " +
            "WHERE p.idarea.id = :idArea OR p.idpersonaSolicitante.id = :idPersona " +
            "ORDER BY p.fechaEmision DESC, p.id DESC")
    List<Pecosa> findByAreaOrSolicitanteWithDetails(@Param("idArea") Integer idArea, @Param("idPersona") Integer idPersona);

    @Query("SELECT p FROM Pecosa p " +
            "LEFT JOIN FETCH p.idarea " +
            "LEFT JOIN FETCH p.idpersonaSolicitante " +
            "LEFT JOIN FETCH p.idpersonaAlmacenista " +
            "WHERE p.id = :id")
    Optional<Pecosa> findByIdWithDetails(@Param("id") Integer id);

    @Query("SELECT p FROM Pecosa p " +
            "LEFT JOIN FETCH p.idarea " +
            "LEFT JOIN FETCH p.idpersonaSolicitante " +
            "LEFT JOIN FETCH p.idpersonaAlmacenista " +
            "WHERE UPPER(p.codigoQr) = UPPER(:codigo) OR UPPER(p.numeroPecosa) = UPPER(:codigo)")
    Optional<Pecosa> findByCodigoQrOrNumero(@Param("codigo") String codigo);
}
