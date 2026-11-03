package com.siga.backend.services;

import com.siga.backend.dtos.DashboardResumen;
import com.siga.backend.repository.LoteRepository;
import com.siga.backend.repository.PecosaRepository;
import com.siga.backend.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final int STOCK_MINIMO = 10;
    private static final ZoneId ZONA = ZoneId.of("America/Lima");

    private final ProductoRepository productoRepository;
    private final LoteRepository loteRepository;
    private final PecosaRepository pecosaRepository;

    @Transactional(readOnly = true)
    public DashboardResumen resumen() {
        Instant inicioMes = LocalDate.now(ZONA)
                .withDayOfMonth(1)
                .atStartOfDay(ZONA)
                .toInstant();

        return new DashboardResumen(
                productoRepository.count(),
                loteRepository.countByCantidadRestanteGreaterThan(BigDecimal.ZERO),
                loteRepository.valorInventario(),
                pecosaRepository.countByFechaEmisionGreaterThanEqual(inicioMes),
                productoRepository.countByStockGeneralLessThanEqual(STOCK_MINIMO));
    }
}