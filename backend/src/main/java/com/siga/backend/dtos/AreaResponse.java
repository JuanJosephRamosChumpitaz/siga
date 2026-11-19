package com.siga.backend.dtos;

public record AreaResponse(
        Integer idArea,
        String nombre,
        String descripcion,
        Boolean activo
) {}