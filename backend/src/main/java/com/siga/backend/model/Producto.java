package com.siga.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "producto")
public class Producto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idproducto", nullable = false)
    private Integer id;

    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    @Column(name = "cuenta", length = 45)
    private String cuenta;

    @Column(name = "codigo_barra", length = 45)
    private String codigoBarra;

    @ColumnDefault("0.00")
    @Column(name = "precio_unidad", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioUnidad;

    @ColumnDefault("0.00")
    @Column(name = "stock_general", nullable = false, precision = 12, scale = 2)
    private BigDecimal stockGeneral;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idcategoria", nullable = false)
    private Categoria idcategoria;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "idunidad", nullable = false)
    private Unidad idunidad;

    @ColumnDefault("0")
    @Column(name = "perecible", nullable = false)
    private Boolean perecible;

    @ColumnDefault("0.00")
    @Column(name = "stock_minimo", nullable = false, precision = 12, scale = 2)
    private BigDecimal stockMinimo;
}
