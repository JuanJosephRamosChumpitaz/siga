package com.siga.backend.dtos;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record NotaEntradaResponse(
        Integer idNotaEntrada,
        String numeroNea,
        LocalDateTime fechaEmision,
        String procedencia,
        String destino,
        String referencia,
        String modalidad,
        String observaciones,
        Integer idProveedor,
        String proveedorRazonSocial,
        String proveedorRuc,
        String responsableNombre,
        Integer cantidadItems,
        BigDecimal totalValorizado,
        List<NotaEntradaItemResponse> items
) {}