"""
ml/training_utils.py
================================================================
Utilidades compartidas por los scripts de entrenamiento (RF y XGBoost):
construcción del pipeline con SMOTE, conteo de clases y ensamblado del
bloque de métricas (train + test + distribución + split) que se guarda en
el artefacto y en el JSON consumido por el dashboard.
"""
from __future__ import annotations

from typing import Dict

import numpy as np
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline

from ml.evaluate_models import compute_metrics
from ml.preprocessing_pipeline import build_preprocessor


def build_smote_pipeline(estimator, random_state: int = 42) -> ImbPipeline:
    """Pipeline imbalanced-learn: preprocesado → SMOTE → estimador.

    SMOTE solo actúa al ajustar (fit); en predict/predict_proba el sampler se
    omite, por lo que el conjunto de prueba nunca se resamplea.
    """
    return ImbPipeline([
        ("preprocessor", build_preprocessor()),
        ("smote", SMOTE(random_state=random_state)),
        ("model", estimator),
    ])


def class_counts(y_encoded, label_encoder) -> Dict[str, int]:
    """Conteo de muestras por clase (etiquetas legibles) de un vector codificado."""
    vals, counts = np.unique(np.asarray(y_encoded), return_counts=True)
    names = label_encoder.inverse_transform(vals.astype(int))
    return {str(name): int(n) for name, n in zip(names, counts)}


def assemble_metrics(pipeline, label_encoder,
                     X_train, y_train, X_test, y_test) -> Dict:
    """Evalúa en train (sin resamplear) y test, y arma el bloque de métricas.

    Mantiene en el nivel superior las claves `accuracy`/`f1_macro`/… del set de
    prueba (compatibilidad con el dashboard actual) y añade los sub-bloques
    `test`, `train`, `class_distribution` y `split`.
    """
    test_metrics = compute_metrics(
        y_test, pipeline.predict(X_test), label_encoder, pipeline.predict_proba(X_test))
    train_metrics = compute_metrics(
        y_train, pipeline.predict(X_train), label_encoder, pipeline.predict_proba(X_train))

    raw = class_counts(y_train, label_encoder)
    majority = max(raw.values()) if raw else 0
    after_smote = {cls: majority for cls in raw}  # SMOTE 'auto' iguala a la mayoritaria

    return {
        **test_metrics,  # accuracy/f1_macro/... del test en el nivel superior (compat)
        "test": test_metrics,
        "train": train_metrics,
        "class_distribution": {"raw_train": raw, "after_smote": after_smote},
        "split": {
            "test_size": round(len(X_test) / (len(X_train) + len(X_test)), 3),
            "n_train": int(len(X_train)),
            "n_test": int(len(X_test)),
            "balancing": "SMOTE (solo train)",
        },
    }
