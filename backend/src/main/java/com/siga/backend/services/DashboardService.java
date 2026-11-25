package com.siga.backend.services;

import com.siga.backend.dtos.DashboardResumen;
import com.siga.backend.dtos.PecosaResponse;
import com.siga.backend.dtos.ReporteCuentaResumen;
import com.siga.backend.model.Lote;
import com.siga.backend.model.MovimientoKardex;
import com.siga.backend.model.Producto;
import com.siga.backend.model.Usuario;
import com.siga.backend.repository.LoteRepository;
import com.siga.backend.repository.MovimientoKardexRepository;
import com.siga.backend.repository.ProductoRepository;
import com.siga.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UsuarioRepository usuarioRepository;
    private final ProductoRepository productoRepository;
    private final LoteRepository loteRepository;
    private final MovimientoKardexRepository movimientoKardexRepository;
    private final PecosaService pecosaService;
    private final ReporteService reporteService;

    @Transactional(readOnly = true)
    public DashboardResumen obtenerResumen(String username) {
        Usuario usuario = usuarioRepository.buscarPorUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));

        String rol = usuario.getRol() != null
                ? usuario.getRol().getNombre().replace("ROLE_", "").toUpperCase()
                : "SOLICITANTE";

        String nombreArea = (usuario.getPersona() != null && usuario.getPersona().getIdarea() != null)
                ? usuario.getPersona().getIdarea().getNombre()
                : "IESTP Cañete";

        List<Producto> activos = productoRepository.findActivosWithDetails();
        long totalActivos = activos.size();
        long stockCritico = activos.stream()
                .filter(p -> p.getStockGeneral().compareTo(BigDecimal.ZERO) > 0
                        && p.getStockGeneral().compareTo(p.getStockMinimo()) <= 0)
                .count();
        long sinExistencias = activos.stream()
                .filter(p -> p.getStockGeneral().compareTo(BigDecimal.ZERO) <= 0)
                .count();

        LocalDate limiteVencimiento = LocalDate.now().plusDays(30);
        List<Lote> lotes = loteRepository.findAllWithDetails();
        BigDecimal valorizacionTotal = lotes.stream()
                .filter(l -> l.getCantidadRestante() != null && l.getCantidadRestante().compareTo(BigDecimal.ZERO) > 0)
                .map(l -> l.getCantidadRestante().multiply(l.getCostoUnitario()))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        long lotesPorVencer = lotes.stream()
                .filter(l -> l.getCantidadRestante() != null && l.getCantidadRestante().compareTo(BigDecimal.ZERO) > 0)
                .filter(l -> Boolean.TRUE.equals(l.getIdproducto().getPerecible())
                        && l.getFechaVencimiento() != null
                        && !l.getFechaVencimiento().isAfter(limiteVencimiento))
                .count();

        // Movimientos últimos 6 meses
        YearMonth mesActual = YearMonth.now();
        YearMonth inicio6Meses = mesActual.minusMonths(5);
        LocalDateTime desde6 = inicio6Meses.atDay(1).atStartOfDay();
        LocalDateTime hasta6 = mesActual.atEndOfMonth().atTime(23, 59, 59);
        List<MovimientoKardex> movs = movimientoKardexRepository.findAllByRangoFecha(desde6, hasta6);

        Map<YearMonth, BigDecimal> ingresosPorMes = new LinkedHashMap<>();
        Map<YearMonth, BigDecimal> salidasPorMes = new LinkedHashMap<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = mesActual.minusMonths(i);
            ingresosPorMes.put(ym, BigDecimal.ZERO);
            salidasPorMes.put(ym, BigDecimal.ZERO);
        }

        for (MovimientoKardex m : movs) {
            YearMonth ym = YearMonth.from(m.getFecha());
            if (!ingresosPorMes.containsKey(ym)) continue;
            if ("ENTRADA".equals(m.getTipoMovimiento()) || "AJUSTE_POSITIVO".equals(m.getTipoMovimiento())) {
                ingresosPorMes.put(ym, ingresosPorMes.get(ym).add(m.getCostoTotal()));
            } else {
                salidasPorMes.put(ym, salidasPorMes.get(ym).add(m.getCostoTotal()));
            }
        }

        Locale esPe = Locale.forLanguageTag("es-PE");
        List<DashboardResumen.MesMovimientoResumen> evolucion = new ArrayList<>();
        for (YearMonth ym : ingresosPorMes.keySet()) {
            String etiqueta = ym.getMonth().getDisplayName(TextStyle.SHORT, esPe);
            etiqueta = etiqueta.substring(0, 1).toUpperCase() + etiqueta.substring(1).replace(".", "") + " " + ym.getYear();
            evolucion.add(new DashboardResumen.MesMovimientoResumen(
                    etiqueta,
                    ingresosPorMes.get(ym).setScale(2, RoundingMode.HALF_UP),
                    salidasPorMes.get(ym).setScale(2, RoundingMode.HALF_UP)
            ));
        }

        BigDecimal ingresosMes = ingresosPorMes.getOrDefault(mesActual, BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
        BigDecimal salidasMes = salidasPorMes.getOrDefault(mesActual, BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);

        // PECOSAs según rol
        List<PecosaResponse> pecosas = pecosaService.listar(username);
        long enProcesoTotal = pecosas.stream()
                .filter(p -> "PENDIENTE_FIRMAS".equals(p.estado()) || "APROBADA".equals(p.estado()))
                .count();
        long pendientesAccion = "SOLICITANTE".equals(rol)
                ? enProcesoTotal
                : pecosas.stream().filter(p -> Boolean.TRUE.equals(p.requiereMiFirma()) || Boolean.TRUE.equals(p.puedeDespachar())).count();

        List<ReporteCuentaResumen> cuentas = "SOLICITANTE".equals(rol)
                ? List.of()
                : reporteService.resumenPorCuentaContable();

        return new DashboardResumen(
                rol,
                nombreArea,
                totalActivos,
                valorizacionTotal,
                ingresosMes,
                salidasMes,
                stockCritico,
                sinExistencias,
                lotesPorVencer,
                pendientesAccion,
                enProcesoTotal,
                evolucion,
                cuentas
        );
    }
}
