"""
ml/train_xgboost.py
================================================================
Entrena un XGBClassifier multiclase para la severidad de anemia y guarda
el artefacto en `ml/saved_models/`.

Uso:
    python ml/train_xgboost.py [--data data/raw/dataset.csv]
"""
from __future__ import annotations

import _bootstrap  # noqa: F401

import argparse
import json
import os
from datetime import datetime, timezone

import joblib
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.utils.class_weight import compute_sample_weight
from xgboost import XGBClassifier

from _bootstrap import DATA_RAW, SAVED_MODELS_DIR
from ml.evaluate_models import compute_metrics, print_report
from ml.preprocessing_pipeline import (
    CLASS_ORDER,
    build_preprocessor,
    load_dataset,
    split_xy,
)

MODEL_NAME = "xgboost"


def train(data_path: str = DATA_RAW, random_state: int = 42) -> dict:
    print(f"[XGB] Cargando dataset desde: {data_path}")
    df = load_dataset(data_path)
    X, y_raw = split_xy(df)

    label_encoder = LabelEncoder().fit(CLASS_ORDER)
    y = label_encoder.transform(y_raw)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=random_state
    )

    # XGBoost no acepta el ColumnTransformer dentro de su API nativa de
    # sample_weight, por lo que transformamos primero y entrenamos después.
    preprocessor = build_preprocessor()
    X_train_t = preprocessor.fit_transform(X_train)
    X_test_t = preprocessor.transform(X_test)
    sample_weight = compute_sample_weight(class_weight="balanced", y=y_train)

    estimator = XGBClassifier(
        n_estimators=400,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.9,
        colsample_bytree=0.9,
        objective="multi:softprob",
        num_class=len(CLASS_ORDER),
        eval_metric="mlogloss",
        tree_method="hist",
        random_state=random_state,
    )

    print(f"[XGB] Entrenando con {len(X_train)} muestras...")
    estimator.fit(X_train_t, y_train, sample_weight=sample_weight)

    y_pred = estimator.predict(X_test_t)
    metrics = compute_metrics(y_test, y_pred, label_encoder)
    print_report("XGBoost", metrics)

    # Empaquetamos preprocesador + modelo como un pipeline manual serializable.
    from sklearn.pipeline import Pipeline

    pipeline = Pipeline([("preprocessor", preprocessor), ("model", estimator)])

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
    print(f"[XGB] Modelo guardado en: {out_path}")
    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Entrena XGBoost para AnemIA")
    parser.add_argument("--data", default=DATA_RAW, help="Ruta al CSV de entrenamiento")
    args = parser.parse_args()
    train(args.data)
