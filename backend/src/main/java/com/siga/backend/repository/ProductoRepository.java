package com.siga.backend.repository;

import com.siga.backend.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface ProductoRepository extends JpaRepository<Producto, Integer> {
    boolean existsByCodigoBarra(String codigoBarra);
    boolean existsByCodigoBarraAndIdNot(String codigoBarra, Integer id);
    boolean existsByCodigoInternoIgnoreCase(String codigoInterno);
    boolean existsByCodigoInternoIgnoreCaseAndIdNot(String codigoInterno, Integer id);
    long countByStockGeneralLessThanEqual(BigDecimal stockGeneral);



    @Query("SELECT p FROM Producto p LEFT JOIN FETCH p.idcategoria LEFT JOIN FETCH p.idunidad ORDER BY p.nombre ASC")
    List<Producto> findAllWithDetails();

    @Query("SELECT p FROM Producto p LEFT JOIN FETCH p.idcategoria LEFT JOIN FETCH p.idunidad WHERE p.activo = true ORDER BY p.nombre ASC")
    List<Producto> findActivosWithDetails();

    @Query("SELECT p FROM Producto p LEFT JOIN FETCH p.idcategoria LEFT JOIN FETCH p.idunidad " +
            "WHERE p.codigoBarra = :codigo OR UPPER(p.codigoInterno) = UPPER(:codigo)")
    Optional<Producto> buscarPorCodigoEscaneado(@Param("codigo") String codigo);
}
