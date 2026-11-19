package com.siga.backend.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UsuarioRequest(
        @NotNull(message = "Debe seleccionar una persona")
        Integer idPersona,

        @NotBlank(message = "El nombre de usuario es obligatorio")
        @Size(min = 3, max = 45)
        String username,

        @Size(min = 6, max = 100, message = "La contraseña debe tener al menos 6 caracteres")
        String password,

        @NotNull(message = "Debe seleccionar un rol")
        Integer idRol
) {}