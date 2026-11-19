package com.siga.backend.repository;

import com.siga.backend.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {
    Optional<Usuario> findByUsername(String username);
    boolean existsByUsernameIgnoreCase(String username);
    boolean existsByUsernameIgnoreCaseAndIdNot(String username, Integer id);
    boolean existsByPersona_Id(Integer idPersona);

    @Query("SELECT u FROM Usuario u LEFT JOIN FETCH u.persona p LEFT JOIN FETCH p.idarea LEFT JOIN FETCH u.rol WHERE u.username = :username")
    Optional<Usuario> buscarPorUsername(@Param("username") String username);

    @Query("SELECT u FROM Usuario u LEFT JOIN FETCH u.persona p LEFT JOIN FETCH p.idarea LEFT JOIN FETCH u.rol ORDER BY u.username ASC")
    List<Usuario> findAllWithDetails();
}
