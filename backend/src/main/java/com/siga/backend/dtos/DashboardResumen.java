package com.siga.backend.dtos;

import java.math.BigDecimal;

public record DashboardResumen(long totalProductos, long lotesConStock, BigDecimal valorInventario,
                               long pecosasDelMes, long productosStockBajo) {}