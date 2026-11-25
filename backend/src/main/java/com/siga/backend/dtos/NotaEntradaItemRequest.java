package com.siga.backend.dtos;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record NotaEntradaItemRequest(
        @NotNull(message = "Debe seleccionar un producto")
        Integer idProducto,

        @NotNull(message = "La cantidad es obligatoria")
        @DecimalMin(value = "0.01", message = "La cantidad debe ser mayor a 0")
        BigDecimal cantidad,

        @NotNull(message = "El costo unitario es obligatorio")
        @DecimalMin(value = "0.00", message = "El costo unitario no puede ser negativo")
        BigDecimal costoUnitario,

        LocalDate fechaVencimiento
) {}