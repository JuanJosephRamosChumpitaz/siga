package com.siga.backend.dtos;

import java.math.BigDecimal;

public record PecosaDetalleResponse(
        Integer idPecosaDetalle,
        Integer idProducto,
        String codigoInterno,
        String nombreProducto,
        String unidadMedida,
        String tipoBien,
        String codigoCuenta,
        Integer idLote,
        BigDecimal stockActualProducto,
        BigDecimal cantidadSolicitada,
        BigDecimal cantidadAtendida,
        BigDecimal precioUnitarioHistorico,
        BigDecimal subtotal
) {}