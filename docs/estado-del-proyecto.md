Resumen de lo hecho


Entorno y estructura

Monorepo siga/ con backend/ (Spring Boot 4.1.2, Maven, paquete com.siga.backend) y frontend/ (React + Vite, Node 26).
IntelliJ, XAMPP (MySQL) y GitHub Desktop. Servidores en localhost:8080 (backend) y localhost:5173 (frontend, con proxy /api).

Base de datos pecosa

9 entidades JPA generadas con JPA Buddy: Categoria, Lote, Pecosa, PecosaDetalle, Persona, Producto, Rol, Unidad, Usuario.
Flyway con V1__crear_tablas.sql (esquema exportado con mysqldump), baseline-on-migrate=true y ddl-auto=validate.
Lote.estado quedó mapeado como enum de Java.

Seguridad y API

Spring Security + JWT (jjwt): SecurityConfig, JwtService, JwtAuthFilter, UsuarioDetailsService, AuthController.
DataInitializer (solo perfil dev) crea roles ADMIN/ALMACENERO y el usuario admin / admin123.
GET /api/dashboard/resumen con 5 métricas. Probado en Postman: login 200 con token y dashboard 200.

Frontend

Login, ruta protegida, contexto de autenticación y dashboard con tarjetas. El login ya funcionó contra el backend.
Pendiente de aplicar: el Login.jsx corregido para el autocompletado del navegador.

CI/CD

ci.yml definido (backend con servicio MySQL, frontend con build). El workflow de CD está propuesto, aún sin probar.

Errores resueltos en el camino

Imports faltantes, paquetes fuera de com.siga.backend, repositorios declarados con la entidad equivocada, @Transactional de Jakarta en lugar del de Spring, y Instant frente a LocalDateTime en el dashboard.

Análisis del Excel y del alcance

El clasificador contable se modela con categoria (ya es un árbol con idpadre).
Falta una migración V2 con: codigo en categoría, perecible y stock_minimo en producto, vencimiento, proveedor y documento en lote, y área destino en pecosa.

Pendiente

Aplicar el nuevo Login.jsx, la migración V2 con sus entidades, el módulo de usuarios, el catálogo, ingresos, PECOSA con PEPS, kardex, alertas y reportes. Además, cambiar admin123 antes de desplegar.