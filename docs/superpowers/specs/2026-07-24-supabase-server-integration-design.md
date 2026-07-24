# Supabase Server Integration — Design

**Date:** 2026-07-24
**Status:** Approved (architecture + phasing); Phase 1 ready for planning
**Package:** `@supabase/server` (v1.4.1) + `@supabase/supabase-js` (peer)

---

## 1. Goal

Move the platform's data layer and authentication onto Supabase, using the
**server-side** integration path (`@supabase/server`) rather than any
browser/frontend Supabase client. This preserves the AGENTS.md rule that the
frontend never calls external providers directly — the Next.js app continues to
talk only to the NestJS API, which is the sole Supabase caller.

Two capabilities, both server-side:

1. **Auth** — verify inbound Supabase-issued JWTs (and API keys) on the NestJS
   API, exposing a real authenticated user identity in place of today's stub.
2. **Data source** — **all** application data (teams, players, games, box
   scores, prop lines, users, injuries, lineups, plus future user-owned tables)
   lives in Supabase Postgres. Prisma and the current `DataClient` abstraction
   are retired.

## 2. Why `@supabase/server`

`@supabase/server` is server-side auth middleware: it verifies credentials from
an inbound `Request` and hands the handler a `SupabaseContext`:

- `supabase` — RLS-scoped client (user's JWT, or anon)
- `supabaseAdmin` — service-role client (bypasses RLS)
- `userClaims` / `jwtClaims` — JWT-derived identity
- `authMode` / `authKeyName` — which credential matched

It ships a **first-class NestJS adapter** (`@supabase/server/adapters/nestjs`)
exposing `withSupabase({ auth })` as a `CanActivate` guard factory and
`@SupabaseCtx()` as a param decorator. This fits NestJS DI and the existing
controller structure directly.

Env vars it reads (already present in `.env`, singular/dev forms — no rename
needed): `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`,
`SUPABASE_JWKS_URL`.

Core primitives (from `@supabase/server/core`) — `createAdminClient()`,
`createContextClient()`, `verifyAuth()` — are used where the guard isn't the
right shape (e.g. ingestion scripts, singleton catalog repositories).

## 3. Architecture Decisions

### 3.1 Retire the Prisma-shaped `DataClient`; introduce domain repositories

The current `DataClient` (`packages/database/src/data-client.ts`) is **not a
neutral abstraction** — it is Prisma's query API
(`findMany({ where, include, orderBy, cursor, take })`, `Prisma.GameWhereInput`,
relation `include`). `games.service.ts` and the other services depend on those
Prisma semantics directly. supabase-js has a fundamentally different query
shape (`.from('games').select('*, homeTeam:teams(*)').eq(...)`), so
"keep the interface, swap the implementation" would mean reimplementing Prisma's
query translator on top of supabase-js. Rejected.

**Instead:** replace `DataClient` with small **domain-oriented repository
interfaces** expressed in the app's own terms, not query args. Example:

```ts
interface GameRepository {
  list(filter: GameListFilter): Promise<GameWithTeamsDto[]>;
  findById(id: string): Promise<GameWithTeamsDto | null>;
  boxScore(gameId: string): Promise<GameBoxScoreEntryDto[]>;
}
// GameListFilter is our own type: { seasonId?, teamId?, status?, gameType?, limit, cursor }
```

- **Supabase implementation** — uses supabase-js, maps rows → existing DTOs
  (honors AGENTS.md "never expose provider objects / convert to internal DTOs").
- **Mock implementation** — in-memory, keeps `DATA_SOURCE=mock` and the existing
  test suite alive. This is *more* honest than today's setup, where the "mock"
  and "Prisma" clients only coincidentally share Prisma's interface.
- Services depend on repository tokens via DI, exactly as they depend on
  `DATA_CLIENT` today (same pattern, new interfaces).

This directly serves the AGENTS.md long-term goal: "data providers … can be
replaced independently without changing the rest of the system."

### 3.2 Client sourcing: RLS-first for user data, admin for catalog

Because the frontend never calls Supabase directly (only the NestJS API does),
we resolve the "singleton service vs. per-request RLS client" tension by role:

- **Catalog / reference data** (teams, players, games, box scores, prop lines):
  read via a **singleton service-role/admin client** (`createAdminClient()`)
  behind the repositories. These tables are public read; catalog repositories
  can be singleton-scoped Nest providers.
- **User-owned data** (profiles, future favorites/saved props): read/written via
  the **per-request `ctx.supabase`** from the guard so RLS enforces ownership.
- **Ingestion** (BDL importer, seed scripts): admin client (bypasses RLS).

### 3.3 RLS model

- Catalog tables: `select` policy for `authenticated` (and `anon` where public
  browsing is allowed).
- User-owned tables: `owner = auth.uid()` policies for select/insert/update.
- Policies are **defined in Phase 1** but enforcement is exercised in Phase 4
  (when the guard + real identity land). Until then the API uses the admin
  client, so RLS being on does not break catalog reads.

### 3.4 Users ↔ Supabase Auth

Supabase Auth owns identity in `auth.users`. The app's `users` table becomes a
`public.profiles` row keyed to `auth.uid()` (RLS: `id = auth.uid()`), holding
app-specific fields (name, etc.). The stub-user pattern in `UsersService` is
replaced by real JWT identity in Phase 4.

### 3.5 Schema & migration workflow: Supabase CLI + local stack

- SQL migrations live in `supabase/migrations/` (version-controlled, matching how
  `prisma/migrations` works today).
- A local Docker Supabase (`supabase start`) provides a real Postgres for Phase 3
  integration tests and a clean local/hosted distinction for the BDL wipe guard.
- `supabase db push` applies migrations to the hosted project.
- `supabase gen types typescript` generates the TS row types that replace the
  `@prisma/client` exports (`packages/database/src/index.ts` currently re-exports
  `@prisma/client`). Generated types can't drift from the schema.

Cost accepted: contributors need Docker + the Supabase CLI.

## 4. Phased Delivery

Ordered so the app is **never broken between phases**. Prisma is removed last,
after everything already runs on Supabase. Each phase gets its own spec → plan →
implementation cycle; only Phase 1 is fully specified here.

| Phase | Outcome | Breaking? |
|-------|---------|-----------|
| **1 — Schema + foundations** | Supabase schema + RLS policies + generated types exist; `@supabase/server` installed; env validated; admin client module in `apps/api`. App still runs on mock/Prisma. | No |
| **2 — BDL ingestion onto Supabase** | `pnpm db:load-bdl --yes` (and seed scripts) populate the Supabase tables. | No (app still reads old path) |
| **3 — Read path** | Domain repositories + Supabase impl; services swapped off `DataClient`; mock repo + tests updated. API reads from Supabase/mock. | No |
| **4 — Auth + RLS + identity** | `withSupabase` guard on protected routes; real JWT identity replaces stub; RLS enforced; user-owned writes via `ctx.supabase`. | No |
| **5 — Remove Prisma** | Prisma schema/client/migrations, `createPrismaDataClient`, `PrismaService`, `@prisma/client` re-export, `DATA_SOURCE=postgres` branch, unused docker Postgres deleted. | No |

---

## 5. Phase 1 — Schema + Foundations (detailed spec)

### 5.1 Scope

Stand up Supabase as infrastructure without switching any read path. At the end
of Phase 1: the schema and RLS policies exist in Supabase, TS types are
generated, `@supabase/server` is installed and env-validated, and `apps/api` can
construct an admin Supabase client — but every service still reads through the
existing `DataClient` (mock/Prisma). Nothing user-facing changes.

### 5.2 Deliverables

**A. Supabase project scaffolding**
- `supabase/config.toml` and `supabase/migrations/` initialized via
  `supabase init`.
- Local stack runnable via `supabase start`.

**B. Schema migration (SQL)**
Translate `packages/database/prisma/schema.prisma` into SQL migration(s). Must
reproduce, table-for-table (using the existing `@@map` snake_case names):
- Tables: `teams`, `players`, `seasons`, `games`, `player_game_stats`,
  `prop_lines`, `injury_reports`, `lineup_reports`, and `profiles` (replacing
  `users`, keyed to `auth.uid()`).
- Enums: `Conference`, `PlayerPosition`, `GameStatus`, `GameType`,
  `InjuryStatus`, `LineupRole`, `LineupConfirmation`, `StatType` — as Postgres
  enum types.
- Constraints/indexes: composite uniques `player_game_stats(player_id, game_id)`
  and `prop_lines(player_id, stat_type)`; `teams.abbreviation` unique;
  `seasons.label` unique; the FK relationships and the indexes present in the
  Prisma schema.
- Convention columns per AGENTS.md: `id`, `created_at`, `updated_at` on every
  table. `updated_at` maintained by a trigger (Postgres has no Prisma
  `@updatedAt` equivalent).
- **Id strategy:** ids are `text` PKs (not uuid). The BDL importer already uses
  deterministic string ids (raw BDL numeric id as string), and the app treats
  ids as opaque strings — keep that. `profiles.id` is `uuid` referencing
  `auth.users(id)`.

**C. RLS policies (defined, enforcement deferred to Phase 4)**
- Enable RLS on all tables.
- Catalog tables (`teams`, `players`, `seasons`, `games`,
  `player_game_stats`, `prop_lines`, `injury_reports`, `lineup_reports`):
  `select` policy for `authenticated` and `anon`.
- `profiles`: `select`/`insert`/`update` where `id = auth.uid()`.
- Note: the admin (service-role) client used in Phases 1–3 bypasses RLS, so
  enabling RLS now does not affect catalog reads.

**D. Generated types**
- `supabase gen types typescript` output committed to the repo (location:
  `packages/database/src/supabase/types.ts` or similar). This becomes the new
  home for row types currently sourced from `@prisma/client`. (Consumers are
  repointed in Phase 3; Phase 1 only generates and commits them.)

**E. Package + env wiring**
- Install `@supabase/server` and `@supabase/supabase-js` (peer) in the workspace.
  (`@nestjs/common`/`@nestjs/core`, the NestJS-adapter peers, are already present.)
- Extend the zod env schema (`packages/configuration/src/lib/env.ts`) with:
  `SUPABASE_URL` (url), `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`,
  `SUPABASE_JWKS_URL` (url) — validated only by the apps that need them (the API).
- Update `.env.example` to document the new vars and the `supabase start` local
  URL/keys.

**F. Supabase client module (apps/api)**
- A `SupabaseModule` providing an injectable singleton admin client built from
  `createAdminClient()` (`@supabase/server/core`) using validated env. Exported
  for later phases. **Not yet wired into any service or route.**

### 5.3 Explicitly out of scope for Phase 1
- No repository interfaces, no service changes (Phase 3).
- No `withSupabase` guard on any route, no auth enforcement (Phase 4).
- No BDL/seed script changes (Phase 2).
- No Prisma removal (Phase 5).

### 5.4 Acceptance criteria
- `supabase start` brings up a local stack; `supabase db reset` applies all
  migrations cleanly.
- The generated types file compiles and is committed.
- `apps/api` builds and boots; `/api/health` and all existing routes behave
  exactly as before (still on mock/Prisma).
- `loadEnv` rejects a missing/malformed `SUPABASE_URL` for the API.
- Existing lint / typecheck / test suite still passes unchanged.

### 5.5 Risks / open items
- **BDL wipe guard (Phase 2 dependency):** the current guard keys on
  `DATABASE_URL` containing `localhost`. Phase 2 must re-derive "is this a local
  target?" from the Supabase URL (local stack API URL vs hosted
  `*.supabase.co`). Noted here so the Phase 1 schema/id decisions stay compatible.
- **Enum drift:** Postgres enums are stricter to alter than Prisma enums; ensure
  the SQL enum value spellings match the mappers in `packages/database/src/bdl/map.ts`.
- **`updated_at` trigger:** must exist on every table to satisfy the AGENTS.md
  "every table has updatedAt" rule without Prisma's `@updatedAt`.
