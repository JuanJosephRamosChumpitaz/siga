package com.siga.backend.config;

import com.siga.backend.model.Persona;
import com.siga.backend.model.Rol;
import com.siga.backend.model.Usuario;
import com.siga.backend.repository.PersonaRepository;
import com.siga.backend.repository.RolRepository;
import com.siga.backend.repository.UsuarioRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Profile("dev")
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {
    private final RolRepository rolRepository;
    private final PersonaRepository personaRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (usuarioRepository.count() > 0) return;

        Rol admin = obtenerRol("ADMIN");
        obtenerRol("ALMACENERO");

        Persona p = new Persona();
        p.setDni("00000000");
        p.setNombres("Administrador");
        p.setApellidos("Sistema");
        personaRepository.save(p);

        Usuario u = new Usuario();
        u.setUsername("admin");
        u.setPassword(passwordEncoder.encode("admin123"));
        u.setPersona(p);
        u.setRol(admin);
        usuarioRepository.save(u);
    }

    private Rol obtenerRol(String nombre) {
        return rolRepository.findByNombre(nombre).orElseGet(() -> {
            Rol r = new Rol();
            r.setNombre(nombre);
            return rolRepository.save(r);
        });
    }
}