package com.siga.backend.repository;

import com.siga.backend.model.PecosaFirma;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PecosaFirmaRepository extends JpaRepository<PecosaFirma, Integer> {

    @Query("SELECT f FROM PecosaFirma f " +
            "LEFT JOIN FETCH f.persona " +
            "WHERE f.pecosa.id IN :ids " +
            "ORDER BY f.orden ASC")
    List<PecosaFirma> findByPecosaIdsWithPersona(@Param("ids") List<Integer> ids);

    @Query("SELECT f FROM PecosaFirma f " +
            "LEFT JOIN FETCH f.persona " +
            "WHERE f.pecosa.id = :idPecosa " +
            "ORDER BY f.orden ASC")
    List<PecosaFirma> findByPecosaIdWithPersona(@Param("idPecosa") Integer idPecosa);
}
