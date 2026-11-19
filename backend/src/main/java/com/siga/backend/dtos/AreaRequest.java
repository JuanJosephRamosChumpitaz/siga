package com.siga.backend.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AreaRequest(
        @NotBlank(message = "El nombre del área es obligatorio")
        @Size(max = 100)
        String nombre,

        @Size(max = 255)
        String descripcion
) {}