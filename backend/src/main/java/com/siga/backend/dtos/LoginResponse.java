package com.siga.backend.dtos;

public record LoginResponse(String token, String username, String rol, String nombreCompleto) {}
