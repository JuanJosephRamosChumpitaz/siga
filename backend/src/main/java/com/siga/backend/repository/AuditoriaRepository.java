package com.siga.backend.repository;

import com.siga.backend.model.Auditoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface AuditoriaRepository extends JpaRepository<Auditoria, Long> {

    @Query("SELECT a FROM Auditoria a LEFT JOIN FETCH a.usuario ORDER BY a.fecha DESC, a.idAuditoria DESC")
    List<Auditoria> findAllWithUsuarioOrderByFechaDesc();
}