package com.siga.backend.repository;
import com.siga.backend.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;


public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {
    @Query("select u from Usuario u join fetch u.rol left join fetch u.persona where u.username = :username")
    Optional<Usuario> buscarPorUsername(@Param("username") String username);
}

