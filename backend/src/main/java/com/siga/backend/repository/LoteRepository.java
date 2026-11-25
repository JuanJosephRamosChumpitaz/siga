package com.siga.backend.repository;

import com.siga.backend.model.Lote;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface LoteRepository extends JpaRepository<Lote, Integer> {

    long countByCantidadRestanteGreaterThan(BigDecimal cantidadRestante);

    @Query("SELECT COALESCE(SUM(l.cantidadRestante * l.costoUnitario), 0) FROM Lote l WHERE l.cantidadRestante > 0")
    BigDecimal valorInventario();

    @Query("SELECT l FROM Lote l " +
            "JOIN FETCH l.idproducto p " +
            "LEFT JOIN FETCH p.idunidad " +
            "LEFT JOIN FETCH p.idcategoria " +
            "LEFT JOIN FETCH l.notaEntrada " +
            "LEFT JOIN FETCH l.proveedorEntidad " +
            "ORDER BY l.fechaIngreso DESC, l.id DESC")
    List<Lote> findAllWithDetails();

    @Query("SELECT l FROM Lote l " +
            "JOIN FETCH l.idproducto p " +
            "LEFT JOIN FETCH p.idunidad " +
            "LEFT JOIN FETCH p.idcategoria " +
            "WHERE l.notaEntrada.idNotaEntrada = :idNotaEntrada " +
            "ORDER BY l.id ASC")
    List<Lote> findByNotaEntradaWithDetails(@Param("idNotaEntrada") Integer idNotaEntrada);

    @Query("SELECT COALESCE(SUM(l.cantidadRestante * l.costoUnitario), 0) " +
            "FROM Lote l WHERE l.idproducto.id = :idProducto AND l.cantidadRestante > 0")
    BigDecimal calcularSaldoValorizadoPorProducto(@Param("idProducto") Integer idProducto);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT l FROM Lote l " +
            "WHERE l.idproducto.id = :idProducto AND l.cantidadRestante > 0 " +
            "ORDER BY l.fechaIngreso ASC, l.id ASC")
    List<Lote> findDisponiblesPeps(@Param("idProducto") Integer idProducto);
}
