package com.siga.backend.repository;

import com.siga.backend.model.Unidad;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface UnidadRepository extends JpaRepository<Unidad, Integer> {
    boolean existsByNombreIgnoreCase(String nombre);
    boolean existsByNombreIgnoreCaseAndIdNot(String nombre, Integer id);
    List<Unidad> findAllByOrderByNombreAsc();
    List<Unidad> findByActivoTrueOrderByNombreAsc();

}