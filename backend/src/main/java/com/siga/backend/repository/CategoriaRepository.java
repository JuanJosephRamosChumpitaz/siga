package com.siga.backend.repository;

import com.siga.backend.model.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CategoriaRepository extends JpaRepository<Categoria, Integer> {
    boolean existsByCodigoIgnoreCase(String codigo);
    boolean existsByCodigoIgnoreCaseAndIdNot(String codigo, Integer id);

    @Query("SELECT c FROM Categoria c LEFT JOIN FETCH c.idpadre ORDER BY c.codigo ASC, c.nombre ASC")
    List<Categoria> findAllWithPadre();

    @Query("SELECT c FROM Categoria c LEFT JOIN FETCH c.idpadre WHERE c.activo = true ORDER BY c.codigo ASC, c.nombre ASC")
    List<Categoria> findActivasWithPadre();
}
