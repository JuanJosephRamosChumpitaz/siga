package com.siga.backend.dtos;

public record CategoriaResponse(
        Integer idCategoria,
        String codigo,
        String nombre,
        Integer idPadre,
        String codigoPadre,
        String nombrePadre,
        Boolean activo
) {}