# MVP Data Requirements

## Required for MVP (Phase 2)

* Players
* Teams
* Schedule
* Final box scores
* Injuries
* Lineups (expected and confirmed)

Injuries and lineups are required starting in Phase 2, not deferred to a
later phase — the Phase 5 baseline projection's Role Adjustment term
depends on this data being available. See `docs/MVP_TASKS.md`.

## Future

* Advanced stats (usage%, true shooting%, etc. — can be calculated from
  box scores already ingested, so this is a calculation task more than a
  new data-source task)

---

## Provider Rules

The frontend must never call providers directly.

Only the backend communicates with external APIs.

Every provider must implement a common adapter interface.

Example

```text
Provider
  ↓
Provider Adapter
  ↓
Internal DTO
  ↓
Database
  ↓
REST API
```

Before any provider integration begins in Phase 2, confirm the provider's
terms of service permit this use case (storage, redistribution via API,
and use in a projection/analytics product). This is a real cost and legal
risk, not just an implementation detail — resolve it before writing an
adapter, not after.
