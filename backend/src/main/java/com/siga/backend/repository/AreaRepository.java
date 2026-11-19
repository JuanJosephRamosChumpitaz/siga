package com.siga.backend.repository;

import com.siga.backend.model.Area;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AreaRepository extends JpaRepository<Area, Integer> {
    boolean existsByNombreIgnoreCase(String nombre);
    boolean existsByNombreIgnoreCaseAndIdNot(String nombre, Integer id);
    List<Area> findAllByOrderByNombreAsc();
    List<Area> findByActivoTrueOrderByNombreAsc();
}
