# Project Rules

## General

This project is an NBA player performance analytics platform.

The application is designed around pre-game analysis.

Do not build live game tracking.

---

## Technology

* TypeScript everywhere
* Nx monorepo
* Next.js
* NestJS
* PostgreSQL
* Prisma
* BullMQ
* Redis

---

## Coding Standards

* Strict TypeScript
* No `any`
* Use interfaces and types
* Small reusable services
* Dependency Injection
* SOLID principles
* Clean Architecture

---

## API Rules

Never call external providers from the frontend.

Always use backend adapters.

Do not expose provider response objects.

Convert everything into internal DTOs.

---

## Database Rules

Use Prisma.

Every table must include:

* id
* createdAt
* updatedAt

Never hard-delete production data.

---

## Prediction Rules

Phase 5 uses a rule-based projection engine (see `docs/MVP_TASKS.md`).

Do not implement machine learning until Phase 6.

The rule-based baseline's Role Adjustment term depends on injury and lineup
data — that data must already be flowing (Phase 2) before Phase 5 starts.

Every projection should include:

* projectedValue
* lowerRange
* upperRange
* projectedMinutes
* explanation
* evidenceScore

---

## Out of Scope

Subscriptions / paid tiers are **not** part of the current plan. The MVP and
all phases in `docs/MVP_TASKS.md` are free. Do not add billing, tier gating,
or usage limits without an explicit product decision to bring this back in
scope.

---

## Development Workflow

Before coding:

1. Read all files in `/docs`.
2. Produce an implementation plan.
3. Wait for approval.

After coding:

* Run lint
* Run type check
* Run tests
* Summarize changed files

Do not begin the next phase without approval.

---

## Long-Term Goal

The application should be modular so that data providers, prediction models and frontend features can be replaced independently without changing the rest of the system.
