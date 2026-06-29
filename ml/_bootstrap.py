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
# Dataset de entrenamiento: el export 2024 limpiado por ml/etl_clean_dataset.py.
DATA_RAW = os.path.join(REPO_ROOT, "data", "dataset2024.csv")
# Conjunto completo de entrenamiento: ambos años combinados (~80k registros)
# tras eliminar duplicados exactos. Usado por defecto por los entrenadores.
DATA_FILES = [
    os.path.join(REPO_ROOT, "data", "dataset2025.csv"),
    os.path.join(REPO_ROOT, "data", "dataset2024.csv"),
]
os.makedirs(SAVED_MODELS_DIR, exist_ok=True)