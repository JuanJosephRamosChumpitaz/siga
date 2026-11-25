package com.siga.backend.dtos;

import jakarta.validation.constraints.Size;

public record InventarioCerrarRequest(
        Boolean aplicarAjustes,

        @Size(max = 255)
        String observaciones
) {}