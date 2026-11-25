package com.siga.backend.dtos;

import java.math.BigDecimal;
import java.util.List;

public record DashboardResumen(
        String rol,
        String nombreArea,
        Long totalProductosActivos,
        BigDecimal valorizacionTotalPeps,
        BigDecimal ingresosMes,
        BigDecimal salidasMes,
        Long stockCriticoCount,
        Long sinExistenciasCount,
        Long lotesPorVencerCount,
        Long pecosasPendientesAccion,
        Long pecosasEnProcesoTotal,
        List<MesMovimientoResumen> evolucionMensual,
        List<ReporteCuentaResumen> distribucionCuentas
) {
    public record MesMovimientoResumen(
            String mes,
            BigDecimal ingresos,
            BigDecimal salidas
    ) {}
}