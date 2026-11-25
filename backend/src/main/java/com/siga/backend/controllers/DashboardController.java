package com.siga.backend.controllers;

import com.siga.backend.dtos.DashboardResumen;
import com.siga.backend.services.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/resumen")
    public ResponseEntity<DashboardResumen> obtenerResumen(Authentication authentication) {
        return ResponseEntity.ok(dashboardService.obtenerResumen(authentication.getName()));
    }
}