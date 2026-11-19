package com.siga.backend.dtos;

public record UsuarioResponse(
        Integer idUsuario,
        String username,
        Integer idPersona,
        String dni,
        String nombreCompleto,
        String cargo,
        Integer idArea,
        String nombreArea,
        Integer idRol,
        String rol,
        Boolean activo
) {}