package com.siga.backend.repository;
import com.siga.backend.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductoRepository extends JpaRepository<Producto, Integer> {

    long countByStockGeneralLessThanEqual(Integer stock);
}
