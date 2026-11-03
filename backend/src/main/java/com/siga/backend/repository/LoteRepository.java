package com.siga.backend.repository;
import com.siga.backend.model.Lote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;

public interface LoteRepository extends JpaRepository<Lote, Integer> {

    long countByCantidadRestanteGreaterThan(BigDecimal valor);

    @Query("select coalesce(sum(l.cantidadRestante * l.costoUnitario), 0) from Lote l where l.cantidadRestante > 0")
    BigDecimal valorInventario();
}
