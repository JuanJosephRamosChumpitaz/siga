package com.siga.backend.controllers;

import com.siga.backend.dtos.AreaRequest;
import com.siga.backend.dtos.AreaResponse;
import com.siga.backend.services.AreaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/areas")
@RequiredArgsConstructor
public class AreaController {

    private final AreaService areaService;

    @GetMapping
    public ResponseEntity<List<AreaResponse>> listar(
            @RequestParam(defaultValue = "false") boolean soloActivas) {
        return ResponseEntity.ok(areaService.listar(soloActivas));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ADMIN')")
    public ResponseEntity<AreaResponse> crear(@Valid @RequestBody AreaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(areaService.crear(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ADMIN')")
    public ResponseEntity<AreaResponse> actualizar(@PathVariable Integer id, @Valid @RequestBody AreaRequest request) {
        return ResponseEntity.ok(areaService.actualizar(id, request));
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ADMIN')")
    public ResponseEntity<AreaResponse> cambiarEstado(@PathVariable Integer id, @RequestParam boolean activo) {
        return ResponseEntity.ok(areaService.cambiarEstado(id, activo));
    }
}