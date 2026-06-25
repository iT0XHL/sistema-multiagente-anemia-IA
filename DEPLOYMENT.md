# Despliegue de AnemIA en Railway

Guía para desplegar el sistema multiagente (PostgreSQL + Backend FastAPI +
Frontend React/Nginx) en [Railway](https://railway.com). Todo el proyecto está
preparado para correr **solo con contenedores**: en local con `docker compose`
y en producción con Railway, usando los **mismos** `Dockerfile.backend` y
`Dockerfile.frontend`.

> Resumen rápido: Railway no usa `docker-compose.yml`. Se crean **3 servicios**
> dentro de un mismo proyecto y cada uno se construye desde su Dockerfile.

---

## 1. Arquitectura en Railway

```
┌──────────────────────────────────────────────────────────────┐
│  Proyecto Railway: "AnemIA"                                    │
│                                                                │
│   ┌────────────┐     ┌──────────────────┐    ┌──────────────┐  │
│   │  Postgres  │◀────│  backend         │◀───│  frontend    │  │
│   │ (plugin)   │ SQL │  FastAPI + ML/XAI │HTTP│  Nginx (SPA) │  │
│   │            │     │  Dockerfile.back  │    │ Dockerfile.fr│  │
│   └────────────┘     └──────────────────┘    └──────────────┘  │
│      DATABASE_URL        :$PORT  /health         :$PORT  /      │
└──────────────────────────────────────────────────────────────┘
        navegador  ──HTTPS──▶  frontend  ──HTTPS──▶  backend
```

- **Postgres** — base de datos gestionada (plugin de Railway). El backend crea
  las tablas solo al arrancar (`init_db()` → `Base.metadata.create_all`), así
  que **no** hay que correr `schema.sql` a mano.
- **backend** — imagen de `Dockerfile.backend`. **Entrena los modelos en el
  build**, por lo que arranca al instante (no entrena en runtime). Escucha en
  el `$PORT` que inyecta Railway.
- **frontend** — imagen de `Dockerfile.frontend` (Webpack → Nginx). La URL del
  backend (`REACT_APP_API_URL`) se **incrusta en el build**; Nginx escucha en
  `$PORT`.

---

## 2. Pre-requisitos

- El repositorio en **GitHub** (Railway despliega desde el repo).
- Cuenta de Railway con un plan que dé memoria suficiente al backend
  (recomendado **≥ 1 GB RAM**: SHAP/LIME + XGBoost consumen memoria). El plan
  Hobby es suficiente; el Trial puede quedarse corto.
- La **API key de Gemini** (la misma del `.env`). Si se omite, el agente de
  recomendaciones cae a las reglas MINSA-CRED y el resto del sistema funciona
  igual.

> `.env` está en `.gitignore` y **no** se sube. En Railway las credenciales se
> configuran como *Variables* de cada servicio (ver §4).

---

## 3. Orden de despliegue (resuelve la dependencia circular)

El frontend necesita la URL del backend **en build**, y el backend necesita la
URL del frontend para **CORS en runtime**. Por eso el orden es:

1. **Postgres** → crear el plugin.
2. **backend** → desplegar y **generar su dominio público**.
3. **frontend** → fijar `REACT_APP_API_URL` = dominio del backend, desplegar y
   generar **su** dominio.
4. **backend** → fijar `CORS_ORIGINS` = dominio del frontend y **redeploy**
   (solo reinicia, no reconstruye).

---

## 4. Variables de entorno por servicio

### backend
| Variable | Valor | Notas |
|---|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Referencia al plugin (usa el nombre real del servicio Postgres). Se normaliza `postgres://`→`postgresql://` en `config.py`. |
| `GEMINI_API_KEY` | *(tu key)* | La misma del `.env`. |
| `CORS_ORIGINS` | `https://<dominio-frontend>` | Se rellena en el paso 4 del orden. Sin barra final. |
| `ENVIRONMENT` | `production` | |
| `GEMINI_MODELS` | `gemini-3.1-flash-lite,gemini-2.5-flash,gemini-2.5-flash-lite,gemini-3.5-flash` | Opcional (igual al default del código). |
| `GEMINI_MAX_OUTPUT_TOKENS` | `400` | Opcional. |
| `GEMINI_TEMPERATURE` | `0.4` | Opcional. |
| `DEFAULT_MODEL` | `random_forest` | Opcional. |
| `PORT` | *(no tocar)* | Lo inyecta Railway. |

### frontend
| Variable | Valor | Notas |
|---|---|---|
| `REACT_APP_API_URL` | `https://<dominio-backend>` | **Build-time**: Railway la pasa como `ARG` al Dockerfile. Sin barra final. Cambiarla exige **redeploy** (rebuild). |
| `PORT` | *(no tocar)* | Lo inyecta Railway; Nginx la usa vía `envsubst`. |

### Postgres
Sin configuración: el plugin expone `DATABASE_URL`, `PGHOST`, `PGUSER`, etc.

---

## 5. Pasos detallados (dashboard)

### 5.1 Crear proyecto y Postgres
1. Railway → **New Project** → **Deploy from GitHub repo** → elige el repo.
2. En el proyecto → **New** → **Database** → **Add PostgreSQL**. Anota el
   nombre del servicio (por defecto `Postgres`).

### 5.2 Servicio backend
1. Si Railway creó un servicio desde el repo, úsalo como **backend** (o **New**
   → **GitHub Repo** → mismo repo).
2. **Settings → Build**:
   - **Config-as-code / Railway Config File**: `railway.backend.json`
     (define el Dockerfile y el healthcheck `/health`). Si tu versión de
     Railway no expone ese campo, fija manualmente **Dockerfile Path** =
     `Dockerfile.backend` y **Root Directory** = `/`.
3. **Variables**: añade las de la tabla *backend* (sin `CORS_ORIGINS` todavía,
   o ponla temporalmente a `*`).
4. **Settings → Networking → Generate Domain**. Copia el dominio
   (`https://backend-...up.railway.app`).
5. Espera el primer build (entrena los modelos: unos minutos). Verifica
   `https://<dominio-backend>/health`.

### 5.3 Servicio frontend
1. **New** → **GitHub Repo** → mismo repo (segundo servicio).
2. **Settings → Build → Railway Config File**: `railway.frontend.json`
   (o **Dockerfile Path** = `Dockerfile.frontend`, **Root Directory** = `/`).
3. **Variables**: `REACT_APP_API_URL = https://<dominio-backend>` (del paso
   anterior).
4. **Generate Domain** y copia el dominio del frontend.
5. Deja que construya (Webpack incrusta la URL del backend en el bundle).

### 5.4 Cerrar el círculo (CORS)
1. Vuelve al **backend → Variables** y fija
   `CORS_ORIGINS = https://<dominio-frontend>`.
2. **Redeploy** del backend (reinicio rápido, sin rebuild).

---

## 6. Verificación post-despliegue

```bash
# 1) Backend vivo y modelos cargados
curl https://<dominio-backend>/health
curl https://<dominio-backend>/models/status   # trained: true en ambos modelos

# 2) Predicción de extremo a extremo
curl -X POST https://<dominio-backend>/agents/run \
  -H "Content-Type: application/json" \
  -d '{"case":{"Sexo":"F","EdadMeses":53.62,"Juntos":0,"SIS":1,"Qaliwarma":0,"Cred":1,"Suplementacion":1,"Consejeria":0,"Sesion":0,"Hemoglobina":13.7,"ProvinciaREN":"SANROMAN","DistritoREN":"JULIACA","AlturaREN":3877},"model":"random_forest"}'

# 3) Dashboard (persistencia en Postgres)
curl https://<dominio-backend>/dashboard        # database: "connected"
```

En el navegador: abre `https://<dominio-frontend>`, registra un caso y confirma
que el chat responde, el Panel muestra los casos y la tarjeta de persistencia
dice **"Conectada"** (Postgres) o **"Local"** (historial del navegador).

---

## 7. Notas y solución de problemas

- **El build del backend tarda**: entrena RF + XGBoost desde
  `data/dataset2024.csv` durante el build. Railway cachea la capa: solo
  reentrena si cambian `data/` o `ml/`.
- **El backend se reinicia / OOM**: súbele memoria al servicio. Inferencia con
  SHAP/LIME es lo más pesado.
- **CORS bloqueado en el navegador**: `CORS_ORIGINS` del backend debe ser
  **exactamente** el dominio del frontend (con `https://`, sin barra final), y
  hay que **redeploy** del backend tras cambiarla.
- **El frontend llama a `localhost:8000`**: se construyó sin
  `REACT_APP_API_URL`. Fíjala en el frontend y **redeploy** (es build-time).
- **`database: "unavailable"` en `/dashboard`**: revisa que `DATABASE_URL`
  referencie el plugin Postgres. El frontend igual funciona con historial local
  (IndexedDB).
- **No fijes `PORT` a mano**: Railway lo inyecta; backend (uvicorn) y frontend
  (Nginx) ya lo respetan.
- **CLI alternativa**: con [Railway CLI](https://docs.railway.com/develop/cli)
  → `railway up` por servicio. El flujo de variables y dominios es el mismo.

---

## 8. Local con Docker (referencia)

Para correr **todo** en local con un solo comando (incluida la API key de
Gemini desde `.env`):

```bash
docker compose up --build
```

- Frontend → http://localhost:3000
- API + Swagger → http://localhost:8000/docs
- PostgreSQL → host `localhost:5433` (interno `db:5432`)
- pgAdmin (opcional) → `docker compose --profile tools up` → http://localhost:5050

El backend recibe `GEMINI_API_KEY` y demás vía `env_file: .env` en el compose.
