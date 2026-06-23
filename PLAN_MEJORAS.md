# Plan — ETL 2024, reentrenamiento balanceado, agente Gemini y dashboard de métricas

## Contexto

AnemIA hoy se entrena con `data/dataset.csv` (2025, limpiado a mano) y reporta accuracy ~0.9997
— una cifra inflada porque `Dx_anemia` es casi una función determinista de `Hbc`, que a su vez es
feature (cuasi-fuga de etiqueta). Se quiere migrar a los datos de 2024 y mejorar varias piezas:

1. **`data/dataset2024.csv`** llegó crudo (36 columnas). Verificado con datos reales: **está
   completamente etiquetado** (Normal 38 171 · Leve 4 459 · Moderada 1 485 · Severa 64), pero tiene
   etiquetas con espacios ("Anemia Leve") y **3 201 vacíos en `Juntos`/`SIS`/`Qaliwarma`**. Hay que
   construir un ETL que impute (antes que eliminar), normalice y deje un CSV limpio en su sitio.
2. El **agente de recomendaciones** es un diccionario hardcodeado; se quiere convertir en un agente
   de IA vía **Gemini API**, con recomendaciones cortas, tokens limitados y una **cadena de modelos**
   de respaldo.
3. Los modelos deben **reentrenarse con el 2024 limpio**, con **SMOTE solo en train** (split
   estratificado 80/20 primero) por el fuerte desbalance (Severa = 0.14 %).
4. Hay que **ampliar las métricas** (hoy solo accuracy / f1) y **mostrarlas visualmente en el
   dashboard** (train vs test, matriz de confusión, métricas por clase).
5. Hallazgo a corregir: el `Hbc` del dataset usa una **fórmula continua por altitud**, distinta de
   la **tabla escalonada** del runtime (`ml/preprocessing_pipeline.py`) → train/serve skew. Se
   decidió **alinear el runtime a la fórmula continua**.

### Decisiones confirmadas con el usuario

- **Balanceo:** split 80/20 estratificado → **SMOTE solo sobre train**; test intacto.
- **Gemini:** cadena configurable de modelos, orden: `gemini-3.1-flash-lite` → `gemini-2.5-flash`
  → `gemini-2.5-flash-lite` → `gemini-3.5-flash`. `max_output_tokens ≈ 400`.
- **Red de seguridad:** si no hay API key o **todos** los modelos fallan → caer a las reglas MINSA
  actuales (el pipeline nunca se rompe).
- **Hbc:** alinear el runtime a la fórmula continua del dataset.

---

## Parte 1 — ETL / limpieza de `dataset2024.csv`

**Nuevo:** `ml/etl_clean_dataset.py` (importable + CLI) y notebook fino `notebooks/00_etl_cleaning.ipynb`
que lo invoca y muestra el reporte de calidad.

Pasos (reutiliza constantes de `ml/preprocessing_pipeline.py`: `FEATURE_COLUMNS`, `CLASS_ORDER`,
`BINARY_FEATURES`, `NUMERIC_FEATURES`, `TARGET`):

1. Cargar crudo `data/dataset2024.csv` (`encoding="utf-8-sig"`), `strip()` de cabeceras.
2. **Backup** del original a `data/raw/dataset2024_original.csv` antes de sobrescribir (reversible).
3. Seleccionar las 17 columnas canónicas (las de `FEATURE_COLUMNS` + `Hbc` + `Dx_anemia`).
4. Normalizar `Dx_anemia`: `"Anemia Leve"→"AnemiaLeve"`, etc. (mapa a `CLASS_ORDER`); filas con
   etiqueta no mapeable se descartan (deben ser ~0).
5. Coerción de tipos: `EdadMeses/Hemoglobina/AlturaREN/Hbc` a float; binarias a `Int`.
6. **Imputación (antes de eliminar):**
   - Binarias `Juntos/SIS/Qaliwarma` (3 201 vacíos): `SimpleImputer(strategy="most_frequent")`
     (moda); documentar conteo imputado.
   - Numéricas con NaN residual: mediana.
   - Solo se eliminan filas si falta el target o un valor clínico irrecuperable
     (`Hemoglobina`/`AlturaREN`/`EdadMeses`).
7. Validación de rangos plausibles (Hemoglobina 3–20, AlturaREN 0–5000, EdadMeses 0–72); clip/flag
   en vez de borrar cuando sea posible. Quitar duplicados exactos.
8. Imprimir reporte: filas in/out, nº imputados por columna, distribución de clases.
9. Escribir el CSV limpio **in place** en `data/dataset2024.csv`.

**Repunte de entrenamiento:** en `ml/_bootstrap.py` cambiar
`DATA_RAW = .../data/dataset.csv` → `.../data/dataset2024.csv`.

---

## Parte 2 — Reentrenamiento con SMOTE + métricas ampliadas

**Deps:** añadir `imbalanced-learn` a `requirements.txt` y `pyproject.toml`; mover `httpx` a deps
principales (ya está en dev).

**`ml/train_random_forest.py` y `ml/train_xgboost.py`:**

- Mantener `train_test_split(test_size=0.2, stratify=y)` (ya existe) — **primero**.
- Construir pipeline `imblearn.pipeline.Pipeline`: `preprocessor` (ColumnTransformer existente) →
  **`SMOTE(random_state=42)`** → estimador. SMOTE se aplica **solo al ajustar con train**; el test
  pasa por `predict` sin resampling. (Si SMOTE sobre one-hot de `ProvinciaREN/DistritoREN` genera
  ruido, alternativa `SMOTENC` con índices categóricos — decidir en implementación validando.)
- Quitar `class_weight`/`sample_weight` (SMOTE ya balancea) para no doble-corregir.
- Calcular métricas en **test** y también en **train original (sin resamplear)** para detectar
  overfitting. Guardar ambos bloques.

**`ml/evaluate_models.py` — `compute_metrics(y_true, y_pred, y_proba, label_encoder)`** (extender
firma para recibir probabilidades). Añadir, además de accuracy/f1_macro/f1_weighted/confusion_matrix/
per_class ya presentes:

- `balanced_accuracy` (`balanced_accuracy_score`)
- `cohen_kappa` (`cohen_kappa_score`)
- `mcc` (`matthews_corrcoef`)
- `roc_auc_macro_ovr` (`roc_auc_score(..., multi_class="ovr", average="macro")`) — usa `y_proba`
- `pr_auc_macro` (`average_precision_score` OvR macro) — usa `y_proba`
- `log_loss`
- `specificity` por clase (derivada de la matriz de confusión)

> Nota: el docstring actual de `evaluate_models.py` ya promete "ROC-AUC OvR" pero **no se calcula**;
> esta parte cierra esa brecha.

**Estructura del artefacto** (`*.joblib` y `*_metrics.json`): envolver en
`{ "test": {...}, "train": {...}, "class_distribution": {"raw": {...}, "after_smote": {...}},
"split": {"test_size":0.2,"n_train":..,"n_test":..} }`, **conservando** `accuracy` y `f1_macro` en el
nivel superior (compat con el dashboard actual). `ml/inference.py:model_status()` ya reenvía
`artifact["metrics"]`, así que el backend expone lo nuevo sin cambios.

El notebook genera PNGs opcionales en `ml/saved_models/plots/` (heatmap + barras) para el informe;
el dashboard usa los datos en vivo vía API.

---

## Parte 3 — Backend: exponer métricas ricas

- `ml/inference.py:model_status()` ya devuelve `metrics` del artefacto → fluye solo.
- Revisar el endpoint de estado de modelos (`backend/app/api/routes_health.py` → `/models/status`)
  y su schema; asegurar que `metrics` sea `Dict[str, Any]` passthrough (sin recortar los campos
  nuevos). Ajustar `backend/app/schemas/*` si tipa el sub-objeto.
- No hace falta endpoint nuevo: el frontend ya consume `/models/status` vía `getModelStatus()`.

---

## Parte 4 — Alinear `Hbc` a fórmula continua

En `ml/preprocessing_pipeline.py`:

- Derivar la fórmula continua ajustándola a los pares `(AlturaREN, Hbc−Hemoglobina)` del dataset
  (polinomio grado 2–3 por mínimos cuadrados; validar residual medio < 0.05 g/dL). Implementar
  `altitude_adjustment(altitude_m)` con esa función continua **reemplazando** la tabla escalonada
  `_ALTITUDE_ADJUSTMENT`. Mantener nombre y firma de `altitude_adjustment` y
  `correct_hemoglobin_for_altitude` → `preprocessing_agent.py` y `case_to_frame()` se benefician sin
  cambios. Así el `Hbc` de entrenamiento (dataset) e inferencia (runtime) coinciden.
- Ajustar el caso de ejemplo de README/COMANDOS si el número de Hbc cambia (cosmético).

---

## Parte 5 — Agente de recomendaciones con Gemini

**Config** (`backend/app/core/config.py`, y replicar lectura por env en el cliente de agentes):

- `gemini_api_key: str = ""`
- `gemini_models: str = "gemini-3.1-flash-lite,gemini-2.5-flash,gemini-2.5-flash-lite,gemini-3.5-flash"`
- `gemini_max_output_tokens: int = 256`
- `gemini_temperature: float = 0.4`

Añadir estas claves al `.env` (y recrear un `.env.example` mínimo documentándolas, ya que el repo usa
un único `.env`).

**Cliente desacoplado:** `agents/llm/gemini_client.py` — usa **httpx** contra la REST API
(`v1beta/models/{model}:generateContent`), leyendo las env vars directamente (los agentes no importan
`backend.config`). Función `generate(prompt, *, models, max_tokens, temperature) -> str | None`:
itera la **cadena de modelos** en orden y, ante error HTTP/cuota/parseo, pasa al siguiente. Usar REST
con httpx evita acoplarnos a versiones del SDK y a la disponibilidad exacta de nombres de modelo.

**`agents/recommendation_agent.py`:**

- Renombrar el dict actual a `FALLBACK_RECOMMENDATIONS` (red de seguridad).
- Construir un prompt clínico compacto desde `context`: `diagnosis_label`, `probability`, `hbc`,
  edad, sexo, altitud, flags clave (`Cred`, `Suplementacion`, `SIS`, `Juntos`) y, si existe,
  `context["explainability"].top_factor`. Instruir: español, ≤ 5 viñetas cortas, tono referencial,
  sin diagnóstico definitivo.
- Llamar `gemini_client.generate(...)`; parsear a la **estructura de salida existente**
  `{title, color, items[], source}` (color por `diagnosis_code` reusando el mapa actual;
  `source="Generado por IA (Gemini) · referencial"`). Añadir campo opcional `engine`
  (`"gemini:<modelo>"` | `"fallback"`) para trazabilidad.
- Si no hay API key o **todos** los modelos fallan → `FALLBACK_RECOMMENDATIONS[code]`.
- La forma de salida no cambia → `RecommendationBubble.tsx` y la persistencia en BD siguen igual.

---

## Parte 6 — Dashboard frontend: rendimiento de modelos

- `frontend/src/types/dashboard.ts`: extender `ModelStatus.metrics` con los bloques `test`/`train`,
  `confusion_matrix`, `per_class`, `classes`, `roc_auc_macro_ovr`, `balanced_accuracy`, `mcc`,
  `cohen_kappa`, `class_distribution`.
- `frontend/src/pages/Dashboard.tsx`: nueva sección **"Rendimiento de modelos"** destacada, por
  modelo (RF y XGBoost):
  - Tarjeta de métricas cabecera (accuracy, balanced_accuracy, f1_macro, ROC-AUC, MCC, kappa) con
    **Test y Train lado a lado** (revela overfitting). Toggle Train/Test.
  - **Matriz de confusión** como heatmap (grid Tailwind con intensidad por valor) — resaltada.
  - **Métricas por clase** con `BarChart` de Recharts (precision/recall/f1) + tabla.
  - **Distribución de clases** (antes/después de SMOTE) en barras, para justificar el balanceo.
- Componentes nuevos: `frontend/src/components/dashboard/ModelMetricsCard.tsx`,
  `ConfusionMatrix.tsx`, `PerClassBarChart.tsx`. Reutilizan `AnimatedCard`, Recharts (ya dep) y
  Tailwind. Se conservan las tarjetas actuales (predicciones, estado BD, pie, logs).

---

## Parte 7 — Dependencias y documentación

- `requirements.txt` + `pyproject.toml`: `+imbalanced-learn`, `httpx` a deps principales.
- Docs ligeras: `docs/models.md` (nuevas métricas, SMOTE, fórmula Hbc), `docs/agents.md` (agente
  Gemini + cadena de fallback), `docs/api.md` (campos de `/models/status`). `.env.example` recreado.

---

## Archivos críticos a tocar

| Área             | Archivo                                                                                                                       |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| ETL              | `ml/etl_clean_dataset.py` (nuevo), `notebooks/00_etl_cleaning.ipynb` (nuevo), `ml/_bootstrap.py`                              |
| Entrenamiento    | `ml/train_random_forest.py`, `ml/train_xgboost.py`, `ml/evaluate_models.py`                                                   |
| Hbc continuo     | `ml/preprocessing_pipeline.py`                                                                                                |
| Gemini           | `agents/llm/gemini_client.py` (nuevo), `agents/recommendation_agent.py`, `backend/app/core/config.py`, `.env`, `.env.example` |
| Backend métricas | `backend/app/api/routes_health.py`, `backend/app/schemas/*` (passthrough)                                                     |
| Dashboard        | `frontend/src/pages/Dashboard.tsx`, `frontend/src/types/dashboard.ts`, `frontend/src/components/dashboard/*` (nuevos)         |
| Deps/docs        | `requirements.txt`, `pyproject.toml`, `docs/models.md`, `docs/agents.md`, `docs/api.md`                                       |

---

## Verificación (end-to-end)

1. **ETL:** `uv run python ml/etl_clean_dataset.py` → `data/dataset2024.csv` limpio: 0 vacíos en
   binarias, etiquetas en `CLASS_ORDER`, reporte de imputación correcto; backup creado.
2. **Entrenar:** `uv run python ml/train_random_forest.py` y `ml/train_xgboost.py` → revisar consola:
   SMOTE balanceó train, métricas test (incl. balanced_accuracy, ROC-AUC, MCC, kappa, per-class),
   `*_metrics.json` con bloques `train`/`test`/`class_distribution`.
3. **Backend:** `uv run uvicorn backend.app.main:app --reload` → `GET /models/status` devuelve las
   métricas ricas; `POST /agents/run` con el caso de Juliaca → recomendación de Gemini (o `fallback`
   si no hay key, sin romper el pipeline); confirmar `Hbc` continuo en `preprocessing`.
4. **Frontend:** `cd frontend && npm start` → `/dashboard`: sección de rendimiento con tarjetas
   train/test, heatmap de confusión y barras por clase renderizando datos reales.
5. **Tests:** `uv run pytest` (backend/tests) sin regresiones; añadir test del ETL (imputación) y del
   fallback de Gemini (sin key → reglas MINSA).

### Riesgos / notas

- El accuracy seguirá siendo muy alto: `Dx_anemia` es cuasi-determinista en `Hbc`. Las nuevas
  métricas (balanced_accuracy, MCC, ROC-AUC, per-class recall en Severa) darán una lectura honesta;
  conviene comunicarlo así en el informe, no como "99 % de acierto clínico".
- SMOTE sobre 64 casos de Severa genera sintéticos muy interpolados; reportar su recall en test con
  cautela (n de test de Severa ≈ 13).
- Nombres exactos de modelos Gemini (3.1/3.5) pueden variar; por eso la cadena es **configurable por
  env** y el cliente degrada al siguiente y, finalmente, a reglas.
