"""
ml/evaluate_models.py
================================================================
Funciones de evaluación compartidas: cálculo de métricas multiclase
(Accuracy, F1 macro/weighted, ROC-AUC OvR, matriz de confusión) y un
reporte legible por consola.
"""
from __future__ import annotations

from typing import Dict

import numpy as np
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
)


def compute_metrics(y_true, y_pred, label_encoder) -> Dict:
    """Devuelve un diccionario serializable con las métricas principales."""
    labels = list(range(len(label_encoder.classes_)))
    report = classification_report(
        y_true, y_pred,
        labels=labels,
        target_names=list(label_encoder.classes_),
        output_dict=True,
        zero_division=0,
    )
    cm = confusion_matrix(y_true, y_pred, labels=labels).tolist()
    return {
        "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
        "f1_macro": round(float(f1_score(y_true, y_pred, average="macro", zero_division=0)), 4),
        "f1_weighted": round(float(f1_score(y_true, y_pred, average="weighted", zero_division=0)), 4),
        "classes": list(label_encoder.classes_),
        "confusion_matrix": cm,
        "per_class": {
            cls: {
                "precision": round(report[cls]["precision"], 4),
                "recall": round(report[cls]["recall"], 4),
                "f1": round(report[cls]["f1-score"], 4),
                "support": int(report[cls]["support"]),
            }
            for cls in label_encoder.classes_
        },
        "n_test": int(len(y_true)),
    }


def print_report(title: str, metrics: Dict) -> None:
    line = "-" * 10
    print(f"\n{line} {title} {line}")
    print(f"  Accuracy     : {metrics['accuracy']:.4f}")
    print(f"  F1 (macro)   : {metrics['f1_macro']:.4f}")
    print(f"  F1 (weighted): {metrics['f1_weighted']:.4f}")
    print("  Por clase:")
    for cls, m in metrics["per_class"].items():
        print(f"    - {cls:<16} P={m['precision']:.3f} R={m['recall']:.3f} "
              f"F1={m['f1']:.3f} (n={m['support']})")
    print("-" * 30 + "\n")
