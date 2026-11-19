package com.siga.backend.controllers;

import com.siga.backend.dtos.LoginRequest;
import com.siga.backend.dtos.LoginResponse;
import com.siga.backend.model.Area;
import com.siga.backend.model.Persona;
import com.siga.backend.model.Usuario;
import com.siga.backend.repository.UsuarioRepository;
import com.siga.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );

        Usuario usuario = usuarioRepository.buscarPorUsername(request.username())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));

        if (Boolean.FALSE.equals(usuario.getActivo())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "El usuario está desactivado");
        }

        String rolNombre = (usuario.getRol() != null)
                ? usuario.getRol().getNombre().replace("ROLE_", "").toUpperCase()
                : "SOLICITANTE";

        String token = jwtService.generar(usuario.getUsername(), rolNombre);

        Persona persona = usuario.getPersona();
        Area area = (persona != null) ? persona.getIdarea() : null;

        String nombreCompleto = (persona != null)
                ? (persona.getNombres() + " " + persona.getApellidos()).trim()
                : usuario.getUsername();

        LoginResponse response = new LoginResponse(
                token,
                usuario.getId(),
                usuario.getUsername(),
                rolNombre,
                persona != null ? persona.getId() : null,
                nombreCompleto,
                area != null ? area.getId() : null,
                area != null ? area.getNombre() : "Sin área asignada"
        );

        return ResponseEntity.ok(response);
    }
}
