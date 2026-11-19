package com.siga.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "pecosa_firma")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PecosaFirma {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idpecosa_firma")
    private Integer idPecosaFirma;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idpecosa", nullable = false)
    private Pecosa pecosa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idpersona")
    private Persona persona;

    @Column(name = "rol_firma", nullable = false, length = 30)
    private String rolFirma;

    @Column(name = "orden", nullable = false)
    private Integer orden;

    @Column(name = "estado", nullable = false, length = 20)
    private String estado = "PENDIENTE";

    @Column(name = "fecha_firma")
    private LocalDateTime fechaFirma;

    @Column(name = "observacion", length = 255)
    private String observacion;
}