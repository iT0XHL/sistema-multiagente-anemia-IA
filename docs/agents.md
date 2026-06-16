# Sistema Multiagente · AnemIA

6 agentes especializados + 1 orquestador (`agents/`). Comparten un `context`
mutable y cada uno reporta un `AgentLog` (estado + tiempo en ms).

| # | Agente | Archivo | Función |
|---|--------|---------|---------|
| 1 | Registro Clínico | `data_agent.py` | Valida tipos, rangos y campos obligatorios. |
| 2 | Clínico-Contextual | `preprocessing_agent.py` | Calcula Hbc por altitud (OMS/MINSA). |
| 3 | Predictivo ML | `prediction_agent.py` | Estima severidad con RF/XGBoost. |
| 4 | Explicabilidad | `explainability_agent.py` | SHAP (global+local) y LIME. |
| 5 | Terapéutico | `recommendation_agent.py` | Pautas MINSA-CRED por diagnóstico. |
| 6 | Monitoreo/Coordinador | `monitoring_agent.py` | Audita tiempos y consolida logs. |
| — | Orquestador | `orchestrator_agent.py` | Coordina el flujo y arma el reporte. |

## Flujo
```
case → Data → Preprocessing → Prediction → Explainability → Recommendation → Monitoring → reporte
```
Si un agente crítico falla (p. ej. validación), la cadena se detiene y el
Monitoring cierra la auditoría con el error.

## Uso programático
```python
from agents.orchestrator_agent import Orchestrator
report = Orchestrator().run(case, model="random_forest")
```

El backend lo expone vía `POST /agents/run` y persiste el resultado.
