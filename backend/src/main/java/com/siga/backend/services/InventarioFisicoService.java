package com.siga.backend.services;

import com.siga.backend.dtos.*;
import com.siga.backend.model.*;
import com.siga.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventarioFisicoService {

    private final InventarioFisicoRepository inventarioRepository;
    private final InventarioFisicoDetalleRepository detalleRepository;
    private final ProductoRepository productoRepository;
    private final LoteRepository loteRepository;
    private final MovimientoKardexRepository kardexRepository;
    private final UsuarioRepository usuarioRepository;
    private final AuditoriaRepository auditoriaRepository;

    @Transactional(readOnly = true)
    public List<InventarioFisicoResponse> listar() {
        List<InventarioFisico> sesiones = inventarioRepository.findAllWithResponsable();
        if (sesiones.isEmpty()) return List.of();

        List<Integer> ids = sesiones.stream().map(InventarioFisico::getIdInventarioFisico).toList();
        Map<Integer, List<InventarioFisicoDetalle>> detallesPorSesion = detalleRepository
                .findByInventarioIdsWithProducto(ids).stream()
                .collect(Collectors.groupingBy(d -> d.getInventarioFisico().getIdInventarioFisico()));

        return sesiones.stream()
                .map(s -> toResponse(s, detallesPorSesion.getOrDefault(s.getIdInventarioFisico(), List.of())))
                .toList();
    }

    @Transactional(readOnly = true)
    public InventarioFisicoResponse obtenerPorId(Integer id) {
        InventarioFisico sesion = inventarioRepository.findByIdWithResponsable(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sesión de inventario no encontrada"));
        return toResponse(sesion, detalleRepository.findByInventarioIdWithProducto(id));
    }

    @Transactional
    public InventarioFisicoResponse iniciarSesion(InventarioFisicoCrearRequest request, String username) {
        Usuario usuario = obtenerUsuario(username);
        if (usuario.getPersona() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El usuario no tiene una persona vinculada");
        }

        List<Producto> productosActivos = productoRepository.findActivosWithDetails();
        if (productosActivos.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No hay productos activos para inventariar");
        }

        LocalDateTime ahora = LocalDateTime.now();
        String codigo = generarCodigoAnual(ahora);

        InventarioFisico sesion = new InventarioFisico();
        sesion.setCodigo(codigo);
        sesion.setFechaInicio(ahora);
        sesion.setEstado("EN_PROCESO");
        sesion.setObservaciones(request != null && request.observaciones() != null && !request.observaciones().isBlank()
                ? request.observaciones().trim()
                : null);
        sesion.setResponsable(usuario.getPersona());

        InventarioFisico guardada = inventarioRepository.save(sesion);

        List<InventarioFisicoDetalle> detalles = productosActivos.stream().map(p -> {
            BigDecimal stockSis = p.getStockGeneral() != null ? p.getStockGeneral() : BigDecimal.ZERO;
            InventarioFisicoDetalle det = new InventarioFisicoDetalle();
            det.setInventarioFisico(guardada);
            det.setProducto(p);
            det.setStockSistema(stockSis);
            det.setStockFisico(stockSis);
            det.setDiferencia(BigDecimal.ZERO);
            return det;
        }).toList();

        detalleRepository.saveAll(detalles);
        registrarAuditoria(usuario, "INVENTARIO", "INICIAR_CONTEO", "inventario_fisico",
                String.valueOf(guardada.getIdInventarioFisico()),
                "Sesión " + codigo + " iniciada con " + detalles.size() + " bienes");

        return toResponse(guardada, detalleRepository.findByInventarioIdWithProducto(guardada.getIdInventarioFisico()));
    }

    @Transactional
    public InventarioFisicoResponse guardarConteo(Integer idInventario, InventarioConteoRequest request, String username) {
        obtenerUsuario(username);
        InventarioFisico sesion = inventarioRepository.findByIdWithResponsable(idInventario)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sesión de inventario no encontrada"));

        if (!"EN_PROCESO".equals(sesion.getEstado())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Solo se puede editar el conteo mientras esté EN_PROCESO");
        }

        Map<Integer, InventarioFisicoDetalle> mapaDetalles = detalleRepository
                .findByInventarioIdWithProducto(idInventario).stream()
                .collect(Collectors.toMap(d -> d.getProducto().getId(), d -> d));

        for (InventarioConteoItemRequest item : request.items()) {
            InventarioFisicoDetalle det = mapaDetalles.get(item.idProducto());
            if (det == null) continue;

            BigDecimal fisico = item.stockFisico().setScale(2, RoundingMode.HALF_UP);
            BigDecimal sistema = det.getStockSistema().setScale(2, RoundingMode.HALF_UP);
            det.setStockFisico(fisico);
            det.setDiferencia(fisico.subtract(sistema).setScale(2, RoundingMode.HALF_UP));
            det.setObservacion(item.observacion() != null && !item.observacion().isBlank()
                    ? item.observacion().trim()
                    : null);
            detalleRepository.save(det);
        }

        return toResponse(sesion, detalleRepository.findByInventarioIdWithProducto(idInventario));
    }

    @Transactional
    public InventarioFisicoResponse cerrarSesion(Integer idInventario, InventarioCerrarRequest request, String username) {
        Usuario usuario = obtenerUsuario(username);
        InventarioFisico sesion = inventarioRepository.findByIdWithResponsable(idInventario)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sesión de inventario no encontrada"));

        if (!"EN_PROCESO".equals(sesion.getEstado())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La sesión de inventario ya fue cerrada o anulada");
        }

        boolean aplicarAjustes = request != null && Boolean.TRUE.equals(request.aplicarAjustes());
        LocalDateTime ahora = LocalDateTime.now();
        List<InventarioFisicoDetalle> detalles = detalleRepository.findByInventarioIdWithProducto(idInventario);
        int ajustesAplicados = 0;

        if (aplicarAjustes) {
            for (InventarioFisicoDetalle det : detalles) {
                BigDecimal diff = det.getDiferencia();
                if (diff == null || diff.compareTo(BigDecimal.ZERO) == 0) continue;

                Producto producto = productoRepository.findById(det.getProducto().getId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado"));

                if (diff.compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal costoUnit = producto.getPrecioUnidad() != null
                            ? producto.getPrecioUnidad().setScale(2, RoundingMode.HALF_UP)
                            : BigDecimal.ZERO;

                    Lote loteAjuste = new Lote();
                    loteAjuste.setIdproducto(producto);
                    loteAjuste.setProveedor("AJUSTE INVENTARIO FÍSICO");
                    loteAjuste.setDocumentoSustento(sesion.getCodigo());
                    loteAjuste.setFechaIngreso(ahora.atZone(ZoneId.systemDefault()).toInstant());
                    loteAjuste.setCantidadInicial(diff);
                    loteAjuste.setCantidadRestante(diff);
                    loteAjuste.setCostoUnitario(costoUnit);
                    loteAjuste.setEstado(Lote.Estado.Activo);
                    Lote loteGuardado = loteRepository.save(loteAjuste);

                    BigDecimal nuevoStock = producto.getStockGeneral().add(diff).setScale(2, RoundingMode.HALF_UP);
                    producto.setStockGeneral(nuevoStock);
                    productoRepository.save(producto);

                    BigDecimal saldoVal = loteRepository.calcularSaldoValorizadoPorProducto(producto.getId())
                            .setScale(2, RoundingMode.HALF_UP);

                    MovimientoKardex k = new MovimientoKardex();
                    k.setFecha(ahora);
                    k.setTipoMovimiento("AJUSTE_POSITIVO");
                    k.setDocumentoReferencia(sesion.getCodigo());
                    k.setProducto(producto);
                    k.setLote(loteGuardado);
                    k.setCantidad(diff);
                    k.setCostoUnitario(costoUnit);
                    k.setCostoTotal(diff.multiply(costoUnit).setScale(2, RoundingMode.HALF_UP));
                    k.setSaldoCantidad(nuevoStock);
                    k.setSaldoValorizado(saldoVal);
                    k.setObservacion(det.getObservacion() != null ? det.getObservacion() : "Sobrante en inventario físico");
                    k.setUsuarioRegistro(usuario);
                    kardexRepository.save(k);
                    ajustesAplicados++;
                } else {
                    BigDecimal faltante = diff.abs().setScale(2, RoundingMode.HALF_UP);
                    List<Lote> lotesPeps = loteRepository.findDisponiblesPeps(producto.getId());
                    BigDecimal pendiente = faltante;

                    for (Lote lote : lotesPeps) {
                        if (pendiente.compareTo(BigDecimal.ZERO) <= 0) break;
                        BigDecimal tomado = lote.getCantidadRestante().min(pendiente).setScale(2, RoundingMode.HALF_UP);
                        BigDecimal restante = lote.getCantidadRestante().subtract(tomado).setScale(2, RoundingMode.HALF_UP);
                        lote.setCantidadRestante(restante);
                        if (restante.compareTo(BigDecimal.ZERO) == 0) {
                            lote.setEstado(Lote.Estado.Agotado);
                        }
                        loteRepository.save(lote);
                        BigDecimal nuevoStock = producto.getStockGeneral().subtract(tomado).max(BigDecimal.ZERO)
                                .setScale(2, RoundingMode.HALF_UP);
                        producto.setStockGeneral(nuevoStock);
                        productoRepository.save(producto);
                        BigDecimal saldoVal = loteRepository.calcularSaldoValorizadoPorProducto(producto.getId())
                                .setScale(2, RoundingMode.HALF_UP);
                        MovimientoKardex k = new MovimientoKardex();
                        k.setFecha(ahora);
                        k.setTipoMovimiento("AJUSTE_NEGATIVO");
                        k.setDocumentoReferencia(sesion.getCodigo());
                        k.setProducto(producto);
                        k.setLote(lote);
                        k.setCantidad(tomado);
                        k.setCostoUnitario(lote.getCostoUnitario());
                        k.setCostoTotal(tomado.multiply(lote.getCostoUnitario()).setScale(2, RoundingMode.HALF_UP));
                        k.setSaldoCantidad(nuevoStock);
                        k.setSaldoValorizado(saldoVal);
                        k.setObservacion(det.getObservacion() != null ? det.getObservacion() : "Faltante en inventario físico");
                        k.setUsuarioRegistro(usuario);
                        kardexRepository.save(k);
                        pendiente = pendiente.subtract(tomado);
                    }
                    ajustesAplicados++;
                }
            }
        }
        sesion.setEstado("CERRADO");
        sesion.setFechaCierre(ahora);
        if (request != null && request.observaciones() != null && !request.observaciones().isBlank()) {
            sesion.setObservaciones(request.observaciones().trim());
        }
        inventarioRepository.save(sesion);
        registrarAuditoria(usuario, "INVENTARIO", "CERRAR_CONTEO", "inventario_fisico",
                String.valueOf(idInventario),
                "Sesión " + sesion.getCodigo() + " cerrada. Ajustes PEPS aplicados: " + ajustesAplicados);
        return toResponse(sesion, detalleRepository.findByInventarioIdWithProducto(idInventario));
    }
    private String generarCodigoAnual(LocalDateTime fecha) {
        int anio = fecha.getYear();
        LocalDateTime inicio = LocalDate.of(anio, 1, 1).atStartOfDay();
        LocalDateTime fin = LocalDate.of(anio, 12, 31).atTime(23, 59, 59);
        long correlativo = inventarioRepository.countByFechaInicioBetween(inicio, fin) + 1;
        String codigo;
        do {
            codigo = String.format("INV-%03d-%d", correlativo++, anio);
        } while (inventarioRepository.existsByCodigoIgnoreCase(codigo));
        return codigo;
    }
    private Usuario obtenerUsuario(String username) {
        return usuarioRepository.buscarPorUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));
    }
    private void registrarAuditoria(Usuario usuario, String modulo, String accion, String entidad, String entidadId, String detalle) {
        Auditoria aud = new Auditoria();
        aud.setFecha(LocalDateTime.now());
        aud.setUsuario(usuario);
        aud.setModulo(modulo);
        aud.setAccion(accion);
        aud.setEntidad(entidad);
        aud.setEntidadId(entidadId);
        aud.setDetalle(detalle);
        auditoriaRepository.save(aud);
    }
    private InventarioFisicoResponse toResponse(InventarioFisico s, List<InventarioFisicoDetalle> detalles) {
        List<InventarioDetalleResponse> detDtos = detalles.stream().map(d -> {
            Producto p = d.getProducto();
            return new InventarioDetalleResponse(
                    d.getIdInventarioDetalle(),
                    p.getId(),
                    p.getCodigoInterno(),
                    p.getCodigoBarra(),
                    p.getNombre(),
                    p.getIdcategoria() != null ? p.getIdcategoria().getCodigo() : p.getCuenta(),
                    p.getIdunidad() != null ? p.getIdunidad().getNombre() : "",
                    d.getStockSistema(),
                    d.getStockFisico(),
                    d.getDiferencia(),
                    d.getObservacion()
            );
        }).toList();

        int conDiff = (int) detDtos.stream()
                .filter(d -> d.diferencia() != null && d.diferencia().compareTo(BigDecimal.ZERO) != 0)
                .count();

        Persona resp = s.getResponsable();
        return new InventarioFisicoResponse(
                s.getIdInventarioFisico(),
                s.getCodigo(),
                s.getFechaInicio(),
                s.getFechaCierre(),
                s.getEstado(),
                s.getObservaciones(),
                resp != null ? (resp.getNombres() + " " + resp.getApellidos()).trim() : "",
                detDtos.size(),
                conDiff,
                detDtos
        );
    }
}