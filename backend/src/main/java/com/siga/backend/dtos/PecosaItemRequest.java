package com.siga.backend.dtos;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record PecosaItemRequest(
        @NotNull(message = "Debe seleccionar un producto")
        Integer idProducto,

        @NotNull(message = "La cantidad solicitada es obligatoria")
        @DecimalMin(value = "0.01", message = "La cantidad solicitada debe ser mayor a 0")
        BigDecimal cantidadSolicitada
) {}