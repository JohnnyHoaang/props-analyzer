# Database Schema

## Main Tables

```text
users
teams
players
seasons
games
player_game_stats
team_game_stats
player_advanced_stats
injury_reports
lineup_reports
player_roles
daily_features
model_predictions
model_versions
prediction_explanations
saved_analyses
analysis_groups
data_sources
data_import_runs
```

There is no `subscriptions` table — subscriptions are out of scope (see
`AGENTS.md`).

---

## Notes on specific tables

`injury_reports` and `lineup_reports` — never overwrite old reports. Each
update is a new row. Historical reports are required to rebuild what the
application knew at prediction time (see data-leakage rules below).

`daily_features` — the output of the feature engine (see
`FEATURE_ENGINE.md`), one row per player/game combination, versioned so a
prediction can always be traced back to the exact feature snapshot that
produced it.

`model_predictions` — every generated prediction should include:

```text
prediction_id
player_id
game_id
stat_type
target_value
projected_value
lower_bound
upper_bound
evidence_score
projected_minutes
model_version
feature_version
prediction_time
data_cutoff_time
lineup_status
injury_status
```

This ensures predictions can be reproduced later. `data_cutoff_time` in
particular must reflect only information available before the game — see
the data-leakage rules in `PREDICTION_ENGINE.md`.

---

## Relationships

```text
Team
  ↓
Players
  ↓
Player Game Stats  ←  Injury Reports, Lineup Reports
  ↓
Daily Features (rolling stats + context)
  ↓
Prediction (model_predictions + prediction_explanations)
```
