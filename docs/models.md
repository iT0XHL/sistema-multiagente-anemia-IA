# Modelos de ML · AnemIA

## Problema
Clasificación **multiclase** de severidad de anemia a partir del dataset real
(44k registros, Puno): `Normal · AnemiaLeve · AnemiaModerada · AnemiaSevera`
(distribución muy desbalanceada).

## Features (`ml/preprocessing_pipeline.py`)
- **Numéricas** (escaladas): `EdadMeses`, `Hemoglobina`, `AlturaREN`, `Hbc`.
- **Binarias** (passthrough): `Juntos`, `SIS`, `Qaliwarma`, `Cred`,
  `Suplementacion`, `Consejeria`, `Sesion`.
- **Categóricas** (one-hot): `Sexo`, `ProvinciaREN`.

`Hbc` se deriva de `Hemoglobina` y `AlturaREN` mediante la corrección por
altitud (OMS 2024 / RM-258-2020-MINSA).

## Modelos
| Modelo | Script | Configuración clave |
|--------|--------|---------------------|
| Random Forest | `train_random_forest.py` | 300 árboles, `class_weight="balanced"`. |
| XGBoost | `train_xgboost.py` | 400 árboles, `multi:softprob`, `sample_weight` balanceado. |

Ambos se serializan con `joblib` en `ml/saved_models/` junto a su
`LabelEncoder` y métricas.

## Evaluación
`evaluate_models.py` calcula Accuracy, F1 macro/weighted, reporte por clase y
matriz de confusión. `compare_models.py` selecciona el mejor por F1 macro.
Por el desbalance, **F1 macro** es la métrica de referencia (no la accuracy).

## Inferencia
```python
from ml.inference import predict
predict(case, model_name="random_forest")
```
Si falta el artefacto, `inference.py` entrena el modelo automáticamente.
