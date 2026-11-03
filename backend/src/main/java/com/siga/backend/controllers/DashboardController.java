package com.siga.backend.controllers;

import com.siga.backend.dtos.DashboardResumen;
import com.siga.backend.services.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {
    private final DashboardService dashboardService;

    @GetMapping("/resumen")
    public DashboardResumen resumen() {
        return dashboardService.resumen();
    }
}