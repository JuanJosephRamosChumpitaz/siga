package com.siga.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "nota_entrada")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class NotaEntrada {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idnota_entrada")
    private Integer idNotaEntrada;

    @Column(name = "numero_nea", nullable = false, length = 45, unique = true)
    private String numeroNea;

    @Column(name = "fecha_emision", nullable = false)
    private LocalDateTime fechaEmision;

    @Column(name = "procedencia", nullable = false, length = 200)
    private String procedencia;

    @Column(name = "destino", nullable = false, length = 200)
    private String destino = "IESTP \"CAÑETE\"";

    @Column(name = "referencia", length = 200)
    private String referencia;

    @Column(name = "modalidad", length = 200)
    private String modalidad;

    @Column(name = "observaciones", length = 255)
    private String observaciones;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idproveedor")
    private Proveedor proveedor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idpersona_responsable", nullable = false)
    private Persona responsable;
}