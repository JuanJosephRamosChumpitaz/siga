package com.siga.backend.services;

import com.siga.backend.dtos.KardexMovimientoResponse;
import com.siga.backend.dtos.KardexProductoResponse;
import com.siga.backend.model.MovimientoKardex;
import com.siga.backend.model.Producto;
import com.siga.backend.repository.LoteRepository;
import com.siga.backend.repository.MovimientoKardexRepository;
import com.siga.backend.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class KardexService {

    private final ProductoRepository productoRepository;
    private final MovimientoKardexRepository movimientoKardexRepository;
    private final LoteRepository loteRepository;

    @Transactional(readOnly = true)
    public KardexProductoResponse consultarPorProducto(Integer idProducto, LocalDate desde, LocalDate hasta) {
        Producto producto = productoRepository.findAllWithDetails().stream()
                .filter(p -> p.getId().equals(idProducto))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado"));

        LocalDateTime fechaDesde = desde != null ? desde.atStartOfDay() : LocalDateTime.of(2000, 1, 1, 0, 0);
        LocalDateTime fechaHasta = hasta != null ? hasta.atTime(23, 59, 59) : LocalDateTime.of(2100, 12, 31, 23, 59, 59);

        List<MovimientoKardex> movimientos = movimientoKardexRepository
                .findByProductoAndRangoFecha(idProducto, fechaDesde, fechaHasta);

        BigDecimal valorizadoActual = loteRepository.calcularSaldoValorizadoPorProducto(idProducto)
                .setScale(2, RoundingMode.HALF_UP);

        List<KardexMovimientoResponse> items = movimientos.stream().map(m -> {
            boolean esEntrada = "ENTRADA".equals(m.getTipoMovimiento())
                    || "AJUSTE_POSITIVO".equals(m.getTipoMovimiento());

            BigDecimal cantEntrada = esEntrada ? m.getCantidad() : BigDecimal.ZERO;
            BigDecimal cantSalida = esEntrada ? BigDecimal.ZERO : m.getCantidad();
            BigDecimal impEntrada = esEntrada ? m.getCostoTotal() : BigDecimal.ZERO;
            BigDecimal impSalida = esEntrada ? BigDecimal.ZERO : m.getCostoTotal();

            return new KardexMovimientoResponse(
                    m.getIdMovimiento(),
                    m.getFecha(),
                    m.getTipoMovimiento(),
                    m.getDocumentoReferencia(),
                    m.getLote() != null ? m.getLote().getId() : null,
                    m.getArea() != null ? m.getArea().getNombre() : null,
                    m.getSolicitante() != null
                            ? (m.getSolicitante().getNombres() + " " + m.getSolicitante().getApellidos()).trim()
                            : null,
                    m.getProveedor() != null ? m.getProveedor().getRazonSocial() : null,
                    cantEntrada,
                    cantSalida,
                    m.getSaldoCantidad(),
                    m.getCostoUnitario(),
                    impEntrada,
                    impSalida,
                    m.getSaldoValorizado(),
                    m.getObservacion(),
                    m.getUsuarioRegistro() != null ? m.getUsuarioRegistro().getUsername() : ""
            );
        }).toList();

        return new KardexProductoResponse(
                producto.getId(),
                producto.getCodigoInterno(),
                producto.getNombre(),
                producto.getMarcaSerie(),
                producto.getIdunidad() != null ? producto.getIdunidad().getNombre() : "Unidad",
                producto.getIdcategoria() != null ? producto.getIdcategoria().getCodigo() : producto.getCuenta(),
                producto.getIdcategoria() != null ? producto.getIdcategoria().getNombre() : "Sin cuenta",
                producto.getConsumoMensualAprox(),
                producto.getStockGeneral(),
                valorizadoActual,
                items
        );
    }
}
