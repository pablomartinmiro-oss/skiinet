# Skiinet (OpenClaw) — Build Progress

## Current Status
- **Phase:** PHASE X complete — Public Contact Form + Full UI/UX Overhaul
- **Step:** Ready for push
- **Live URL:** https://crm-dash-prod.up.railway.app
- **Last pushed commit:** cb6fa70 (2026-03-18)
- **Last deployed commit:** fc2e8d0 (2026-03-16) — phases R-X pushed to git, Railway auto-deploys
- **Date:** 2026-03-22

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

### Phase X Final Audit (2026-03-22) — Latest
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
