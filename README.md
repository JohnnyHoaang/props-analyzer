# NBA Player Performance Analytics

## Overview

This project is an NBA player performance analytics platform built with TypeScript.

The application helps users analyze player performance before games by combining historical statistics, matchup information, projected minutes, injuries, and advanced metrics into transparent player projections.

This is **not** a live game tracking application.

The application updates before games and after games.

---

## Goals

The application should:

* Display today's NBA games
* Display player statistics
* Display historical trends
* Generate player projections
* Explain why a projection was generated
* Evaluate projection accuracy after games finish

---

## Tech Stack

Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* Recharts

Backend

* NestJS
* TypeScript

Monorepo

* Nx

Database

* PostgreSQL
* Prisma

Background Jobs

* BullMQ
* Redis

Prediction Model

* Rule-based baseline
* LightGBM (future)
* ONNX Runtime (future)

---

## Project Status

Current Phase

Phase 1

Goals

* Repository setup
* Mock data
* Database schema
* Authentication
* Basic UI

No real NBA APIs should be integrated until Phase 2.

---

## Local Development

By default the API reads mock data from `packages/database/src/mock-data/mock-data.json` — **no Postgres or Docker required**. Edit that JSON file and restart the API to change the dataset.

### Prerequisites

* Node.js 20+
* [pnpm](https://pnpm.io/)
* Docker (optional — only needed when `DATA_SOURCE=postgres`)

### First-time setup

```bash
# Install dependencies
pnpm install

# Copy environment variables (mock mode is the default)
cp .env.example .env
```

That's enough to run both apps. The committed `mock-data.json` ships with fictional teams, players, games, and box scores.

To regenerate `mock-data.json` from the TypeScript fixture generators (e.g. after changing procedural box-score logic):

```bash
pnpm --filter @props-analyzer/database db:export-mock-data
```

### Run the apps

Use two terminals from the repo root:

```bash
# Terminal 1 — NestJS API (port 3333, mock data by default)
pnpm nx serve @props-analyzer/api

# Terminal 2 — Next.js web app (port 3000)
pnpm nx dev @props-analyzer/web
```

| Service | URL |
| --- | --- |
| Web app | http://localhost:3000 |
| API | http://localhost:3333/api |
| Health check | http://localhost:3333/api/health |
| Swagger docs | http://localhost:3333/api/docs |

All player, team, and game endpoints work in mock mode without a database.

### Resetting the Nx cache

If `serve` or `dev` starts slowly or serves stale output, clear the Nx cache and
stop the daemon, then start the apps again. `nx reset` applies to the whole
workspace, so it covers both the API and the web app:

```bash
pnpm nx reset   # clears the cache and stops the daemon for all projects (api + web)

# then start the apps again
pnpm nx serve @props-analyzer/api
pnpm nx dev @props-analyzer/web
```

The first run after a reset rebuilds from scratch; subsequent runs are cached again.

### Using Postgres instead (optional)

Set `DATA_SOURCE=postgres` and uncomment `DATABASE_URL` in `.env`, then:

```bash
docker compose up -d
pnpm --filter @props-analyzer/database db:migrate:deploy
pnpm --filter @props-analyzer/database db:seed
```

The Postgres seed reads the same `mock-data.json` file, so both data sources stay in sync.

### Database commands

Run from the repo root via the `@props-analyzer/database` package:

```bash
pnpm --filter @props-analyzer/database db:export-mock-data  # Regenerate mock-data.json from TS fixtures
pnpm --filter @props-analyzer/database db:generate          # Regenerate Prisma client
pnpm --filter @props-analyzer/database db:migrate:dev       # Create/apply migrations in dev
pnpm --filter @props-analyzer/database db:migrate:deploy    # Apply migrations (CI/prod-like)
pnpm --filter @props-analyzer/database db:seed              # Load mock-data.json into Postgres
pnpm --filter @props-analyzer/database db:studio            # Open Prisma Studio
```

### Quality checks

```bash
# Lint, typecheck, test, and build all projects
pnpm nx run-many -t lint typecheck test build

# API e2e tests (starts the API automatically; requires seeded DB)
pnpm nx e2e @props-analyzer/api-e2e
```

---

## Documentation

See `docs/` for the full plan:

* `docs/PRODUCT_PLAN.md` — product vision and supported categories
* `docs/ARCHITECTURE.md` — system architecture and monorepo layout
* `docs/DATABASE_SCHEMA.md` — main tables and relationships
* `docs/API_REQUIREMENTS.md` — MVP data requirements and provider rules
* `docs/FEATURE_ENGINE.md` — feature engineering inputs
* `docs/PREDICTION_ENGINE.md` — baseline and future ML projection flow
* `docs/MVP_TASKS.md` — phase-by-phase build plan

`AGENTS.md` at the repo root defines project rules for anyone (human or agent) writing code here.

`PLAN.md` is the original background brain-dump this structure was distilled from — kept for context, not actively maintained.
