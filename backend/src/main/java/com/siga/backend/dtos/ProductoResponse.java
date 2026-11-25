package com.siga.backend.dtos;

import java.math.BigDecimal;

public record ProductoResponse(
        Integer idProducto,
        String codigoInterno,
        String codigoBarra,
        String nombre,
        String marcaSerie,
        String tipoBien,
        BigDecimal precioUnidad,
        BigDecimal stockGeneral,
        BigDecimal stockMinimo,
        BigDecimal consumoMensualAprox,
        Boolean perecible,
        Integer idCategoria,
        String codigoCuenta,
        String nombreCategoria,
        Integer idUnidad,
        String nombreUnidad,
        String abreviaturaUnidad,
        Boolean activo
) {}