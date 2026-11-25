package com.siga.backend.dtos;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record InventarioConteoItemRequest(
        @NotNull(message = "El producto es obligatorio")
        Integer idProducto,

        @NotNull(message = "El stock físico contado es obligatorio")
        @DecimalMin(value = "0.00", message = "El stock físico no puede ser negativo")
        BigDecimal stockFisico,

        @Size(max = 255)
        String observacion
) {}