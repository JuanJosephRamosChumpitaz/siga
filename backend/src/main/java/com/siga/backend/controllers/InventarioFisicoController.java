package com.siga.backend.controllers;

import com.siga.backend.dtos.*;
import com.siga.backend.services.InventarioFisicoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/inventarios-fisicos")
@RequiredArgsConstructor
public class InventarioFisicoController {

    private final InventarioFisicoService inventarioService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ADMIN', 'ROLE_ALMACENERO', 'ALMACENERO')")
    public ResponseEntity<List<InventarioFisicoResponse>> listar() {
        return ResponseEntity.ok(inventarioService.listar());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ADMIN', 'ROLE_ALMACENERO', 'ALMACENERO')")
    public ResponseEntity<InventarioFisicoResponse> obtenerPorId(@PathVariable Integer id) {
        return ResponseEntity.ok(inventarioService.obtenerPorId(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ADMIN', 'ROLE_ALMACENERO', 'ALMACENERO')")
    public ResponseEntity<InventarioFisicoResponse> iniciar(
            @RequestBody(required = false) InventarioFisicoCrearRequest request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(inventarioService.iniciarSesion(request, authentication.getName()));
    }

    @PutMapping("/{id}/conteo")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ADMIN', 'ROLE_ALMACENERO', 'ALMACENERO')")
    public ResponseEntity<InventarioFisicoResponse> guardarConteo(
            @PathVariable Integer id,
            @Valid @RequestBody InventarioConteoRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(inventarioService.guardarConteo(id, request, authentication.getName()));
    }

    @PostMapping("/{id}/cerrar")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ADMIN', 'ROLE_ALMACENERO', 'ALMACENERO')")
    public ResponseEntity<InventarioFisicoResponse> cerrar(
            @PathVariable Integer id,
            @RequestBody(required = false) InventarioCerrarRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(inventarioService.cerrarSesion(id, request, authentication.getName()));
    }
}