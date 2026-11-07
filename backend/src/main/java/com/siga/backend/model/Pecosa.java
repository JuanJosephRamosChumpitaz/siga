package com.siga.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "pecosa")
public class Pecosa {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idpecosa", nullable = false)
    private Integer id;

    @Column(name = "numero_pecosa", nullable = false, length = 45)
    private String numeroPecosa;

    @ColumnDefault("current_timestamp()")
    @Column(name = "fecha_emision", nullable = false)
    private Instant fechaEmision;

    @Column(name = "observaciones", length = 255)
    private String observaciones;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idpersona_solicitante", nullable = false)
    private Persona idpersonaSolicitante;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idpersona_almacenista", nullable = false)
    private Persona idpersonaAlmacenista;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idarea")
    private Area idarea; // Clave foránea agregada según diagrama
}
