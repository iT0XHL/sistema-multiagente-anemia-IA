import type { AgentRunReport } from '../types'

export function mockAgentRunResponse(): AgentRunReport {
  const now = new Date().toISOString()
  return {
    ok: true,
    run_id: `mock_${Date.now()}`,
    generated_at: now,
    model: 'XGBoost',
    case: {
      Prov_EESS: 'SANROMAN',
      Dist_EESS: 'JULIACA',
      Sexo: 'F',
      EdadMeses: 53.62,
      Juntos: 0,
      SIS: 1,
      Qaliwarma: 0,
      Cred: 1,
      Suplementacion: 1,
      Consejeria: 0,
      Sesion: 0,
      Hemoglobina: 13.7,
      ProvinciaREN: 'SANROMAN',
      DistritoREN: 'JULIACA',
      AlturaREN: 3877,
    },
    preprocessing: {
      hb_observed: 13.7,
      altitude_m: 3877,
      adjustment: 6.3,
      hbc: 10.2,
      normative_framework: 'OMS 2024 / MINSA',
    },
    prediction: {
      model: 'XGBoost',
      diagnosis_code: 'AnemiaModerada',
      diagnosis_label: 'Anemia Moderada',
      probability: 87,
      hbc: 10.2,
      class_probabilities: {
        Normal: 0.05,
        AnemiaLeve: 0.08,
        AnemiaModerada: 0.87,
        AnemiaSevera: 0.0,
      },
      clinical_reference: {
        code: 'AnemiaModerada',
        label: 'Anemia Moderada',
        severity: 'Moderada',
        risk: 'Requiere evaluación médica',
        risk_pct: 70,
      },
    },
    explainability: {
      shap: {
        global: [
          { feature: 'Hemoglobina', label: 'Hemoglobina corregida', weight: 1.2, weight_norm: 0.85 },
          { feature: 'EdadMeses', label: 'Edad del paciente', weight: 0.8, weight_norm: 0.55 },
          { feature: 'AlturaREN', label: 'Altitud del establecimiento', weight: 0.6, weight_norm: 0.42 },
          { feature: 'SIS', label: 'Seguro SIS', weight: 0.3, weight_norm: 0.2 },
        ],
        local: {
          method: 'SHAP',
          model: 'XGBoost',
          factors: [
            { feature: 'Hemoglobina', label: 'Hemoglobina corregida', weight: 0.72, weight_norm: 0.72 },
            { feature: 'EdadMeses', label: 'Edad del paciente', weight: 0.45, weight_norm: 0.45 },
            { feature: 'AlturaREN', label: 'Altitud del establecimiento', weight: 0.31, weight_norm: 0.31 },
            { feature: 'Cred', label: 'Control CRED', weight: 0.18, weight_norm: 0.18 },
          ],
        },
      },
      lime: {
        method: 'LIME',
        model: 'XGBoost',
        factors: [
          { feature: 'Hemoglobina', label: 'Hemoglobina corregida', weight: 0.68, weight_norm: 0.68 },
          { feature: 'EdadMeses', label: 'Edad del paciente', weight: 0.41, weight_norm: 0.41 },
          { feature: 'AlturaREN', label: 'Altitud del establecimiento', weight: 0.28, weight_norm: 0.28 },
          { feature: 'Suplementacion', label: 'Suplementación Fe', weight: 0.15, weight_norm: 0.15 },
        ],
      },
      top_factor: 'Hemoglobina corregida por altitud',
    },
    recommendation: {
      diagnosis_code: 'AnemiaModerada',
      title: 'Recomendación para Anemia Moderada',
      color: '#ea580c',
      items: [
        'Derivar a evaluación médica especializada para confirmar diagnóstico con análisis de laboratorio.',
        'Iniciar suplementación con hierro según lineamientos MINSA (3-6 mg/kg/día de hierro elemental).',
        'Fortalecer control CRED y seguimiento nutricional cada 30 días.',
        'Educar a cuidadores sobre alimentación rica en hierro y vitamina C.',
        'Evaluar necesidad de referencia a establecimiento de mayor capacidad resolutiva.',
      ],
      source: 'MINSA — Guía Técnica para el Diagnóstico y Tratamiento de la Anemia Infantil (2024)',
    },
    monitoring: {
      total_elapsed_ms: 2847,
      agents_run: 6,
      errors: 0,
      status: 'completed',
    },
    agent_logs: [
      { agent: 'data_agent', status: 'ok', elapsed_ms: 320, message: 'Datos válidos: provincia, distrito, edad, sexo, hemoglobina.' },
      { agent: 'preprocessing_agent', status: 'ok', elapsed_ms: 180, message: 'Hbc calculada: 13.7 → 10.2 g/dL (ajuste +6.3 por 3877 m).' },
      { agent: 'prediction_agent', status: 'ok', elapsed_ms: 450, message: 'Predicción: Anemia Moderada (XGBoost, 87%).' },
      { agent: 'explainability_agent', status: 'ok', elapsed_ms: 890, message: 'SHAP y LIME generados: 4 factores principales.' },
      { agent: 'recommendation_agent', status: 'ok', elapsed_ms: 350, message: 'Recomendación MINSA para Anemia Moderada generada.' },
      { agent: 'monitoring_agent', status: 'ok', elapsed_ms: 657, message: 'Reporte consolidado. Pipeline completado en 2847 ms.' },
    ],
    error: null,
  }
}
