package com.siga.backend.dtos;

import java.math.BigDecimal;
import java.time.LocalDate;

public record NotaEntradaItemResponse(
        Integer idLote,
        Integer idProducto,
        String codigoInterno,
        String nombreProducto,
        String codigoCuenta,
        String unidadMedida,
        BigDecimal cantidadInicial,
        BigDecimal cantidadRestante,
        BigDecimal costoUnitario,
        BigDecimal subtotal,
        LocalDate fechaVencimiento
) {}