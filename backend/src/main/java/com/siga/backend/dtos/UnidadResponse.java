package com.siga.backend.dtos;

public record UnidadResponse(
        Integer idUnidad,
        String nombre,
        String abreviatura,
        Boolean activo
) {}