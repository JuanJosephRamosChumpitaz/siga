-- V3__esquema_completo_siga.sql
-- Cierre del esquema definitivo de SIGA (IESTP Cañete)
-- Compatible con MySQL 8.0 (CI) y MariaDB (XAMPP)

-- ============================================================================
-- 1. AJUSTES A TABLAS MAESTRAS (anchos de texto y borrado lógico)
-- ============================================================================
ALTER TABLE categoria
    MODIFY COLUMN nombre VARCHAR(150) NOT NULL,
    ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1;

ALTER TABLE unidad
    ADD COLUMN abreviatura VARCHAR(15) NULL,
    ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1;

ALTER TABLE area
    ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1;

ALTER TABLE persona
    MODIFY COLUMN nombres VARCHAR(100) NOT NULL,
    MODIFY COLUMN apellidos VARCHAR(100) NOT NULL,
    ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1;

ALTER TABLE usuario
    ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1;

-- Roles base requeridos para dashboards y flujo de firmas
INSERT IGNORE INTO rol (nombre) VALUES
    ('ADMIN'),
    ('ALMACENERO'),
    ('ABASTECIMIENTO'),
    ('SOLICITANTE');

-- ============================================================================
-- 2. PROVEEDORES
-- ============================================================================
CREATE TABLE proveedor (
                           idproveedor INT AUTO_INCREMENT PRIMARY KEY,
                           ruc VARCHAR(11) NOT NULL,
                           razon_social VARCHAR(150) NOT NULL,
                           direccion VARCHAR(255) NULL,
                           telefono VARCHAR(20) NULL,
                           email VARCHAR(100) NULL,
                           activo TINYINT(1) NOT NULL DEFAULT 1,
                           CONSTRAINT uk_proveedor_ruc UNIQUE (ruc)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. AJUSTES EN PRODUCTO (Existencias Valoradas, PECOSA y Escáner QR/Barras)
-- ============================================================================
UPDATE producto SET codigo_barra = NULL WHERE codigo_barra = '';

ALTER TABLE producto
    MODIFY COLUMN nombre VARCHAR(200) NOT NULL,
    ADD COLUMN codigo_interno VARCHAR(50) NULL,
    ADD COLUMN marca_serie VARCHAR(150) NULL,
    ADD COLUMN tipo_bien VARCHAR(50) NULL,
    ADD COLUMN consumo_mensual_aprox DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1,
    ADD CONSTRAINT uk_producto_codigo_interno UNIQUE (codigo_interno),
    ADD CONSTRAINT uk_producto_codigo_barra UNIQUE (codigo_barra);

-- ============================================================================
-- 4. NOTA DE ENTRADA A ALMACÉN (NEA) Y VÍNCULO CON LOTES
-- ============================================================================
CREATE TABLE nota_entrada (
                              idnota_entrada INT AUTO_INCREMENT PRIMARY KEY,
                              numero_nea VARCHAR(45) NOT NULL,
                              fecha_emision DATETIME NOT NULL,
                              procedencia VARCHAR(200) NOT NULL,
                              destino VARCHAR(200) NOT NULL DEFAULT 'IESTP "CAÑETE"',
                              referencia VARCHAR(200) NULL,
                              modalidad VARCHAR(200) NULL,
                              observaciones VARCHAR(255) NULL,
                              idproveedor INT NULL,
                              idpersona_responsable INT NOT NULL,
                              CONSTRAINT uk_nota_entrada_numero UNIQUE (numero_nea),
                              CONSTRAINT fk_nea_proveedor FOREIGN KEY (idproveedor) REFERENCES proveedor(idproveedor),
                              CONSTRAINT fk_nea_responsable FOREIGN KEY (idpersona_responsable) REFERENCES persona(idpersona)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE lote
    ADD COLUMN idnota_entrada INT NULL,
    ADD COLUMN idproveedor INT NULL,
    ADD CONSTRAINT fk_lote_nota_entrada FOREIGN KEY (idnota_entrada) REFERENCES nota_entrada(idnota_entrada),
    ADD CONSTRAINT fk_lote_proveedor FOREIGN KEY (idproveedor) REFERENCES proveedor(idproveedor);

-- ============================================================================
-- 5. AJUSTES EN PECOSA Y PECOSA_DETALLE (Solicitudes antes de despacho PEPS)
-- ============================================================================
ALTER TABLE pecosa
    MODIFY COLUMN idpersona_almacenista INT NULL,
    ADD COLUMN numero_pedido VARCHAR(45) NULL,
    ADD COLUMN numero_salida VARCHAR(45) NULL,
    ADD COLUMN estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE_FIRMAS',
    ADD COLUMN codigo_qr VARCHAR(100) NULL,
    ADD COLUMN fecha_despacho DATETIME NULL,
    ADD CONSTRAINT uk_pecosa_codigo_qr UNIQUE (codigo_qr);

ALTER TABLE pecosa_detalle
    MODIFY COLUMN idlote INT NULL,
    MODIFY COLUMN cantidad_atendida DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    MODIFY COLUMN precio_unitario_historico DECIMAL(12,2) NOT NULL DEFAULT 0.00;

-- ============================================================================
-- 6. FLUJO DE FIRMAS DE PECOSA (4 firmas oficiales del IESTP Cañete)
-- ============================================================================
CREATE TABLE pecosa_firma (
                              idpecosa_firma INT AUTO_INCREMENT PRIMARY KEY,
                              idpecosa INT NOT NULL,
                              idpersona INT NULL,
                              rol_firma VARCHAR(30) NOT NULL, -- SOLICITANTE, ABASTECIMIENTO, ALMACEN, ADMINISTRADOR
                              orden INT NOT NULL,             -- 1, 2, 3, 4
                              estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE', -- PENDIENTE, FIRMADO, RECHAZADO
                              fecha_firma DATETIME NULL,
                              observacion VARCHAR(255) NULL,
                              CONSTRAINT uk_pecosa_rol_firma UNIQUE (idpecosa, rol_firma),
                              CONSTRAINT fk_pecosa_firma_pecosa FOREIGN KEY (idpecosa) REFERENCES pecosa(idpecosa),
                              CONSTRAINT fk_pecosa_firma_persona FOREIGN KEY (idpersona) REFERENCES persona(idpersona)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 7. INVENTARIO FÍSICO (Sesiones de conteo y conciliación de stock)
-- ============================================================================
CREATE TABLE inventario_fisico (
                                   idinventario_fisico INT AUTO_INCREMENT PRIMARY KEY,
                                   codigo VARCHAR(45) NOT NULL,
                                   fecha_inicio DATETIME NOT NULL,
                                   fecha_cierre DATETIME NULL,
                                   estado VARCHAR(20) NOT NULL DEFAULT 'EN_PROCESO', -- EN_PROCESO, CERRADO, ANULADO
                                   observaciones VARCHAR(255) NULL,
                                   idpersona_responsable INT NOT NULL,
                                   CONSTRAINT uk_inventario_codigo UNIQUE (codigo),
                                   CONSTRAINT fk_inv_responsable FOREIGN KEY (idpersona_responsable) REFERENCES persona(idpersona)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE inventario_fisico_detalle (
                                           idinventario_detalle INT AUTO_INCREMENT PRIMARY KEY,
                                           idinventario_fisico INT NOT NULL,
                                           idproducto INT NOT NULL,
                                           stock_sistema DECIMAL(12,2) NOT NULL,
                                           stock_fisico DECIMAL(12,2) NOT NULL,
                                           diferencia DECIMAL(12,2) NOT NULL,
                                           observacion VARCHAR(255) NULL,
                                           CONSTRAINT uk_inv_detalle_producto UNIQUE (idinventario_fisico, idproducto),
                                           CONSTRAINT fk_inv_det_cabecera FOREIGN KEY (idinventario_fisico) REFERENCES inventario_fisico(idinventario_fisico),
                                           CONSTRAINT fk_inv_det_producto FOREIGN KEY (idproducto) REFERENCES producto(idproducto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 8. KARDEX / CONTROL VISIBLE (Libro inmutable de movimientos y saldos)
-- ============================================================================
CREATE TABLE movimiento_kardex (
                                   idmovimiento INT AUTO_INCREMENT PRIMARY KEY,
                                   fecha DATETIME NOT NULL,
                                   tipo_movimiento VARCHAR(30) NOT NULL, -- ENTRADA, SALIDA, AJUSTE_POSITIVO, AJUSTE_NEGATIVO
                                   documento_referencia VARCHAR(60) NOT NULL, -- Ej. NEA-004-2025, PECOSA-003265, INV-2026-01
                                   idproducto INT NOT NULL,
                                   idlote INT NULL,
                                   idnota_entrada INT NULL,
                                   idpecosa INT NULL,
                                   idarea INT NULL,
                                   idpersona_solicitante INT NULL,
                                   idproveedor INT NULL,
                                   cantidad DECIMAL(12,2) NOT NULL,
                                   costo_unitario DECIMAL(12,2) NOT NULL,
                                   costo_total DECIMAL(12,2) NOT NULL,
                                   saldo_cantidad DECIMAL(12,2) NOT NULL,
                                   saldo_valorizado DECIMAL(12,2) NOT NULL,
                                   observacion VARCHAR(255) NULL,
                                   idusuario_registro INT NOT NULL,
                                   INDEX idx_kardex_producto_fecha (idproducto, fecha),
                                   CONSTRAINT fk_kardex_producto FOREIGN KEY (idproducto) REFERENCES producto(idproducto),
                                   CONSTRAINT fk_kardex_lote FOREIGN KEY (idlote) REFERENCES lote(idlote),
                                   CONSTRAINT fk_kardex_nea FOREIGN KEY (idnota_entrada) REFERENCES nota_entrada(idnota_entrada),
                                   CONSTRAINT fk_kardex_pecosa FOREIGN KEY (idpecosa) REFERENCES pecosa(idpecosa),
                                   CONSTRAINT fk_kardex_area FOREIGN KEY (idarea) REFERENCES area(idarea),
                                   CONSTRAINT fk_kardex_solicitante FOREIGN KEY (idpersona_solicitante) REFERENCES persona(idpersona),
                                   CONSTRAINT fk_kardex_proveedor FOREIGN KEY (idproveedor) REFERENCES proveedor(idproveedor),
                                   CONSTRAINT fk_kardex_usuario FOREIGN KEY (idusuario_registro) REFERENCES usuario(idusuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 9. AUDITORÍA DEL SISTEMA
-- ============================================================================
CREATE TABLE auditoria (
                           idauditoria BIGINT AUTO_INCREMENT PRIMARY KEY,
                           fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                           idusuario INT NULL,
                           modulo VARCHAR(50) NOT NULL,
                           accion VARCHAR(50) NOT NULL,
                           entidad VARCHAR(60) NOT NULL,
                           entidad_id VARCHAR(50) NULL,
                           detalle VARCHAR(500) NULL,
                           INDEX idx_auditoria_fecha (fecha),
                           CONSTRAINT fk_auditoria_usuario FOREIGN KEY (idusuario) REFERENCES usuario(idusuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;