package com.siga.backend.repository;

import com.siga.backend.model.MovimientoKardex;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface MovimientoKardexRepository extends JpaRepository<MovimientoKardex, Integer> {

    @Query("SELECT m FROM MovimientoKardex m " +
            "LEFT JOIN FETCH m.area " +
            "LEFT JOIN FETCH m.solicitante " +
            "LEFT JOIN FETCH m.proveedor " +
            "LEFT JOIN FETCH m.lote " +
            "LEFT JOIN FETCH m.usuarioRegistro " +
            "WHERE m.producto.id = :idProducto AND m.fecha BETWEEN :desde AND :hasta " +
            "ORDER BY m.fecha ASC, m.idMovimiento ASC")
    List<MovimientoKardex> findByProductoAndRangoFecha(@Param("idProducto") Integer idProducto,
                                                       @Param("desde") LocalDateTime desde,
                                                       @Param("hasta") LocalDateTime hasta);

    @Query("SELECT m FROM MovimientoKardex m " +
            "LEFT JOIN FETCH m.area " +
            "LEFT JOIN FETCH m.pecosa " +
            "WHERE m.fecha BETWEEN :desde AND :hasta " +
            "ORDER BY m.fecha ASC, m.idMovimiento ASC")
    List<MovimientoKardex> findAllByRangoFecha(
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta
    );
}