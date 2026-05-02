# AGENTS.md — OpenClaw Hospitality Platform

## Identity

You are an autonomous senior full-stack engineer building a multi-tenant hospitality platform (ski resorts, hotels, spas, restaurants) with modular architecture. Ship production-grade code. Execute, verify, prove it works.

## Project

- **Stack:** Next.js 16 (App Router), TypeScript (strict), Tailwind v4 + shadcn/ui, Prisma v7 + Postgres, Redis, GHL API v2, Codex API, S3/R2
- **Deploy:** Railway (Docker + Postgres + Redis)
- **Live URL:** https://openclaw-production-50e4.up.railway.app
- **UI Language:** All Spanish. Currency in EUR (es-ES format).
- **Prisma models:** 111 models across 17 modules
- **Phases completed:** A through X (CRM dashboard) + Platform Expansion Phase 1 (module architecture) + Security audit PRs merged

## Key Docs

| File | Purpose |
|------|---------|
| `PROGRESS.md` | External memory. READ FIRST every session. |
| `ARCHITECTURE.md` | Architecture patterns and data flow. |
| `src/AGENTS.md` | Code patterns, conventions, imports. |
| `src/app/api/AGENTS.md` | API route patterns, auth, GHL sync. |
| `src/app/(dashboard)/AGENTS.md` | UI conventions, design system. |

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection string |
| `REDIS_URL` | Redis connection string |
| `AUTH_URL` | Full app URL (e.g., `https://crm-dash-prod.up.railway.app`) |
| `AUTH_SECRET` | NextAuth JWT signing secret |
| `ENCRYPTION_KEY` | 32-byte hex key for AES-256-GCM (encrypts GHL tokens) |
| `GHL_CLIENT_ID` / `GHL_CLIENT_SECRET` | GHL Marketplace app credentials |
| `GHL_REDIRECT_URI` | OAuth callback URL (`{AUTH_URL}/api/crm/oauth/callback`) |
| `GHL_WEBHOOK_SECRET` | HMAC-SHA256 webhook verification secret |
| `ENABLE_MOCK_GHL` | Set `true` for fake GHL data in dev |
| `ANTHROPIC_API_KEY` | Codex API key (voucher image reader — uses `process.env` not `env.X`) |
| `S3_BUCKET` | S3/R2 bucket name (optional — file uploads disabled without it) |
| `S3_REGION` | S3 region (default: `auto` for R2) |
| `S3_ENDPOINT` | S3/R2 endpoint URL |
| `S3_ACCESS_KEY_ID` | S3 access key |
| `S3_SECRET_ACCESS_KEY` | S3 secret key |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN (client + server + edge error tracking) |
| `NEXT_PUBLIC_VERCEL_ENV` | Sentry environment tag (`development`/`preview`/`production`) |
| `SENTRY_ORG` | Sentry org slug (build plugin; source map upload disabled for now) |
| `SENTRY_PROJECT` | Sentry project slug (build plugin; source map upload disabled for now) |

## Module System (17 Modules)

The platform is organized into **17 toggleable modules**. Each tenant can enable/disable modules via Settings.

| Module | Slug | Section | Dependencies | Models |
|--------|------|---------|--------------|--------|
| Principal | `core` | Principal | — (always on) | Tenant, User, Role, ModuleConfig |
| CRM | `crm` | Ventas | — | CachedContact, CachedConversation, CachedOpportunity, CachedPipeline |
| Catálogo | `catalog` | Ventas | — | Product, Category, Location, ExperienceVariant, ProductTimeSlot |
| Reservas | `booking` | Ventas | catalog | Quote, QuoteItem, Reservation, ActivityBooking, BookingMonitor, DailyOrder |
| Hotel | `hotel` | Operaciones | booking | RoomType, RoomRateSeason, RoomRate, RoomBlock |
| Spa | `spa` | Operaciones | booking | SpaCategory, SpaTreatment, SpaResource, SpaSlot, SpaScheduleTemplate |
| Alquiler | `rental` | Operaciones | booking | RentalInventory, RentalOrder, RentalOrderItem, CustomerSizingProfile |
| Restaurante | `restaurant` | Operaciones | — | Restaurant, RestaurantShift, RestaurantClosure, RestaurantBooking, RestaurantStaff |
| Finanzas | `finance` | Gestión | — | Invoice, InvoiceLine, Transaction, CostCenter, ExpenseCategory, Expense, ExpenseFile, RecurringExpense |
| Proveedores | `suppliers` | Gestión | finance | Supplier, SupplierSettlement, SettlementLine, SettlementDocument, SettlementStatusLog |
| REAV | `reav` | Gestión | finance, suppliers | ReavExpedient, ReavCost, ReavDocument |
| TPV | `tpv` | Gestión | finance | CashRegister, CashSession, CashMovement, TpvSale, TpvSaleItem |
| Tienda Online | `storefront` | Online | catalog | DiscountCode, DiscountCodeUse, CompensationVoucher |
| Contenidos | `cms` | Online | — | SiteSetting, SlideshowItem, CmsMenuItem, StaticPage, PageBlock |
| Ticketing | `ticketing` | Ventas | booking | ExternalPlatform, PlatformProduct, CouponRedemption, CouponEmailConfig |
| Reseñas | `reviews` | Online | — | Review |
| Packs | `packs` | Ventas | catalog, booking | LegoPack, LegoPackLine |

### Module Architecture Files

| File | Purpose |
|------|---------|
| `src/lib/modules/registry.ts` | Module definitions (slug, name, icon, dependencies, navItems, permissions) |
| `src/lib/modules/guard.ts` | `requireModule(tenantId, slug)` — API route guard (Redis-cached, returns 403 if disabled) |
| `src/lib/modules/types.ts` | TypeScript interfaces (ModuleDefinition, ModuleState, NavItemDef) |
| `src/hooks/useModules.ts` | React hook: `useModules()` → `{ isEnabled(slug), toggleModule, modules }` |
| `src/app/api/settings/modules/route.ts` | GET (list modules) + PATCH (toggle with dependency validation) |

### Module Guard Pattern

```typescript
// In any API route for a non-core module:
const [session, authError] = await requireTenant();
if (authError) return authError;
const modError = await requireModule(session.tenantId, "hotel");
if (modError) return modError;
```

### Dynamic Sidebar

Sidebar nav items are built from `MODULE_REGISTRY` filtered by `useModules().isEnabled()`. Items are grouped by section (Principal, Ventas, Operaciones, Gestión, Online).

## File Storage (S3/R2)

- **Service:** `src/lib/storage/s3.ts` — `uploadFile()`, `deleteFile()`, `getSignedUrl()`
- **API:** `POST /api/upload` — multipart form data, validates type + size
- **Key format:** `{tenantId}/{module}/{entityId}/{uuid}-{filename}`
- **Limits:** Images 10MB (jpeg/png/webp/gif), Docs 25MB (pdf/xlsx)
- **Compatible:** AWS S3, Cloudflare R2, MinIO

## Validation (Split by Module)

Schemas are organized in `src/lib/validation/`:
- `index.ts` — re-exports all + `validateBody()` helper
- `core.ts` — registerSchema, updateTenantSchema, inviteTeamMemberSchema, contactFormSchema
- `catalog.ts` — createProductSchema, updateProductSchema, bulkImportProductSchema
- `booking.ts` — createQuoteSchema, quoteItemSchema, createReservationSchema, seasonCalendarSchema
- `hotel.ts`, `spa.ts`, `restaurant.ts`, `finance.ts`, `suppliers.ts`, `tpv.ts`, `storefront.ts`, `cms.ts` — stub files for future schemas

All existing imports of `@/lib/validation` still work via re-exports.

## Public Storefront

- **Route:** `(storefront)/s/[slug]/*` — tenant-scoped public pages
- **Layout:** Minimal header + footer with tenant name, no sidebar/auth
- **Middleware:** `/s/*`, `/api/storefront/*`, `/api/reviews/public/*` are public routes
- **Future:** Cart in Redis, checkout creates Quote + Redsys payment

## Auth System

- **NextAuth v5** with credentials provider + JWT strategy
- Session: `{ id, email, name, tenantId, roleId, roleName, permissions, onboardingComplete, isDemo }`
- Edge middleware uses `getToken()` from `next-auth/jwt` — NOT `auth()` (Prisma → edge crash)
- Cookie: `__Secure-authjs.session-token` (HTTPS) or `authjs.session-token` (HTTP)
- 4 roles: Owner (all), Manager (all), Sales Rep (view+create), VA/Admin (view only)
- **Role-based sidebar**: Owner sees all, Manager sees all except Ajustes, Rep sees Dashboard/Reservas/Comunicaciones/Catálogo
- **API auth is session + tenant only** — `hasPermission()` was removed from all routes (DB roles lack populated permissions)
- Client-side RBAC: `RoleGate` component + `usePermissions()` hook still work for UI gating

## Mock vs Live Mode

- Tenant model has `dataMode` field: `"mock"` (default) or `"live"`
- `getDataMode(tenantId)` in `src/lib/data/getDataMode.ts`
- Toggle in Settings → DataModeCard (requires Owner + GHL OAuth connected)
- **Mock mode:** `MockGHLClient` (axios-style) returns fake data from `mock-server.ts`. Local CRUD (reservations, quotes, products) uses real Postgres.
- **Live mode:** Reads from cache tables (CachedContact/Conversation/Opportunity/Pipeline). Writes go through `GHLClient` → GHL API → update cache. Failed writes queued to SyncQueue.
- First switch to live triggers `fullSync(tenantId)`.
- **GHL not yet connected** — no real sub-account OAuth flow tested. Token auto-refresh built but untested under load.

## Product Catalog (Current State)

- **93 products** across 10 categories: alquiler (33), locker (4), escuela (6), clase_particular (5), forfait (10), menu (2), snowcamp (9), apreski (12), taxi (4), pack (8)
- **3 stations**: Baqueira Beret, Sierra Nevada, La Pinilla (equipment per-station, not "all")
- **Season calendar**: 7 periods (3 alta: Navidades, Carnaval, Semana Santa; 4 media)
- **Pricing matrices**: Day-based `{ media: { "1": 36, "2": 72 }, alta: {...} }`, private lessons `{ media: { "1h": { "1p": 70 } } }`
- **Bundle products**: priceType "bundle", pricingMatrix `{ type: "bundle", components: ["slug1", ...] }` — price = sum of components
- **Tier naming**: "media"/"alta" (code also handles legacy "media_quality"/"alta_quality")
- **La Pinilla**: max 5 day pricing (not 7)
- **Seed**: POST `/api/admin/seed-products` or "Sembrar Catálogo" button in Settings
- **Catalog data file**: `src/lib/constants/product-catalog.ts` (buildFullCatalog function)
- **Constants**: `src/lib/constants/skicenter.ts` (age brackets, skill levels)

## Voucher Reader (AI)

- `POST /api/voucher/read` → Codex API (`Codex-sonnet-4-20250514`)
- Accepts base64 image of Groupon voucher → returns structured JSON: `{ producto, códigos, precios, servicios }`
- Auto-fills reservation form fields. Uses `process.env.ANTHROPIC_API_KEY`.
- Voucher section only visible when source = "CUPÓN GROUPON"

## Design System

Warm/premium aesthetic inspired by kinso.ai:
- **Font:** DM Sans
- **Background:** #FAF9F7 (warm off-white)
- **Primary accent:** #E87B5A (warm coral), hover: #D56E4F
- **Success:** #5B8C6D (sage green), **Warning:** #D4A853 (warm gold), **Danger:** #C75D4A (muted red)
- **Text:** #2D2A26 primary, #8A8580 secondary. **Border:** #E8E4DE
- **Radius:** 16px cards, 10px inputs/buttons, 6px pills
- shadcn/ui v4 on base-ui (not Radix) — `render` prop instead of `asChild`

## Non-Negotiable Rules

1. Every DB query scoped by `tenantId` — no cross-tenant data leaks
2. Every live-mode read goes through cache tables — never hit GHL directly
3. Use `env.X` not `process.env.X` (exception: `ANTHROPIC_API_KEY`)
4. Use `logger` not `console.log`
5. No `any` types (except raw GHL responses with comment)
6. No `@ts-ignore` or `eslint-disable`
7. Max 300 lines per file — split if longer
8. All UI text in SPANISH, all currency in EUR
9. GHL tokens always encrypted via `lib/encryption.ts`
10. API routes: session + tenant auth only (no `hasPermission()` checks — they were removed)

## Known Issues

- **GHL not connected** — OAuth flow built but no real sub-account connected yet
- **GHL token expiry** — 24h refresh built in GHLClient but untested under real load
- **Mock contacts hardcoded** — MockGHLClient returns 20 fake contacts; pagination uses `limit` param (max 101)
- **Permission checks removed** — DB roles lack populated permissions → all API routes are session+tenant only
- **Phases R-T not deployed** — pushed to git but Railway last deployed fc2e8d0
- **Token auto-refresh** — if refresh token expires, tenant marked disconnected (tokens cleared, syncState=error)
- **Cron not configured** — `/api/cron/sync` needs Railway cron job (every 5 min)
- **ANTHROPIC_API_KEY** — must be set on Railway env vars for voucher reader

## Operating Mode

- **Auto-audit** after every step: `tsc --noEmit` → `eslint src/` → `npm run build`
- **Auto-fix bugs** — 3 attempts before escalating
- **Compaction protocol** — update PROGRESS.md + ARCHITECTURE.md BEFORE compacting

## Startup Protocol

```
1. Read PROGRESS.md → know where you left off
2. Continue from where you stopped
3. Run auto-audit after completing each step
```

## Demo Mode

- **Permanent demo tenant**: `isDemo: true` flag on Tenant, seeded via `npx prisma db seed`
- **Demo users**: demo@skicenter.com (Owner), natalia@demo.skicenter.com (Sales Rep), manager@demo.skicenter.com (Manager) — all pw: `demo123`
- **Legacy users**: admin@demo.com / demo1234 (Owner), sales@demo.com / demo1234 (Sales Rep)
- **Demo data**: 50 contacts, 50 reservations, 12 quotes, 25 pipeline deals, 20 conversations, station capacity, hotel (3 room types + rates), restaurant (El Mirador + 2 shifts), spa (3 treatments + 2 resources), finance (2 cost centers + 3 expense categories), CMS (3 slideshow + 2 menu items), 5 categories, 3 locations
- **Demo banner**: persistent coral banner "Modo demostración" with "Crear tu cuenta real →" CTA
- **Reset demo**: POST `/api/admin/reset-demo` — wipes and re-seeds all demo data (demo tenant only)
- **Clean tenant**: POST `/api/admin/clean-tenant` — removes reservations/quotes/capacity from current tenant
- **GHLEmptyState**: wrapper for Contacts/Comms/Pipeline — shows "Conectar GHL" CTA when not connected (skipped for demo)
- **OnboardingCards**: 3-step guide on Dashboard for new real tenants (Catálogo → Presupuesto → Reserva)
- Mock GHL: `ENABLE_MOCK_GHL=true`
- Seed catalog on live: Settings → "Sembrar Catálogo" or `fetch('/api/admin/seed-products', {method:'POST'})`

## API Route Map (All Modules)

| Route prefix | Module | Methods | Description |
|--------------|--------|---------|-------------|
| `/api/catalog/categories` | catalog | GET, POST, PATCH, DELETE | Product categories CRUD |
| `/api/catalog/locations` | catalog | GET, POST, PATCH, DELETE | Station/location CRUD |
| `/api/catalog/variants` | catalog | GET, POST, PATCH, DELETE | Experience variants |
| `/api/catalog/timeslots` | catalog | GET, POST, PATCH, DELETE | Product time slots |
| `/api/booking/activities` | booking | GET, POST, PATCH, DELETE | Activity bookings |
| `/api/booking/monitors` | booking | GET, POST, DELETE | Booking monitors (staff) |
| `/api/booking/daily-orders` | booking | GET, POST, PATCH, DELETE | Daily operation orders |
| `/api/booking/clients` | booking | GET, POST, PATCH, DELETE | Client registry |
| `/api/hotel/room-types` | hotel | GET, POST, PATCH, DELETE | Room type CRUD |
| `/api/hotel/seasons` | hotel | GET, POST, PATCH, DELETE | Rate season periods |
| `/api/hotel/rates` | hotel | GET, POST, PATCH, DELETE | Room rates (type x season x day) |
| `/api/hotel/blocks` | hotel | GET, POST, PATCH, DELETE | Room availability blocks |
| `/api/hotel/availability` | hotel | GET | Room availability query |
| `/api/spa/categories` | spa | GET, POST, PATCH, DELETE | Spa treatment categories |
| `/api/spa/treatments` | spa | GET, POST, PATCH, DELETE | Spa treatment CRUD |
| `/api/spa/resources` | spa | GET, POST, PATCH, DELETE | Cabins + therapists |
| `/api/spa/slots` | spa | GET, POST, PATCH, DELETE | Spa slot availability |
| `/api/spa/schedule-templates` | spa | GET, POST, PATCH, DELETE | Weekly schedule templates |
| `/api/restaurant/venues` | restaurant | GET, POST, PATCH, DELETE | Restaurant CRUD |
| `/api/restaurant/shifts` | restaurant | GET, POST, PATCH, DELETE | Shift CRUD (almuerzo/cena) |
| `/api/restaurant/closures` | restaurant | GET, POST, DELETE | Closure dates |
| `/api/restaurant/bookings` | restaurant | GET, POST, PATCH, DELETE | Table bookings |
| `/api/restaurant/staff` | restaurant | GET, POST, DELETE | Staff assignments |
| `/api/finance/invoices` | finance | GET, POST, PATCH, DELETE | Invoice CRUD + PDF |
| `/api/finance/transactions` | finance | GET, POST, PATCH, DELETE | Transaction ledger |
| `/api/finance/cost-centers` | finance | GET, POST, PATCH, DELETE | Cost center CRUD |
| `/api/finance/expense-categories` | finance | GET, POST, PATCH, DELETE | Expense categories |
| `/api/finance/expenses` | finance | GET, POST, PATCH, DELETE | Expense CRUD |
| `/api/finance/recurring-expenses` | finance | GET, POST, PATCH, DELETE | Recurring expenses |
| `/api/suppliers/*` | suppliers | GET, POST, PATCH, DELETE | Suppliers + settlements + lines + docs |
| `/api/reav/expedients/*` | reav | GET, POST, PATCH, DELETE | REAV expedients + costs + docs |
| `/api/tpv/registers` | tpv | GET, POST, PATCH, DELETE | Cash register CRUD |
| `/api/tpv/sessions` | tpv | GET, POST, PATCH | Cash sessions + movements |
| `/api/tpv/sales` | tpv | GET, POST, DELETE | TPV sale records |
| `/api/storefront/discount-codes` | storefront | GET, POST, PATCH, DELETE | Discount codes + apply |
| `/api/storefront/vouchers` | storefront | GET, POST, PATCH, DELETE | Compensation vouchers |
| `/api/storefront/[slug]/*` | storefront | GET, POST | Public storefront (hotel/spa/restaurant/packs) |
| `/api/cms/settings` | cms | GET, PATCH | Site settings |
| `/api/cms/slideshow` | cms | GET, POST, PATCH, DELETE | Slideshow items |
| `/api/cms/menu-items` | cms | GET, POST, PATCH, DELETE | Navigation menu |
| `/api/cms/pages` | cms | GET, POST, PATCH, DELETE | Static pages + blocks |
| `/api/ticketing/platforms` | ticketing | GET, POST, PATCH, DELETE | External platforms + products |
| `/api/ticketing/redemptions` | ticketing | GET, POST, PATCH, DELETE | Coupon redemptions |
| `/api/ticketing/email-config` | ticketing | GET, POST, PATCH, DELETE | Coupon email configs |
| `/api/reviews` | reviews | GET, POST, PATCH, DELETE | Customer reviews |
| `/api/packs` | packs | GET, POST, PATCH, DELETE | Lego packs + lines |
| `/api/rental/inventory` | rental | GET, POST, PATCH, DELETE | Equipment inventory pools |
| `/api/rental/orders` | rental | GET, POST, PATCH, DELETE | Rental orders + items |
| `/api/rental/orders/[id]/pickup` | rental | POST | Pickup workflow (atomic) |
| `/api/rental/orders/[id]/return` | rental | POST | Return workflow (atomic) |
| `/api/rental/profiles` | rental | GET, POST, PATCH, DELETE | Customer sizing profiles |
| `/api/rental/dashboard` | rental | GET | Dashboard stats |

## File Structure (Key Directories)

```
src/
├── app/
│   ├── (auth)/          — login, register, onboarding
│   ├── (dashboard)/     — all main pages (/, contacts, comms, pipeline, reservas, presupuestos, catalogo, settings, spa, hotel, restaurant, finance)
│   ├── (storefront)/    — public tenant storefront pages
│   └── api/             — 120+ route files across 16 modules
├── components/
│   ├── layout/          — Sidebar, Topbar, MobileNav
│   ├── shared/          — RoleGate, EmptyState, ErrorBoundary, DemoBanner, GHLEmptyState
│   └── ui/              — shadcn/ui components
├── hooks/               — React Query hooks (useGHL, useReservations, useQuotes, useProducts, usePricing, useSettings, useVoucher, useSeasonCalendar, usePermissions, useModules, useSpa)
├── lib/
│   ├── auth/            — NextAuth config, permissions, guard.ts (requireTenant)
│   ├── cache/           — Redis client, keys, TTLs
│   ├── constants/       — product-catalog.ts (93 products), skicenter.ts (age brackets), demo-seed-data.ts (curated demo data)
│   ├── data/            — getDataMode.ts
│   ├── ghl/             — GHLClient (live), MockGHLClient, sync service
│   ├── modules/         — registry.ts, guard.ts (requireModule), types.ts
│   ├── pricing/         — types.ts, client.ts (pure), calculator.ts (server)
│   ├── quotes/          — auto-package.ts (season-aware quote builder)
│   ├── storage/         — s3.ts (S3/R2 file upload)
│   └── validation/      — index.ts + 15 module schema files (core, catalog, booking, hotel, spa, restaurant, finance, suppliers, tpv, reav, storefront, cms, packs, reviews, ticketing)
├── generated/prisma/    — Prisma generated client (do not edit)
prisma/
├── schema.prisma        — 79 models across 16 modules
├── seed.ts              — Demo tenant + data seeder (includes seedNewModules for hotel/spa/restaurant/finance/cms)
└── migrations/          — 5 migrations
```

## Future Work (NOT NOW)

Do not implement unless explicitly asked: white-labeling, dark mode, mobile optimization, in-app calling, email integration, AI beyond voucher reader, Stripe billing, E2E tests, Sentry.
