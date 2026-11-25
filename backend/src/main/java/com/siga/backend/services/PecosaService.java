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
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PecosaService {

    private final PecosaRepository pecosaRepository;
    private final PecosaDetalleRepository pecosaDetalleRepository;
    private final PecosaFirmaRepository pecosaFirmaRepository;
    private final ProductoRepository productoRepository;
    private final LoteRepository loteRepository;
    private final AreaRepository areaRepository;
    private final PersonaRepository personaRepository;
    private final UsuarioRepository usuarioRepository;
    private final MovimientoKardexRepository movimientoKardexRepository;
    private final AuditoriaRepository auditoriaRepository;

    @Transactional(readOnly = true)
    public List<PecosaResponse> listar(String username) {
        Usuario usuario = obtenerUsuarioAutenticado(username);
        String rol = normalizarRol(usuario);

        List<Pecosa> pecosas;
        if ("SOLICITANTE".equals(rol)) {
            Persona p = usuario.getPersona();
            Integer idArea = (p != null && p.getIdarea() != null) ? p.getIdarea().getId() : -1;
            Integer idPersona = (p != null) ? p.getId() : -1;
            pecosas = pecosaRepository.findByAreaOrSolicitanteWithDetails(idArea, idPersona);
        } else {
            pecosas = pecosaRepository.findAllWithDetails();
        }

        if (pecosas.isEmpty()) {
            return List.of();
        }

        List<Integer> ids = pecosas.stream().map(Pecosa::getId).toList();
        Map<Integer, List<PecosaDetalle>> detallesPorPecosa = pecosaDetalleRepository
                .findByPecosaIdsWithDetails(ids).stream()
                .collect(Collectors.groupingBy(d -> d.getIdpecosa().getId()));
        Map<Integer, List<PecosaFirma>> firmasPorPecosa = pecosaFirmaRepository
                .findByPecosaIdsWithPersona(ids).stream()
                .collect(Collectors.groupingBy(f -> f.getPecosa().getId()));

        return pecosas.stream()
                .map(p -> toResponse(
                        p,
                        detallesPorPecosa.getOrDefault(p.getId(), List.of()),
                        firmasPorPecosa.getOrDefault(p.getId(), List.of()),
                        rol
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public PecosaResponse obtenerPorId(Integer id, String username) {
        Usuario usuario = obtenerUsuarioAutenticado(username);
        String rol = normalizarRol(usuario);

        Pecosa pecosa = pecosaRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "PECOSA no encontrada"));

        validarPermisoLectura(pecosa, usuario, rol);

        return toResponse(
                pecosa,
                pecosaDetalleRepository.findByPecosaIdWithDetails(id),
                pecosaFirmaRepository.findByPecosaIdWithPersona(id),
                rol
        );
    }

    @Transactional(readOnly = true)
    public PecosaResponse buscarPorQr(String codigo, String username) {
        Usuario usuario = obtenerUsuarioAutenticado(username);
        String rol = normalizarRol(usuario);

        Pecosa pecosa = pecosaRepository.findByCodigoQrOrNumero(codigo.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No se encontró PECOSA con código: " + codigo));

        validarPermisoLectura(pecosa, usuario, rol);

        return toResponse(
                pecosa,
                pecosaDetalleRepository.findByPecosaIdWithDetails(pecosa.getId()),
                pecosaFirmaRepository.findByPecosaIdWithPersona(pecosa.getId()),
                rol
        );
    }

    @Transactional
    public PecosaResponse crearSolicitud(PecosaRequest request, String username) {
        Usuario usuario = obtenerUsuarioAutenticado(username);
        String rol = normalizarRol(usuario);

        Persona solicitante = usuario.getPersona();
        if (request.idPersonaSolicitante() != null && ("ADMIN".equals(rol) || "ALMACENERO".equals(rol))) {
            solicitante = personaRepository.findById(request.idPersonaSolicitante())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Persona solicitante no encontrada"));
        }
        if (solicitante == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El usuario no tiene una persona vinculada");
        }

        Area areaDestino = solicitante.getIdarea();
        if (request.idAreaDestino() != null && ("ADMIN".equals(rol) || "ALMACENERO".equals(rol))) {
            areaDestino = areaRepository.findById(request.idAreaDestino())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Área de destino no encontrada"));
        }
        if (areaDestino == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe tener un área asignada para emitir una PECOSA");
        }

        Map<Integer, BigDecimal> cantidadesPorProducto = new LinkedHashMap<>();
        for (PecosaItemRequest item : request.items()) {
            BigDecimal cant = item.cantidadSolicitada().setScale(2, RoundingMode.HALF_UP);
            cantidadesPorProducto.merge(item.idProducto(), cant, BigDecimal::add);
        }

        LocalDateTime ahora = LocalDateTime.now();
        String correlativo = generarCorrelativoAnual(ahora);
        String numeroPecosa = "PEC-" + correlativo;
        String numeroPedido = "PED-" + correlativo;
        String codigoQr = "SIGA-" + numeroPecosa;

        Pecosa pecosa = new Pecosa();
        pecosa.setNumeroPecosa(numeroPecosa);
        pecosa.setNumeroPedido(numeroPedido);
        pecosa.setCodigoQr(codigoQr);
        pecosa.setFechaEmision(ahora.atZone(ZoneId.systemDefault()).toInstant());
        pecosa.setEstado("PENDIENTE_FIRMAS");
        pecosa.setObservaciones(limpiarTexto(request.observaciones()));
        pecosa.setIdarea(areaDestino);
        pecosa.setIdpersonaSolicitante(solicitante);
        pecosa.setIdpersonaAlmacenista(null);

        Pecosa guardada = pecosaRepository.save(pecosa);

        List<PecosaDetalle> detalles = new ArrayList<>();
        for (Map.Entry<Integer, BigDecimal> entry : cantidadesPorProducto.entrySet()) {
            Producto producto = productoRepository.findById(entry.getKey())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado: ID " + entry.getKey()));

            if (Boolean.FALSE.equals(producto.getActivo())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El bien '" + producto.getNombre() + "' está inactivo");
            }

            PecosaDetalle det = new PecosaDetalle();
            det.setIdpecosa(guardada);
            det.setIdproducto(producto);
            det.setIdlote(null);
            det.setCantidadSolicitada(entry.getValue());
            det.setCantidadAtendida(BigDecimal.ZERO);
            det.setPrecioUnitarioHistorico(BigDecimal.ZERO);
            detalles.add(pecosaDetalleRepository.save(det));
        }

        List<PecosaFirma> firmas = List.of(
                crearFirma(guardada, "SOLICITANTE", 1, "FIRMADO", solicitante, ahora, "Solicitud emitida"),
                crearFirma(guardada, "ABASTECIMIENTO", 2, "PENDIENTE", null, null, null),
                crearFirma(guardada, "ADMINISTRADOR", 3, "PENDIENTE", null, null, null),
                crearFirma(guardada, "ALMACEN", 4, "PENDIENTE", null, null, null)
        );
        pecosaFirmaRepository.saveAll(firmas);

        registrarAuditoria(usuario, "PECOSA", "CREAR_SOLICITUD", "pecosa",
                String.valueOf(guardada.getId()),
                "Solicitud " + numeroPecosa + " creada por área " + areaDestino.getNombre());

        return toResponse(
                guardada,
                pecosaDetalleRepository.findByPecosaIdWithDetails(guardada.getId()),
                pecosaFirmaRepository.findByPecosaIdWithPersona(guardada.getId()),
                rol
        );
    }

    @Transactional
    public PecosaResponse firmarORechazar(Integer idPecosa, PecosaFirmaRequest request, String username) {
        Usuario usuario = obtenerUsuarioAutenticado(username);
        String rol = normalizarRol(usuario);

        if (usuario.getPersona() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El usuario no tiene una persona vinculada para firmar");
        }

        Pecosa pecosa = pecosaRepository.findByIdWithDetails(idPecosa)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "PECOSA no encontrada"));

        if ("DESPACHADA".equals(pecosa.getEstado()) || "RECHAZADA".equals(pecosa.getEstado())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Esta PECOSA ya fue cerrada (" + pecosa.getEstado() + ")");
        }

        String rolFirmaObjetivo = mapearRolAFirma(rol);
        if (rolFirmaObjetivo == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tu rol (" + rol + ") no tiene permiso para firmar esta etapa");
        }

        List<PecosaFirma> firmas = pecosaFirmaRepository.findByPecosaIdWithPersona(idPecosa);
        PecosaFirma firmaActual = firmas.stream()
                .filter(f -> f.getRolFirma().equals(rolFirmaObjetivo))
                .findFirst()
.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Espacio de firma no encontrado para " + rolFirmaObjetivo));
        if (!"PENDIENTE".equals(firmaActual.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La firma de " + rolFirmaObjetivo + " ya fue registrada");
        }
        if (Boolean.FALSE.equals(request.aprobar())) {
            if (request.observacion() == null || request.observacion().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debes indicar el motivo al rechazar una PECOSA");
            }
            firmaActual.setEstado("RECHAZADO");
            firmaActual.setPersona(usuario.getPersona());
            firmaActual.setFechaFirma(LocalDateTime.now());
            firmaActual.setObservacion(request.observacion().trim());
            pecosaFirmaRepository.save(firmaActual);
            pecosa.setEstado("RECHAZADA");
            pecosaRepository.save(pecosa);
            registrarAuditoria(usuario, "PECOSA", "RECHAZAR", "pecosa",
                    String.valueOf(idPecosa),
                    pecosa.getNumeroPecosa() + " rechazada por " + rolFirmaObjetivo + ": " + request.observacion().trim());
        } else {
            if ("ALMACEN".equals(rolFirmaObjetivo)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "La firma de ALMACÉN se registra al ejecutar el Despacho (PEPS) una vez aprobada por Abastecimiento y Administración"
                );
            }
            firmaActual.setEstado("FIRMADO");
            firmaActual.setPersona(usuario.getPersona());
            firmaActual.setFechaFirma(LocalDateTime.now());
            firmaActual.setObservacion(limpiarTexto(request.observacion()));
            pecosaFirmaRepository.save(firmaActual);
            boolean aprobadaAbastecimiento = firmas.stream()
                    .anyMatch(f -> "ABASTECIMIENTO".equals(f.getRolFirma()) && "FIRMADO".equals(f.getEstado()));
            boolean aprobadaAdmin = firmas.stream()
                    .anyMatch(f -> "ADMINISTRADOR".equals(f.getRolFirma()) && "FIRMADO".equals(f.getEstado()));
            if (aprobadaAbastecimiento && aprobadaAdmin) {
                pecosa.setEstado("APROBADA");
                pecosaRepository.save(pecosa);
            }
            registrarAuditoria(usuario, "PECOSA", "FIRMAR_" + rolFirmaObjetivo, "pecosa",
                    String.valueOf(idPecosa),
                    pecosa.getNumeroPecosa() + " firmada por " + rolFirmaObjetivo);
        }
        return toResponse(
                pecosa,
                pecosaDetalleRepository.findByPecosaIdWithDetails(idPecosa),
                pecosaFirmaRepository.findByPecosaIdWithPersona(idPecosa),
                rol
        );
    }
@Transactional
public PecosaResponse despacharPeps(Integer idPecosa, PecosaDespachoRequest request, String username) {
    Usuario usuario = obtenerUsuarioAutenticado(username);
    String rol = normalizarRol(usuario);

    if (!"ALMACENERO".equals(rol) && !"ADMIN".equals(rol)) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo ALMACENERO o ADMIN pueden ejecutar el despacho PEPS");
    }
    if (usuario.getPersona() == null) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El usuario no tiene una persona vinculada");
    }

    Pecosa pecosa = pecosaRepository.findByIdWithDetails(idPecosa)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "PECOSA no encontrada"));

    if (!"APROBADA".equals(pecosa.getEstado())) {
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Solo se pueden despachar PECOSAs en estado APROBADA (faltan firmas de Abastecimiento y/o Administración)"
        );
    }

    List<PecosaDetalle> detallesOriginales = pecosaDetalleRepository.findByPecosaIdWithDetails(idPecosa);
    Map<Integer, BigDecimal> solicitadoPorProducto = new LinkedHashMap<>();
    for (PecosaDetalle det : detallesOriginales) {
        solicitadoPorProducto.merge(det.getIdproducto().getId(), det.getCantidadSolicitada(), BigDecimal::add);
    }

    Map<Integer, BigDecimal> atendidoPorProducto = new HashMap<>();
    for (PecosaDespachoItemRequest item : request.items()) {
        atendidoPorProducto.put(item.idProducto(), item.cantidadAtendida().setScale(2, RoundingMode.HALF_UP));
    }

    BigDecimal totalDespachadoGlobal = atendidoPorProducto.values().stream()
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    if (totalDespachadoGlobal.compareTo(BigDecimal.ZERO) <= 0) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe despachar una cantidad mayor a 0 en al menos un bien");
    }

    pecosaDetalleRepository.deleteAll(detallesOriginales);
    pecosaDetalleRepository.flush();

    LocalDateTime ahora = LocalDateTime.now();
    String numeroSalida = pecosa.getNumeroPecosa().replace("PEC-", "SAL-");
    pecosa.setNumeroSalida(numeroSalida);
    pecosa.setFechaDespacho(ahora);
    pecosa.setIdpersonaAlmacenista(usuario.getPersona());
    pecosa.setEstado("DESPACHADA");
    if (request.observaciones() != null && !request.observaciones().isBlank()) {
        String prev = pecosa.getObservaciones();
        pecosa.setObservaciones(prev != null ? prev + " | Despacho: " + request.observaciones().trim() : request.observaciones().trim());
    }
    pecosaRepository.save(pecosa);

    for (Map.Entry<Integer, BigDecimal> entry : solicitadoPorProducto.entrySet()) {
        Integer idProducto = entry.getKey();
        BigDecimal cantSolicitada = entry.getValue();
        BigDecimal cantAtender = atendidoPorProducto.getOrDefault(idProducto, BigDecimal.ZERO);

        Producto producto = productoRepository.findById(idProducto)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado"));

        if (cantAtender.compareTo(cantSolicitada) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "No puedes atender más de lo solicitado para '" + producto.getNombre() + "'"
            );
        }

        if (cantAtender.compareTo(BigDecimal.ZERO) == 0) {
            PecosaDetalle detCero = new PecosaDetalle();
            detCero.setIdpecosa(pecosa);
            detCero.setIdproducto(producto);
            detCero.setIdlote(null);
            detCero.setCantidadSolicitada(cantSolicitada);
            detCero.setCantidadAtendida(BigDecimal.ZERO);
            detCero.setPrecioUnitarioHistorico(BigDecimal.ZERO);
            pecosaDetalleRepository.save(detCero);
            continue;
        }

        List<Lote> lotesPeps = loteRepository.findDisponiblesPeps(idProducto);
        BigDecimal stockDisponibleLotes = lotesPeps.stream()
                .map(Lote::getCantidadRestante)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (stockDisponibleLotes.compareTo(cantAtender) < 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Stock insuficiente en lotes para '" + producto.getNombre() + "'. Disponible: " + stockDisponibleLotes
            );
        }

        BigDecimal pendientePorDescontar = cantAtender;
        boolean esPrimeraLineaDelProducto = true;

        for (Lote lote : lotesPeps) {
            if (pendientePorDescontar.compareTo(BigDecimal.ZERO) <= 0) break;

            BigDecimal disponibleLote = lote.getCantidadRestante();
            BigDecimal tomado = disponibleLote.min(pendientePorDescontar).setScale(2, RoundingMode.HALF_UP);
            BigDecimal nuevoRestanteLote = disponibleLote.subtract(tomado).setScale(2, RoundingMode.HALF_UP);

            lote.setCantidadRestante(nuevoRestanteLote);
            if (nuevoRestanteLote.compareTo(BigDecimal.ZERO) == 0) {
                lote.setEstado(Lote.Estado.Agotado);
            }
            loteRepository.save(lote);

            PecosaDetalle det = new PecosaDetalle();
            det.setIdpecosa(pecosa);
            det.setIdproducto(producto);
            det.setIdlote(lote);
            det.setCantidadSolicitada(esPrimeraLineaDelProducto ? cantSolicitada : BigDecimal.ZERO);
            det.setCantidadAtendida(tomado);
            det.setPrecioUnitarioHistorico(lote.getCostoUnitario());
            pecosaDetalleRepository.save(det);
            esPrimeraLineaDelProducto = false;

            BigDecimal stockActual = producto.getStockGeneral() != null ? producto.getStockGeneral() : BigDecimal.ZERO;
            BigDecimal nuevoStock = stockActual.subtract(tomado).setScale(2, RoundingMode.HALF_UP);
            producto.setStockGeneral(nuevoStock.max(BigDecimal.ZERO));
            productoRepository.save(producto);

            BigDecimal costoTotal = tomado.multiply(lote.getCostoUnitario()).setScale(2, RoundingMode.HALF_UP);
            BigDecimal saldoValorizado = loteRepository.calcularSaldoValorizadoPorProducto(idProducto)
                    .setScale(2, RoundingMode.HALF_UP);

            MovimientoKardex kardex = new MovimientoKardex();
            kardex.setFecha(ahora);
            kardex.setTipoMovimiento("SALIDA");
            kardex.setDocumentoReferencia(pecosa.getNumeroPecosa());
            kardex.setProducto(producto);
            kardex.setLote(lote);
            kardex.setPecosa(pecosa);
            kardex.setArea(pecosa.getIdarea());
            kardex.setSolicitante(pecosa.getIdpersonaSolicitante());
            kardex.setCantidad(tomado);
            kardex.setCostoUnitario(lote.getCostoUnitario());
            kardex.setCostoTotal(costoTotal);
            kardex.setSaldoCantidad(producto.getStockGeneral());
            kardex.setSaldoValorizado(saldoValorizado);
            kardex.setObservacion("Despacho PEPS a " + (pecosa.getIdarea() != null ? pecosa.getIdarea().getNombre() : "Área"));
            kardex.setUsuarioRegistro(usuario);
            movimientoKardexRepository.save(kardex);

            pendientePorDescontar = pendientePorDescontar.subtract(tomado);
        }
    }

    List<PecosaFirma> firmas = pecosaFirmaRepository.findByPecosaIdWithPersona(idPecosa);
    firmas.stream()
            .filter(f -> "ALMACEN".equals(f.getRolFirma()))
            .findFirst()
            .ifPresent(f -> {
                f.setEstado("FIRMADO");
                f.setPersona(usuario.getPersona());
                f.setFechaFirma(ahora);
                f.setObservacion("Despachado con PEPS (" + numeroSalida + ")");
                pecosaFirmaRepository.save(f);
            });

    registrarAuditoria(usuario, "PECOSA", "DESPACHAR_PEPS", "pecosa",
            String.valueOf(idPecosa),
            "Despacho PEPS ejecutado para " + pecosa.getNumeroPecosa() + " (" + numeroSalida + ")");

    return toResponse(
            pecosa,
            pecosaDetalleRepository.findByPecosaIdWithDetails(idPecosa),
            pecosaFirmaRepository.findByPecosaIdWithPersona(idPecosa),
            rol
    );
}

private PecosaFirma crearFirma(Pecosa pecosa, String rolFirma, int orden, String estado,
                               Persona persona, LocalDateTime fecha, String obs) {
    PecosaFirma f = new PecosaFirma();
    f.setPecosa(pecosa);
    f.setRolFirma(rolFirma);
    f.setOrden(orden);
    f.setEstado(estado);
    f.setPersona(persona);
    f.setFechaFirma(fecha);
    f.setObservacion(obs);
    return f;
}

private String generarCorrelativoAnual(LocalDateTime fecha) {
    int anio = fecha.getYear();
    Instant inicio = LocalDate.of(anio, 1, 1).atStartOfDay(ZoneId.systemDefault()).toInstant();
    Instant fin = LocalDate.of(anio, 12, 31).atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toInstant();
    long correlativo = pecosaRepository.countByFechaEmisionBetween(inicio, fin) + 1;
    String sufijo;
    do {
        sufijo = String.format("%04d-%d", correlativo++, anio);
    } while (pecosaRepository.existsByNumeroPecosaIgnoreCase("PEC-" + sufijo));
    return sufijo;
}
private Usuario obtenerUsuarioAutenticado(String username) {
    return usuarioRepository.buscarPorUsername(username)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));
}
private String normalizarRol(Usuario usuario) {
    if (usuario.getRol() == null || usuario.getRol().getNombre() == null) return "SOLICITANTE";
    return usuario.getRol().getNombre().replace("ROLE_", "").toUpperCase();
}
private String mapearRolAFirma(String rol) {
    return switch (rol) {
        case "ABASTECIMIENTO" -> "ABASTECIMIENTO";
        case "ADMIN" -> "ADMINISTRADOR";
        case "ALMACENERO" -> "ALMACEN";
        default -> null;
    };
}
private void validarPermisoLectura(Pecosa pecosa, Usuario usuario, String rol) {
    if (!"SOLICITANTE".equals(rol)) return;
    Persona p = usuario.getPersona();
    Integer miArea = (p != null && p.getIdarea() != null) ? p.getIdarea().getId() : null;
    Integer areaPecosa = pecosa.getIdarea() != null ? pecosa.getIdarea().getId() : null;
    boolean mismoSolicitante = p != null && pecosa.getIdpersonaSolicitante() != null
            && p.getId().equals(pecosa.getIdpersonaSolicitante().getId());
    boolean mismaArea = miArea != null && miArea.equals(areaPecosa);
    if (!mismoSolicitante && !mismaArea) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permiso para ver PECOSAs de otra área");
    }
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
private String limpiarTexto(String valor) {
    return (valor == null || valor.isBlank()) ? null : valor.trim();
}
    private PecosaResponse toResponse(Pecosa p, List<PecosaDetalle> detalles, List<PecosaFirma> firmas, String rolActual) {
        List<PecosaDetalleResponse> detDto = detalles.stream().map(d -> {
            Producto prod = d.getIdproducto();
            BigDecimal subtotal = d.getCantidadAtendida().multiply(d.getPrecioUnitarioHistorico()).setScale(2, RoundingMode.HALF_UP);
            return new PecosaDetalleResponse(
                    d.getId(),
                    prod.getId(),
                    prod.getCodigoInterno(),
                    prod.getNombre(),
                    prod.getIdunidad() != null ? prod.getIdunidad().getNombre() : "",
                    prod.getTipoBien(),
                    prod.getIdcategoria() != null ? prod.getIdcategoria().getCodigo() : prod.getCuenta(),
                    d.getIdlote() != null ? d.getIdlote().getId() : null,
                    prod.getStockGeneral(),
                    d.getCantidadSolicitada(),
                    d.getCantidadAtendida(),
                    d.getPrecioUnitarioHistorico(),
                    subtotal
            );
        }).toList();

        List<PecosaFirmaResponse> firmDto = firmas.stream().map(f -> {
            Persona per = f.getPersona();
            return new PecosaFirmaResponse(
                    f.getIdPecosaFirma(),
                    f.getRolFirma(),
                    f.getOrden(),
                    f.getEstado(),
                    per != null ? (per.getNombres() + " " + per.getApellidos()).trim() : null,
                    per != null ? per.getCargo() : null,
                    f.getFechaFirma(),
                    f.getObservacion()
            );
        }).toList();

        BigDecimal total = detDto.stream()
                .map(PecosaDetalleResponse::subtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        String miFirmaRol = mapearRolAFirma(rolActual);
        boolean requiereMiFirma = "PENDIENTE_FIRMAS".equals(p.getEstado()) && miFirmaRol != null
                && !"ALMACEN".equals(miFirmaRol)
                && firmas.stream().anyMatch(f -> miFirmaRol.equals(f.getRolFirma()) && "PENDIENTE".equals(f.getEstado()));

        boolean puedeDespachar = "APROBADA".equals(p.getEstado())
                && ("ALMACENERO".equals(rolActual) || "ADMIN".equals(rolActual));

        Persona sol = p.getIdpersonaSolicitante();
        Persona alm = p.getIdpersonaAlmacenista();
        Area area = p.getIdarea();

        LocalDateTime fechaEmision = p.getFechaEmision() != null
                ? LocalDateTime.ofInstant(p.getFechaEmision(), ZoneId.systemDefault())
                : null;

        return new PecosaResponse(
                p.getId(),
                p.getNumeroPecosa(),
                p.getNumeroPedido(),
                p.getNumeroSalida(),
                p.getCodigoQr(),
                p.getEstado(),
                fechaEmision,
                p.getFechaDespacho(),
                p.getObservaciones(),
                area != null ? area.getId() : null,
                area != null ? area.getNombre() : "Sin área",
                sol != null ? sol.getId() : null,
                sol != null ? (sol.getNombres() + " " + sol.getApellidos()).trim() : "",
                alm != null ? (alm.getNombres() + " " + alm.getApellidos()).trim() : null,
                total,
                requiereMiFirma,
                puedeDespachar,
                detDto,
                firmDto
        );
    }
}