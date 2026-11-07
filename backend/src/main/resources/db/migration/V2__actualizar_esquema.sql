-- V2__actualizar_esquema.sql

-- ==========================================
-- 1. CREACIÓN DE ÁREAS (Centro de Costos)
-- ==========================================
CREATE TABLE area (
                      idarea INT AUTO_INCREMENT PRIMARY KEY,
                      nombre VARCHAR(100) NOT NULL UNIQUE,
                      descripcion VARCHAR(255) NULL
);

-- ==========================================
-- 2. ACTUALIZACIÓN DEL PERSONAL (Tabla persona)
-- ==========================================
ALTER TABLE persona
    ADD COLUMN idarea INT NULL,
ADD COLUMN cargo VARCHAR(100) NULL,
ADD CONSTRAINT fk_persona_area FOREIGN KEY (idarea) REFERENCES area(idarea);

-- ==========================================
-- 3. ACTUALIZACIÓN DE PECOSA (Destino físico)
-- ==========================================
ALTER TABLE pecosa
    ADD COLUMN idarea INT NULL,
ADD CONSTRAINT fk_pecosa_area FOREIGN KEY (idarea) REFERENCES area(idarea);

-- ==========================================
-- 4. CLASIFICADOR CONTABLE (Tabla categoria)
-- ==========================================
ALTER TABLE categoria
    ADD COLUMN codigo VARCHAR(50) NULL;

-- ==========================================
-- 5. ACTUALIZACIÓN DE PRODUCTO (Cantidades y tipos)
-- ==========================================
ALTER TABLE producto
    MODIFY COLUMN stock_general DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN perecible TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN stock_minimo DECIMAL(12,2) NOT NULL DEFAULT 0.00;

-- ==========================================
-- 6. ACTUALIZACIÓN DE LOTE (Ingresos y Trazabilidad)
-- ==========================================
ALTER TABLE lote
    ADD COLUMN fecha_vencimiento DATE NULL,
ADD COLUMN proveedor VARCHAR(255) NULL,
ADD COLUMN documento_sustento VARCHAR(255) NULL;