# AnemIA · Asistente Clínico para Anemia Infantil

Sistema multiagente con **Machine Learning** y **XAI** para el apoyo al diagnóstico
de anemia infantil en la región altoandina de **Puno, Perú**, donde la altitud
distorsiona la interpretación de la hemoglobina.

> ⚠️ **PROTOTIPO ACADÉMICO.** No reemplaza el diagnóstico ni el tratamiento realizado
> por profesionales de salud. Toda recomendación debe ser validada por personal médico
> autorizado.

---

## Arquitectura (tres capas)

- **Frontend:** React + TypeScript + TSX + **Webpack 5** + Tailwind CSS (mobile-first).
- **Backend:** FastAPI (Python) + SQLAlchemy + PostgreSQL, servido con **Uvicorn**.
- **Capa inteligente:** sistema multiagente + ML (Scikit-learn / XGBoost) + XAI (SHAP / LIME).
- **Entorno Python:** **`uv`** + `.venv`. **Docker Compose** para el sistema completo.

```
frontend/ (React+Webpack :3000)  →  backend/ (FastAPI :8000)  →  agents/ + ml/ + explainability/  →  PostgreSQL :5432
```

Detalle en [`docs/architecture.md`](docs/architecture.md).

---

## Sistema multiagente (6 + orquestador)

| # | Agente | Función |
|---|--------|---------|
| 1 | Data Agent (Registro Clínico) | Valida los datos del caso. |
| 2 | Preprocessing Agent (Clínico-Contextual) | Calcula la Hb corregida por altitud (OMS 2024 / MINSA). |
| 3 | Prediction Agent (Predictivo ML) | Estima la severidad (Normal/Leve/Moderada/Severa). |
| 4 | Explainability Agent (XAI) | Genera importancias SHAP y LIME. |
| 5 | Recommendation Agent (Terapéutico) | Recomendaciones referenciales MINSA-CRED. |
| 6 | Monitoring Agent (Coordinador) | Audita tiempos y consolida el reporte. |
| — | Orchestrator Agent | Coordina el flujo y arma el reporte unificado. |

---

## Cómo ejecutar

### Opción A · Docker (recomendado)
```bash
docker compose up --build      # el .env único de la raíz ya está incluido
```
- Frontend → http://localhost:3000
- API (Swagger) → http://localhost:8000/docs

### Opción B · Local

**Backend + ML (Python con `uv`):**
```bash
uv venv
uv pip install -r requirements.txt
uv run python ml/train_random_forest.py
uv run python ml/train_xgboost.py
uv run uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend (React + Webpack):**
```bash
cd frontend
npm install
npm start            # http://localhost:3000
```

> 📋 Comandos completos y guía de prueba manual en **[`COMANDOS_EJECUCION.md`](COMANDOS_EJECUCION.md)**.
> Guía técnica de instalación en [`docs/setup.md`](docs/setup.md).

---

## Endpoints de la API

```
GET  /health            POST /predict           POST /explain/shap
GET  /models/status     POST /agents/run        POST /explain/lime
GET  /dashboard         GET  /agents/logs
```

Detalle y ejemplos en [`docs/api.md`](docs/api.md).

---

## Dataset

`data/raw/dataset.csv` (44 053 registros reales de Puno). Problema: **clasificación
multiclase** de severidad de anemia (`Dx_anemia`). Variables y caso de ejemplo
(Juliaca) descritos en [`docs/models.md`](docs/models.md).

### Caso de ejemplo (Juliaca)
```
Sexo F · EdadMeses 53.62 · Hemoglobina 13.7 g/dL · AlturaREN 3877 m.s.n.m.
→ Hbc ≈ 11.40 g/dL (ajuste -2.30) → Diagnóstico: Normal (bajo riesgo)
```

---

## Estructura del repositorio

```
backend/   API FastAPI (core, api, schemas, services, models, utils, tests)
frontend/  SPA React + Webpack (pages, components, services, hooks, types, styles)
ml/        preprocesamiento, entrenamiento RF/XGB, evaluación e inferencia
explainability/  SHAP y LIME
agents/    6 agentes + orquestador
database/  schema.sql, seed.sql, migraciones (Alembic)
data/      raw / processed / sample
notebooks/ EDA, entrenamiento, XAI, demo del pipeline
docs/      documentación técnica
pyproject.toml · uv.lock · requirements.txt · docker-compose.yml
```

---

## Tecnologías

`React` · `TypeScript` · `TSX` · `Webpack 5` · `Tailwind CSS` · `Framer Motion` ·
`React Router DOM` · `Axios` · `Recharts` · `Lucide React` ·
`FastAPI` · `Uvicorn` · `SQLAlchemy` · `Alembic` · `PostgreSQL` ·
`scikit-learn` · `XGBoost` · `SHAP` · `LIME` · `uv` · `.venv` · `Docker Compose`.

---

## Documentación

[Arquitectura](docs/architecture.md) · [Setup](docs/setup.md) ·
[Base de datos](docs/database.md) · [Docker](docs/docker.md) ·
[Agentes](docs/agents.md) · [Modelos](docs/models.md) · [API](docs/api.md) ·
[Comandos y pruebas](COMANDOS_EJECUCION.md)

---

**Contexto académico:** Trabajo de investigación sobre anemia infantil en zonas
altoandinas del Perú · Grupo 07.
