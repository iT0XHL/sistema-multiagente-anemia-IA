# AnemIA · Comandos de Ejecución y Guía de Prueba Manual

Guía paso a paso para **ejecutar** el sistema y **probarlo manualmente** (testing humano).
Distinción clave: **`uv`** gestiona el entorno/dependencias de Python; **`uvicorn`** es el
servidor ASGI que corre FastAPI. No son lo mismo.

---

## 0. Requisitos previos

| Herramienta       | Versión | Verificar          |
| ----------------- | ------- | ------------------ |
| Python            | ≥ 3.11  | `python --version` |
| uv                | ≥ 0.4   | `uv --version`     |
| Node.js           | ≥ 20    | `node -v`          |
| npm               | ≥ 10    | `npm -v`           |
| Docker (opcional) | ≥ 24    | `docker --version` |

> El proyecto usa un **único `.env` en la raíz** (base de datos, backend, frontend y la
> API key de Gemini). Cópialo desde la plantilla: `cp .env.example .env`.
> El agente de recomendaciones usa **Google Gemini** si `GEMINI_API_KEY` está definida;
> si no, cae a reglas MINSA (el sistema funciona igual). Ver §5.

---

## 1. Ejecución local (recomendado)

### 1.1. Entorno Python con uv + .venv

```bash
uv venv                              # crea .venv
# Activar (Windows PowerShell):
.venv\Scripts\activate
# Activar (Linux/macOS):
source .venv/bin/activate

uv pip install -r requirements.txt   # backend + ML + SMOTE (imbalanced-learn) + httpx
```

> Si PowerShell bloquea la activación por política de ejecución, usa el intérprete del
> venv directamente, p. ej. `.\.venv\Scripts\python.exe -m uvicorn ...`.

### 1.2. (Opcional) Regenerar el dataset limpio

El repo ya incluye `data/dataset2024.csv` limpio. Solo si partes del export crudo de
RENIPRESS, vuelve a generarlo (imputa vacíos de programas sociales, normaliza etiquetas,
recorta rangos y deduplica; respalda el crudo en `data/raw/`):

```bash
uv run python ml/etl_clean_dataset.py
```

### 1.3. Entrenar los modelos (genera ml/saved_models/\*.joblib)

Entrena con **ambos datasets combinados** (`data/dataset2025.csv` + `data/dataset2024.csv`,
≈ 82k registros tras eliminar los duplicados exactos), split 80/20 estratificado +
**SMOTE solo sobre el conjunto de entrenamiento**:

```bash
uv run python ml/train_random_forest.py
uv run python ml/train_xgboost.py
uv run python ml/compare_models.py    # opcional: compara y elige el mejor por F1 macro
```

> Las métricas (accuracy, balanced accuracy, F1, ROC-AUC, PR-AUC, MCC, kappa, matriz de
> confusión, por clase, train/test) se guardan en `ml/saved_models/*_metrics.json` y se
> exponen en `GET /models/status` para el dashboard.

### 1.4. Levantar el backend (Uvicorn)

```bash
uv run uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

> Funciona sin PostgreSQL: solo se desactiva la persistencia (el dashboard de métricas de
> modelos sí funciona, porque lee los `.joblib`). Para habilitar la BD en local, ajusta
> `DATABASE_URL` en `.env` a `localhost:5433` y ejecuta `psql "$DATABASE_URL" -f database/init.sql`.

### 1.5. Levantar el frontend (React + Webpack)

```bash
cd frontend
npm install
npm start                            # http://localhost:3000
```

Build de producción:

```bash
cd frontend
npm run build                        # genera frontend/dist/
npm run type-check                   # verificación de tipos (tsc --noEmit)
```

---

## 2. Ejecución con Docker (alternativa)

```bash
docker compose up --build           # levanta db + backend + frontend
# con pgAdmin (opcional):
docker compose --profile tools up --build
```

| Servicio           | URL                                                                         |
| ------------------ | --------------------------------------------------------------------------- |
| Frontend (React)   | http://localhost:3000                                                       |
| Backend (Swagger)  | http://localhost:8000/docs                                                  |
| PostgreSQL         | localhost:**5433** (postgres/postgres) · puerto interno del contenedor 5432 |
| pgAdmin (opcional) | http://localhost:5050                                                       |

> En Docker, `docker-compose.yml` carga el `.env` de la raíz en el backend vía `env_file`,
> así que el agente usa **Gemini** si `GEMINI_API_KEY` está definida (si no, el **fallback MINSA**).
> No pongas la clave en `docker-compose.yml`; déjala en `.env`.

Detener:

```bash
docker compose down          # detiene
docker compose down -v       # detiene y borra el volumen de la base de datos
```

---

## 3. Pruebas automáticas

```bash
uv run pytest -q                     # lógica clínica + humo de API (9 pruebas)
```

---

## 4. Testing humano (checklist de validación manual)

### 4.1. Backend (sin frontend)

1. Abre **http://localhost:8000/docs** (Swagger).
2. `GET /health` → debe responder `status: "ok"` y listar los modelos como `trained: true`.
3. `GET /models/status` → ✅ cada modelo trae `metrics` con bloques `test`/`train`,
   `confusion_matrix`, `per_class` y `class_distribution`.
4. `POST /predict` → "Try it out" → caso Juliaca → **Execute**.
   - ✅ Esperado: `diagnosis_code: "Normal"`, `hbc: 11.06`, `probability` alta (~98–100%).
5. `POST /explain/shap` → mismo caso → ✅ el factor con mayor peso debe ser **"Hemoglobina ajustada (Hbc)"**.
6. `POST /explain/lime` → mismo caso → ✅ devuelve `method: "lime"` y una lista de factores.
7. `POST /agents/run` → mismo caso → ✅ `ok: true`, `agent_logs` con los 6 agentes en `ok`, y
   `recommendation.engine` = `gemini:<modelo>` (con API key) o `fallback` (sin ella).
8. `GET /dashboard` → ✅ responde (con DB conectada muestra conteos; sin DB, ceros).

### 4.2. Frontend (navegador móvil/responsive)

Abre **http://localhost:3000** y prueba la barra inferior de navegación:

| Paso | Acción                                    | Resultado esperado                                                          |
| ---- | ----------------------------------------- | --------------------------------------------------------------------------- |
| 1    | **Chat / Inicio**                         | Mensaje de bienvenida y formulario clínico.                                 |
| 2    | "Caso ejemplo (Juliaca)"                  | El formulario se autocompleta.                                              |
| 3    | Elegir modelo (Random Forest / XGBoost)   | El selector se resalta.                                                     |
| 4    | "Enviar caso al sistema"                  | Aparece la Hbc (**11.06**), el diagnóstico **Normal** y la recomendación.   |
| 5    | Revisar la recomendación                  | Si hay API key, texto **generado por IA (Gemini)**; si no, pautas MINSA.    |
| 6    | "Ver explicabilidad"                      | Gráficos SHAP (global + local) y LIME del caso.                            |
| 7    | **Agentes**                               | Flujo de los 6 agentes con tiempos (ms) y estado ✓.                         |
| 8    | **Panel (Dashboard)**                     | **Rendimiento de modelos**: métricas train/test, matriz de confusión y barras por clase. |
| 9    | Ruta inexistente (ej. `/xyz`)             | Página **404** con botón "Volver al inicio".                               |

### 4.3. Caso de prueba de anemia (para ver otro diagnóstico)

En el formulario, cambia **Hemoglobina = 9.5** y **Altitud = 4000** (Hbc ≈ **6.76**) →
debe estimar **Anemia Severa/Moderada** con su recomendación de referencia/urgencia.

---

## 5. Variables de entorno relevantes (`.env`)

```env
# Base de datos / backend / frontend
DATABASE_URL=postgresql+psycopg2://postgres:postgres@db:5432/anemia_db
REACT_APP_API_URL=http://localhost:8000
DEFAULT_MODEL=random_forest          # random_forest | xgboost

# Agente de recomendaciones (Google Gemini)
GEMINI_API_KEY=                      # vacío → usa reglas MINSA (fallback)
GEMINI_MODELS=gemini-3.1-flash-lite,gemini-2.5-flash,gemini-2.5-flash-lite,gemini-3.5-flash
GEMINI_MAX_OUTPUT_TOKENS=400         # techo de tokens de salida (recomendaciones cortas)
GEMINI_TEMPERATURE=0.4
```

> La cadena `GEMINI_MODELS` se intenta **en orden**: si un modelo falla (error, cuota,
> bloqueo), se prueba el siguiente; si todos fallan o no hay key, se usan las reglas MINSA.

---

## 6. Problemas comunes

| Síntoma                                       | Causa / Solución                                                       |
| --------------------------------------------- | ---------------------------------------------------------------------- |
| El front no conecta al backend                | Verifica `REACT_APP_API_URL` y que el backend esté en :8000.           |
| `/dashboard` muestra "Sin base de datos"      | PostgreSQL no está corriendo; usa Docker o ajusta `DATABASE_URL`.      |
| La recomendación dice "MINSA" y esperabas IA  | Falta `GEMINI_API_KEY` o la API falló; revisa la key en `.env` y reinicia el backend. |
| Primer `/predict` tarda                       | Si faltan modelos, `inference.py` los entrena al vuelo (una sola vez). |
| `ModuleNotFoundError: imblearn` al cargar     | Falta instalar deps: `uv pip install -r requirements.txt` (incluye imbalanced-learn). |
| Error de codificación en consola Windows      | Usa Windows Terminal o `PYTHONIOENCODING=utf-8`.                       |
