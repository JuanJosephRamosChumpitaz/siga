package com.siga.backend.dtos;

import jakarta.validation.constraints.Size;

public record InventarioFisicoCrearRequest(
        @Size(max = 255)
        String observaciones
) {}