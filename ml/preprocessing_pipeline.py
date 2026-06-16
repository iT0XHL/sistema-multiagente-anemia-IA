"""
ml/preprocessing_pipeline.py
================================================================
Núcleo clínico-contextual y de preprocesamiento de AnemIA.

Es la ÚNICA fuente de verdad para:
  * La corrección de hemoglobina por altitud (OMS 2024 / RM-258-2020-MINSA).
  * La clasificación diagnóstica por puntos de corte OMS.
  * El esquema de features y el `ColumnTransformer` de scikit-learn.

El backend (FastAPI), los agentes y los scripts de entrenamiento importan
desde aquí para evitar duplicar la lógica.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Tuple

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

# ── Esquema de columnas del dataset real ────────────────────────────
TARGET = "Dx_anemia"

# Orden canónico de clases (de menor a mayor severidad).
CLASS_ORDER = ["Normal", "AnemiaLeve", "AnemiaModerada", "AnemiaSevera"]

NUMERIC_FEATURES = ["EdadMeses", "Hemoglobina", "AlturaREN", "Hbc"]
BINARY_FEATURES = [
    "Juntos", "SIS", "Qaliwarma", "Cred",
    "Suplementacion", "Consejeria", "Sesion",
]
CATEGORICAL_FEATURES = ["Sexo", "ProvinciaREN"]

FEATURE_COLUMNS = NUMERIC_FEATURES + BINARY_FEATURES + CATEGORICAL_FEATURES

# Etiquetas legibles para el frontend / reportes.
DX_LABELS_ES = {
    "Normal": "Normal",
    "AnemiaLeve": "Anemia Leve",
    "AnemiaModerada": "Anemia Moderada",
    "AnemiaSevera": "Anemia Severa",
}


# ════════════════════════════════════════════════════════════════════
#  1. Corrección de hemoglobina por altitud (OMS 2024 / MINSA)
# ════════════════════════════════════════════════════════════════════
# Tabla de ajustes (g/dL) por franja de altitud (m.s.n.m.), portada del
# prototipo clínico original y alineada con RM-258-2020-MINSA.
_ALTITUDE_ADJUSTMENT = [
    (1000, 1500, -0.15),
    (1500, 2000, -0.35),
    (2000, 2500, -0.65),
    (2500, 3000, -1.10),
    (3000, 3500, -1.55),
    (3500, 3600, -1.85),
    (3600, 3700, -2.00),
    (3700, 3800, -2.15),
    (3800, 3900, -2.30),
    (3900, 4000, -2.50),
    (4000, 4100, -2.70),
    (4100, 4200, -2.90),
    (4200, 4300, -3.10),
    (4300, 4400, -3.30),
    (4400, 4500, -3.55),
]
_ALTITUDE_ADJUSTMENT_MAX = -3.80  # >= 4500 m.s.n.m.


def altitude_adjustment(altitude_m: float) -> float:
    """Ajuste (negativo, g/dL) que se suma a la Hb observada según la altitud."""
    if altitude_m is None or altitude_m <= 1000:
        return 0.0
    for low, high, adj in _ALTITUDE_ADJUSTMENT:
        if low <= altitude_m < high:
            return adj
    if altitude_m >= 4500:
        return _ALTITUDE_ADJUSTMENT_MAX
    return 0.0


def correct_hemoglobin_for_altitude(hb: float, altitude_m: float) -> float:
    """Devuelve la hemoglobina corregida (Hbc) redondeada a 2 decimales."""
    return round(hb + altitude_adjustment(altitude_m), 2)


# ════════════════════════════════════════════════════════════════════
#  2. Clasificación diagnóstica por puntos de corte OMS
# ════════════════════════════════════════════════════════════════════
@dataclass
class Diagnosis:
    code: str          # 'Normal' | 'AnemiaLeve' | 'AnemiaModerada' | 'AnemiaSevera'
    label: str         # texto legible en español
    severity: str      # Ninguna | Leve | Moderada | Severa
    risk: str          # Bajo | Moderado | Alto | Muy alto
    risk_pct: int      # posición del gauge de riesgo (0-100)


_RISK_BY_CODE = {
    "Normal": ("Ninguna", "Bajo", 10),
    "AnemiaLeve": ("Leve", "Moderado", 45),
    "AnemiaModerada": ("Moderada", "Alto", 72),
    "AnemiaSevera": ("Severa", "Muy alto", 95),
}


def classify_anemia(hbc: float, edad_meses: float) -> Diagnosis:
    """Clasifica según Hbc y edad usando los cortes OMS por grupo etario."""
    if edad_meses < 60:          # < 5 años
        normal, leve, moderada = 11.0, 10.0, 7.0
    else:                        # 5 - 11 años
        normal, leve, moderada = 11.5, 11.0, 8.0

    if hbc >= normal:
        code = "Normal"
    elif hbc >= leve:
        code = "AnemiaLeve"
    elif hbc >= moderada:
        code = "AnemiaModerada"
    else:
        code = "AnemiaSevera"

    severity, risk, pct = _RISK_BY_CODE[code]
    return Diagnosis(code, DX_LABELS_ES[code], severity, risk, pct)


# ════════════════════════════════════════════════════════════════════
#  3. Carga y preparación del dataset
# ════════════════════════════════════════════════════════════════════
def load_dataset(path: str) -> pd.DataFrame:
    """Carga el CSV real, normaliza tipos y elimina filas inválidas."""
    df = pd.read_csv(path, encoding="utf-8-sig")
    df.columns = [c.strip() for c in df.columns]
    df = df.dropna(subset=[TARGET] + NUMERIC_FEATURES)
    for col in BINARY_FEATURES:
        df[col] = df[col].fillna(0).astype(int)
    df = df[df[TARGET].isin(CLASS_ORDER)].reset_index(drop=True)
    return df


def split_xy(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
    """Separa la matriz de features X y el vector objetivo y."""
    X = df[FEATURE_COLUMNS].copy()
    y = df[TARGET].copy()
    return X, y


def build_preprocessor() -> ColumnTransformer:
    """`ColumnTransformer`: escala numéricas, one-hot categóricas, pasa binarias."""
    return ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERIC_FEATURES),
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                CATEGORICAL_FEATURES,
            ),
            ("bin", "passthrough", BINARY_FEATURES),
        ],
        remainder="drop",
    )


def make_pipeline(estimator) -> Pipeline:
    """Encapsula preprocesamiento + estimador en un único `Pipeline`."""
    return Pipeline([("preprocessor", build_preprocessor()), ("model", estimator)])


def case_to_frame(case: dict) -> pd.DataFrame:
    """Convierte un caso clínico (dict) en un DataFrame de una fila con el
    esquema esperado por el pipeline, calculando Hbc si no viene dado."""
    record = dict(case)
    if "Hbc" not in record or record.get("Hbc") in (None, ""):
        record["Hbc"] = correct_hemoglobin_for_altitude(
            float(record["Hemoglobina"]), float(record["AlturaREN"])
        )
    if "ProvinciaREN" not in record:
        record["ProvinciaREN"] = "DESCONOCIDA"
    row = {col: record.get(col) for col in FEATURE_COLUMNS}
    return pd.DataFrame([row], columns=FEATURE_COLUMNS)
