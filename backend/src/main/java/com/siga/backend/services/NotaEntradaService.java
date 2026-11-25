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
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotaEntradaService {

    private final NotaEntradaRepository notaEntradaRepository;
    private final LoteRepository loteRepository;
    private final ProductoRepository productoRepository;
    private final ProveedorRepository proveedorRepository;
    private final UsuarioRepository usuarioRepository;
    private final MovimientoKardexRepository movimientoKardexRepository;
    private final AuditoriaRepository auditoriaRepository;

    @Transactional(readOnly = true)
    public List<NotaEntradaResponse> listarNotasEntrada() {
        List<NotaEntrada> notas = notaEntradaRepository.findAllWithDetails();
        List<Lote> todosLotes = loteRepository.findAllWithDetails();

        Map<Integer, List<Lote>> lotesPorNea = todosLotes.stream()
                .filter(l -> l.getNotaEntrada() != null)
                .collect(Collectors.groupingBy(l -> l.getNotaEntrada().getIdNotaEntrada()));

        return notas.stream()
                .map(n -> toNotaResponse(n, lotesPorNea.getOrDefault(n.getIdNotaEntrada(), List.of())))
                .toList();
    }

    @Transactional(readOnly = true)
    public NotaEntradaResponse obtenerPorId(Integer id) {
        NotaEntrada nota = notaEntradaRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nota de entrada no encontrada"));
        List<Lote> lotes = loteRepository.findByNotaEntradaWithDetails(id);
        return toNotaResponse(nota, lotes);
    }

    @Transactional(readOnly = true)
    public List<LoteResponse> listarLotes(boolean soloConStock) {
        return loteRepository.findAllWithDetails().stream()
                .filter(l -> !soloConStock || (l.getCantidadRestante() != null && l.getCantidadRestante().compareTo(BigDecimal.ZERO) > 0))
                .map(this::toLoteResponse)
                .toList();
    }

    @Transactional
    public NotaEntradaResponse registrarEntrada(NotaEntradaRequest request, String username) {
        Usuario usuario = usuarioRepository.buscarPorUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));

        Persona responsable = usuario.getPersona();
        if (responsable == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El usuario actual no tiene una persona asociada");
        }

        LocalDateTime fechaEmision = request.fechaEmision() != null ? request.fechaEmision() : LocalDateTime.now();
        String numeroNea = resolverNumeroNea(request.numeroNea(), fechaEmision);

        if (notaEntradaRepository.existsByNumeroNeaIgnoreCase(numeroNea)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una Nota de Entrada con el número " + numeroNea);
        }

        Proveedor proveedor = null;
        if (request.idProveedor() != null) {
            proveedor = proveedorRepository.findById(request.idProveedor())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Proveedor no encontrado"));
        }

        NotaEntrada nota = new NotaEntrada();
        nota.setNumeroNea(numeroNea);
        nota.setFechaEmision(fechaEmision);
        nota.setProcedencia(request.procedencia().trim());
        nota.setDestino(request.destino() != null && !request.destino().isBlank()
                ? request.destino().trim()
                : "IESTP \"CAÑETE\"");
        nota.setReferencia(limpiarTexto(request.referencia()));
        nota.setModalidad(limpiarTexto(request.modalidad()));
        nota.setObservaciones(limpiarTexto(request.observaciones()));
        nota.setProveedor(proveedor);
        nota.setResponsable(responsable);

        NotaEntrada notaGuardada = notaEntradaRepository.save(nota);
        List<Lote> lotesGuardados = new ArrayList<>();

        for (NotaEntradaItemRequest item : request.items()) {
            Producto producto = productoRepository.findById(item.idProducto())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado: ID " + item.idProducto()));

            if (Boolean.FALSE.equals(producto.getActivo())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El bien '" + producto.getNombre() + "' está inactivo");
            }

            if (Boolean.TRUE.equals(producto.getPerecible()) && item.fechaVencimiento() == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "El bien '" + producto.getNombre() + "' es perecible y exige fecha de vencimiento"
                );
            }

            BigDecimal cantidad = item.cantidad().setScale(2, RoundingMode.HALF_UP);
            BigDecimal costoUnitario = item.costoUnitario().setScale(2, RoundingMode.HALF_UP);
            BigDecimal costoTotal = cantidad.multiply(costoUnitario).setScale(2, RoundingMode.HALF_UP);

            // 1. Crear el lote (base del PEPS)
            Lote lote = new Lote();
            lote.setIdproducto(producto);
            lote.setNotaEntrada(notaGuardada);
            lote.setProveedorEntidad(proveedor);
            lote.setProveedor(proveedor != null ? proveedor.getRazonSocial() : notaGuardada.getProcedencia());
            lote.setDocumentoSustento(numeroNea + (notaGuardada.getReferencia() != null ? " · " + notaGuardada.getReferencia() : ""));
            lote.setFechaIngreso(fechaEmision.atZone(ZoneId.systemDefault()).toInstant());
            lote.setFechaVencimiento(item.fechaVencimiento());
            lote.setCantidadInicial(cantidad);
            lote.setCantidadRestante(cantidad);
            lote.setCostoUnitario(costoUnitario);

            // AJUSTA ESTA LÍNEA al nombre exacto de tu enum en Lote.java (ej. EstadoLote.DISPONIBLE o EstadoLote.ACTIVO)
            lote.setEstado(Lote.Estado.Activo.values()[0]);

            Lote loteGuardado = loteRepository.save(lote);
            lotesGuardados.add(loteGuardado);

            // 2. Actualizar stock general y último costo referencial del producto
            BigDecimal stockActual = producto.getStockGeneral() != null ? producto.getStockGeneral() : BigDecimal.ZERO;
            BigDecimal nuevoStock = stockActual.add(cantidad).setScale(2, RoundingMode.HALF_UP);
            producto.setStockGeneral(nuevoStock);
            if (costoUnitario.compareTo(BigDecimal.ZERO) > 0) {
                producto.setPrecioUnidad(costoUnitario);
            }
            productoRepository.save(producto);

            // 3. Calcular saldo valorizado exacto (PEPS) y registrar en Kardex
            BigDecimal saldoValorizado = loteRepository.calcularSaldoValorizadoPorProducto(producto.getId())
                    .setScale(2, RoundingMode.HALF_UP);

            MovimientoKardex kardex = new MovimientoKardex();
            kardex.setFecha(fechaEmision);
            kardex.setTipoMovimiento("ENTRADA");
            kardex.setDocumentoReferencia(numeroNea);
            kardex.setProducto(producto);
            kardex.setLote(loteGuardado);
            kardex.setNotaEntrada(notaGuardada);
            kardex.setProveedor(proveedor);
            kardex.setCantidad(cantidad);
            kardex.setCostoUnitario(costoUnitario);
            kardex.setCostoTotal(costoTotal);
            kardex.setSaldoCantidad(nuevoStock);
            kardex.setSaldoValorizado(saldoValorizado);
            kardex.setObservacion(notaGuardada.getReferencia() != null ? notaGuardada.getReferencia() : notaGuardada.getProcedencia());
            kardex.setUsuarioRegistro(usuario);
            movimientoKardexRepository.save(kardex);
        }

        // 4. Registrar auditoría
        Auditoria aud = new Auditoria();
        aud.setFecha(LocalDateTime.now());
        aud.setUsuario(usuario);
        aud.setModulo("ENTRADAS");
        aud.setAccion("CREAR_NEA");
        aud.setEntidad("nota_entrada");
        aud.setEntidadId(String.valueOf(notaGuardada.getIdNotaEntrada()));
        aud.setDetalle("Ingreso " + numeroNea + " con " + lotesGuardados.size() + " lote(s) desde " + notaGuardada.getProcedencia());
        auditoriaRepository.save(aud);

        return toNotaResponse(notaGuardada, lotesGuardados);
    }

    private String resolverNumeroNea(String solicitado, LocalDateTime fecha) {
        if (solicitado != null && !solicitado.isBlank()) {
            return solicitado.trim().toUpperCase();
        }
        int anio = fecha.getYear();
        LocalDateTime inicio = LocalDate.of(anio, 1, 1).atStartOfDay();
        LocalDateTime fin = LocalDate.of(anio, 12, 31).atTime(23, 59, 59);
        long correlativo = notaEntradaRepository.countByFechaEmisionBetween(inicio, fin) + 1;
        String candidato;
        do {
            candidato = String.format("NEA-%03d-%d", correlativo++, anio);
        } while (notaEntradaRepository.existsByNumeroNeaIgnoreCase(candidato));
        return candidato;
    }

    private String limpiarTexto(String valor) {
        return (valor == null || valor.isBlank()) ? null : valor.trim();
    }

    private NotaEntradaResponse toNotaResponse(NotaEntrada n, List<Lote> lotes) {
        List<NotaEntradaItemResponse> items = lotes.stream().map(l -> {
            Producto p = l.getIdproducto();
            BigDecimal subtotal = l.getCantidadInicial().multiply(l.getCostoUnitario()).setScale(2, RoundingMode.HALF_UP);
            return new NotaEntradaItemResponse(
                    l.getId(),
                    p.getId(),
                    p.getCodigoInterno(),
                    p.getNombre(),
                    p.getIdcategoria() != null ? p.getIdcategoria().getCodigo() : p.getCuenta(),
                    p.getIdunidad() != null ? p.getIdunidad().getNombre() : "",
                    l.getCantidadInicial(),
                    l.getCantidadRestante(),
                    l.getCostoUnitario(),
                    subtotal,
                    l.getFechaVencimiento()
            );
        }).toList();

        BigDecimal total = items.stream()
                .map(NotaEntradaItemResponse::subtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        Proveedor prov = n.getProveedor();
        Persona resp = n.getResponsable();

        return new NotaEntradaResponse(
                n.getIdNotaEntrada(),
                n.getNumeroNea(),
                n.getFechaEmision(),
                n.getProcedencia(),
                n.getDestino(),
                n.getReferencia(),
                n.getModalidad(),
                n.getObservaciones(),
                prov != null ? prov.getIdProveedor() : null,
                prov != null ? prov.getRazonSocial() : null,
                prov != null ? prov.getRuc() : null,
                resp != null ? (resp.getNombres() + " " + resp.getApellidos()).trim() : "",
                items.size(),
                total,
                items
        );
    }

    private LoteResponse toLoteResponse(Lote l) {
        Producto p = l.getIdproducto();
        BigDecimal valorizado = l.getCantidadRestante().multiply(l.getCostoUnitario()).setScale(2, RoundingMode.HALF_UP);
        LocalDateTime fechaIngreso = l.getFechaIngreso() != null
                ? LocalDateTime.ofInstant(l.getFechaIngreso(), ZoneId.systemDefault())
                : null;

        return new LoteResponse(
                l.getId(),
                p.getId(),
                p.getCodigoInterno(),
                p.getNombre(),
                p.getIdunidad() != null ? p.getIdunidad().getNombre() : "",
                p.getPerecible(),
                l.getNotaEntrada() != null ? l.getNotaEntrada().getNumeroNea() : null,
                l.getDocumentoSustento(),
                l.getProveedorEntidad() != null ? l.getProveedorEntidad().getRazonSocial() : l.getProveedor(),
                fechaIngreso,
                l.getFechaVencimiento(),
                l.getCantidadInicial(),
                l.getCantidadRestante(),
                l.getCostoUnitario(),
                valorizado,
                l.getEstado() != null ? l.getEstado().name() : ""
        );
    }
}