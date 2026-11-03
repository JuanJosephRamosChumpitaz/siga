package com.siga.backend.controllers;

import com.siga.backend.dtos.LoginRequest;
import com.siga.backend.dtos.LoginResponse;
import com.siga.backend.model.Usuario;
import com.siga.backend.repository.UsuarioRepository;
import com.siga.backend.security.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest req) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.username(), req.password()));
        Usuario u = usuarioRepository.buscarPorUsername(req.username()).orElseThrow();
        String rol = u.getRol().getNombre().toUpperCase();
        String nombre = u.getPersona() != null
                ? u.getPersona().getNombres() + " " + u.getPersona().getApellidos()
                : u.getUsername();
        return new LoginResponse(jwtService.generar(u.getUsername(), rol), u.getUsername(), rol, nombre);
    }
}