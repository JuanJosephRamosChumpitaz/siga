package com.siga.backend.dtos;

import java.time.LocalDateTime;
import java.util.List;

public record InventarioFisicoResponse(
        Integer idInventarioFisico,
        String codigo,
        LocalDateTime fechaInicio,
        LocalDateTime fechaCierre,
        String estado,
        String observaciones,
        String responsableNombre,
        Integer totalProductos,
        Integer totalConDiferencia,
        List<InventarioDetalleResponse> detalles
) {}