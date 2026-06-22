<div align="center">

<img src="docs/assets/anemia-logo.svg" alt="AnemIA" width="120" />

# AnemIA

**Asistente clínico multiagente para el diagnóstico de anemia infantil en zonas altoandinas**

Sistema de apoyo a la decisión clínica que combina **Machine Learning** e **IA explicable (XAI)** para estimar la severidad de anemia infantil en la región de **Puno, Perú**, aplicando la corrección de hemoglobina por altitud (OMS 2024 / RM-258-2020-MINSA).

![React](https://img.shields.io/badge/React-18-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker_Compose-2496ED?logo=docker&logoColor=white)

</div>

> [!WARNING]
> **Prototipo académico.** AnemIA no reemplaza el diagnóstico ni el tratamiento realizado por profesionales de salud. Toda recomendación generada debe ser validada por personal médico autorizado.

## Resumen

En la sierra peruana, la altitud eleva la concentración de hemoglobina y distorsiona la interpretación clínica: un valor "normal" a nivel del mar puede esconder una anemia a 3 800 m.s.n.m. AnemIA aborda este problema con un **pipeline de seis agentes** que valida el caso, corrige la hemoglobina por altitud, predice la severidad con modelos de ML, explica el porqué de la predicción y propone recomendaciones referenciales del MINSA, todo a través de una interfaz conversacional.

## Características

- **Corrección por altitud** — Hemoglobina ajustada (Hbc) según las tablas OMS 2024 / MINSA antes de cualquier clasificación.
- **Diagnóstico con ML** — Modelos Random Forest y XGBoost para clasificación multiclase (Normal · Leve · Moderada · Severa).
- **IA explicable (XAI)** — Importancia de factores por caso con SHAP y LIME, no solo el resultado.
- **Recomendaciones MINSA-CRED** — Pautas referenciales según severidad y grupo etario.
- **Interfaz conversacional** — SPA tipo chat (React) con formulario clínico, panel de resultados, reporte en PDF e historial local.
- **Arquitectura multiagente auditable** — Cada paso del pipeline registra su estado y tiempos.

## Arquitectura

Tres capas desacopladas, orquestadas con Docker Compose:

```
┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────────────────┐
│  Frontend (SPA)     │     │  Backend (API)       │     │  Capa inteligente           │
│  React + TS + TSX   │ ──▶ │  FastAPI + Uvicorn   │ ──▶ │  agents/ · ml/ · explainability/ │
│  Webpack 5 · :3000  │     │  SQLAlchemy · :8000  │     │  scikit-learn · XGBoost · SHAP/LIME │
└─────────────────────┘     └──────────┬───────────┘     └─────────────────────────────┘
                                        │
                                        ▼
                               PostgreSQL (:5432)
```

Detalle en [`docs/architecture.md`](docs/architecture.md).

## Sistema multiagente

El `Orchestrator` ejecuta los agentes de forma secuencial y se detiene ante el primer error crítico; el agente de monitoreo siempre corre al final para cerrar la auditoría.

| # | Agente | Rol |
|---|--------|-----|
| 1 | **Data** (Registro Clínico) | Valida los campos del caso clínico. |
| 2 | **Preprocessing** (Clínico-Contextual) | Calcula la hemoglobina corregida por altitud (Hbc). |
| 3 | **Prediction** (Predictivo ML) | Estima la severidad con Random Forest o XGBoost. |
| 4 | **Explainability** (XAI) | Genera importancias SHAP y LIME del caso. |
| 5 | **Recommendation** (Terapéutico) | Devuelve recomendaciones referenciales MINSA-CRED. |
| 6 | **Monitoring** (Coordinador) | Audita tiempos, consolida y cierra el reporte unificado. |

Detalle en [`docs/agents.md`](docs/agents.md).

## Primeros pasos

### Requisitos

- [Docker](https://www.docker.com/) y Docker Compose, **o bien**
- [Python 3.11–3.13](https://www.python.org/) (fijado a 3.12) gestionado con [`uv`](https://github.com/astral-sh/uv) + [Node.js 20+](https://nodejs.org/) para desarrollo local.

> [!NOTE]
> El proyecto usa un **único `.env` en la raíz**, leído tanto por el backend como por Webpack. Copia la plantilla antes de arrancar:
> ```bash
> cp .env.example .env
> ```

### Opción A — Docker (recomendado)

```bash
cp .env.example .env
docker compose up --build
```

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| API + Swagger | http://localhost:8000/docs |
| PostgreSQL | `localhost:5433` (mapeado; interno `5432`) |

### Opción B — Local

**Backend + ML (Python con `uv`):**

```bash
uv venv
uv pip install -r requirements.txt

# Entrena los modelos (requerido antes de iniciar la API)
uv run python ml/train_random_forest.py
uv run python ml/train_xgboost.py

# Inicia la API
uv run uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend (React + Webpack):**

```bash
cd frontend
npm install
npm start            # http://localhost:3000
```

> [!IMPORTANT]
> En modo local, **entrena los modelos antes de iniciar la API**: el backend carga los `.pkl` al arrancar y una predicción sin modelo devuelve error 500.

Comandos completos y guía de prueba manual en [`COMANDOS_EJECUCION.md`](COMANDOS_EJECUCION.md); instalación detallada en [`docs/setup.md`](docs/setup.md).

## API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET`  | `/health` | Estado del servicio. |
| `GET`  | `/models/status` | Disponibilidad de los modelos entrenados. |
| `POST` | `/predict` | Predicción de severidad para un caso. |
| `POST` | `/explain/shap` | Explicación SHAP del caso. |
| `POST` | `/explain/lime` | Explicación LIME del caso. |
| `POST` | `/agents/run` | Ejecuta el pipeline multiagente completo. |
| `GET`  | `/agents/logs` | Histórico de ejecuciones de agentes. |
| `GET`  | `/dashboard` | Métricas agregadas para el panel. |

Documentación interactiva en `/docs`; ejemplos en [`docs/api.md`](docs/api.md).

## Dataset

`data/dataset.csv` — 44 053 registros reales de Puno. El objetivo es la **clasificación multiclase** de la severidad de anemia (`Dx_anemia`). Una muestra de 200 filas está disponible en `data/sample/sample_200.csv`. Variables y modelado en [`docs/models.md`](docs/models.md).

**Caso de ejemplo (Juliaca):**

```
Sexo F · Edad 53.62 meses · Hb 13.7 g/dL · Altitud 3877 m.s.n.m.
→ Hbc ≈ 11.40 g/dL (ajuste −2.30) → Diagnóstico: Normal (bajo riesgo)
```

## Estructura del repositorio

```
backend/          API FastAPI (core, api, schemas, services, models, utils, tests)
frontend/         SPA React + Webpack (pages, components, hooks, services, types)
agents/           6 agentes + orquestador
ml/               preprocesamiento, entrenamiento RF/XGB, evaluación e inferencia
explainability/   SHAP y LIME
database/         schema.sql, seed.sql, migraciones (Alembic)
data/             dataset y muestra
notebooks/        EDA, entrenamiento, XAI y demo del pipeline
docs/             documentación técnica
docker-compose.yml · Dockerfile.* · pyproject.toml · requirements.txt
```

## Tecnologías

**Frontend** — React 18 · TypeScript · Webpack 5 · Tailwind CSS · Framer Motion · React Router · Axios · Recharts · Lucide

**Backend** — FastAPI · Uvicorn · SQLAlchemy · Alembic · PostgreSQL · Pydantic

**ML / XAI** — scikit-learn · XGBoost · SHAP · LIME · pandas · NumPy

**Tooling** — `uv` · Docker Compose

## Notebooks

Exploración y experimentación reproducible en [`notebooks/`](notebooks/):

1. `01_eda.ipynb` — análisis exploratorio
2. `02_training_random_forest.ipynb` — entrenamiento Random Forest
3. `03_training_xgboost.ipynb` — entrenamiento XGBoost
4. `04_shap_lime_explainability.ipynb` — explicabilidad
5. `05_demo_pipeline.ipynb` — demostración del pipeline completo

## Documentación

[Arquitectura](docs/architecture.md) · [Setup](docs/setup.md) · [Base de datos](docs/database.md) · [Docker](docs/docker.md) · [Frontend](docs/frontend.md) · [Agentes](docs/agents.md) · [Modelos](docs/models.md) · [API](docs/api.md)

---

<div align="center">

Proyecto académico · Inteligencia Artificial · Ciclo VII · Ingeniería de Sistemas

</div>
