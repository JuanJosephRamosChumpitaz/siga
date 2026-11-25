package com.siga.backend.dtos;

import java.time.LocalDateTime;

public record PecosaFirmaResponse(
        Integer idPecosaFirma,
        String rolFirma,
        Integer orden,
        String estado,
        String firmanteNombre,
        String firmanteCargo,
        LocalDateTime fechaFirma,
        String observacion
) {}