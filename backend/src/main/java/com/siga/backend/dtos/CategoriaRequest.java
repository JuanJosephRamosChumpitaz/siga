package com.siga.backend.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CategoriaRequest(
        @NotBlank(message = "El código contable es obligatorio")
        @Size(max = 50)
        String codigo,

        @NotBlank(message = "La denominación de la cuenta es obligatoria")
        @Size(max = 150)
        String nombre,

        Integer idPadre
) {}