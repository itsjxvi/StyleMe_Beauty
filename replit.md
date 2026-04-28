# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Project: Salón de Belleza

Spanish-language salon management web app, hosted at artifact `artifacts/salon-belleza` (slug: `salon-belleza`, BASE_PATH `/`).
Backend API at `artifacts/api-server` (port 8080, prefix `/api`).
Database is provisioned (Replit Postgres). Schema lives in `lib/db/src/schema/`.

**Default admin login**: `admin@salonbelleza.com` / `Admin1234`
Seeded employees: `maria@salonbelleza.com`, `lucia@salonbelleza.com` (password `empleado123`).

Re-run seed: `pnpm --filter @workspace/scripts run seed` (skips if users already exist).

### Architecture

Salon management web app (Spanish UI). Features:
- Public landing with services, brands, products, **published reviews + 5-star submission form**
- Booking flow for guests
- **Admin panel** under `/admin/*` with:
  - Dashboard, Citas (appointments list), **Calendario** (visual day/week view with drag&drop reschedule), **Reseñas** (moderation), **Reportes** (income/top services/frequent clients with Recharts)
  - Inventario: services (with **product usage links** for auto-deduction), products (low-stock alerts), categories, brands, providers, stock movements
  - Facturación: invoices, payments (linked to appointments), expenses
  - Notification bell in admin header (reminders, confirmations, low_stock, reviews)
- **Auto inventory deduction**: when an appointment is marked completed via `POST /api/appointments/{id}/complete`, products linked to the service are decremented from stock and a low_stock notification is created if a product crosses its min_stock threshold.
- **Online store + cart + checkout**: `/tienda` (catalog with promo banners), `/carrito` (cart, promo validation, delivery $3.50, payment method: cash/card/transfer/delivery_cash). Orders persisted with discount and activity log entry.
- **Promotions**: admin CRUD at `/admin/promociones`. Codes validated at checkout via `POST /api/promotions/validate`. Seeded: BIENVENIDA10, ENVIOGRATIS, BELLEZA15.
- **Activity logs**: `/admin/actividad` — every login + create/update/delete on key entities is logged via `logActivity()` middleware helper.
- **Smart reports**: `/admin/reportes` — profitability by service, employee performance, peak hours, top spenders, with CSV export.
- **CSV exports**: `/api/exports/{products|appointments|invoices|orders|customers}.csv` (BOM-prefixed for Excel).
- **Booking guard**: `/citas` requires login. Business hours 8:00–20:00 enforced server-side, with 10-min rest between appointments and overlap check.

### Auth model
- Plaintext passwords (dev). Token format: `token-{userId}` sent via `Authorization: Bearer ...`.
- Roles: `admin` | `employee` | `customer`. Permissions map in `artifacts/api-server/src/lib/auth.ts` — use `requirePermission(action)` middleware.
- Frontend uses `setAuthTokenGetter` (in `main.tsx`) for orval-generated hooks; `apiFetch()` helper in `src/lib/apiFetch.ts` for new endpoints (orders, promotions, activity-logs, reports, exports).

### Codegen quirk

`orval` always rewrites `lib/api-zod/src/index.ts` to re-export both `./generated/api` and `./generated/types`, which causes duplicate-identifier TS errors. Workaround: the `codegen` script in `lib/api-spec/package.json` overwrites `index.ts` to only `export * from "./generated/api";` after orval runs.
