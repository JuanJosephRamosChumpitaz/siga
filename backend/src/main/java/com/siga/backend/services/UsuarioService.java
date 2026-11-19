package com.siga.backend.services;

import com.siga.backend.dtos.RolResponse;
import com.siga.backend.dtos.UsuarioRequest;
import com.siga.backend.dtos.UsuarioResponse;
import com.siga.backend.model.Area;
import com.siga.backend.model.Persona;
import com.siga.backend.model.Rol;
import com.siga.backend.model.Usuario;
import com.siga.backend.repository.PersonaRepository;
import com.siga.backend.repository.RolRepository;
import com.siga.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PersonaRepository personaRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UsuarioResponse> listar() {
        return usuarioRepository.findAllWithDetails().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RolResponse> listarRoles() {
        return rolRepository.findAllByOrderByNombreAsc().stream()
                .map(r -> new RolResponse(r.getId(), r.getNombre()))
                .toList();
    }

    @Transactional
    public UsuarioResponse crear(UsuarioRequest request) {
        String username = request.username().trim().toLowerCase();

        if (request.password() == null || request.password().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La contraseña es obligatoria");
        }
        if (usuarioRepository.existsByUsernameIgnoreCase(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El nombre de usuario ya está en uso");
        }
        if (usuarioRepository.existsByPersona_Id(request.idPersona())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Esta persona ya tiene un usuario asignado");
        }

        Persona persona = personaRepository.findById(request.idPersona())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Persona no encontrada"));
        Rol rol = rolRepository.findById(request.idRol())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rol no encontrado"));

        Usuario usuario = new Usuario();
        usuario.setUsername(username);
        usuario.setPassword(passwordEncoder.encode(request.password()));
        usuario.setPersona(persona);
        usuario.setRol(rol);
        usuario.setActivo(true);

        return toResponse(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioResponse actualizar(Integer id, UsuarioRequest request) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        String username = request.username().trim().toLowerCase();
        if (usuarioRepository.existsByUsernameIgnoreCaseAndIdNot(username, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Otro usuario ya utiliza ese nombre");
        }

        Rol rol = rolRepository.findById(request.idRol())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rol no encontrado"));

        usuario.setUsername(username);
        usuario.setRol(rol);
        if (request.password() != null && !request.password().isBlank()) {
            usuario.setPassword(passwordEncoder.encode(request.password()));
        }

        return toResponse(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioResponse cambiarEstado(Integer id, boolean activo) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        usuario.setActivo(activo);
        return toResponse(usuarioRepository.save(usuario));
    }

    private UsuarioResponse toResponse(Usuario u) {
        Persona p = u.getPersona();
        Area a = (p != null) ? p.getIdarea() : null;
        Rol r = u.getRol();
        return new UsuarioResponse(
                u.getId(),
                u.getUsername(),
                p != null ? p.getId() : null,
                p != null ? p.getDni() : "",
                p != null ? (p.getNombres() + " " + p.getApellidos()).trim() : u.getUsername(),
                p != null ? p.getCargo() : "",
                a != null ? a.getId() : null,
                a != null ? a.getNombre() : "Sin área",
                r != null ? r.getId() : null,
                r != null ? r.getNombre() : "",
                u.getActivo()
        );
    }
}
