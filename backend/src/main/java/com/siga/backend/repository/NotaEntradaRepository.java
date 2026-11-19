package com.siga.backend.repository;

import com.siga.backend.model.NotaEntrada;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface NotaEntradaRepository extends JpaRepository<NotaEntrada, Integer> {
    Optional<NotaEntrada> findByNumeroNea(String numeroNea);
}