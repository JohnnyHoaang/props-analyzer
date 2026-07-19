# Prediction Engine

## Phase 5: Rule-based baseline (no machine learning)

```text
Projected Minutes
  ×
Per Minute Production
  ×
Opponent Adjustment
  ×
Pace Adjustment
  ×
Role Adjustment
```

The Role Adjustment term requires injury and lineup data (teammates
absent/returning, confirmed vs. expected starters). That data is ingested
in Phase 2, ahead of this phase, specifically so this formula has real
inputs from day one — see `docs/MVP_TASKS.md`.

Do not return a single number. Every projection includes a central
projection, a lower/upper expected range, and an evidence level.

## Phase 6+: Machine learning

```text
LightGBM
  ↓
ONNX Runtime
  ↓
Projection
  ↓
Expected Range
  ↓
Explanation
```

Separate models per stat category (points, rebounds, assists, etc.).
Combined categories (e.g. points + rebounds + assists) are calculated by
summing individual projections until backtesting justifies a dedicated
combined model.

Predictions should be generated once per player/game/category and cached
for all users — never recomputed per request.

## Data-leakage rules

Every feature must use only information available before the game.

Incorrect: using a player's final minutes from tonight's game to predict
tonight's points.

Correct: using projected minutes created before the game.

Other leakage sources to guard against: season averages that include the
game being predicted, injury updates posted after the game began, using a
confirmed lineup to backtest a projection that was actually generated
earlier. Every feature and prediction row carries a `data_cutoff_time`
(see `docs/DATABASE_SCHEMA.md`) so this can be audited.
