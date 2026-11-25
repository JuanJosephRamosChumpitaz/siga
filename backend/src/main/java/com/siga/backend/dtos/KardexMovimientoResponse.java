package com.siga.backend.dtos;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record KardexMovimientoResponse(
        Integer idMovimiento,
        LocalDateTime fecha,
        String tipoMovimiento,
        String documentoReferencia,
        Integer idLote,
        String areaNombre,
        String solicitanteNombre,
        String proveedorNombre,
        BigDecimal cantidadEntrada,
        BigDecimal cantidadSalida,
        BigDecimal saldoCantidad,
        BigDecimal costoUnitario,
        BigDecimal importeEntrada,
        BigDecimal importeSalida,
        BigDecimal saldoValorizado,
        String observacion,
        String usuarioRegistro
) {}