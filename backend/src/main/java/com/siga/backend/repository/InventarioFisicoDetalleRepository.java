package com.siga.backend.repository;

import com.siga.backend.model.InventarioFisicoDetalle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface InventarioFisicoDetalleRepository extends JpaRepository<InventarioFisicoDetalle, Integer> {

    @Query("SELECT d FROM InventarioFisicoDetalle d " +
            "JOIN FETCH d.producto p " +
            "LEFT JOIN FETCH p.idunidad " +
            "LEFT JOIN FETCH p.idcategoria " +
            "WHERE d.inventarioFisico.idInventarioFisico IN :ids " +
            "ORDER BY p.nombre ASC")
    List<InventarioFisicoDetalle> findByInventarioIdsWithProducto(@Param("ids") List<Integer> ids);

    @Query("SELECT d FROM InventarioFisicoDetalle d " +
            "JOIN FETCH d.producto p " +
            "LEFT JOIN FETCH p.idunidad " +
            "LEFT JOIN FETCH p.idcategoria " +
            "WHERE d.inventarioFisico.idInventarioFisico = :idInventario " +
            "ORDER BY p.nombre ASC")
    List<InventarioFisicoDetalle> findByInventarioIdWithProducto(@Param("idInventario") Integer idInventario);
}
