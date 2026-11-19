package com.siga.backend.repository;

import com.siga.backend.model.Persona;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface PersonaRepository extends JpaRepository<Persona, Integer> {
    boolean existsByDni(String dni);
    boolean existsByDniAndIdNot(String dni, Integer id);

    @Query("SELECT p FROM Persona p LEFT JOIN FETCH p.idarea ORDER BY p.apellidos ASC, p.nombres ASC")
    List<Persona> findAllWithArea();
}