package com.siga.backend.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ProveedorRequest(
        @NotBlank(message = "El RUC es obligatorio")
        @Pattern(regexp = "\\d{11}", message = "El RUC debe tener exactamente 11 dígitos")
        String ruc,

        @NotBlank(message = "La razón social es obligatoria")
        @Size(max = 150)
        String razonSocial,

        @Size(max = 255)
        String direccion,

        @Size(max = 20)
        String telefono,

        @Email(message = "El correo no tiene un formato válido")
        @Size(max = 100)
        String email
) {}