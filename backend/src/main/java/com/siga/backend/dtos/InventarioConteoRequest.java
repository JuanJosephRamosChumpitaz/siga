package com.siga.backend.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record InventarioConteoRequest(
        @NotEmpty(message = "Debe enviar al menos un conteo")
        @Valid
        List<InventarioConteoItemRequest> items
) {}