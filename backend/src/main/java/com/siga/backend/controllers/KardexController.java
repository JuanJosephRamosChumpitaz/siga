package com.siga.backend.controllers;

import com.siga.backend.dtos.KardexProductoResponse;
import com.siga.backend.services.KardexService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/kardex")
@RequiredArgsConstructor
public class KardexController {

    private final KardexService kardexService;

    @GetMapping("/producto/{idProducto}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ADMIN', 'ROLE_ALMACENERO', 'ALMACENERO')")
    public ResponseEntity<KardexProductoResponse> consultarPorProducto(
            @PathVariable Integer idProducto,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ResponseEntity.ok(kardexService.consultarPorProducto(idProducto, desde, hasta));
    }
}