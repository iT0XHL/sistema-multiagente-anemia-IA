"""
ml/train_random_forest.py
================================================================
Entrena un RandomForestClassifier multiclase para estimar la severidad
de la anemia (Normal / Leve / Moderada / Severa) y guarda el modelo,
el codificador de etiquetas y las métricas en `ml/saved_models/`.

Uso:
    python ml/train_random_forest.py [--data data/raw/dataset.csv]
"""
from __future__ import annotations

import _bootstrap  # noqa: F401  (configura sys.path y rutas)

import argparse
import json
import os
from datetime import datetime, timezone

import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

from _bootstrap import DATA_RAW, SAVED_MODELS_DIR
from ml.evaluate_models import print_report
from ml.preprocessing_pipeline import CLASS_ORDER, load_dataset, split_xy
from ml.training_utils import assemble_metrics, build_smote_pipeline

MODEL_NAME = "random_forest"


def train(data_path: str = DATA_RAW, random_state: int = 42) -> dict:
    print(f"[RF] Cargando dataset desde: {data_path}")
    df = load_dataset(data_path)
    X, y_raw = split_xy(df)

    label_encoder = LabelEncoder().fit(CLASS_ORDER)
    y = label_encoder.transform(y_raw)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=random_state
    )

    # Sin class_weight: el balanceo lo aporta SMOTE (solo sobre train).
    estimator = RandomForestClassifier(
        n_estimators=300,
        max_depth=None,
        min_samples_leaf=2,
        n_jobs=-1,
        random_state=random_state,
    )
    pipeline = build_smote_pipeline(estimator, random_state=random_state)

    print(f"[RF] Entrenando (SMOTE en train) con {len(X_train)} muestras...")
    pipeline.fit(X_train, y_train)

    metrics = assemble_metrics(pipeline, label_encoder, X_train, y_train, X_test, y_test)
    print_report("Random Forest", metrics)

    artifact = {
        "pipeline": pipeline,
        "label_encoder": label_encoder,
        "classes": list(label_encoder.classes_),
        "metrics": metrics,
        "model_name": MODEL_NAME,
        "trained_at": datetime.now(timezone.utc).isoformat(),
    }
    out_path = os.path.join(SAVED_MODELS_DIR, f"{MODEL_NAME}.joblib")
    joblib.dump(artifact, out_path)
    with open(os.path.join(SAVED_MODELS_DIR, f"{MODEL_NAME}_metrics.json"),
              "w", encoding="utf-8") as fh:
        json.dump(metrics, fh, indent=2, ensure_ascii=False)
    print(f"[RF] Modelo guardado en: {out_path}")
    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Entrena RandomForest para AnemIA")
    parser.add_argument("--data", default=DATA_RAW, help="Ruta al CSV de entrenamiento")
    args = parser.parse_args()
    train(args.data)
