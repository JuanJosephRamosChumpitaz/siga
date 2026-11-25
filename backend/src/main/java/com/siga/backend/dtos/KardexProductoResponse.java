package com.siga.backend.dtos;

import java.math.BigDecimal;
import java.util.List;

public record KardexProductoResponse(
        Integer idProducto,
        String codigoInterno,
        String nombreProducto,
        String marcaSerie,
        String unidadMedida,
        String codigoCuenta,
        String nombreCuenta,
        BigDecimal consumoMensualAprox,
        BigDecimal stockActual,
        BigDecimal valorizadoActual,
        List<KardexMovimientoResponse> movimientos
) {}