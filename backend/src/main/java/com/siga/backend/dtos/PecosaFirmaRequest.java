package com.siga.backend.dtos;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PecosaFirmaRequest(
        @NotNull(message = "Debe indicar si aprueba o rechaza")
        Boolean aprobar,

        @Size(max = 255)
        String observacion
) {}