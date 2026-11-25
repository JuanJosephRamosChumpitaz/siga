package com.siga.backend.dtos;

public record ProveedorResponse(
        Integer idProveedor,
        String ruc,
        String razonSocial,
        String direccion,
        String telefono,
        String email,
        Boolean activo
) {}