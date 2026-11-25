package com.siga.backend.controllers;

import com.siga.backend.dtos.UnidadRequest;
import com.siga.backend.dtos.UnidadResponse;
import com.siga.backend.services.UnidadService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/unidades")
@RequiredArgsConstructor
public class UnidadController {

    private final UnidadService unidadService;

    @GetMapping
    public ResponseEntity<List<UnidadResponse>> listar(
            @RequestParam(defaultValue = "false") boolean soloActivas) {
        return ResponseEntity.ok(unidadService.listar(soloActivas));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ADMIN', 'ROLE_ALMACENERO', 'ALMACENERO')")
    public ResponseEntity<UnidadResponse> crear(@Valid @RequestBody UnidadRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(unidadService.crear(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ADMIN', 'ROLE_ALMACENERO', 'ALMACENERO')")
    public ResponseEntity<UnidadResponse> actualizar(@PathVariable Integer id, @Valid @RequestBody UnidadRequest request) {
        return ResponseEntity.ok(unidadService.actualizar(id, request));
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ADMIN', 'ROLE_ALMACENERO', 'ALMACENERO')")
    public ResponseEntity<UnidadResponse> cambiarEstado(@PathVariable Integer id, @RequestParam boolean activo) {
        return ResponseEntity.ok(unidadService.cambiarEstado(id, activo));
    }
}