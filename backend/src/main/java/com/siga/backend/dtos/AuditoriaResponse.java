package com.siga.backend.dtos;

import java.time.LocalDateTime;

public record AuditoriaResponse(
        Long idAuditoria,
        LocalDateTime fecha,
        String usuario,
        String modulo,
        String accion,
        String entidad,
        String entidadId,
        String detalle
) {}