package com.siga.backend.repository;

import com.siga.backend.model.PecosaDetalle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PecosaDetalleRepository extends JpaRepository<PecosaDetalle, Integer> {

    @Query("SELECT d FROM PecosaDetalle d " +
            "JOIN FETCH d.idproducto p " +
            "LEFT JOIN FETCH p.idunidad " +
            "LEFT JOIN FETCH p.idcategoria " +
            "LEFT JOIN FETCH d.idlote " +
            "WHERE d.idpecosa.id IN :ids " +
            "ORDER BY d.id ASC")
    List<PecosaDetalle> findByPecosaIdsWithDetails(@Param("ids") List<Integer> ids);

    @Query("SELECT d FROM PecosaDetalle d " +
            "JOIN FETCH d.idproducto p " +
            "LEFT JOIN FETCH p.idunidad " +
            "LEFT JOIN FETCH p.idcategoria " +
            "LEFT JOIN FETCH d.idlote " +
            "WHERE d.idpecosa.id = :idPecosa " +
            "ORDER BY d.id ASC")
    List<PecosaDetalle> findByPecosaIdWithDetails(@Param("idPecosa") Integer idPecosa);
}
