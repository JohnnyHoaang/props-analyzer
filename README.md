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
