package com.siga.backend.dtos;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record ProductoRequest(
        @NotBlank(message = "El nombre del bien es obligatorio")
        @Size(max = 200)
        String nombre,

        @Size(max = 50)
        String codigoInterno,

        @Size(max = 45)
        String codigoBarra,

        @Size(max = 150)
        String marcaSerie,

        @Size(max = 50)
        String tipoBien,

        @DecimalMin(value = "0.00", message = "El precio referencial no puede ser negativo")
        BigDecimal precioUnidad,

        @DecimalMin(value = "0.00", message = "El stock mínimo no puede ser negativo")
        BigDecimal stockMinimo,

        @DecimalMin(value = "0.00", message = "El consumo mensual no puede ser negativo")
        BigDecimal consumoMensualAprox,

        Boolean perecible,

        @NotNull(message = "Debe seleccionar una cuenta contable")
        Integer idCategoria,

        @NotNull(message = "Debe seleccionar una unidad de medida")
        Integer idUnidad
) {}