package com.siga.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "movimiento_kardex")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MovimientoKardex {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idmovimiento")
    private Integer idMovimiento;

    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha;

    @Column(name = "tipo_movimiento", nullable = false, length = 30)
    private String tipoMovimiento;

    @Column(name = "documento_referencia", nullable = false, length = 60)
    private String documentoReferencia;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idproducto", nullable = false)
    private Producto producto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idlote")
    private Lote lote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idnota_entrada")
    private NotaEntrada notaEntrada;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idpecosa")
    private Pecosa pecosa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idarea")
    private Area area;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idpersona_solicitante")
    private Persona solicitante;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idproveedor")
    private Proveedor proveedor;

    @Column(name = "cantidad", nullable = false, precision = 12, scale = 2)
    private BigDecimal cantidad;

    @Column(name = "costo_unitario", nullable = false, precision = 12, scale = 2)
    private BigDecimal costoUnitario;

    @Column(name = "costo_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal costoTotal;

    @Column(name = "saldo_cantidad", nullable = false, precision = 12, scale = 2)
    private BigDecimal saldoCantidad;

    @Column(name = "saldo_valorizado", nullable = false, precision = 12, scale = 2)
    private BigDecimal saldoValorizado;

    @Column(name = "observacion", length = 255)
    private String observacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idusuario_registro", nullable = false)
    private Usuario usuarioRegistro;
}