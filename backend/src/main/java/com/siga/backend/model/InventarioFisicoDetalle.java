package com.siga.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "inventario_fisico_detalle")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InventarioFisicoDetalle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idinventario_detalle")
    private Integer idInventarioDetalle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idinventario_fisico", nullable = false)
    private InventarioFisico inventarioFisico;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idproducto", nullable = false)
    private Producto producto;

    @Column(name = "stock_sistema", nullable = false, precision = 12, scale = 2)
    private BigDecimal stockSistema;

    @Column(name = "stock_fisico", nullable = false, precision = 12, scale = 2)
    private BigDecimal stockFisico;

    @Column(name = "diferencia", nullable = false, precision = 12, scale = 2)
    private BigDecimal diferencia;

    @Column(name = "observacion", length = 255)
    private String observacion;
}