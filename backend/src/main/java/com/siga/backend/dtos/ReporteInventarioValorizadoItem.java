package com.siga.backend.dtos;

import java.math.BigDecimal;

public record ReporteInventarioValorizadoItem(
        Integer idProducto,
        String codigoInterno,
        String nombreProducto,
        String marcaSerie,
        String codigoCuenta,
        String nombreCuenta,
        String unidadMedida,
        BigDecimal stockGeneral,
        BigDecimal stockMinimo,
        BigDecimal costoReferencial,
        BigDecimal valorTotalPeps
) {}