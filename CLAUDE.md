# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

AnemIA is a multi-agent clinical decision support system for pediatric anemia diagnosis in the high-altitude Puno region of Peru. It applies altitude-corrected hemoglobin (OMS 2024 / RM-258-2020-MINSA) and ML models (Random Forest + XGBoost) with XAI (SHAP + LIME) explanations.

**Stack:** React 18 + TypeScript + Webpack 5 (frontend) · FastAPI + SQLAlchemy + PostgreSQL (backend) · scikit-learn + XGBoost + SHAP + LIME (ML/XAI) · Python managed with `uv`.

## Commands

### Option A — Docker (full stack)
```bash
docker compose up --build
```
Frontend: http://localhost:3000 | API + Swagger: http://localhost:8000/docs | PostgreSQL mapped to host port **5433** (avoids conflicts).

### Option B — Local development

**Python (requires Python 3.11–3.13, pinned to 3.12 via `.python-version`):**
```bash
uv venv
uv pip install -r requirements.txt

# Train ML models first (required before starting the API)
uv run python ml/train_random_forest.py
uv run python ml/train_xgboost.py

# Start the API
uv run uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm start        # http://localhost:3000
```

### Frontend additional commands
```bash
npm run build        # production bundle
npm run type-check   # tsc --noEmit (no emitting, type errors only)
npm run css          # recompile Tailwind CSS manually
```

### Tests
```bash
uv run pytest                        # all tests in backend/tests/
uv run pytest -k "not slow"          # skip tests that need trained models
uv run pytest backend/tests/test_api.py::test_health  # single test
```

Tests are in `backend/tests/`. The `slow` marker (`@pytest.mark.slow`) flags tests that require trained `.pkl` models in `ml/saved_models/`.

## Architecture

```
frontend/ (React+Webpack :3000)  →  backend/ (FastAPI :8000)  →  agents/ + ml/ + explainability/  →  PostgreSQL :5432
```

### Agents pipeline (`agents/`)

The `Orchestrator` (`agents/orchestrator_agent.py`) runs agents sequentially and stops on the first error:

1. **DataAgent** — validates clinical case fields
2. **PreprocessingAgent** — computes altitude-corrected Hb (`Hbc`)
3. **PredictionAgent** — calls the ML model (RF or XGBoost)
4. **ExplainabilityAgent** — runs SHAP + LIME
5. **RecommendationAgent** — returns MINSA-CRED treatment references
6. **MonitoringAgent** — always runs last; audits timing and consolidates

Each agent extends `agents/base.py::Agent`, implements `process(context)`, and mutates the shared `context` dict. The orchestrator is triggered via `backend/app/services/pipeline_service.py::run_pipeline()`.

### ML pipeline (`ml/`)

`ml/preprocessing_pipeline.py` is the **single source of truth** for:
- Altitude adjustment table (per OMS 2024)
- `classify_anemia()` — WHO cutoff-based diagnosis by age group
- `case_to_frame()` — converts a dict case to a sklearn-compatible DataFrame
- `build_preprocessor()` — `ColumnTransformer` (StandardScaler for numeric, OneHotEncoder for categorical, passthrough for binary)

Training scripts (`ml/train_random_forest.py`, `ml/train_xgboost.py`) save `.pkl` models to `ml/saved_models/`. The backend loads them at startup via `backend/app/services/model_loader.py`.

### Backend (`backend/app/`)
- `core/config.py` — Pydantic `Settings` reading the single root `.env` file
- `core/database.py` — SQLAlchemy engine + `init_db()`
- `api/routes_*.py` — one router per domain (health, prediction, explainability, agents, dashboard)
- `services/pipeline_service.py` — thin wrapper that calls `Orchestrator` + `persist_run()`

### Frontend (`frontend/src/`)
- API calls centralized in `services/api.ts` (Axios, base URL from `REACT_APP_API_URL`)
- Pages in `pages/` map to React Router routes; hooks in `hooks/` handle API state
- `CaseContext.tsx` shares the active clinical case across pages
- Tailwind CSS is compiled separately by the `css` script (not via webpack loaders) due to a path compatibility issue with `!` characters in the Windows project path

## Key constraints

- **Models must be trained before starting the API locally.** The backend's `model_loader` imports `.pkl` files; a missing model causes a 500 error on `/predict`.
- **Python version must stay 3.11–3.13** (pinned 3.12). NumPy 2.1.3 and psycopg2-binary 2.9.10 have no wheels for 3.14+.
- **Single `.env` at repo root.** Both the backend (`pydantic-settings`) and webpack config (`loadEnv()`) read `../.env` relative to their location. Do not create per-service `.env` files.
- **PostgreSQL host port is 5433** (Docker) to avoid conflicts with a local PG on 5432. Inside Docker containers, the DB is reached at `db:5432`.
- Webpack `client` and `liveReload` are disabled in `devServer` because the Windows project path contains `!`, which Webpack reserves as a loader separator. Hot reload is unavailable locally; use Ctrl+R.
