package com.siga.backend.dtos;

import java.math.BigDecimal;

public record ReporteCuentaResumen(
        String codigoCuenta,
        String nombreCuenta,
        Long cantidadProductos,
        BigDecimal stockTotal,
        BigDecimal valorTotalPeps
) {}