package com.siga.backend.dtos;

public record LoginResponse(
        String token,
        Integer idUsuario,
        String username,
        String rol,
        Integer idPersona,
        String nombreCompleto,
        Integer idArea,
        String nombreArea
) {}