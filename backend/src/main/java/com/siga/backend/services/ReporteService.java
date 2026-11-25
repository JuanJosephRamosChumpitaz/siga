package com.siga.backend.services;

import com.siga.backend.dtos.*;
import com.siga.backend.model.Lote;
import com.siga.backend.model.MovimientoKardex;
import com.siga.backend.model.Producto;
import com.siga.backend.repository.AuditoriaRepository;
import com.siga.backend.repository.LoteRepository;
import com.siga.backend.repository.MovimientoKardexRepository;
import com.siga.backend.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReporteService {

    private final ProductoRepository productoRepository;
    private final LoteRepository loteRepository;
    private final MovimientoKardexRepository movimientoKardexRepository;
    private final AuditoriaRepository auditoriaRepository;

    @Transactional(readOnly = true)
    public List<ReporteInventarioValorizadoItem> inventarioValorizado() {
        List<Producto> productos = productoRepository.findActivosWithDetails();
        Map<Integer, BigDecimal> valorPorProducto = mapearValorizadoPorProducto();

        return productos.stream().map(p -> new ReporteInventarioValorizadoItem(
                p.getId(),
                p.getCodigoInterno(),
                p.getNombre(),
                p.getMarcaSerie(),
                p.getIdcategoria() != null ? p.getIdcategoria().getCodigo() : p.getCuenta(),
                p.getIdcategoria() != null ? p.getIdcategoria().getNombre() : "Sin cuenta",
                p.getIdunidad() != null ? p.getIdunidad().getNombre() : "",
                p.getStockGeneral(),
                p.getStockMinimo(),
                p.getPrecioUnidad(),
                valorPorProducto.getOrDefault(p.getId(), BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP)
        )).toList();
    }

    @Transactional(readOnly = true)
    public List<ReporteCuentaResumen> resumenPorCuentaContable() {
        List<ReporteInventarioValorizadoItem> items = inventarioValorizado();
        Map<String, List<ReporteInventarioValorizadoItem>> grupos = items.stream()
                .collect(Collectors.groupingBy(
                        i -> (i.codigoCuenta() != null ? i.codigoCuenta() : "SIN-CTA") + "||" + (i.nombreCuenta() != null ? i.nombreCuenta() : "Sin cuenta"),
                        TreeMap::new,
                        Collectors.toList()
                ));

        List<ReporteCuentaResumen> resultado = new ArrayList<>();
        for (Map.Entry<String, List<ReporteInventarioValorizadoItem>> entry : grupos.entrySet()) {
            String[] partes = entry.getKey().split("\\|\\|", 2);
            List<ReporteInventarioValorizadoItem> lista = entry.getValue();
            BigDecimal stockTotal = lista.stream()
                    .map(ReporteInventarioValorizadoItem::stockGeneral)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2, RoundingMode.HALF_UP);
            BigDecimal valorTotal = lista.stream()
                    .map(ReporteInventarioValorizadoItem::valorTotalPeps)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2, RoundingMode.HALF_UP);

            resultado.add(new ReporteCuentaResumen(
                    partes[0],
                    partes.length > 1 ? partes[1] : "",
                    (long) lista.size(),
                    stockTotal,
                    valorTotal
            ));
        }
        return resultado;
    }

    @Transactional(readOnly = true)
    public List<ReporteConsumoArea> consumoPorArea(LocalDate desde, LocalDate hasta) {
        LocalDateTime fechaDesde = desde != null ? desde.atStartOfDay() : LocalDateTime.of(2000, 1, 1, 0, 0);
        LocalDateTime fechaHasta = hasta != null ? hasta.atTime(23, 59, 59) : LocalDateTime.of(2100, 12, 31, 23, 59, 59);

        List<MovimientoKardex> salidas = movimientoKardexRepository.findAllByRangoFecha(fechaDesde, fechaHasta)
                .stream()
                .filter(m -> "SALIDA".equals(m.getTipoMovimiento()) && m.getArea() != null)
                .toList();

        Map<Integer, List<MovimientoKardex>> porArea = salidas.stream()
                .collect(Collectors.groupingBy(m -> m.getArea().getId()));

        return porArea.entrySet().stream().map(e -> {
            List<MovimientoKardex> movs = e.getValue();
            String nombreArea = movs.get(0).getArea().getNombre();
            long totalPecosas = movs.stream()
                    .map(m -> m.getPecosa() != null ? m.getPecosa().getId() : m.getIdMovimiento())
                    .distinct()
                    .count();
            BigDecimal unidades = movs.stream()
                    .map(MovimientoKardex::getCantidad)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2, RoundingMode.HALF_UP);
            BigDecimal valor = movs.stream()
                    .map(MovimientoKardex::getCostoTotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2, RoundingMode.HALF_UP);
            return new ReporteConsumoArea(e.getKey(), nombreArea, totalPecosas, unidades, valor);
        }).sorted(Comparator.comparing(ReporteConsumoArea::valorTotalConsumido).reversed()).toList();
    }

    @Transactional(readOnly = true)
    public List<AuditoriaResponse> listarAuditoria() {
        return auditoriaRepository.findAllWithUsuarioOrderByFechaDesc().stream()
                .limit(250)
                .map(a -> new AuditoriaResponse(
                        a.getIdAuditoria(),
                        a.getFecha(),
                        a.getUsuario() != null ? a.getUsuario().getUsername() : "sistema",
                        a.getModulo(),
                        a.getAccion(),
                        a.getEntidad(),
                        a.getEntidadId(),
                        a.getDetalle()
                ))
                .toList();
    }

    private Map<Integer, BigDecimal> mapearValorizadoPorProducto() {
        Map<Integer, BigDecimal> mapa = new HashMap<>();
        for (Lote l : loteRepository.findAllWithDetails()) {
            if (l.getCantidadRestante() == null || l.getCantidadRestante().compareTo(BigDecimal.ZERO) <= 0) continue;
            BigDecimal val = l.getCantidadRestante().multiply(l.getCostoUnitario());
            mapa.merge(l.getIdproducto().getId(), val, BigDecimal::add);
        }
        return mapa;
    }
}
