package com.siga.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "lote")
public class Lote {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idlote", nullable = false)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idproducto", nullable = false)
    private Producto idproducto;

    @ColumnDefault("current_timestamp()")
    @Column(name = "fecha_ingreso", nullable = false)
    private Instant fechaIngreso;

    @Column(name = "cantidad_inicial", nullable = false, precision = 12, scale = 2)
    private BigDecimal cantidadInicial;

    @Column(name = "cantidad_restante", nullable = false, precision = 12, scale = 2)
    private BigDecimal cantidadRestante;

    @ColumnDefault("0.00")
    @Column(name = "costo_unitario", nullable = false, precision = 12, scale = 2)
    private BigDecimal costoUnitario;

    public enum Estado { Activo, Agotado, Vencido }

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false)
    private Estado estado;

    @Column(name = "fecha_vencimiento")
    private LocalDate fechaVencimiento; // DATE en MySQL mapea mejor a LocalDate

    @Column(name = "proveedor", length = 255)
    private String proveedor;

    @Column(name = "documento_sustento", length = 255)
    private String documentoSustento;
}
