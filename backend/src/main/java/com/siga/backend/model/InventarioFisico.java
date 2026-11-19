package com.siga.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventario_fisico")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InventarioFisico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idinventario_fisico")
    private Integer idInventarioFisico;

    @Column(name = "codigo", nullable = false, length = 45, unique = true)
    private String codigo;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDateTime fechaInicio;

    @Column(name = "fecha_cierre")
    private LocalDateTime fechaCierre;

    @Column(name = "estado", nullable = false, length = 20)
    private String estado = "EN_PROCESO";

    @Column(name = "observaciones", length = 255)
    private String observaciones;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idpersona_responsable", nullable = false)
    private Persona responsable;
}