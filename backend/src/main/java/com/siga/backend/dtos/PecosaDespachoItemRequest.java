package com.siga.backend.dtos;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record PecosaDespachoItemRequest(
        @NotNull(message = "El producto es obligatorio")
        Integer idProducto,

        @NotNull(message = "La cantidad atendida es obligatoria")
        @DecimalMin(value = "0.00", message = "La cantidad atendida no puede ser negativa")
        BigDecimal cantidadAtendida
) {}