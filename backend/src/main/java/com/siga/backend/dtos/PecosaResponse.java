package com.siga.backend.dtos;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record PecosaResponse(
        Integer idPecosa,
        String numeroPecosa,
        String numeroPedido,
        String numeroSalida,
        String codigoQr,
        String estado,
        LocalDateTime fechaEmision,
        LocalDateTime fechaDespacho,
        String observaciones,
        Integer idAreaDestino,
        String areaDestino,
        Integer idPersonaSolicitante,
        String solicitanteNombre,
        String almacenistaNombre,
        BigDecimal totalValorizado,
        Boolean requiereMiFirma,
        Boolean puedeDespachar,
        List<PecosaDetalleResponse> detalles,
        List<PecosaFirmaResponse> firmas
) {}