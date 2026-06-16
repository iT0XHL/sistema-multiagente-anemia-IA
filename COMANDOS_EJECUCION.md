# AnemIA · Comandos de Ejecución y Guía de Prueba Manual

Guía paso a paso para **ejecutar** el sistema y **probarlo manualmente** (testing humano).
Distinción clave: **`uv`** gestiona el entorno/dependencias de Python; **`uvicorn`** es el
servidor ASGI que corre FastAPI. No son lo mismo.

---

## 0. Requisitos previos

| Herramienta | Versión | Verificar |
|-------------|---------|-----------|
| Python | ≥ 3.11 | `python --version` |
| uv | ≥ 0.4 | `uv --version` |
| Node.js | ≥ 20 | `node -v` |
| npm | ≥ 10 | `npm -v` |
| Docker (opcional) | ≥ 24 | `docker --version` |

> El proyecto incluye un **único `.env` en la raíz** con todas las variables
> (base de datos, backend y frontend). No necesitas crear ni copiar otro archivo.

---

## 1. Ejecución con Docker (todo en uno) — recomendado

```bash
docker compose up --build           # levanta db + backend + frontend
# con pgAdmin (opcional):
docker compose --profile tools up --build
```

| Servicio | URL |
|----------|-----|
| Frontend (React) | http://localhost:3000 |
| Backend (Swagger) | http://localhost:8000/docs |
| PostgreSQL | localhost:**5433** (postgres/postgres) · puerto interno del contenedor 5432 |
| pgAdmin (opcional) | http://localhost:5050 |

Detener:
```bash
docker compose down          # detiene
docker compose down -v       # detiene y borra el volumen de la base de datos
```

---

## 2. Ejecución local (sin Docker)

### 2.1. Entorno Python con uv + .venv
```bash
uv venv                              # crea .venv
# Activar (Windows PowerShell):
.venv\Scripts\activate
# Activar (Linux/macOS):
source .venv/bin/activate

uv pip install -r requirements.txt   # instala dependencias
```

### 2.2. Entrenar los modelos (genera ml/saved_models/*.joblib)
```bash
uv run python ml/train_random_forest.py
uv run python ml/train_xgboost.py
uv run python ml/evaluate_models.py
uv run python ml/compare_models.py
```

### 2.3. Levantar el backend (Uvicorn)
```bash
uv run uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```
> Funciona sin PostgreSQL: solo se desactiva la persistencia. Para habilitarla, ajusta
> `DATABASE_URL` en `.env` (host `localhost`) y ejecuta
> `psql "$DATABASE_URL" -f database/init.sql`.

### 2.4. Levantar el frontend (React + Webpack)
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

## 3. Pruebas automáticas

```bash
uv run pytest -q                     # lógica clínica + humo de API (8 pruebas)
```

---

## 4. Testing humano (checklist de validación manual)

### 4.1. Backend (sin frontend)
1. Abre **http://localhost:8000/docs** (Swagger).
2. `GET /health` → ejecutar → debe responder `status: "ok"` y listar los modelos como `trained: true`.
3. `POST /predict` → "Try it out" → usar el ejemplo precargado (caso Juliaca) → **Execute**.
   - ✅ Esperado: `diagnosis_code: "Normal"`, `hbc: 11.4`, `probability` alta (~98%).
4. `POST /explain/shap` → mismo caso → ✅ el factor con mayor peso debe ser **"Hemoglobina ajustada (Hbc)"**.
5. `POST /explain/lime` → mismo caso → ✅ devuelve `method: "lime"` y una lista de factores.
6. `POST /agents/run` → mismo caso → ✅ `ok: true` y `agent_logs` con los 6 agentes en estado `ok`.
7. `GET /dashboard` → ✅ responde (con DB conectada muestra conteos; sin DB, ceros).

### 4.2. Frontend (navegador móvil/responsive)
Abre **http://localhost:3000** y prueba la barra inferior de navegación:

| Paso | Acción | Resultado esperado |
|------|--------|--------------------|
| 1 | **Inicio** | Tarjeta animada + 4 features + pipeline de 6 agentes. |
| 2 | **Predicción** → "Caso ejemplo (Juliaca)" | El formulario se autocompleta. |
| 3 | Elegir modelo (Random Forest / XGBoost) | El selector se resalta. |
| 4 | "Enviar caso al sistema" | Aparece la Hbc (11.4), el diagnóstico **Normal** y la recomendación MINSA. |
| 5 | "Ver explicabilidad" | Gráficos SHAP (global + local) y LIME del caso. |
| 6 | **Agentes** | Flujo de los 6 agentes con tiempos (ms) y estado ✓. |
| 7 | **Panel** | Métricas, distribución por diagnóstico y logs recientes. |
| 8 | Ruta inexistente (ej. `/xyz`) | Página **404** con botón "Volver al inicio". |

### 4.3. Caso de prueba de anemia (para ver otro diagnóstico)
En el formulario, cambia **Hemoglobina = 9.5** y **Altitud = 4000** (Hbc ≈ 6.8) →
debe estimar **Anemia Severa/Moderada** con su recomendación de referencia/urgencia.

---

## 5. Variables de entorno relevantes (`.env`)

```env
DATABASE_URL=postgresql+psycopg2://postgres:postgres@db:5432/anemia_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=anemia_db
BACKEND_PORT=8000
FRONTEND_PORT=3000
REACT_APP_API_URL=http://localhost:8000
```

---

## 6. Problemas comunes

| Síntoma | Causa / Solución |
|---------|------------------|
| El front no conecta al backend | Verifica `REACT_APP_API_URL` y que el backend esté en :8000. |
| `/dashboard` muestra "Sin base de datos" | PostgreSQL no está corriendo; usa Docker o ajusta `DATABASE_URL`. |
| Primer `/predict` tarda | Si faltan modelos, `inference.py` los entrena al vuelo (una sola vez). |
| Error de codificación en consola Windows | Ejecuta con `PYTHONIOENCODING=utf-8` o usa Windows Terminal. |
