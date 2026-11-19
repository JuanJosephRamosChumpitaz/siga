package com.siga.backend.dtos;

public record PersonaResponse(
        Integer idPersona,
        String dni,
        String nombres,
        String apellidos,
        String nombreCompleto,
        String cargo,
        Integer idArea,
        String nombreArea,
        Boolean activo,
        Boolean tieneUsuario
) {}