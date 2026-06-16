"""
agents/recommendation_agent.py — Agente 5 · Terapéutico
================================================================
Asocia la categoría diagnóstica con pautas preventivas/terapéuticas
referenciales del MINSA (Estrategia CRED). Pautas portadas del prototipo
clínico original.
"""
from __future__ import annotations

from typing import Any, Dict

from agents.base import Agent

RECOMMENDATIONS: Dict[str, Dict[str, Any]] = {
    "Normal": {
        "title": "Seguimiento preventivo",
        "color": "green",
        "items": [
            "Continuar suplementación preventiva con hierro (1 mg/kg/día) según esquema MINSA.",
            "Mantener controles CRED según edad: mensual hasta los 11 meses, bimestral de 12-23 meses.",
            "Reforzar alimentación complementaria rica en hierro (sangrecita, hígado, leguminosas).",
            "Control en 3 meses para verificar niveles de hemoglobina.",
            "Consejería nutricional a la madre o cuidador principal.",
        ],
    },
    "AnemiaLeve": {
        "title": "Tratamiento ambulatorio – Anemia Leve",
        "color": "amber",
        "items": [
            "Iniciar suplementación terapéutica con hierro elemental: 3 mg/kg/día vía oral.",
            "Administrar en ayunas o entre comidas, alejado de lácteos y té.",
            "Control hematológico en 30 días para evaluar respuesta al tratamiento.",
            "Reforzar orientación alimentaria: consumo diario de alimentos fuente de hierro hemínico.",
            "Activar programa SIS para cobertura de suplementos si no cuenta con ellos.",
            "Registrar en sistema SIEN/HIS del establecimiento de salud.",
        ],
    },
    "AnemiaModerada": {
        "title": "Tratamiento prioritario – Anemia Moderada",
        "color": "orange",
        "items": [
            "Suplementación terapéutica intensiva: hierro elemental 4–6 mg/kg/día vía oral.",
            "Evaluar tolerancia gástrica; si hay intolerancia considerar fraccionamiento de dosis.",
            "Control hematológico estricto a los 30 y 60 días.",
            "Descartar parasitosis intestinal; solicitar examen parasitológico.",
            "Notificación al coordinador de estrategia CRED del establecimiento.",
            "Referencia a médico especialista si no hay respuesta tras 30 días de tratamiento.",
            "Evaluar necesidad de consejería familiar intensiva y visita domiciliaria.",
        ],
    },
    "AnemiaSevera": {
        "title": "Atención urgente – Anemia Severa",
        "color": "red",
        "items": [
            "REFERENCIA INMEDIATA al Hospital o Centro de Salud II-2 / III.",
            "Evaluación médica urgente para determinar etiología (hemolítica, nutricional, parasitaria).",
            "Considerar hospitalización según estado clínico y tolerancia oral.",
            "Evaluación pediátrica para posible transfusión si Hbc < 7 g/dL con compromiso hemodinámico.",
            "Notificación obligatoria en el sistema de vigilancia epidemiológica de Puno.",
            "Coordinación con programa Juntos y SIS para acompañamiento familiar.",
            "Seguimiento post-alta con control en 15 días.",
        ],
    },
}


class RecommendationAgent(Agent):
    name = "recommendation_agent"
    description = "Genera recomendaciones terapéuticas referenciales MINSA."

    def process(self, context: Dict[str, Any]) -> Dict[str, Any]:
        prediction = context["prediction"]
        code = prediction.get("diagnosis_code", "Normal")
        rec = RECOMMENDATIONS.get(code, RECOMMENDATIONS["Normal"])

        result = {
            "_message": f"Recomendación generada: {rec['title']}.",
            "diagnosis_code": code,
            "title": rec["title"],
            "color": rec["color"],
            "items": rec["items"],
            "source": "MINSA · Estrategia CRED (referencial)",
        }
        context["recommendation"] = result
        return result
