package com.siga.backend.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.List;

public record NotaEntradaRequest(
        @Size(max = 45)
        String numeroNea,

        LocalDateTime fechaEmision,

        @NotBlank(message = "La procedencia es obligatoria")
        @Size(max = 200)
        String procedencia,

        @Size(max = 200)
        String destino,

        @Size(max = 200)
        String referencia,

        @Size(max = 200)
        String modalidad,

        @Size(max = 255)
        String observaciones,

        Integer idProveedor,

        @NotEmpty(message = "Debe agregar al menos un bien a la Nota de Entrada")
        @Valid
        List<NotaEntradaItemRequest> items
) {}