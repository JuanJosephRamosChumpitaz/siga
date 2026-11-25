package com.siga.backend.controllers;

import com.siga.backend.dtos.LoteResponse;
import com.siga.backend.dtos.NotaEntradaRequest;
import com.siga.backend.dtos.NotaEntradaResponse;
import com.siga.backend.services.NotaEntradaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class NotaEntradaController {

    private final NotaEntradaService notaEntradaService;

    @GetMapping("/notas-entrada")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ADMIN', 'ROLE_ALMACENERO', 'ALMACENERO')")
    public ResponseEntity<List<NotaEntradaResponse>> listar() {
        return ResponseEntity.ok(notaEntradaService.listarNotasEntrada());
    }

    @GetMapping("/notas-entrada/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ADMIN', 'ROLE_ALMACENERO', 'ALMACENERO')")
    public ResponseEntity<NotaEntradaResponse> obtenerPorId(@PathVariable Integer id) {
        return ResponseEntity.ok(notaEntradaService.obtenerPorId(id));
    }

    @PostMapping("/notas-entrada")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ADMIN', 'ROLE_ALMACENERO', 'ALMACENERO')")
    public ResponseEntity<NotaEntradaResponse> registrar(
            @Valid @RequestBody NotaEntradaRequest request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(notaEntradaService.registrarEntrada(request, authentication.getName()));
    }

    @GetMapping("/lotes")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ADMIN', 'ROLE_ALMACENERO', 'ALMACENERO')")
    public ResponseEntity<List<LoteResponse>> listarLotes(
            @RequestParam(defaultValue = "false") boolean soloConStock) {
        return ResponseEntity.ok(notaEntradaService.listarLotes(soloConStock));
    }
}