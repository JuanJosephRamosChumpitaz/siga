package com.siga.backend.controllers;

import com.siga.backend.dtos.*;
import com.siga.backend.services.PecosaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/pecosas")
@RequiredArgsConstructor
public class PecosaController {

    private final PecosaService pecosaService;

    @GetMapping
    public ResponseEntity<List<PecosaResponse>> listar(Authentication authentication) {
        return ResponseEntity.ok(pecosaService.listar(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PecosaResponse> obtenerPorId(@PathVariable Integer id, Authentication authentication) {
        return ResponseEntity.ok(pecosaService.obtenerPorId(id, authentication.getName()));
    }

    @GetMapping("/buscar-qr/{codigo}")
    public ResponseEntity<PecosaResponse> buscarPorQr(@PathVariable String codigo, Authentication authentication) {
        return ResponseEntity.ok(pecosaService.buscarPorQr(codigo, authentication.getName()));
    }

    @PostMapping
    public ResponseEntity<PecosaResponse> crear(
            @Valid @RequestBody PecosaRequest request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(pecosaService.crearSolicitud(request, authentication.getName()));
    }

    @PostMapping("/{id}/firmar")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ADMIN', 'ROLE_ABASTECIMIENTO', 'ABASTECIMIENTO', 'ROLE_ALMACENERO', 'ALMACENERO')")
    public ResponseEntity<PecosaResponse> firmar(
            @PathVariable Integer id,
            @Valid @RequestBody PecosaFirmaRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(pecosaService.firmarORechazar(id, request, authentication.getName()));
    }

    @PostMapping("/{id}/despachar")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ADMIN', 'ROLE_ALMACENERO', 'ALMACENERO')")
    public ResponseEntity<PecosaResponse> despachar(
            @PathVariable Integer id,
            @Valid @RequestBody PecosaDespachoRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(pecosaService.despacharPeps(id, request, authentication.getName()));
    }
}