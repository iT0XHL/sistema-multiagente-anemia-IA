"""Asegura que la raíz del repositorio esté en sys.path para poder importar
los paquetes `ml`, `agents`, `explainability` y `backend` cuando los scripts
se ejecutan directamente (p. ej. `python ml/train_random_forest.py`)."""
import os
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

# Rutas estándar de artefactos.
SAVED_MODELS_DIR = os.path.join(REPO_ROOT, "ml", "saved_models")
DATA_RAW = os.path.join(REPO_ROOT, "data", "raw", "dataset.csv")
os.makedirs(SAVED_MODELS_DIR, exist_ok=True)
