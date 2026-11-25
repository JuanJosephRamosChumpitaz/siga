package com.siga.backend.dtos;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record LoteResponse(
        Integer idLote,
        Integer idProducto,
        String codigoInterno,
        String nombreProducto,
        String unidadMedida,
        Boolean perecible,
        String numeroNea,
        String documentoSustento,
        String proveedor,
        LocalDateTime fechaIngreso,
        LocalDate fechaVencimiento,
        BigDecimal cantidadInicial,
        BigDecimal cantidadRestante,
        BigDecimal costoUnitario,
        BigDecimal valorizadoRestante,
        String estado
) {}