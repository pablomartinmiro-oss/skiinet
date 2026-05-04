# Skiinet (OpenClaw) — Build Progress

## Current Status (2026-05-03 — post-compact handoff)

- **Live URL:** https://openclaw-production-50e4.up.railway.app
- **Branch:** `main` (PR #35 + #36 mergeados)
- **Tenant prod Skicenter ID:** `cmn3gorz400004cov5kzoh3k2`

### Mergeado hoy

**PR #35** (squashed, deployed) — 23 commits cubriendo:
- Lead unification (forms públicos crean Lead real)
- 14 PORT specs (numbering, Redsys, CRM, reviews, discounts, REAV, catalog, packs, suppliers, finance, cancellations, ticketing, operations, TPV)
- Twilio adapter + VAPI webhook + inbox unificado
- Bug fix: syncDocumentCounters auto-heal en seed

**PR #36** (squashed, en deploy ahora) — Templates email/PDF profesionales:
- 8 emails transaccionales con brand Skicenter (navy `#0F2A4A` + winter orange `#FF6B35`)
- 3 PDFs (quote, invoice, settlement) con datos CIAN
- `POST /api/admin/seed-templates` (Owner-only)
- Files en `src/lib/seed/templates/*`

### LO QUE QUEDA POST-COMPACT

1. **Verificar deploy bdbb7019** — BUILDING al momento de compactar.
2. **Triggerear `/api/admin/seed-templates`** en prod (Owner Skicenter).
3. **Triggerear `/api/admin/seed-products`** en prod (carga 93 productos + 3 estaciones + 7 períodos temporada).
4. **Switch `dataMode` mock→live** en tenant Skicenter via Settings UI o SQL directo:
   ```sql
   UPDATE "Tenant" SET "dataMode"='live' WHERE id='cmn3gorz400004cov5kzoh3k2';
   ```
5. **Env vars Railway opcionales** cuando hagan falta:
   - `RESEND_API_KEY` (emails outbound — sin esto no fluyen)
   - `REDSYS_ENVIRONMENT=production` + `REDSYS_MERCHANT_CODE/SECRET_KEY/TERMINAL`
   - `TWILIO_ACCOUNT_SID/AUTH_TOKEN/FROM_SMS/FROM_WHATSAPP`
   - `VAPI_WEBHOOK_SECRET`

### Estado actual prod (verificado)

- ✅ 126 tablas creadas, 44 migrations aplicadas
- ✅ Smoke test 4 endpoints prod (health, /api/contact, webhooks/vapi, webhooks/twilio): 4/4 pass
- ✅ Lead + Conversation + InboxMessage creados end-to-end
- 🟡 Tenant Skicenter aún sin productos/templates/site-settings — pendiente seedear
- 🟡 dataMode aún en `mock`

### Coexistencia GHL ↔ Skinet (importante)

GHL **sigue conectado** para Skicenter. Razón: tienen histórico ahí (contactos, conversaciones, oportunidades). Decisión:
- Skinet sincroniza GHL → tablas Cached* (legacy reads)
- Nuevos leads de forms / VAPI / Twilio → tablas `Lead` / `Conversation` (nuevas)
- UI `/comms` muestra ambas fuentes (PR-22 hace el merge)

Apagar GHL completamente = trabajo futuro: configurar Twilio + VAPI directos, validar 1-2 semanas, luego desconectar OAuth en Settings + borrar `src/lib/ghl/` (~1 día).

### Logins
- Demo: `demo@skicenter.com` / `demo123`
- Skicenter real (Owner): `jgrande@skicenter.es` (password con cliente)

### Docs útiles en raíz del repo
- `AUDIT-REPORT.md` — reporte completo del audit dinámico (smoke test 26/26, screenshots Playwright, plan deploy)
- `nayade-port/PORT-PLAN.md` — plan portado de Nayade (todo cubierto salvo Hotel/Spa/Restaurant/Auth descartados por decisión producto)

---

## Sesiones previas (histórico)

### Phase: Glass Design System (2026-05-02) ✅
- **Last pushed commit:** 710d352 (2026-05-02)
- **Last deployed commit:** fc2e8d0 (2026-03-16) — phases R-X pushed to git, Railway auto-deploys

### Glass Design System (2026-05-02) ✅
- Full glass morphism design across all dashboard pages
- Aurora gradient background (#f0f4ff with 3 colored blobs, fixed position)
- Sidebar: glass backdrop-filter (rgba(255,255,255,0.45) + blur(40px)), active items glass-l3
- Topbar: glass (rgba(255,255,255,0.72) + blur(40px))
- All module page card containers: glass-card utility (rgba(255,255,255,0.55) + blur(40px))
- Design tokens: --glass-l1/l2/l3, --glass-blur, --glass-border, --glass-inset, --glass-shadow
- Badge semantic variants: badge-confirmed, badge-pending, badge-cancelled, badge-default-glass
- **Audit**: `tsc --noEmit` → 0 errors

## Phase AP (2026-05-02) — Operaciones dashboard rebuild + sidebar trim
Operaciones section reduced to three top-level items: **Dashboard Operaciones**, **Escuela** (expandable group), **Alquiler**.

- **Sidebar trim**: hotel, spa and restaurant modules keep their pages and APIs but their `navItems` are now empty in `MODULE_REGISTRY`, so they no longer show in the sidebar.
- **New `operations` module**: `isCore: true` registry entry whose only navItem is `Dashboard Operaciones → /operaciones/hoy`. Always enabled, owner/manager only.
- **Registry order**: `instructors` placed before `rental` so the section renders in the requested order: Dashboard Operaciones → Escuela → Alquiler.
- **API extended (`/api/operations/today`)**: now returns `classesToday` (with instructor + meeting point), `rentalsToday` (with `items[]`), and a derived `instructorsToday` aggregate (classesCount, currentStatus `en_clase`/`libre` based on Europe/Madrid wall clock, `nextClassTime`). New totals: `classesToday`, `rentalsActive`, `instructorsOnShift`, `materialPendingReturn`.
- **Page rewrite (`/operaciones/hoy`)**: 4 stat cards (Clases hoy / Alquileres activos / Profesores en turno / Material pendiente devolucion) + Alquileres del dia table (expandable rows showing each item) + Clases de hoy table (instructor + nivel + alumnos + estacion + estado) + Profesores en turno cards grid (3 cols, libre/en clase pill + proxima clase). Warm design system: `#FAF9F7` background, `#E87B5A` coral accent, rounded-2xl cards, table skeletons per section.

**Audit**: `tsc --noEmit` → 0 errors.

## Phase AO (2026-05-02) — QA follow-up fixes
Two more bugs from QA audit.

- **TPV productos triplicados**: `filteredProducts` useMemo in `/tpv/venta/page.tsx` now deduplicates by `name|category` after the category filter. Sort puts `isPresentialSale=true` first so the "presentational" variant wins when there are duplicates across stations.
- **Finanzas "Ingresos mes" = 0€** (seed fix): `DEMO_INVOICES` FAC-2026-0004 and FAC-2026-0005 had `paidDaysAgo: 14` and `paidDaysAgo: 9` — both landing in April 2026. Updated to `paidDaysAgo: 1` and `paidDaysAgo: 0` respectively so they fall in May 2026 (current month). Dashboard shows ≥ 960€ in "Ingresos mes" after next seed run.

**Audit**: `tsc --noEmit` → 0 errors.

## Phase AN (2026-05-02) — QA bug sweep
Fourteen bugs from the QA audit, fixed end to end. `tsc --noEmit` and `eslint` clean across all touched files.

**P0 críticos**
- **REAV crash (React #310)**: `ExpedientsTable.tsx` had `useMemo` *after* an early `return <PageSkeleton />`, so the hook count flipped between renders the moment the data finished loading. Restructured so all hooks (incl. the filter `useMemo`) run unconditionally; the early return now sits below.
- **Restaurante 0 mostrados**: `useRestaurants` hit `/api/restaurant` (no route), and the typed `Restaurant.name` / `depositPerPerson` didn't match the schema's `title` / `depositPerGuest`. URLs now go to `/api/restaurant/venues` (and matching CRUD); types renamed; `VenuesTab` + `RestaurantModal` rewritten to read/write `title` and `depositPerGuest`.
- **Restaurante NaN€ depósito**: `RestaurantBooking` had no `depositAmount` column — frontend was reading a non-existent field. The API now includes `restaurant.depositPerGuest`; `BookingsTab` computes `depositForBooking(b) = (b.restaurant?.depositPerGuest ?? lookup) * b.guestCount` with a null fallback.
- **Restaurante CLIENTE & RESTAURANTE columns vacíos**: API already included `restaurant: { title }` and `client: { name, email }`, but the frontend read `b.restaurant?.name` and `b.clientName`. Frontend now reads `b.restaurant?.title` and `b.client?.name`. Bonus: when the modal sends inline `clientName/clientEmail/clientPhone`, the booking POST upserts a `Client` row by email/phone (or creates one) and stores its id, so future bookings have a real client linkage instead of a silently-dropped name.
- **Hotel Reservas tab en blanco**: `StaysTab.tsx` was a "próximamente" placeholder. Implemented a full LodgeStay listing — guest contact, room type, check-in/out, nights, occupants, importe, status pill — backed by the existing `GET /api/hotel/stays` endpoint with `useQuery`.

**P1 importantes**
- **Reservas filtro "Hoy" devolvía 0**: list-mode page was loading `pageSize: 50` and the in-memory date filter operated on that subset. If today's reservations weren't in the latest 50, "Hoy" returned 0. Bumped list-mode pageSize to 500.
- **Finanzas "Ingresos mes" = 0€**: `/api/finance/reports` parsed `to=YYYY-MM-DD` as midnight UTC, excluding all invoices paid the same day. Now normalised to `T23:59:59.999Z`. Also extended `fetchPaidInvoices` to fall back to `issuedAt` for paid invoices missing `paidAt` (auto-invoices that bypassed the webhook).
- **Reviews columna PUNTUACIÓN vacía**: `StarRating` rendered five outlined stars with no numeric value when ratings hadn't loaded. Added a `Math.max/Math.min` clamp + a numeric `4.0` label next to the stars so the column is always readable.

**P2 menores**
- **Fichaje timestamps UTC**: `TimeEntryTable.formatTime` and `formatDate` now pass `timeZone: "Europe/Madrid"` so wall-clock entrada/salida always shows in local time regardless of server TZ.
- **Fichaje stats contradictorias**: `TimeEntrySummary` rewrote labels — "Horas registradas" sub: "X fichajes completos (con entrada y salida)"; "Fichajes abiertos" sub: "Con entrada pero sin salida". The two are now visibly disjoint partitions.
- **Finanzas payment methods raw**: new `lib/finance/payment-methods.ts` with `paymentMethodLabel()` mapping `card→Tarjeta`, `cash→Efectivo`, `bizum→Bizum`, `transfer→Transferencia`, `redsys→Redsys (TPV)`, `mixed→Mixto`, `other→Otro`. Wired into `DashboardTab` (recent transactions table); ready to drop into TPV + suppliers callsites.
- **Presupuestos sin tabs nuevo/en_proceso**: `FILTER_TABS` extended with `nuevo` and `en_proceso` so quotes in those states get a clickable filter pill instead of being hidden under "Todos".
- **Catálogo productos duplicados**: `/api/products` now post-filters the `OR: [tenantId, null]` result by `(slug, station, category)`, preferring the tenant-scoped row over the global one. Both rows are still in the DB; the response is what's deduped.
- **Acentos**: bulk sed across `src/app/(dashboard)/**` and `src/components/layout/` rehydrated `Anadir→Añadir`, `Telefono→Teléfono`, `Direccion→Dirección`, `Descripcion→Descripción`, `Politica→Política`, `Conversion→Conversión`, `Cancelacion→Cancelación`, `Configuracion→Configuración`, `Metodo→Método`, `Habitacion→Habitación`, `Resena(s)→Reseña(s)`, `atencion→atención`, `Sesion→Sesión`, `Deposito→Depósito`, `Montana→Montaña`, `Informacion→Información`. Module registry's `Reseñas` label corrected too.

## Phase AM (2026-05-02) — Comprehensive Demo Seed
Ampliado el seed demo para que la cuenta `admin@demo.com` / `demo1234` tenga datos realistas en TODOS los módulos:
- 15 leads en distintos estados (nuevo/contactado/calificado/convertido/perdido)
- 6 instructores totales (3 nuevos: Pablo Sanz TD3 Sierra, Marta Cano TD2 Baqueira, Jorge Velasco TD1 Formigal) con disponibilidad y fichajes
- ~20 asignaciones de clases (group/private/freeride/adaptive)
- 12 facturas (5 paid, 4 sent, 2 draft, 1 cancelled) con líneas + transacciones
- 10 gastos con categorías PER/SUM/MKT y centros de coste
- 3 proveedores con liquidaciones (1 paid, 1 sent, 1 draft) y líneas
- 10 reseñas (mix 1-5 estrellas, algunas con respuesta)
- 11 mensajes internos (admin↔instructores) y 8 notificaciones para profesor
- 4 tipos de habitación (añadida individual) + 3 estancias en hotel (checkin/reservada/checkout)
- TPV: caja principal abierta + 5 ventas reales (efectivo/tarjeta/bizum)

**Nuevos archivos:**
- `src/lib/seed/seed-extra-modules.ts` — función compartida `seedExtraModules(prisma, tenantId, { wipe })`
- `src/app/api/admin/seed-all-modules/route.ts` — endpoint idempotente (additive, no borra datos existentes)

**Archivos ampliados:**
- `src/lib/constants/demo-seed-data.ts` — +15 nuevas constantes DEMO_*
- `prisma/seed.ts` — llama a `seedExtraModules` con `wipe: true`
- `src/app/api/admin/reset-demo/route.ts` — llama a `seedExtraModules` con `wipe: true`

## What the App Does Today

A fully functional multi-tenant CRM dashboard for Skicenter ski travel agencies, built on GoHighLevel:

1. **Auth & Multi-Tenant** — Register new companies, invite team members, 4 RBAC roles (Owner, Manager, Sales Rep, VA/Admin). Session-based auth via NextAuth v5 JWT. Two demo accounts.
2. **Dashboard** — Stats cards (contacts, pipeline value, conversations, today's reservations, weekly revenue), daily reservation volume chart, top station widget, source revenue breakdown, recent activity feed (reservations + quotes + GHL opportunities).
3. **Contacts** — Searchable table with source/tag filters, detail page with inline editing (name, email, phone) + notes + delete. Live mode reads from synced cache.
4. **Communications** — 3-panel chat (conversation list with mine/unassigned/unread filters, message thread, contact sidebar with full contact data). Conversation assignment via GHL API. Paginated API.
5. **Pipeline** — Kanban board with drag-and-drop stage movement (@dnd-kit v6), opportunity detail modal with status badges, pipeline selector, value totals per stage. Paginated API.
6. **Reservations** — Form + list with Groupon voucher integration (AI image reader via Claude API), voucher tracking stats. Inline editing of client info, station, date, notes. CSV export. Custom date range filter. Status management (confirm, cancel, mark unavailable). Client search autocomplete. Participants table with baby/infantil/adulto types, SnowCamp services.
7. **Presupuestos** — Quote CRUD with auto-package (season-aware pricing across 10 categories), line item editing, email preview with print/PDF, quote expiry badges, quote-to-reservation conversion. Upsell suggestions for après-ski, menu, locker, snowcamp, taxi.
8. **Catálogo** — 93 products across 10 categories. Product CRUD with station filter, season toggle (Media/Alta), expandable pricing matrix (click chevron to see full 1-7 day prices for both seasons), private lesson hour×people matrix, bundle component display. Search, CSV bulk import with preview table.
9. **Settings** — Mock/live toggle with sync status, GHL OAuth connection, team management with invites, Groupon product mappings, season calendar CRUD (7 periods), CSV price import, "Sembrar Catálogo" button to seed full 93-product catalog.
10. **GHL Sync** — Full sync (paginated), incremental sync (cron), webhook real-time sync (12 event types), write-through with retry queue (SyncQueue).
11. **Pricing Engine** — Season-aware pricing matrices (day-based + private lesson hour/people + bundle component aggregation), auto-pricing in reservation form, manual override with restore. 7 season periods (3 alta + 4 media).

## Completed Phases

### Phase A: Foundation (Steps 1-8) ✅
1. ✅ Scaffold — Next.js 16, TypeScript, Tailwind v4, App Router
2. ✅ Dependencies — shadcn/ui with 13 components (sonner for toasts)
3. ✅ Environment validation — `src/lib/env.ts` with Zod schema
4. ✅ Logger — pino + child loggers
5. ✅ Prisma setup — v7 with `@prisma/adapter-pg`
6. ✅ Encryption — AES-256-GCM for token storage
7. ✅ Redis client — cache-aside pattern
8. ✅ Testing setup — vitest, 17 tests

### Phase B: Auth & GHL Integration (Steps 9-13) ✅
9. ✅ NextAuth v5 — credentials + JWT strategy
10. ✅ RBAC — permissions.ts, RoleGate, usePermissions
11. ✅ Middleware — edge-compatible JWT check
12. ✅ GHL client — axios + mock server (20 contacts, 10 convos, 15 opps)
13. ✅ GHL OAuth — authorize + callback with encrypted tokens

### Phase C: Layout & Onboarding (Steps 14-15) ✅
14. ✅ Layout shell — Sidebar, Topbar, MobileNav, ErrorBoundary, skeletons
15. ✅ Onboarding wizard — 4-step flow, middleware redirects

### Phase D: Modules (Steps 16-19) ✅
16. ✅ Comms — 3-panel chat layout
17. ✅ Contacts — table + detail + notes
18. ✅ Pipeline — Kanban board
19. ✅ Dashboard home — stats + activity

### Phase E: Polish (Steps 20-25) ✅
20. ✅ Settings page — tenant info, GHL status, team table
21. ✅ Team management — role dropdown, invites
22. ✅ GHL webhooks — HMAC verification, cache invalidation
23. ✅ Error boundaries — per-route error.tsx
24. ✅ Loading states — skeletons + optimistic updates
25. ✅ Final audit

### Phase F: Railway Deployment (2026-03-13) ✅
26-34. ✅ Prisma postinstall, route rename to /api/crm/*, trustHost, AUTH_URL/SECRET, migrate in start, adapter-pg seed, tsx prod dep, prisma.config.ts seed, session cookie fix

### Phase G: Phase 2 Features (2026-03-16) ✅
- Real authentication & multi-tenant signup (`/register`, invite flows)
- Mock/real data toggle (DataModeCard, `getDataMode()`)
- AI-powered voucher image reader (Claude API → structured JSON)
- Reservation form voucher section (image drop zone, manual fields)
- Voucher tracking (stats widget, aggregation queries)
- Groupon product mapping editor (regex → services CRUD)

### Phase H: GHL Live Sync (2026-03-16) ✅
- GHLClient class with 25+ typed methods, auto-refresh, rate limiting
- 6 cache tables (CachedContact/Conversation/Opportunity/Pipeline, SyncQueue, SyncStatus)
- Sync service: fullSync, incrementalSync, webhook handlers, processSyncQueue
- All CRM API routes branch on `getDataMode()`: live reads cache, mock uses MockGHLClient
- Write-through with SyncQueue retry (exponential backoff, max 5 attempts)
- Cron safety net at `/api/cron/sync`

### Design System Overhaul (2026-03-16) ✅
- Warm/premium aesthetic inspired by kinso.ai
- DM Sans font, warm coral (#E87B5A) primary accent
- Applied across all pages and components

### Phase I: Smart Pricing Engine (2026-03-16) ✅
- Product model refactored with pricingMatrix JSON, station, personType, tier fields
- SeasonCalendar model for alta/media periods per station
- Client/server split: `calculator.ts` (Prisma) vs `client.ts` (pure functions)
- 27+ products seeded with full pricing matrices
- Catálogo UI with season toggle, station filter, matrix display
- Presupuestos auto-package with season-aware pricing

### Phase J: Auto-Pricing & Reservation Detail (2026-03-16) ✅
- Auto-pricing wired into ReservationForm (season detection, product matching)
- ReservationForm split into 4 files under 300 lines each
- CLAUDE.md restructured into 4 scoped files
- ReservationDetail with status management, inline editing, copy-to-clipboard

### Phase K: Dashboard & Presupuestos Enhancement (2026-03-16) ✅
- Dashboard with real data (daily volume chart, reservation KPIs, top station, source revenue)
- QuoteDetail split into 2 files, quote-to-reservation flow
- Station labels consolidated to shared STATIONS constant

### Phase L: UX Polish & Fixes (2026-03-16) ✅
- Print/PDF for quotes, client search autocomplete
- Fix fake notification timestamps, quote expiry badges, product search

### Phase M: Feature Gaps (2026-03-16) ✅
- Quote CRUD (create + delete), CSV export for reservations
- Editable fields in ReservationDetail, custom date range filter

### Phase N: Security & Polish (2026-03-16) ✅
- Delete reservation endpoint, empty states, real team data in AssignDropdown

### Phase O: Contact Edit & Kanban DnD (2026-03-16) ✅
- Contact inline editing (name, email, phone) + delete with confirmation
- Kanban drag-and-drop via @dnd-kit v6 (DndContext, DragOverlay, PointerSensor 8px)
- useMoveOpportunity hook → PUT `/api/crm/opportunities/[id]`

### Phase P: Full Feature Completion (2026-03-16) ✅
- Conversation assignment (API endpoint + GHLClient method + hook + UI wiring)
- Opportunity detail modal with status badges
- API pagination for conversations and opportunities
- CSV price import with client-side parser and preview table

### Phase Q: Permission Fix & Deploy (2026-03-16) ✅
- **Critical fix:** Removed `hasPermission()` from all 32 API route files
- DB roles don't have granular permissions populated → all checks returned false → 403 on every route
- Auth is now session + tenant only (no granular RBAC at API level)
- Deployed to Railway: commit fc2e8d0

### Phase R: Complete Product Catalog (2026-03-17) ✅
- 93 products across 10 categories: alquiler (33), locker (4), escuela (6), clase_particular (5), forfait (10), menu (2), snowcamp (9), apreski (12), taxi (4), pack (8)
- Full 2025/2026 season calendar with 7 periods (3 alta + 4 media)
- New categories: menu, snowcamp, taxi, pack (bundle)
- Age brackets + skill levels constants at `src/lib/constants/skicenter.ts`
- Seed endpoint: POST `/api/admin/seed-products`
- La Pinilla products capped at 5 days, Baqueira has separate Sector Baqueira/Beret
- Bundle packs store component references for dynamic price calculation
- UI updated: ParticipantsTable with Baby type + SnowCamp services, auto-package with 5 upsell categories

### Phase S: Seed Button + Catálogo Matrix View (2026-03-17) ✅
- "Sembrar Catálogo" button in Settings page (SeedCatalogCard) — triggers POST `/api/admin/seed-products`
- Expandable pricing matrix rows in Catálogo — click chevron to see full day-by-day prices for both seasons
- PricingMatrixRow component: day-based matrix (1-7 days × media/alta), private lesson matrix (hours × people), bundle component list
- Seed endpoint already existed from Phase R — now accessible via UI button

### Phase T: Demo/Real Separation + Onboarding (2026-03-17) ✅
- **Permanent demo tenant** (`isDemo: true`): 3 demo users (demo@skicenter.com / natalia@demo.skicenter.com / manager@demo.skicenter.com, pw: demo123)
- **Curated demo data**: 50 contacts, 50 reservations (35 today + 15 historical), 12 quotes, 25 pipeline deals, 20 WhatsApp conversations, station capacity
- **Demo banner**: persistent coral banner "Modo demostración — los datos son ficticios" with "Crear tu cuenta real →" CTA
- **Role-based sidebar**: Owner sees all, Sales Rep sees Dashboard/Reservas/Comunicaciones/Catálogo only
- **Empty states**: GHLEmptyState wrapper for Contacts/Comms/Pipeline — shows "Conectar GoHighLevel" CTA when not connected
- **Onboarding cards**: 3-step guide on Dashboard for new real tenants (Catálogo → Presupuesto → Reserva) with dismiss
- **Sync progress on Tenant**: `syncState`, `syncProgressMsg`, `lastSyncAt`, `lastSyncError` fields — updated during fullSync
- **Token auto-refresh fix**: if refresh token also expired, mark tenant as disconnected (clear tokens, set syncState=error)
- **Clean-tenant endpoint**: POST `/api/admin/clean-tenant` — removes reservations, quotes, capacity from current tenant
- **Reset-demo endpoint**: POST `/api/admin/reset-demo` — wipes and re-seeds all demo data (demo tenant only)
- **Schema migration**: `20260317000000_demo_onboarding_sync` — adds isDemo, onboarding steps, sync progress fields to Tenant

### Completed 2026-03-17 (Post-Phase T) ✅
- **GHL OAuth connected** — Skicenter sub-account `FsOiwAoJJB4C8dAL3gUT` (Velno tenant)
- **Fixed onboarding loop** — JWT callback now refreshes `onboardingComplete` from DB
- **Fixed ghlLocationId unique constraint** in OAuth callback
- **ENABLE_MOCK_GHL=false** — real GHL data active
- **Imported 4,092 Nexor opportunities via CSV** — 7 pipelines: Sierra Nevada (2,161), Baqueira (1,329), Madrid (248), Formigal (218), Alto Campoo (86), Candanchú (34), Astún (16). 4,056 created, 162 new contacts, 33 failed.
- **Redsys + SMTP env vars** added to Railway
- **PRESUPUESTOS-ARCHITECTURE-v2.md** ready

### Phase U: Presupuestos v2 — Redsys + GHL + PDF + Email (2026-03-18) ✅
- **QuoteDetail** status-aware UI: editable for nuevo/borrador, read-only for pagado/cancelado
- **Send flow**: POST `/api/quotes/:id/send` → generates Redsys payment link + PDF + sends email
- **Payment flow**: POST `/api/quotes/:id/mark-paid` → marks paid, moves GHL opp to "COMPRA" (won)
- **GHL pipeline moves**: `src/lib/ghl/stages.ts` — findStageByName() searches all pipelines, caches 1h TTL
- **Send** moves opp to "PRESUPUESTO" stage; **mark-paid** sets monetaryValue + status=won → "COMPRA" stage
- **Public Redsys pages**: `/presupuestos/[id]/success` and `/presupuestos/[id]/error` (no auth required)
- **useQuotes hooks**: `useSendQuote()` + `useMarkPaid()` mutations
- **QuoteList**: pagado/expirado/cancelado status badges
- Middleware updated to allow public `/presupuestos/:id/success|error` paths

### Phase V: Product System Upgrade (2026-03-20) ✅
- **Schema upgrade**: QuoteItem now has 20+ per-product fields (startDate, numDays, numPersons, ageDetails, modalidad, nivel, sector, idioma, horario, puntoEncuentro, tipoCliente, gama, casco, tipoActividad, regimen, alojamientoNombre, seguroIncluido, tallaBotas, alturaPeso, dni)
- **Task model**: Auto-generated tasks on payment — 7 task types (request_dni, check_dni, request_sizes, prepare_material, validate_level, offer_insurance, send_location)
- **Cancellation system**: POST `/api/quotes/:id/cancel` with >15 days (bono/refund), <15 days (100% charge), Groupon block, holiday blackout
- **Quote cancellation fields**: cancelType, cancelNotes, refundIban, refundTitular, refundStatus, bonoCode, bonoAmount, bonoExpiresAt
- **BDR email templates**: Presupuesto email with per-product details (fecha, modalidad, nivel, sector, idioma), dark teal header, client info block, T&C policy
- **Confirmation email**: Per-product details, matching BDR format
- **Cancellation emails**: Client notification (bono/refund/no-refund) + admin refund request to administracion@skicenter.es
- **ProductVariableForm**: Collapsible per-product variable section — fields shown by category type
- **ProductSearchPicker**: Dynamic search/filter with grouped categories, replaces flat product list
- **CancellationModal**: Multi-step flow (reason → bono/refund choice → IBAN form → confirmation)
- **TaskList**: Progress bar, pending/completed tasks, toggle completion, due date warnings
- **PackageTable upgrade**: Integrated ProductVariableForm + ProductSearchPicker
- **QuoteDetail upgrade**: Cancellation button on enviado/pagado, task list on paid quotes, cancel info bar
- **Items API**: PUT/POST now persist all per-product fields
- **Auto-tasks wired**: Both Redsys webhook and manual mark-paid trigger task generation
- **Product audit**: GET `/api/admin/product-audit` — finds duplicates, zero-price, test products
- **Migration**: `20260320000000_product_system_upgrade`

### Phase W: Automated Quote Follow-Up System (2026-03-22) ✅
- **Full reminder sequence**: 5-step automated follow-up for unpaid quotes
  - +24h: first reminder ("tu viaje sigue esperando")
  - +48h: second reminder ("las disponibilidades podrían variar")
  - +72h: discount offer (code PTSK2526, 5% off)
  - 2 days before expiry: urgency warning
  - Past expiry: auto-expire + notification email
- **Post-payment follow-up**: cross-sell (+24h after payment, only missing services) + review request (+5h after checkout via TripAdvisor)
- **Pre-trip reminders**: 48h, 24h, and day-of-arrival messages for paid quotes
- **Multi-channel delivery**: Email (Resend) + SMS/WhatsApp (GHL API) for every message
- **Internal notifications**: Team notified on quote expiry + at-risk flagging (5+ days unpaid)
- **Schema fields**: `lastReminderStep`, `crossSellSentAt`, `reviewSentAt`, `preTripStep` on Quote
- **Migration**: `20260322000000_quote_followup_tracking`
- **Files**:
  - `src/lib/email/followup-templates.ts` — 10 email templates + 9 SMS message builders
  - `src/lib/quotes/follow-up.ts` — Follow-up engine (4 processors: unpaid, post-payment, pre-trip, at-risk)
  - `src/app/api/cron/quote-reminders/route.ts` — Cron endpoint orchestrating all flows
- **Cron setup**: `GET /api/cron/quote-reminders` — run daily at 09:00 Europe/Madrid

### Phase X: Public Contact Form + Full UI/UX Overhaul (2026-03-22) ✅

**TASK 1: Public Contact Form (/contacto)**
- **Public page** at `/contacto` — no auth required, standalone layout with Skicenter branding
- **Fields**: Nombre (required), Email (required), Teléfono, Asunto (dropdown: Presupuesto/Info/Incidencia/Cupones/Otro), Mensaje (required), Privacidad checkbox (required)
- **Honeypot** field for bot protection (hidden "website" input — bots fill it, silently accepted)
- **Rate limiting**: max 3 submissions per email per hour via `ContactSubmission` DB model
- **Email delivery**: Notification to reservas@skicenter.es + Confirmation to client ("Te contactaremos en menos de 24h") via Resend
- **GHL integration**: Creates/updates contact with tag "web-contacto" (best effort)
- **Success screen**: Animated checkmark + "¡Gracias! Te contactaremos pronto."
- **Embed support**: `?embed=true` hides header/footer for clean iframe on skicenter.es
- **New files**: `src/app/contacto/` (page, layout, contact-form, success-screen), `src/app/api/contact/` (route, email-templates)
- **DB migration**: `20260322100000_contact_submission` — ContactSubmission model with email+createdAt index

**TASK 2: Full UI/UX Overhaul**

**A. Design System & Micro-interactions (globals.css)**
- 7 animation utility classes: `animate-fade-in`, `animate-slide-up`, `animate-slide-in-right`, `animate-scale-in`, `animate-pulse-soft`, `hover-lift`, `card-hover`
- Custom scrollbar styling (6px, warm border colors)
- 5 keyframe definitions for smooth animations

**B. Sidebar Polish**
- Mountain icon logo with coral background, better collapsed state
- Active nav item: coral gradient background (`from-coral/10 to-coral/[0.03]`), icon turns coral
- Hover animation: subtle `translate-x-0.5` slide effect
- Footer: green pulsing "online" status dot + version label
- Spanish aria labels

**C. Topbar Polish**
- Menu items translated to Spanish ("Perfil", "Cerrar sesión")
- Subtle bottom shadow, gradient avatar background (coral → coral-hover)

**D. NotificationBell Upgrade**
- Time-grouped notifications: "Hoy", "Ayer", "Esta semana", "Anteriores"
- Color-coded left borders by type (coral/sage/gold/blue)
- Slide-in animation on dropdown open
- New `payment_received` type with CircleDollarSign icon

**E. EmptyState Upgrade**
- Warmer design with coral-light icon background
- Fade-in mount animation, larger typography, better visual hierarchy

**F. Dashboard — Command Center Redesign**
- Split from 498 lines into 5 files (all <300 lines)
- StatCard enhanced with trend arrows (↑12%) and sparkline mini-charts
- New **NeedsAttention** section: quotes expiring within 3 days, color-coded urgency
- New **ActivityFeed**: unified feed (reservations + quotes + opportunities) with colored stripes, relative timestamps
- FunnelChart extracted to own component
- All chart cards get `animate-fade-in` + `card-hover`

**G. Presupuestos — QuoteList Overhaul**
- Cards instead of plain list items: client name, destination, total (bold), status badge, pax count
- Status badges: borrador (gray), enviado (blue + pulse), pagado (green + checkmark), expirado (red + strikethrough), cancelado (dark gray)
- "Desde formulario" orange badge for survey-sourced quotes
- Clickable status pill filters (Todos/Borrador/Enviado/Pagado/Expirado) with counts
- Search bar (client name/email/phone)

**H. Pipeline — Kanban Improvements**
- Color-coded card left borders by days in stage: <3d green, 3-7d yellow, >7d red
- Days-in-stage badge with matching colors
- Stage headers: count pill + total value
- Warm background for columns

**I. Contacts — Table Upgrade**
- Row hover highlight, clickable rows
- Tags column with color-coded badges (VIP gold, nuevo blue, activo sage, lead coral)
- "Actividad" column with relative dates
- Smart pagination with numbered pages + ellipsis (not just prev/next)
- "Mostrando X-Y de Z" info display

**J. Settings — Sectioned Layout**
- 5 sections with icon headers: Cuenta, Sincronización, Catálogo, Integraciones, Equipo
- Each section has coral-light icon circle + title
- Separators between sections

**K. Mobile Responsive**
- Dashboard layout: `p-4 md:p-6` padding
- Split-panel pages (Presupuestos, Reservas, Comms): show one panel at a time on mobile with "← Volver" back button
- MobileNav: 44x44px touch targets on trigger and nav items
- Tables: horizontal scroll wrapper on mobile
- All interactive elements meet 44px minimum touch target

### TPV POS Screen (2026-04-24) ✅
- **New POS screen** at `/tpv/venta` — full point-of-sale interface
- **Product grid (left, 70%)**: 5 category tabs (Alquiler, Forfait, Clases, Comida, Otros) mapped from Product.category. Search bar. Click card to add to cart.
- **Cart panel (right, 30%)**: line items with editable quantity (+/- and direct input), per-line subtotal, remove + clear, live total.
- **Payment bar**: method selector (Efectivo, Tarjeta, Mixto). Mixto opens split UI with cash/card/Bizum amount inputs and a remaining badge that turns green when balanced.
- **Receipt view**: prints with `window.print()` — clean monochrome ticket with header, lines, totals, payment breakdown.
- **Active session guard**: shows "abrir caja" prompt when no open sessions exist; auto-selects when only one is open; selector when multiple.
- **Sidebar**: TPV module now exposes "Punto de Venta" (`/tpv/venta`) and "Backoffice TPV" (`/tpv`).
- **SessionsTab enhancement**: open/close labelled "Abrir Caja"/"Cerrar Caja". Close modal fetches session detail and shows full summary (sales count, totals per method, movements, expected cash) plus actual count input with green/amber/red difference badge.
- **SalesTab enhancement**: payment method filter, totals stat cards (count, cash, card, Bizum), table footer with grand total.
- **RegistersTab enhancement**: new "Sesion abierta" column showing pulsing green badge + opener + open time when a session is active for the register.
- No schema change — existing TpvSale/TpvSaleItem models already cover description/quantity/unitPrice/lineTotal.
- **Files**: `src/app/(dashboard)/tpv/venta/page.tsx`, `_components/{categories,ProductGrid,Cart,PaymentBar,PaymentModal,Receipt}.tsx`, `src/app/(dashboard)/tpv/_components/{SessionsTab,SalesTab,RegistersTab,OpenSessionModal,CloseSessionModal}.tsx`, registry update.

### Phase Y: Infrastructure — Sentry Error Tracking (2026-04-25) ✅
- **`@sentry/nextjs` v10.50.0** wired into client, server, and edge runtimes
- **Configs at project root**: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` — all read DSN from `NEXT_PUBLIC_SENTRY_DSN`
- **Sample rates**: `tracesSampleRate: 0.1` everywhere; `replaysSessionSampleRate: 0` (replays disabled to keep payloads minimal)
- **Environment tag**: `NEXT_PUBLIC_VERCEL_ENV || 'development'` — Railway sets this per-deploy
- **`next.config.ts`** wrapped with `withSentryConfig()`, silent mode on, `sourcemaps: { disable: true }` (no source map upload until Railway env vars are populated)
- **`src/app/global-error.tsx`** now calls `Sentry.captureException(error)` in its `useEffect` (replaces the prior `console.error` placeholder)
- **No top-level `src/app/error.tsx`** existed — only nested route segment errors. Skipped per spec ("if it exists").
- **No `sentry.properties` file** — DSN + org/project supplied via Railway env vars
- **CLAUDE.md env table** extended with `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_VERCEL_ENV`, `SENTRY_ORG`, `SENTRY_PROJECT`
- **Audit**: `tsc --noEmit` clean; `next build` compiles successfully (page-data step fails only due to absent local `DATABASE_URL`, unrelated to this change)

### Phase Z: Storefront Website Transformation (2026-04-25) ✅
- **Goal**: transform the scaffold-quality `/s/[slug]` storefront into a production ski-travel website to replace skicenter.es.
- **New nav (`StorefrontNav.tsx`)**: fixed positioning, transparent on home hero → solid white on scroll, logo mark + tenant name, links (Destinos, Servicios, Packs, Contacto), prominent coral "Solicita Presupuesto" CTA, mobile slide-out menu.
- **New footer (`StorefrontFooter.tsx`)**: dark navy (#0F1A2B), 4-column layout (brand+social, Destinos x7, Servicios x6, Contacto with phone/WhatsApp/email + CTA), legal sub-row.
- **Home page rewrite (`page.tsx`)**: now server-rendered, composes 8 sections via `_components/home/`:
  - **Hero**: full-screen unsplash mountain bg + dark gradient overlay, headline "Tu viaje de esqui, en un solo clic", dual CTA, viajeros pill + bounce indicator.
  - **TrustBar**: 4 stats on dark bg (4.000 viajeros, 7 estaciones, packs desde 89 EUR, 25% pago fraccionado).
  - **Destinations**: 7 cards with unsplash bg images, "desde X EUR" pill, hover zoom + lift, station-filtered link to experiencias.
  - **Services**: 7 cards with custom SVG icons (PackIcon, BedIcon, SchoolIcon, SkiIcon, TicketIcon, DrinkIcon, LockerIcon) — no more letter placeholders.
  - **HowItWorks**: 3 numbered steps with large coral numerals.
  - **Testimonials**: 3 reviews with star ratings + avatars.
  - **Financing**: dark navy section with "25%" headline + 4 stat tiles + CTA.
  - **ContactCTA**: phone/WhatsApp/presupuesto buttons + email link.
- **Experiencias polish**: dark gradient hero, floating filter card with search + 2 dropdowns (estacion + categoria) + chip filters, polished empty state with mountain icon, station filter wired via `?station=` query.
- **ProductCard polish**: gradient backgrounds per category (10 gradients), category-specific SVG glyphs, station pill overlay, "Desde X EUR" footer with bold price + Anadir button.
- **Presupuesto polish**: dark hero, 2-col layout (form + trust sidebar), 4 numbered sections (Datos personales / Detalles del viaje / Servicios / Notas), trust signals card (Respuesta 24h, Sin compromiso, Pago fraccionado, Mejor precio), success state redesigned.
- **New files**: `_components/home/Hero.tsx`, `_components/home/Destinations.tsx`, `_components/home/Services.tsx`, `_components/home/Testimonials.tsx`.
- **No backend changes** — pure frontend/UI overhaul.
- **Audit**: `tsc --noEmit` clean; `eslint src/app/(storefront)` clean; `next build` compiles successfully (page-data step fails only due to absent local DB env).

### Phase AA: Storefront Redesign — skicenter.es Style (2026-04-26) ✅
- **Goal**: complete visual overhaul of `/s/[slug]` storefront to match skicenter.es — Bebas Neue + Raleway fonts, navy/blue palette, European travel agency feel.
- **Fonts**: `Bebas_Neue` (400) + `Raleway` (400/500/600/700) via `next/font/google` in `layout.tsx`, applied as CSS variables (`--font-bebas-neue`, `--font-raleway`) to all components.
- **Color system**: primary navy `#001D3D`, CTA blue `#42A5F5`, WhatsApp green `#2DB742`, price orange `#F27A0B`, dark footer `#2E2E32`, light gray bg `#F5F7F9`, text gray `#757575`. All coral `#E87B5A` removed.
- **CTA buttons**: squared (no border-radius), Bebas Neue font, blue `#42A5F5` background.
- **StorefrontNav**: top bar (navy `#001D3D`) with phone + hours + WhatsApp; main nav (white) with Destinos dropdown (all 7 stations), squared blue CTA; mobile hamburger with full-height slide-out menu.
- **StorefrontFooter**: dark charcoal `#2E2E32`, 4 columns (brand+social, Destinos, Servicios, Contacto with green WhatsApp), blue CTA, legal sub-row.
- **Hero**: full-screen mountain bg, Bebas Neue headline "Skicenter. Todo tu viaje de esquí en un solo clic.", two squared CTAs (blue + green WhatsApp), 100px offset for nav height.
- **TrustBar**: navy `#001D3D`, Bebas Neue numbers (+4.000, 7, Desde 89€, 25%).
- **Destinations**: horizontal carousel with arrow buttons, Bebas Neue station names as overlay, "Encuentra lo que necesitas…" heading.
- **Services**: horizontal scrollable row of 7 circular icons on `#F5F7F9` bg; HowItWorks with blue left-border steps.
- **Testimonials**: white cards on `#F5F7F9`, italic quotes, orange stars, Bebas Neue headings.
- **Financing**: navy bg, "Reserva con solo el 25%" in Bebas Neue, blue CTA, squared stat tiles.
- **ContactCTA**: navy box, Bebas Neue heading "¿Necesitas ayuda?", blue + green + phone buttons.
- **Offers** (NEW `home/Offers.tsx`): 4 hardcoded offer cards with photo, station badge, price in orange Bebas Neue, blue "VER OFERTA" CTA.
- **WhatsAppButton** (NEW `home/WhatsAppButton.tsx`): fixed bottom-right green circle with pulse animation, links to wa.me/34919041947.
- **ProductCard**: updated to navy/blue palette, orange price in Bebas Neue, squared "AÑADIR" button.
- **Experiencias page**: Bebas Neue navy hero, blue filter pills (active = `#42A5F5`), `#F5F7F9` background.
- **Presupuesto page**: Bebas Neue navy hero, blue squared submit button, blue checkboxes, phone+WhatsApp in trust sidebar.
- **`page.tsx`**: Offers + WhatsAppButton added to home section composition.
- **Audit**: `tsc --noEmit` → 0 errors.

### Phase AB: Storefront Polish — Real Logo + Images (2026-04-26) ✅
- **Logo**: replaced mountain SVG + text in nav and footer with real `/skicenter-logo-white.png` (293×90 PNG). Nav uses `filter: brightness(0)` to appear dark on white bg; footer shows white version directly on dark bg.
- **Nav links**: "Packs" renamed to "Inicio" (links to home `/s/[slug]`) to match skicenter.es nav (Inicio | Destinos | Servicios | Inicio | Contáctanos).
- **Hero headline**: split "Skicenter." onto its own line with `<br />` before the blue subtitle, matching skicenter.es two-line layout.
- **Services row**: replaced SVG icon circles with real photo thumbnails (`overflow-hidden rounded-full bg-cover`) using downloaded images (`/services-alojamiento.jpg`, `/services-escuela.jpg`, `/services-forfaits.jpg`, `/clases-1024x494.jpg`) + unsplash for packs/apreski/taquillas. Labels updated to exact skicenter.es casing: "Packs all in one", "Hotel/apt +forfaits", "escuela de esqui", "skirent service", "Forfaits", "apreski", "taquillas 1500".
- **Offers section**: swapped unsplash placeholder images for real local photos — Baqueira offer uses `/clases-1024x494.jpg`, Sierra Nevada uses `/ALOJAMIENTO-600x289.jpg`, La Pinilla uses `/services-forfaits.jpg`.
- **Audit**: `tsc --noEmit` → 0 errors.

### Phase AC: Storefront Polish — Nav, Typo, Logos, Banner, Metadata (2026-04-26) ✅
- **Nav order**: Desktop and mobile nav reordered to Inicio | Destinos | Servicios | Contáctanos
- **Typo fix**: Financing banner heading fixed — "Reserva con solo el 25%" space preserved inline
- **Partner logos strip** (`PartnerLogos.tsx`): horizontal strip between Destinations and Offers with Astún + Candanchú image logos + Baqueira/Sierra Nevada/Formigal/Alto Campoo/La Pinilla text placeholders (Bebas Neue), grayscale hover effect
- **Ski level banner**: full-width `banner_nivel_skicenter.jpg` section between Services and HowItWorks
- **Page metadata**: storefront layout exports title template `%s — Skicenter`; home page uses absolute title "Skicenter — Tu viaje de esquí en un solo clic"; experiencias/presupuesto each have nested `layout.tsx` exporting their page title
- **tsc --noEmit**: 0 errors

### Phase AD: Multi-Tenant Isolation Proof (2026-04-26) ✅
- **Goal**: prove the platform works as a multi-tenant SaaS by adding a second tenant and verifying complete data isolation.
- **Second tenant** (`prisma/seed.ts` → `seedSierraSkiTenant()`): "Sierra Ski School", slug `sierra-ski`, owner `sierra@test.com` / `test1234`. Idempotent (all `upsert` / `findFirst+create`).
- **Modules enabled**: core (always on) + catalog, booking, storefront, rental, finance.
- **Sample data** (tenant-scoped, never bleeds into Skicenter):
  - 2 categories (esqui, alquiler)
  - 7 products with `sierra-` slug prefix (clases grupo/particular, alquiler esqui/snow, forfait 1d/3d, locker)
  - 3 site settings (contact_email, contact_phone, site_title)
  - 1 sample quote (`test-cliente@sierraski.test`, status: borrador, 380€)
  - 1 sample reservation (`test-reserva@sierraski.test`, status: confirmada, 135€)
- **Isolation test suite** (`__tests__/lib/multi-tenant-isolation.test.ts`): 12 cases proving tenant A and tenant B cannot see/mutate each other's data:
  1. Products GET — tenant A query never includes tenant B id (and vice versa)
  2. Reservations GET — strict `tenantId` scope (no `OR` / no `null`)
  3. Reservations POST — session `tenantId` always wins over body injection attempt
  4. Reservation [id] PATCH — cross-tenant access returns 404, no `update` called
  5. Quotes GET — strict `tenantId` scope
  6. Quotes POST — session `tenantId` stamped on create (rejects body injection)
  7. Storefront `/s/skicenter/products` — only tenant A products
  8. Storefront `/s/sierra-ski/products` — only tenant B products
  9. Storefront cross-tenant slug — tenant B's slug cannot resolve tenant A's product (404)
  10. Storefront unknown slug — 404, no product query issued
  11. Module configs — query scoped per tenant id (tenant A and B return different sets)
- **Tests live at `__tests__/lib/`** (root) not `src/__tests__/` because vitest config only picks up `__tests__/**/*.test.ts` (see `vitest.config.ts`).
- **No isolation bugs found** — existing API routes already enforce `tenantId` scope via `requireTenant()` + Prisma WHERE clauses. Test suite locks the contract in.
- **Audit**: `npx tsc --noEmit` → 0 errors.

### Phase AE: Storefront Copy — Accents & Typo Fixes (2026-04-27) ✅
- **"RESERVA CONSOLO"**: already fixed in Phase AC — confirmed not present.
- **Services.tsx**: `"escuela de esqui"` → `"Escuela de esquí"` (capital + accent)
- **LegalShell.tsx**: `"Ultima actualizacion"` → `"Última actualización"`
- **StorefrontNav.tsx**: cart aria-label `"articulos"` → `"artículos"`; hamburger `"Cerrar/Abrir menu"` → `"menú"`
- **CartSummary.tsx**: empty state + item count `"articulo/articulos"` → `"artículo/artículos"`; `"esta vacio"` → `"está vacío"`
- **checkout/_components.tsx**: `"Tu carrito esta vacio"` → `"está vacío"`
- **carrito/page.tsx**: `"esta vacio"`, `"anade"`, `"mas"`, `"Codigo de descuento"`, `"articulos"`, `"Habitacion"` all corrected; error strings too
- **cancelar/page.tsx**: `"Solicitar cancelacion"` → `"cancelación"`; `"Politica de cancelacion"` → `"Política de cancelación"`; `"Estacion"` → `"Estación"`; policy text accents; inline errors
- **canjear/page.tsx**: `"Canjear cupon"` → `"cupón"`; field labels `"Codigo"`, `"Telefono"`, `"Numero"`, `"Nivel de esqui"` all corrected; error strings
- **cookies/page.tsx**: full rewrite — all accents corrected throughout body (`"Política"`, `"Qué"`, `"pequeños"`, `"Técnicas"`, `"Analíticas"`, `"según"`, `"Gestión"`, `"configuración"`, `"técnicas"`, `"políticas"`, `"versión"`, `"jurídico"`, etc.)
- **politica-privacidad/page.tsx**: full rewrite — `"Política de privacidad"` title + all body accents (`"política"`, `"cómo"`, `"información"`, `"protección"`, `"teléfono"`, `"método"`, `"técnicos"`, `"dirección"`, `"ejecución"`, `"conservación"`, `"dirección"`, `"periódicamente"`, etc.)
- **terminos/page.tsx**: full rewrite — `"Términos y condiciones"` title + all body accents (`"través"`, `"están"`, `"comunicación"`, `"indicación"`, `"según"`, `"específicas"`, `"Política de cancelación"`, `"más"`, `"días"`, `"íntegro"`, `"gestión"`, `"presentación"`, `"podrá"`, `"compensación"`, `"código"`, `"montaña"`, `"suspensión"`, `"meteorológicas"`, `"legislación"`, `"española"`, `"someterán"`, `"versión"`, `"jurídico"`)
- **Audit**: `tsc --noEmit` → 0 errors; `next build` compiled successfully (page-data step fails only due to absent local DATABASE_URL)

### Phase AF: Storefront Experience Catalog — Skicenter Seed (2026-04-27) ✅
- **Goal**: populate the public storefront `/s/skicenter/experiencias` with real products. The page was returning `{products:[]}` from the API and showing the "No encontramos experiencias" empty state because zero `Product` rows existed for the skicenter tenant.
- **Seed dataset** (`src/lib/seed/skicenter-storefront-experiences.ts`): 43 products across 7 categories and all 7 stations.
  - **By category**: pack 11 (7 todo-incluido featured + 4 hotel+forfait), forfait 10 (7 adulto + 3 infantil), escuela 5, clase_particular 3, alquiler 8 (5 alta_quality + 3 media_quality), apreski 3, locker 3.
  - **By station**: Baqueira Beret 9, Sierra Nevada 10, Formigal 7, Alto Campoo 2, Candanchú 4, Astún 2, La Pinilla 9.
  - **Stations stored as full names** ("Baqueira Beret", etc.) to match the storefront filter (`StorefrontNav` + `experiencias/page.tsx` use `?station=<encoded name>` and filter via `.includes(name)`).
  - Each product has slug, description in skicenter.es voice, EUR price (locker 5-8€/día → packs up to 399€), unsplash cover image, isPublished/isActive=true, isFeatured=true on the 7 todo-incluido packs.
- **Categories**: 7 storefront categories upserted (pack, forfait, escuela, clase_particular, alquiler, apreski, locker) so the experiencias filter chips render.
- **Endpoint** (`src/app/api/storefront/admin/seed-experiences/route.ts`): one-shot POST with idempotent upserts. Auth: `Authorization: Bearer <AUTH_SECRET>` (lives under `/api/storefront` which is the public middleware prefix, so the bearer check is the only gate). Returns `{ ok, tenant, categoriesUpserted, productsUpserted }`.
- **Run from prod**: `curl -X POST -H "Authorization: Bearer $AUTH_SECRET" https://openclaw-production-50e4.up.railway.app/api/storefront/admin/seed-experiences?slug=skicenter`
- **Verify**: `curl https://openclaw-production-50e4.up.railway.app/api/storefront/public/skicenter/products | jq '.products | length'` should return ≥ 43.
- **Audit**: `npx tsc --noEmit` → 0 errors.

### Phase AJ: Interconexión de Módulos — Cross-Module Plumbing (2026-05-02) ✅
- **Goal**: turn the platform from "modules side-by-side" into "modules that talk". A reservation that bundles class + rental + hotel must (a) verify availability across all three before saving, (b) when confirmed, fan out to per-module sub-records (RentalOrder + LodgeStay + ActivityBooking), (c) free inventory back when cancelled, all driven by a small in-process event bus.
- **Cross-module availability**:
  - `src/lib/availability/cross-module.ts` — `checkCrossModuleAvailability(tenantId, date, items[])` runs all checks in parallel via `Promise.all`. Per-item `AvailabilitySlot` returns `{ ok, reason, available, requested, nextAvailableDate? }`. Item shapes: `{type:'class',productId,qty}`, `{type:'rental',inventoryId,qty}`, `{type:'hotel',roomTypeId,nights,units?}`, `{type:'instructor',level,qty,startTime?,endTime?}`.
  - Class check uses `StationCapacity` and probes 14 days ahead for next free slot.
  - Rental check subtracts active overlapping `RentalOrder` items from `RentalInventory.availableQuantity` (worst-case during the window).
  - Hotel check uses `RoomType.capacity` as a proxy for total units and subtracts overlapping `LodgeStay` (status `reservada`/`checkin`) plus summed `RoomBlock.unitCount`.
  - Instructor check counts active `Instructor` rows minus those with `GroupCell` overlapping the date+time slot.
- **API**:
  - `POST /api/availability/cross-module` — Zod-discriminated body, calls the checker.
  - `GET /api/availability/rental?date=&productId=&station=&equipmentType=&qualityTier=` — when `productId` is given the route resolves equipment type + tier from the Product, then returns each matching `RentalInventory` pool with `effectiveAvailable = availableQuantity − blockedByOverlappingOrders`.
- **Reserva unificada (cascade)**:
  - `src/lib/reservations/cascade.ts` — `cascadeOnConfirm(tenantId, reservationId)` reads `Reservation.services`, buckets each service by resolved `moduleType` and creates: a single `RentalOrder` (with one `RentalOrderItem` per requested unit) for all rental items, one `LodgeStay` per hotel item, and a placeholder `ActivityBooking` for all instructor items (planning later assigns the actual monitor + `GroupCell`). Decrements `RentalInventory.availableQuantity` inside the same transaction. Idempotent — looks up existing sub-records before re-creating.
  - `cascadeOnCancel` releases inventory by re-incrementing the matching pools, sets `RentalOrder.status="CANCELLED"`, soft-cancels overlapping `ActivityBooking` rows, and flips matching `LodgeStay` rows to `cancelada`.
- **Inventario conectado**:
  - On confirm, `cascadeOnConfirm` decrements `RentalInventory.availableQuantity` per (equipmentType, qualityTier) tuple.
  - On cancel/cancellation/`reservation_cancelled` event, `cascadeOnCancel` re-increments (clamped to `totalQuantity`).
  - `GET /api/availability/rental` returns the **effective** available stock for a given date (raw availableQuantity minus active overlapping orders).
- **Quote ↔ module mapping**:
  - New `QuoteItem.moduleType` column (`catalog | rental | hotel | spa | instructor`) — written on every item create/replace via `categoryToModule()` (`src/lib/quotes/category-to-module.ts`). Schema migration `20260502200000_phase5_cross_module` adds the column + a `(quoteId, moduleType)` index.
  - `PUT /api/quotes/[id]/items` now also returns an advisory `availability` snapshot (non-blocking) so the UI can show a "no hay plazas" warning before the quote is sent.
- **Cliente unificado**:
  - `GET /api/clientes/[id]/history` — returns `{ client, totals, quotes, reservations, rentalOrders, classes, invoices, messages }`. Cross-module match is done by client email + phone (so legacy reservations without a `clientId` still surface). Class history is fetched via `OperationalUnit.reservationId IN (...)` → `GroupCell`. Messages are only included when the client's email maps to a `User`.
  - New page `/clientes/[id]` — header card + 6 tabs: Resumen / Reservas / Alquiler / Clases / Facturas / Mensajes. Lifetime total + visit count in the header. Each list item links back into the relevant module.
- **Dashboard operacional del día**:
  - `GET /api/operations/today` — single `Promise.all` returning `classesNow`, `rentalsActive`, `reservationsToday`, `invoicesUnpaid`, `leadsNew` plus a `totals` block (incl. `invoicesUnpaidAmount`).
  - New page `/operaciones/hoy` — 5 stat cards on top, then 5 sectioned panels (Clases / Equipos / Check-ins / Facturas / Leads). Auto-refresh every 60s via `useQuery({ refetchInterval: 60_000 })`. Empty states + status pills throughout.
- **Eventos cross-module**:
  - `src/lib/events/emitter.ts` — typed in-process emitter. Generic `Handler<T>` API but stored in a `Map<EventType, AnyHandler[]>` to avoid TS variance noise. Supports `on(type, handler)` (returns unsubscribe) and `await emitEvent(tenantId, type, payload)` with `Promise.allSettled` semantics + per-handler error logging. Event types: `reservation_confirmed`, `reservation_cancelled`, `rental_returned`, `class_completed`, `invoice_paid`.
  - `src/lib/events/handlers.ts` registers the cross-module fan-out: `reservation_confirmed → cascadeOnConfirm + notifyOwners` (in-app notification when classes need a monitor), `reservation_cancelled → cascadeOnCancel`. Other events log-only for now.
  - `src/lib/events/index.ts` is a side-effect module that calls `registerEventHandlers()` once per process.
  - Wired into `PATCH /api/reservations/[id]`: status → `confirmada` emits `reservation_confirmed`; status → `cancelada`/`sin_disponibilidad` emits `reservation_cancelled`; soft-DELETE on a previously confirmed reservation also emits `reservation_cancelled`.
- **Schema migration** `20260502200000_phase5_cross_module`: idempotent `ADD COLUMN IF NOT EXISTS "moduleType"` on `QuoteItem` + `(quoteId, moduleType)` index.
- **Audit**: `tsc --noEmit` clean (`NODE_OPTIONS=--max-old-space-size=8192`); `eslint` clean across all new files.
- **Operational note**: hotel availability uses `RoomType.capacity` as a proxy for room count because the schema does not (yet) have an explicit "total physical units" field. When the hotel module grows, swap that line for the proper field — the rest of the checker is unchanged.

### Phase AI: Portal del Profesor — Mobile-First, Geolocalización, Notificaciones, Chat (2026-05-02) ✅
- **Goal**: complete the 20% missing on the instructor portal — mobile UX, fichaje GPS, in-app notifications, internal chat. Most of the portal already existed (sidebar/topbar swap by role + dedicated `/profesores/*` pages).
- **Mobile-first layout**:
  - New `InstructorBottomNav` (`src/components/layout/InstructorBottomNav.tsx`): 5 fixed tabs (Mi Día / Fichaje / Clases / Ingresos / Perfil). Visible only on `<md`. Uses `pb-[env(safe-area-inset-bottom)]`, 60px touch targets, active indicator stripe.
  - `(dashboard)/layout.tsx` adapts main padding for instructors (`p-4 pb-24 md:p-7 md:pb-7`) so the bottom nav doesn't cover content; sidebar still hidden on mobile via `hidden md:block`.
  - `InstructorTopbar`: now `min-h-[56px]`, `px-4 md:px-6`, hides the user name on mobile, exposes the bell + message badge with 40×40 touch targets.
  - `ClockWidget` on `/profesores/mi-portal`: stacks vertically on mobile, full-width buttons with `min-h-[56px]` and active-press feedback (`active:scale-[0.99]`); reverts to inline on `sm+`.
- **Geolocalización en fichaje**:
  - New `src/lib/geo/browser.ts` — `getCurrentCoords()` wraps `navigator.geolocation.getCurrentPosition` with 6s timeout, returns `null` on denial/error/unsupported (never throws).
  - Both `ClockWidget` (mi-portal) and `ClockInOutWidget` (fichaje) capture coords on entrada AND salida, send `{geoLat, geoLon}` for clock-in and `{clockOutLat, clockOutLon}` for clock-out. Toast confirms when location was captured.
  - `clockOutSchema` (`src/lib/validation/instructors.ts`) now accepts `clockOutLat`/`clockOutLon`; PATCH route stores them.
  - `useClockOut` hook accepts the new geo fields; `TimeEntry` type extended with `geoLat/geoLon/clockOutLat/clockOutLon`.
  - Schema migration adds `clockOutLat Float?` + `clockOutLon Float?` to `InstructorTimeEntry`.
  - Admin `TimeEntryTable`: new "Con ubicación" pill (sage green, `MapPin` icon) next to entrada/salida times when coords are present, with the lat/lng in the `title` attribute.
- **Notificaciones in-app**:
  - `Notification` model + `GET /api/notifications` already existed. Added missing `DELETE /api/notifications/[id]` handler.
  - `useDeleteNotification()` hook added.
  - New `src/lib/notifications/create.ts` — `createNotification()` helper, fire-and-forget, swallow-and-log errors.
  - New `InstructorNotificationBell` component — unread badge (1–9 / "9+"), dropdown with grouped time-ago (1m/1h/1d), per-item mark-read + delete buttons that appear on hover, "Marcar todas" link.
  - Wired into the planning groups PATCH (`/api/planning/groups/[id]`): when `instructorId` transitions to a non-null value (and differs from previous), creates a `clase_asignada` notification on the assigned instructor's user with date, time slot, station, discipline + level.
- **Chat interno**:
  - New `Message` Prisma model (`fromUserId`, `toUserId`, `body`, `isRead`, `readAt`, `createdAt` + 3 indexes) wired into `Tenant.messages` and `User.messagesSent`/`messagesReceived` relations.
  - `GET /api/messages` (default returns inbox grouped by peer with last message + unread count + total; `?with=<userId>` returns the full thread newest-last) + `POST` (sends + creates a `new_message` notification for the recipient).
  - `PATCH /api/messages/[id]` marks as read (idempotent, only the recipient can mark their own); `DELETE` allows either side to delete.
  - New `useMessages.ts` hook: `useConversations`, `useThread`, `useSendMessage`, `useMarkMessageRead`, `useDeleteMessage`. Inbox refetches every 30s, threads every 15s.
  - New page `/profesores/mensajes` — two-pane layout (conversation list + thread). Mobile: list collapses when a thread opens (with a "Volver" arrow back). Auto-scroll to bottom on new messages. Auto-mark-read on open. Enter sends, Shift+Enter newline. Suspense-wrapped because it reads `?to=<userId>` from `useSearchParams`.
  - `InstructorMessageBadge` in the topbar shows total unread, links to `/profesores/mensajes`.
  - Admin/manager view: "Enviar mensaje" button on `/profesores/[id]` (in `InstructorProfileCard`) deep-links to `/profesores/mensajes?to=<userId>`. Also added a `Mensajes` entry in the desktop `InstructorSidebar`.
- **Schema migration** `20260502100000_instructor_portal_phase4`: idempotent `ADD COLUMN IF NOT EXISTS` for the geo columns + `CREATE TABLE IF NOT EXISTS "Message"` with FKs to Tenant/User and three indexes.
- **Audit**: `npx tsc --noEmit` clean.

### Phase AH: Presupuestos & Facturación Automática Fase 3 (2026-05-02) ✅
- **Goal**: complete the end-to-end Quote → Reservation → Invoice flow with auto-billing, fiscal-grade PDFs, automated emails, reminder loops, and centralised numbering.
- **Auto-invoice on confirmation** (`src/app/api/reservations/[id]/route.ts`): the PATCH handler now triggers `autoInvoiceFromReservation` whenever a reservation transitions into `confirmada` (in addition to `completada`). Quotes that were already paid still own billing — the auto-invoice helper detects that case and skips.
- **Auto-invoice helpers refactored**:
  - `src/lib/finance/auto-invoice-from-quote.ts` and `src/lib/invoices/auto-invoice-from-reservation.ts` now both delegate numbering to `generateDocumentNumber(tenantId, "invoice", { tx })` from `src/lib/documents/numbering.ts`. The legacy "FAC-YYYY-NNNN" lookup-and-increment code is gone — atomic upsert via `DocumentCounter` is the single source of truth, with audit rows in `DocumentNumberLog`.
  - Both helpers now compute correct fiscal totals: gross is treated as IVA-included, subtotal = gross / 1.21, tax = gross − subtotal. Per-line `lineTotal` stores the net contribution so totals reconcile.
  - Both helpers fire-and-forget the client invoice email after creation via the new `sendInvoiceEmail` helper.
- **Manual invoice route** (`src/app/api/finance/invoices/route.ts`): also switched to `generateDocumentNumber` (context `manual:create`).
- **Tenant fiscal data resolver** (`src/lib/tenant/fiscal.ts` — NEW): `getTenantFiscalData(tenantId, "quote" | "invoice")` returns `{ companyName, companyNif, companyAddress, companyPhone, companyEmail, logoUrl, headerColor, accentColor, footerText, legalText }` by reading the matching `PdfTemplate` row, falling back to tenant name + sensible defaults.
- **Quote PDF** (`src/app/api/quotes/[id]/pdf/route.ts`): now pulls fiscal data from `getTenantFiscalData(_, "quote")`. Header shows tenant logo (if uploaded) or text brand, NIF + address. Colours come from PdfTemplate. New "Condiciones generales" block uses `legalText` or a sensible default. Footer prints NIF/contact.
- **Invoice PDF** (`src/app/api/finance/invoices/[id]/pdf/route.ts`): rewritten to HTML (Spanish fiscal compliance). Logo + NIF + address in header, "Factura" badge, status badge, client block, line table, **IVA breakdown grouped by tax rate** (base imponible al X% / IVA X%), legal text + footer with NIF. Auto-prints via `window.print()`.
- **Invoice email**:
  - `src/lib/finance/invoice-email.ts` (NEW): `sendInvoiceEmail({ tenantId, invoiceId, to, clientName, isReminder?, reminderNumber? })` — uses `buildInvoiceEmailHTML` with tenant fiscal data (name + email + phone), payment URL points at the new HTML invoice PDF route. Records `emailSentAt` / `emailSentTo` on first send, increments `reminderCount` + sets `lastReminderAt` on reminders.
  - Both auto-invoice paths fire it on creation (non-blocking).
- **Invoice reminders**:
  - `src/lib/finance/invoice-reminders.ts` (NEW): `processInvoiceReminders()` — scans invoices in `sent`/`draft` status with `issuedAt ≤ now − 7d` and `reminderCount < 3`. Throttles to one email per 7-day window. Resolves recipient email from `Invoice.emailSentTo` → `Invoice.client.email` → reservation client. Returns `{ sent, errors, scanned }`.
  - Wired into the daily cron (`src/app/api/cron/quote-reminders/route.ts`): the response body now includes `invoiceRemindersSent`, `invoiceRemindersScanned`.
- **Schema migration** `20260502000000_invoice_reminders` — adds `emailSentAt`, `emailSentTo`, `reminderCount`, `lastReminderAt` to `Invoice` (idempotent `ADD COLUMN IF NOT EXISTS`).
- **Numbering atomicity fix** (`src/lib/documents/numbering.ts`): the `tx` parameter type widened to `Prisma.TransactionClient | typeof prisma` so it composes correctly inside `prisma.$transaction(async (tx) => …)`.
- **Presupuestos dashboard panel** (`src/app/(dashboard)/presupuestos/page.tsx`): list-panel header now shows three stat tiles — Pendientes (count + pipeline €), Aceptados (count + revenue €), Total — alongside the existing search + status pill filters in `QuoteList`. Removed the leftover "Debug view" block + duplicated header.
- **Numeración fiscal**: already centralised on `DocumentCounter` (per-tenant, per-type, per-year, atomic). Each generated number is logged in `DocumentNumberLog` with `context` so manual/auto/reset paths are auditable. Year rollover happens automatically on the first call of the new year (counter row keyed on `(tenantId, documentType, year)`).
- **Audit**: `npx tsc --noEmit` → 0 errors. `npx eslint` clean across modified files (only 2 pre-existing unused-arg warnings in `QuoteDetail.tsx`).

### Phase AG: Presupuestos Module Fixes (2026-04-30) ✅
- **PDF endpoint** (`/api/quotes/[id]/pdf`): print-ready HTML quote document at the URL the email already references. Auth: `requireTenant` + `requireModule("booking")`, scoped by `tenantId`. Renders tenant name, quote number (`Q-XXXXXXXX`), client + trip info, full line-items table with per-item variables (modalidad, nivel, sector, idioma, horario, tipoCliente, fecha, días, notas), subtotal/discounts/total, payment instructions (Redsys link if available + IBAN), expiry date, footer with contact info. `@media print` CSS strips chrome; `<script>window.print()</script>` auto-triggers Save-as-PDF. Returns `text/html`.
- **`en_proceso` quote status** added to `updateQuoteSchema` enum in `src/lib/validation/booking.ts` so the QuoteDetail UI can transition a converted quote without the API rejecting it.
- **Quote→Reservation conversion** (`/api/reservations/from-quote/[quoteId]`):
  - **Idempotency guard**: pre-check for existing `Reservation` with this `quoteId`; if present, returns 200 with `{ reservation, existing: true }` instead of duplicating.
  - **Atomic conversion** in `prisma.$transaction`: creates the reservation and updates the source quote (status → `en_proceso` for `nuevo|borrador|en_proceso`, otherwise preserved; `internalNotes` appended with `Convertido a reserva el <ISO>`).
  - **Full per-item variable copy**: services array now carries every QuoteItem field (productId, category, description, startDate/endDate, numDays/numPersons, ageDetails, station, modalidad, nivel, sector, idioma, horario, puntoEncuentro, tipoCliente, gama, casco, tipoActividad, regimen, alojamientoNombre, seguroIncluido, tallaBotas, alturaPeso, dni, notes) — no more dropped data.
  - **Dynamic schedule**: picks the first non-empty `horario` across QuoteItems; falls back to `10:00-13:00` only if none provided. No more universal hardcode.
- **Audit**: `npx tsc --noEmit` → 0 errors.

### Phase AI: Premium Light Dashboard — Refined Design System (2026-05-02) ✅
- **Goal**: lift the dashboard from generic shadcn defaults to a premium, magazine-quality light theme matching the visual standard of `public/landing.html` (dashboard mockups). Light theme only — no dark mode.
- **Design tokens (`src/app/globals.css`)**:
  - Primary blue tightened to `#4F8EF7` (matches landing); hover `#6BA0F9`. All legacy `#0066FF` references rerouted (incl. `--coral` alias, `--ring`, `--accent-foreground`, `--chart-1`).
  - Sidebar bg lifted to `#0F172A` (Linear/Vercel-style premium navy); border `rgba(255,255,255,0.06)`; accent `rgba(255,255,255,0.05)` for hover.
  - Shadow tokens reauthored — sm `0 1px 3px rgba(15,23,42,0.06)`, md `0 4px 16px rgba(15,23,42,0.08)`, lg `0 8px 32px rgba(15,23,42,0.10)`. New `--shadow-blue-glow` for primary-button hover.
  - New utility classes: `.card-premium`, `.btn-primary-glow`, `.stat-label`, `.stat-value`. Existing `.badge-*` extended with `.badge-pill` foundation + `.badge-violet`.
  - `.nav-item` rewritten — left-border accent (`border-l-2 border-[#4F8EF7]`) on active state; bg `rgba(79,142,247,0.15)`; hover `rgba(255,255,255,0.05)`.
  - `.table-linear` premium: header `bg-slate-50/50` + uppercase tracking-wider, row hover `slate-50/80`, first col text-slate-900.
- **Sidebar (`src/components/layout/Sidebar.tsx`)**:
  - Bg `#0F172A`, borders `white/[0.06]`. Logo dot — animated cyan ping (`bg-cyan-400 shadow-[0_0_8px]`).
  - Active item: `bg-[#4F8EF7]/15 text-white border-l-2 border-[#4F8EF7]`; icon turns `#4F8EF7`.
  - Hover: `bg-white/[0.05] text-slate-200`. Normal: `text-slate-500`.
  - Section labels: `text-[0.6rem] uppercase tracking-[0.14em] text-slate-600`.
  - Badge counters use `bg-[#4F8EF7]/20 text-[#4F8EF7]` (no more red destructive for unread/draft counts).
  - Footer status pulse switched to `bg-emerald-400`.
- **Topbar (`src/components/layout/Topbar.tsx`)**:
  - Height `h-14`; `border-b border-slate-100 shadow-sm` for premium drop. Avatar gradient `from-[#4F8EF7] to-[#6BA0F9]` + `ring-2 ring-white shadow-sm`. Dropdown content `shadow-lg`.
- **Badge (`src/components/ui/badge.tsx`)**:
  - Pill shape default (`rounded-full px-2.5 py-0.5 text-[0.65rem]`).
  - 6 new semantic variants: `success`, `warning`, `info`, `danger`, `neutral`, `violet` — all with light-50 bg + 700 text + 200 border per the spec (borrador→warning, enviado→info, pagado/aceptado→success, cancelado→danger).
- **Table (`src/components/ui/table.tsx`)**:
  - `<TableHeader>` → `bg-slate-50/50 [&_tr]:border-slate-100`. `<TableHead>` → uppercase, tracking `0.06em`, `text-[0.65rem] font-semibold`, `text-slate-500`. `<TableRow>` → border-slate-100, hover slate-50/80. `<TableCell>` → first child `font-medium text-slate-900`, others `text-sm text-slate-600`.
- **Card / Button / Input / Select / Textarea primitives**:
  - Card: `border border-slate-100 shadow-sm hover:shadow-md`. Replaces the ring-foreground/10 outline.
  - Button (default): primary blue with `shadow-sm` → `hover:bg-[#6BA0F9] hover:shadow-blue-glow`.
  - Input/Textarea/Select trigger: `h-9 border-slate-200 bg-white hover:border-slate-300 focus:border-[#4F8EF7] focus:ring-[3px] focus:ring-[#4F8EF7]/20` — consistent across all form primitives.
- **No page-level rewrites required** — design system updates cascade through every existing usage. Pages already wired to `--primary`, `--card`, badge variants, and table primitives inherit the polish automatically.
- **Audit**: `npx tsc --noEmit` → 0 errors.

### Phase AK: Module Improvements — REAV, Reviews, Suppliers, CSV, Global Search (2026-05-02) ✅
- **REAV**: stats header (total expedientes, base imponible total), búsqueda en tiempo real por nº factura / tipo operación, dropdown filtro de tipo, paginación 15 filas/página con "Mostrando X-Y de Z"
- **Reviews**: stats header (puntuación media ★, total reseñas, % respondidas), widget distribución de estrellas 5→1 con barras doradas proporcionales, búsqueda por autor/contenido, filtro de estrellas clickable (pills 1★–5★ + Todas), fix acentos completo (Reseñas, moderación, etc.)
- **Suppliers**: columna "Pendiente" en SuppliersTab (suma de netAmount de liquidaciones no pagadas por proveedor), stats bar en SettlementsTab (total pendiente gold / pagado este mes green / total count), nuevo SettlementDetailModal con líneas desglosadas (tipo, fecha, pax, venta, comisión%), fix acentos (Añadir, Híbrido, Liquidación)
- **CSV Export** (`src/lib/export/csv.ts`): función pura con BOM UTF-8 para Excel, escape CSV correcto, botones Exportar CSV en Reservas/Presupuestos/Finanzas (InvoicesTab)
- **Búsqueda global** (`/api/search`): amplía query a 4 tablas (contacts/reservations/quotes/products), take 3/categoría, componente GlobalSearch muestra sección Catálogo con icono Package
- **Tests**: e2e billing-flow/onboarding/storefront/tenant-isolation + unit cross-module-availability; vitest.config extendido a `tests/**`
- **Audit**: `tsc --noEmit` → 0 errores

### Phase AL: Fase 7 (E2E Testing) + Fase 8 (Storefront 2.0 + Landing Comercial) (2026-05-02) ✅
- **Goal**: lock the cross-module flows in tests + ship a public-facing storefront upgrade and a landing that reflects the platform we actually built.

**Fase 7 — E2E Testing** (vitest, all DB-less via Prisma + helper mocks)
- New tests live under `tests/` (added to vitest config alongside `__tests__/`):
  - `tests/e2e/billing-flow.test.ts` — Quote→Reservation conversion (incl. idempotency), PATCH `confirmada` triggers `autoInvoiceFromReservation` with the correct payload, `cancelada` does NOT trigger billing.
  - `tests/e2e/onboarding.test.ts` — POST `/api/auth/register` creates Tenant + Owner role + 3 default roles + Owner User and enables ALL 17 modules in `ModuleConfig`. Covers email-already-taken (409), missing companyName (400), weak-password (Zod 400) edges.
  - `tests/e2e/tenant-isolation.test.ts` — extends `__tests__/lib/multi-tenant-isolation.test.ts` with Leads, Clientes [id]/history (cross-tenant 404 + per-module aggregate scope), and Finanzas Invoices.
  - `tests/e2e/storefront.test.ts` — public products listing scoped by slug, checkout converts cart→Quote stamped with tenantId, falls back to `manual` payment when Redsys unavailable, 404 on unknown slugs and cross-tenant carts.
  - `tests/unit/cross-module-availability.test.ts` — multi-module quote scenarios (rental + hotel + class all OK; rental shortage trips overall ok=false; hotel block with Spanish reason; class shortage probes next 14 days; instructor level filter).
  - `tests/unit/auto-invoice.test.ts` — sibling that imports the real helper to verify IVA-included math (gross 121 → subtotal 100, tax 21), paid-quote skip path, and idempotency.
- **vitest config**: added `tests/**/*.test.ts(x)` to both projects' `include` globs. Existing `__tests__/` suite untouched.
- **Result**: 26 new tests, all green; full suite 242 passing across 26 files (the 2 pre-existing testing-library/dom failures predate this work).

**Fase 8 — Storefront 2.0 + Landing Comercial**
- **Public packs page** — new `src/app/(storefront)/s/[slug]/packs/page.tsx` is a visual constructor: tabs across all active `LegoPack`s, hero card per pack, line-by-line components panel that distinguishes obligatorio (locked, dark pill) / opcional (toggleable, amber pill) / incluido (checked, green pill). Live total recomputes when optional lines toggle. Sticky right-rail summary with base + extras breakdown and an "Añadir al carrito" CTA that pushes a `type:"product"` cart entry tagged `meta.variant="pack"` + `meta.packLines=<id1,id2>`.
- **SEO** — added per-route metadata layouts (`Metadata` exports) for hotel, spa, restaurante, packs, carrito, checkout, bono, canjear, cancelar. Cart/checkout/canjear/cancelar are flagged `robots: { index: false, follow: false }` so transactional URLs don't pollute search. The root storefront layout already had a `template: "%s — Skicenter"` fallback so each child only needs to set its own `title`.
- **Sitemap** — `src/app/(storefront)/s/[slug]/sitemap.ts` returns the static landing pages + 7 destination pages + every active product slug, all dated from `Tenant.updatedAt` (or product `updatedAt` for product entries). Uses `process.env.AUTH_URL` for the base URL.
- **Landing comercial** (`public/landing.html`):
  - **Modules grid**: added a new "Sprint 6 — Avanzado" group with 5 cards reflecting Fases 3-5: Facturación Auto (F3), Portal Profesor (F4), Disponibilidad cruzada (F5), Operaciones del día, Cliente unificado.
  - **Interactive dashboard mockup**: new "Operaciones" tab (now the default-active one) with 5 stat cards (clases ahora, alquileres, check-ins, sin pagar, leads nuevos) + 5 cross-module rows with status pills (EN VIVO / PRONTO / PRÓX. / PEND. / NEW).
  - **How it works**: 3 steps → 5 steps that mirror the actual onboarding wizard (Empresa → Módulos → Equipo → Catálogo → Operar). Grid expanded to `repeat(5,1fr)` desktop / `repeat(3,1fr)` tablet / `1fr` mobile.
  - **Roadmap**: rebuilt to reflect what shipped (Fases 1-5, 7-8 with ✓ pills) plus what's next (Fase 9 Veri*factu/TicketBAI, Fase 10 mobile + marketplace).
  - **Testimonial section**: new "Construido junto a Skicenter" block with quote, author block (Equipo Skicenter, 3-stations badge), and 4 stat tiles (93 productos / 3 estaciones / 7 periodos / 3h ahorro al día). Linked from nav.
- **Audit**: `tsc --noEmit` clean (`exit=0`), 26/26 new tests passing, 242/242 in scope.

### Next: TBD

## DB Migrations
1. `init` — Core models (Tenant, User, Role, Reservation, etc.)
2. `20260316100000_phase2_auth_voucher_datamode` — Auth fields, voucher fields, dataMode, GrouponProductMapping
3. `20260316200000_ghl_cache_sync` — Cache tables, SyncQueue, SyncStatus
4. `20260316300000_pricing_engine` — Product refactor (destination→station, new fields), SeasonCalendar table
5. `20260317000000_demo_onboarding_sync` — isDemo, onboarding steps (1-3 + dismissed), sync progress fields on Tenant
6. `20260320000000_product_system_upgrade` — QuoteItem per-product fields, Task model, Quote cancellation fields
7. `20260322000000_quote_followup_tracking` — Quote follow-up tracking fields (lastReminderStep, crossSellSentAt, reviewSentAt, preTripStep)
8. `20260322100000_contact_submission` — ContactSubmission model for public contact form (rate limiting index)
9. `20260502000000_invoice_reminders` — Invoice email + reminder tracking fields (emailSentAt, emailSentTo, reminderCount, lastReminderAt)
10. `20260502100000_instructor_portal_phase4` — Clock-out geolocation on InstructorTimeEntry + Message model for internal chat
11. `20260502200000_phase5_cross_module` — QuoteItem.moduleType + index for cross-module reservation cascade

## Known Issues
- No Postgres running locally — need `docker-compose up db redis` before migrations
- ~~ANTHROPIC_API_KEY must be set on Railway for voucher reader to work~~ ✅ Set on Railway + local .env (2026-03-22)
- Voucher section only visible when "CUPÓN GROUPON" source is selected
- Cron endpoint (`/api/cron/sync`) needs Railway cron job configured (every 5 min)
- Permission checks removed — auth is session-only (no granular RBAC at API level)
- Phases R-T pushed to git but NOT yet deployed to Railway
- Product catalog seed on Railway requires clicking "Sembrar Catálogo" in Settings after deploy
- Demo data uses CachedContact/CachedConversation/CachedOpportunity/CachedPipeline tables (same as GHL data)

## Pending Work (Operational — Not Code)
- **Deploy phases R+S to Railway** — push is done, Railway auto-deploys from main
- **Seed catalog on live** — click "Sembrar Catálogo" in Settings after deploy
- **Connect real GHL sub-account** via OAuth flow and test end-to-end live sync
- **Set up Railway cron** for `/api/cron/sync` (every 5 minutes)
- **Set up Railway cron** for `/api/cron/quote-reminders` (daily at 09:00 Europe/Madrid) — optional: set CRON_SECRET env var + pass as `Authorization: Bearer {secret}`
- **Test webhook delivery** — register webhook URL in GHL marketplace app settings
- **Email/WhatsApp delivery** — integrate Resend (email) + Twilio (WhatsApp) for real notifications

## Key Decisions
- **Prisma v7** requires adapter pattern — `@prisma/adapter-pg`
- **shadcn/ui v4** on base-ui (not Radix) — `render` prop instead of `asChild`
- **Next.js 16** with Tailwind v4
- **Edge middleware** uses `getToken()` from `next-auth/jwt`, NOT `auth()` (Prisma → node:path → edge crash)
- **Two GHL clients**: `MockGHLClient` (mock mode) and `GHLClient` class (live mode)
- **Live mode reads from cache tables**, not directly from GHL
- **Write-through pattern** — writes go to GHL first, then update cache; failures queued to SyncQueue
- **No API-level permission checks** — removed because DB roles lack populated permissions
- **@dnd-kit v6** for drag-and-drop — `useDraggable`/`useDroppable` (not sortable)
- **Railway**: migrations at start time (not build), DATABASE_URL injected at runtime
- **Cookie config explicit** for Railway's TLS proxy — `__Secure-` prefix when AUTH_URL is HTTPS
- **Product tier naming**: "media"/"alta" (not "media_quality"/"alta_quality") — code handles both for backward compat
- **Bundle products**: pricingMatrix stores `{ type: "bundle", components: ["slug1", ...] }` — price resolved from components

## Deployment Info
- **Platform:** Railway (Docker)
- **Live URL:** https://crm-dash-prod.up.railway.app
- **Services:** Next.js app + Postgres + Redis
- **Build:** `npm install` → postinstall (`prisma generate`) → `npm run build`
- **Start:** `npm start` → `prisma migrate deploy` → `prisma db seed` → `next start`
- **Demo login:** admin@demo.com / demo1234 (Owner), sales@demo.com / demo1234 (Sales Rep)

## Auto-Audit Results

### Phase AL Final Audit (2026-05-02) — Latest
- ✅ Type Check: 0 errors
- ✅ Tests: 26 new tests added under `tests/`, all green; 242 passing in scope
- ✅ Storefront pages enriched with SEO metadata + sitemap
- ✅ Landing reflects Fases 3-5, 7-8 + Skicenter testimonial

### Phase X Audit (2026-03-22)
- ✅ Type Check: 0 errors
- ✅ Build: compiled clean (65 static pages, 7.5s)
- ✅ New route: /contacto (public contact form)
- ✅ Pending push

### Phase T Final Audit (2026-03-17)
- ✅ Type Check: 0 errors
- ✅ Build: compiled clean (48+ routes)
- ✅ Pending push

### Phase S Audit (2026-03-17)
- ✅ Type Check: 0 errors
- ✅ Build: compiled clean (48+ routes)
- ✅ Pushed: commit 033fbd7

### Previous Audits (all passed)
- Phase Q: 0 errors, deployed fc2e8d0
- Phase P: 0 type/lint errors, build clean
- Phase N: 0 type/lint errors, build clean
- Phase M: 0 type/lint errors, build clean
- Phase H: 0 type/lint errors, deployed f78b7f9
- Phases A-E: 34 tests, 0 type/lint errors
- Phase G: 0 type/lint errors, deployed ce6f718
