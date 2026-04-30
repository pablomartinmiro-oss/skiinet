# Skiinet Master Plan — SaaS para Industria de Montaña

> **Fecha:** 30 abril 2026
> **Objetivo:** Convertir Skiinet de un MVP funcional en un SaaS production-ready para cualquier negocio de montaña (escuelas de esquí, alquiler de material, agencias de viajes, resorts).

---

## 📊 Auditoría — Estado Actual

### Lo que HAY (y está bien)
| Métrica | Valor |
|---------|-------|
| LOC total | ~396K |
| Archivos TS/TSX | 966 |
| Modelos Prisma | 111 |
| Rutas API | 317 |
| Módulos completos | 18/18 ✅ |
| Tests pasando | 216/216 (20/22 suites) |
| TypeScript errors | 0 |
| Multi-tenant | ✅ Verificado con 4 tenants |
| Auth/isolation | ✅ 80% rutas con requireTenant |
| Storefront público | ✅ 15 páginas |

### Los 18 Módulos Existentes
1. **Core** — Dashboard, settings, team, modules ✅
2. **CRM** — Contactos, pipeline kanban, chat (via GHL) ✅
3. **Catálogo** — 93 productos, matrix pricing, CSV import ✅
4. **Reservas** — Quote→Reservation flow, pagos Redsys, AI voucher reader ✅
5. **Hotel** — Room types, rates, seasons, blocks ✅
6. **Spa** — Treatments, resources, schedule templates ✅
7. **Restaurante** — Shifts, closures, bookings, staff ✅
8. **Finanzas** — Invoices, transactions, expenses, cost centers ✅
9. **Proveedores** — Settlements, status workflow ✅
10. **REAV** — Expedients, costs, documents ✅
11. **TPV** — POS, cash sessions, sales ✅
12. **Storefront** — 15 páginas públicas, checkout, carrito ✅
13. **CMS** — Pages, slideshow, menus, blocks ✅
14. **Ticketing** — Platforms, coupons, redemption ✅
15. **Reseñas** — Moderation ✅
16. **Packs** — Lego packs with lines ✅
17. **Alquiler** — Inventory, orders, sizing profiles ✅
18. **Escuela/Profesores** — Planning, horario, fichaje, diplomas, KPIs, liquidaciones (5,449 LOC — módulo más grande) ✅

### ⚠️ Problemas Detectados

#### Schema
- `RestaurantReservation` duplica `RestaurantBooking` — consolidar
- `SyncQueue` y `WebhookLog` sin FK a Tenant en Prisma
- `ContactSubmission` sin tenant scoping
- `Quote` tiene 57 campos — candidato a split

#### Seguridad
- 3 endpoints de onboarding sin auth (`intake`, `research`, `trigger`) — `research` consume API Anthropic
- `storefront/admin/seed-experiences` usa Bearer token ad-hoc

#### Testing
- 0 tests E2E/integración de rutas HTTP
- 2 suites de componentes fallan por `@testing-library/dom` missing
- Solo tests unitarios de libs/validation

#### Infraestructura
- ❌ S3/R2 (file uploads rotos)
- ❌ Sentry (error tracking)
- ❌ Redsys prod credentials (pagos)
- ❌ Stripe Billing (suscripciones SaaS)
- ❌ GDPR export/delete
- ❌ CI/CD (0 GitHub Actions)

---

## 🎯 Visión del Producto

Skiinet es un **SaaS modular para negocios de montaña**. Cada cliente activa solo los módulos que necesita:

| Tipo de Negocio | Módulos Activos |
|-----------------|-----------------|
| **Escuela de Esquí** | Core, CRM, Catálogo, Reservas, Finanzas, Escuela/Profesores, Ticketing, Storefront |
| **Alquiler de Material** | Core, CRM, Catálogo, Alquiler, TPV, Finanzas, Storefront |
| **Agencia de Viajes** | Core, CRM, Catálogo, Reservas, Packs, Hotel, Finanzas, Storefront, Proveedores |
| **Resort Completo** | TODOS los módulos |
| **Restaurante de Montaña** | Core, Restaurante, TPV, Finanzas, CMS |
| **Hotel/Alojamiento** | Core, CRM, Hotel, Reservas, Finanzas, Restaurante, Spa, CMS |

**Diferenciador clave:** Los módulos se interconectan. Una agencia de viajes puede ver la disponibilidad de la escuela de esquí, el inventario de alquiler, y las plazas de hotel — todo desde un solo dashboard.

---

## 🏗️ Plan de Ejecución — 8 Fases

### Fase 1: Limpieza y Estabilización (1-2 días)
> **Objetivo:** Base sólida antes de construir más

| # | Tarea | Prioridad | Esfuerzo |
|---|-------|-----------|----------|
| 1.1 | Consolidar `RestaurantReservation` → `RestaurantBooking` (eliminar modelo duplicado) | Alta | 2h |
| 1.2 | Añadir FK Tenant a `SyncQueue`, `WebhookLog`, `ContactSubmission` | Alta | 1h |
| 1.3 | Proteger endpoints onboarding (`research`, `intake`, `trigger`) con HMAC/shared secret | Alta | 2h |
| 1.4 | Instalar `@testing-library/dom` y arreglar 2 suites de componentes | Media | 30min |
| 1.5 | Limpiar Quote model — extraer `QuoteCustomer` (datos cliente) y `QuotePayment` (datos pago) | Media | 3h |
| 1.6 | Actualizar CLAUDE.md: 18 módulos (no 17), documentar Escuela como módulo completo | Baja | 30min |

### Fase 2: Sistema de Leads Independiente (2-3 días)
> **Objetivo:** CRM propio sin depender de GHL

Actualmente el CRM depende 100% de GoHighLevel (GHL). Para ser un SaaS independiente necesitamos leads nativos.

| # | Tarea | Detalle |
|---|-------|---------|
| 2.1 | Crear modelo `Lead` en Prisma | nombre, email, teléfono, origen (web/manual/importación), estado (nuevo/contactado/calificado/convertido/perdido), asignado a, notas, campos custom JSON |
| 2.2 | API CRUD de leads | `/api/leads` — list (filtros, búsqueda, paginación), create, update, delete |
| 2.3 | Lead scoring automático | Reglas configurables: origen, actividad, interacción con storefront |
| 2.4 | Pipeline visual (Kanban) | Columnas configurables por tenant, drag & drop |
| 2.5 | Importación CSV/Excel | Mapeo de campos, detección de duplicados |
| 2.6 | Conversión Lead → Presupuesto | Un click convierte lead en Quote con datos pre-rellenados |
| 2.7 | Widget de captura para storefront | Formulario embebible en `/s/[slug]/` que crea leads |
| 2.8 | Notificaciones de nuevo lead | Push + email al usuario asignado |
| 2.9 | GHL como opcional | Mantener sync con GHL como add-on, no como dependencia |

### Fase 3: Presupuestos y Facturación Automática (2-3 días)
> **Objetivo:** Flujo completo Lead → Presupuesto → Reserva → Factura sin intervención manual

| # | Tarea | Detalle |
|---|-------|---------|
| 3.1 | Auditar flujo actual Quote → Reservation | Verificar que el flujo completo funciona E2E con datos reales |
| 3.2 | Generación automática de factura al confirmar reserva | Reservation.status = "confirmed" → Invoice auto-generada con items de la Quote |
| 3.3 | Templates de presupuesto PDF | Diseño profesional con logo tenant, datos fiscales, condiciones |
| 3.4 | Templates de factura PDF | Cumplimiento fiscal español (NIF, base imponible, IVA desglosado, nº factura secuencial) |
| 3.5 | Envío automático por email | Quote creada → email al cliente con PDF + link de pago. Invoice generada → email con PDF |
| 3.6 | Recordatorios automáticos | Quote sin respuesta 48h → reminder. Invoice impagada 7d → reminder |
| 3.7 | Panel de seguimiento | Dashboard: presupuestos pendientes, facturas emitidas/cobradas/vencidas |
| 3.8 | Multi-divisa (EUR base) | Soporte para mostrar precios en £/CHF para clientes extranjeros |
| 3.9 | Numeración fiscal configurable | Serie por tipo (F-2026/001, P-2026/001), reset anual automático |

### Fase 4: Portal del Profesor (3-4 días)
> **Objetivo:** App dedicada donde los profesores gestionan su día a día

El módulo Escuela tiene 5,449 LOC en dashboard pero todo es para el admin. Falta la vista del profesor.

| # | Tarea | Detalle |
|---|-------|---------|
| 4.1 | Nuevo layout `/instructor/` con auth por rol | Login propio, UI mobile-first, menú simplificado |
| 4.2 | Mi Horario | Vista semanal/diaria de clases asignadas. Info: hora, nivel, nº alumnos, punto de encuentro |
| 4.3 | Fichaje digital | Check-in/check-out con geolocalización y timestamp. Historial de fichajes |
| 4.4 | Mis Clases (detalle) | Lista de alumnos, nivel, equipamiento, notas. Marcar asistencia. Añadir observaciones post-clase |
| 4.5 | Mis Ingresos | Liquidaciones: clases dadas, tarifa, extras, total a cobrar. Histórico mensual |
| 4.6 | Disponibilidad | El profesor marca días/horas disponibles. El admin lo ve al planificar |
| 4.7 | Notificaciones | Clase asignada, cambio de horario, cancelación — push + email + SMS (opt-in) |
| 4.8 | Diplomas e informes | El profesor puede generar diploma para alumnos desde su portal |
| 4.9 | Incidencias | Reportar incidencia (material roto, accidente, queja) con fotos |
| 4.10 | Chat con administración | Mensajería interna simple para coordinar cambios |

### Fase 5: Interconexión de Módulos (2-3 días)
> **Objetivo:** Los módulos hablan entre sí — el valor real del SaaS

| # | Tarea | Detalle |
|---|-------|---------|
| 5.1 | Disponibilidad cruzada | Al crear una Quote de "pack esquí + hotel", el sistema verifica disponibilidad de clases, instructor, habitación y equipo en tiempo real |
| 5.2 | Reserva unificada | Una sola reserva puede contener: clases, alquiler, hotel, forfait. Cada item se gestiona en su módulo pero la reserva es una |
| 5.3 | Inventario conectado | Alquiler sabe qué equipos están asignados a clases. Si un alumno tiene clase, su equipo se reserva automáticamente |
| 5.4 | Cliente unificado | Un cliente que reserva clase Y alquila equipo Y se aloja en hotel — perfil único con todo su historial |
| 5.5 | Dashboard cross-module | Vista de operaciones del día: clases en curso, equipos prestados, check-ins hotel, mesas restaurante |
| 5.6 | Facturación consolidada | Una factura puede incluir items de múltiples módulos (clase + alquiler + hotel) |
| 5.7 | API de disponibilidad pública | Endpoint público para que partners consulten disponibilidad (ej: agencia de viajes consulta escuela de esquí) |
| 5.8 | Eventos cross-module | Sistema de eventos interno: "reserva confirmada" → alquiler reserva equipo → profesor recibe notificación → factura se genera |

### Fase 6: Infraestructura de Producción (2-3 días)
> **Objetivo:** Todo lo necesario para cobrar dinero real

| # | Tarea | Detalle |
|---|-------|---------|
| 6.1 | S3/R2 para uploads | Cloudflare R2: vouchers, docs, fotos incidencias, logos tenant |
| 6.2 | Redsys producción | Conectar con banco, test E2E de pago real |
| 6.3 | Stripe Billing | Suscripciones mensuales para tenants. Plans: Starter (3 módulos), Pro (todos), Enterprise (custom) |
| 6.4 | CI/CD con GitHub Actions | Build + lint + test + deploy automático. PR checks obligatorios |
| 6.5 | Error tracking | Sentry ligero o alternativa (LogRocket, Highlight.io) |
| 6.6 | Backups automáticos | Railway Postgres + S3 daily backup |
| 6.7 | Rate limiting en todos los endpoints públicos | Ya existe en algunos, extender a todos |
| 6.8 | GDPR compliance | Export data + delete account + cookie consent real |
| 6.9 | Custom domains por tenant | `app.skicenter.es` → Skiinet tenant "skicenter" |
| 6.10 | SSL + CDN | Cloudflare proxy para storefront |

### Fase 7: Testing E2E (2-3 días)
> **Objetivo:** Confianza para desplegar sin miedo

| # | Tarea | Detalle |
|---|-------|---------|
| 7.1 | Test E2E: Lead → Presupuesto → Pago → Reserva → Factura | El flujo core completo |
| 7.2 | Test E2E: Onboarding de nuevo tenant | Wizard completo + primer login + primer producto |
| 7.3 | Test E2E: Portal profesor | Login → ver horario → fichar → cerrar clase → ver liquidación |
| 7.4 | Test E2E: Storefront público | Home → experiencia → carrito → checkout → confirmación |
| 7.5 | Test E2E: Multi-tenant isolation | Tenant A no puede ver datos de Tenant B (ampliar suite existente) |
| 7.6 | Test de carga | 50 concurrent users, respuestas < 200ms |
| 7.7 | Test de pagos | Redsys sandbox full cycle (generar → pagar → webhook → confirmar) |
| 7.8 | Seed de datos realistas | Script que crea tenant con 50 productos, 200 clientes, 20 profesores, 500 reservas históricas |

### Fase 8: Storefront 2.0 + Landing Comercial (2-3 días)
> **Objetivo:** Que venda solo

| # | Tarea | Detalle |
|---|-------|---------|
| 8.1 | Storefront responsive perfecto | Auditar mobile, tablet, desktop. Performance Lighthouse > 90 |
| 8.2 | SEO | Metadata, sitemap, structured data (JSON-LD para productos y eventos) |
| 8.3 | Booking widget embebible | `<iframe>` o web component que cualquier web puede incrustar |
| 8.4 | Landing de venta de Skiinet | `skiinet.com` — qué es, para quién, pricing, demo, contacto |
| 8.5 | Demo interactiva | Tenant "demo" con datos realistas, acceso libre, reset diario |
| 8.6 | Onboarding self-service | Nuevo negocio se registra → elige módulos → configura → listo en 15 min |
| 8.7 | Docs/Help center | Guías por módulo, FAQs, vídeos cortos |

---

## 📅 Roadmap Estimado

```
Semana 1 (May 1-4):   Fase 1 (limpieza) + Fase 2 (leads)
Semana 2 (May 5-9):   Fase 3 (facturación) + Fase 4 (portal profesor)
Semana 3 (May 12-16): Fase 5 (interconexión) + Fase 6 (infra)
Semana 4 (May 19-23): Fase 7 (testing) + Fase 8 (storefront + landing)
```

**Total estimado: 4 semanas hasta SaaS vendible.**

---

## 🔑 Decisiones Pendientes (necesito tu input)

1. **GHL:** ¿Mantenemos la integración GHL como add-on o la eliminamos completamente en favor de leads nativos?
2. **Pricing SaaS:** ¿Qué planes? Sugerencia: Starter €49/mes (3 módulos), Pro €99/mes (todos), Enterprise custom.
3. **Primer cliente:** ¿Skicenter sigue siendo el primer tenant real? ¿Hay otros prospectos?
4. **Stripe vs Redsys para suscripciones:** Stripe Billing es más fácil para suscripciones SaaS. Redsys solo para pagos de clientes finales del tenant.
5. **Dominio:** ¿`skiinet.com`? ¿`skiinet.es`? ¿Ambos?
6. **Prioridad real:** ¿Qué módulo/fase es el que más urgencia tiene para ti ahora mismo?
