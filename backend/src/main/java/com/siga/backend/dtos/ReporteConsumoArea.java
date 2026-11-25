package com.siga.backend.dtos;

import java.math.BigDecimal;

public record ReporteConsumoArea(
        Integer idArea,
        String nombreArea,
        Long totalPecosas,
        BigDecimal unidadesDespachadas,
        BigDecimal valorTotalConsumido
) {}