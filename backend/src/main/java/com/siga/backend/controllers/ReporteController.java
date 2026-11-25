package com.siga.backend.controllers;

import com.siga.backend.dtos.AuditoriaResponse;
import com.siga.backend.dtos.ReporteConsumoArea;
import com.siga.backend.dtos.ReporteCuentaResumen;
import com.siga.backend.dtos.ReporteInventarioValorizadoItem;
import com.siga.backend.services.ReporteService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ReporteController {

    private final ReporteService reporteService;

    @GetMapping("/reportes/inventario-valorizado")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ADMIN', 'ROLE_ALMACENERO', 'ALMACENERO', 'ROLE_ABASTECIMIENTO', 'ABASTECIMIENTO')")
    public ResponseEntity<List<ReporteInventarioValorizadoItem>> inventarioValorizado() {
        return ResponseEntity.ok(reporteService.inventarioValorizado());
    }

    @GetMapping("/reportes/resumen-cuentas")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ADMIN', 'ROLE_ALMACENERO', 'ALMACENERO', 'ROLE_ABASTECIMIENTO', 'ABASTECIMIENTO')")
    public ResponseEntity<List<ReporteCuentaResumen>> resumenCuentas() {
        return ResponseEntity.ok(reporteService.resumenPorCuentaContable());
    }

    @GetMapping("/reportes/consumo-areas")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ADMIN', 'ROLE_ALMACENERO', 'ALMACENERO', 'ROLE_ABASTECIMIENTO', 'ABASTECIMIENTO')")
    public ResponseEntity<List<ReporteConsumoArea>> consumoAreas(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ResponseEntity.ok(reporteService.consumoPorArea(desde, hasta));
    }

    @GetMapping("/auditoria")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ADMIN')")
    public ResponseEntity<List<AuditoriaResponse>> listarAuditoria() {
        return ResponseEntity.ok(reporteService.listarAuditoria());
    }
}