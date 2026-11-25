package com.siga.backend.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public record PecosaDespachoRequest(
        @Size(max = 255)
        String observaciones,

        @NotEmpty(message = "Debe confirmar al menos un ítem para despachar")
        @Valid
        List<PecosaDespachoItemRequest> items
) {}