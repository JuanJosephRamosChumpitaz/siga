package com.siga.backend.repository;

import com.siga.backend.model.Proveedor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ProveedorRepository extends JpaRepository<Proveedor, Integer> {
    Optional<Proveedor> findByRuc(String ruc);
    boolean existsByRuc(String ruc);
    boolean existsByRucAndIdProveedorNot(String ruc, Integer idProveedor);
    List<Proveedor> findAllByOrderByRazonSocialAsc();
    List<Proveedor> findByActivoTrueOrderByRazonSocialAsc();
}