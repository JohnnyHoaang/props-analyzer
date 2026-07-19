# System Architecture

Data Providers

↓

Data Import Workers

↓

PostgreSQL

↓

Feature Engine

↓

Projection Engine

↓

REST API

↓

Next.js Frontend

---

## Applications

apps/

* web
* api
* worker

packages/

* database
* shared-types
* validation
* analytics
* feature-engineering
* prediction-runtime
* api-client
* ui
* configuration
* data-providers

---

## Responsibilities

### `apps/web`

* Dashboard
* Search
* Player Pages
* Charts
* User Accounts

### `apps/api`

* Authentication
* Players
* Games
* Statistics
* Projections

### `apps/worker`

* Data imports
* Feature calculations
* Projection generation

### `packages/analytics`

* Mean, median, standard deviation
* Rolling averages
* Trend calculations
* Range calculations

### `packages/data-providers`

* Provider adapters (schedule, box scores, injuries, lineups)
* Converts external provider responses into internal DTOs
* Only `apps/worker` and `apps/api` depend on this package — never `apps/web`

### `packages/prediction-runtime`

* ONNX model loading
* Feature ordering
* Prediction execution
* Model-version checks

Keeping data collection, storage, feature engineering, prediction and
presentation as separate layers makes the application easier to test and
improve independently.
