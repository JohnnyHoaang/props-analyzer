# MVP Task Plan

Eight phases. Each phase needs approval before starting the next (see
`AGENTS.md`). Injuries/lineups were deliberately moved into Phase 2 (not
deferred to "future") because the Phase 5 baseline projection can't compute
its Role Adjustment term without them.

## Phase 1: Foundation

* Nx monorepo
* Next.js application
* NestJS API
* PostgreSQL database
* Prisma schema
* Mock data
* User authentication
* Basic dashboard
* Player page

Deliverable: a website where users can browse players and completed game
logs.

## Phase 2: Data Ingestion

* NBA data provider selection + terms-of-service review (before writing
  any adapter — see `docs/API_REQUIREMENTS.md`)
* Provider adapters (schedule, players, box scores, injuries, lineups)
* Schedule / player / game-log / team-stat importers
* Injury report importer
* Lineup report importer
* BullMQ import queues
* Import logging and duplicate prevention

Deliverable: NBA data, including injuries and lineups, is automatically
stored and updated.

## Phase 3: Analytics Dashboard

* Last-three, last-five, last-ten, last-20 averages
* Season average and median
* Standard deviation
* Home and away splits
* Charts
* Search
* Target comparison

Deliverable: users can analyze recent player performance without machine
learning.

## Phase 4: Context Data

* Rest days
* Back-to-backs
* Team pace
* Team defensive rating
* Role-change indicators
* Matchup features

(Injuries and lineups are already flowing from Phase 2 — this phase adds
the remaining schedule/matchup context.)

Deliverable: analysis includes circumstances surrounding the upcoming
game.

## Phase 5: Baseline Projection Engine

* Projected-minutes system
* Per-minute production
* Pace adjustments
* Opponent adjustments
* Role adjustments (backed by real injury/lineup data from Phase 2)
* Expected ranges
* Rule-based explanations

Deliverable: the app generates transparent numerical projections.

## Phase 6: Machine-Learning Model

* Historical feature dataset
* Chronological train/validation/test split
* Separate models by category
* LightGBM training pipeline
* ONNX export
* Node.js inference (`onnxruntime-node`)
* Model versioning

Deliverable: machine-learning projections can be compared against the
baseline.

## Phase 7: Evaluation

* Projection versus actual results
* MAE and bias reporting
* Range coverage
* Model comparison (baseline vs. ML)
* Feature monitoring
* Drift detection

Deliverable: you can prove whether the machine-learning model is
improving accuracy.

## Phase 8: Scaling

* Redis caching
* Saved analyses
* Comparison groups
* Monitoring
* Alerts

Deliverable: the application can support a larger number of users at a
predictable cost. (No subscription/billing work here — that's out of
scope; see `AGENTS.md`.)

---

## Suggested first release

The first public version should include only:

* Today's NBA games
* Player search
* Points, rebounds and assists
* Last-five and last-ten statistics
* Season average and median
* Standard deviation
* Home and away splits
* Projected minutes
* Basic opponent information
* Baseline projection
* Expected range
* Positive and risk factors
* Saved players

Do not initially include: complex parlays or combination analysis, live
in-game predictions, referee analysis, travel-distance modeling, large
language model explanations, deep neural networks, or dozens of
statistical categories. A focused first version will be easier to
validate.
