package com.siga.backend.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UnidadRequest(
        @NotBlank(message = "El nombre de la unidad es obligatorio")
        @Size(max = 45)
        String nombre,

        @Size(max = 15)
        String abreviatura
) {}