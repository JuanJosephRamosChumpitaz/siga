package com.siga.backend.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public record PecosaRequest(
        Integer idAreaDestino,
        Integer idPersonaSolicitante,

        @Size(max = 255)
        String observaciones,

        @NotEmpty(message = "Debe incluir al menos un bien en la PECOSA")
        @Valid
        List<PecosaItemRequest> items
) {}