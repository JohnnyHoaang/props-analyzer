# Feature Engine

The feature engine converts historical statistics into prediction features.

Examples

Rolling Averages

* Last 3
* Last 5
* Last 10
* Last 20

Season

* Average
* Median
* Standard Deviation

Game Context

* Home
* Away
* Rest Days
* Back-to-Back
* Opponent Pace
* Opponent Defense

Player Context

* Projected Minutes
* Starter
* Usage
* Injuries

Injury and lineup data referenced here is ingested starting in Phase 2 (see
`docs/API_REQUIREMENTS.md` and `docs/MVP_TASKS.md`), so it is available by
the time the Phase 5 baseline projection needs it.

The feature engine should never depend on frontend code.
