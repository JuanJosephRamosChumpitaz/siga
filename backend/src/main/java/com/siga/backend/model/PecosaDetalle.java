package com.siga.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "pecosa_detalle")
public class PecosaDetalle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idpecosa_detalle", nullable = false)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "idpecosa", nullable = false)
    private Pecosa idpecosa;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idproducto", nullable = false)
    private Producto idproducto;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idlote", nullable = false)
    private Lote idlote;

    @Column(name = "cantidad_solicitada", nullable = false, precision = 12, scale = 2)
    private BigDecimal cantidadSolicitada;

    @Column(name = "cantidad_atendida", nullable = false, precision = 12, scale = 2)
    private BigDecimal cantidadAtendida;

    @Column(name = "precio_unitario_historico", nullable = false, precision = 12, scale = 2)
    private BigDecimal precioUnitarioHistorico;


}