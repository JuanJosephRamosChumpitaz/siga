package com.siga.backend.dtos;

import java.math.BigDecimal;

public record InventarioDetalleResponse(
        Integer idInventarioDetalle,
        Integer idProducto,
        String codigoInterno,
        String codigoBarra,
        String nombreProducto,
        String codigoCuenta,
        String unidadMedida,
        BigDecimal stockSistema,
        BigDecimal stockFisico,
        BigDecimal diferencia,
        String observacion
) {}