// ============================================================
//  Datos simulados (mock) AISLADOS para el modo demostración.
//  Solo se usan como *fallback* cuando el backend no está disponible
//  (error de red). El flujo real siempre prioriza POST /agents/run.
//  La persistencia en base de datos NUNCA se simula aquí.
// ============================================================
import type {
  AgentRunReport,
  ClinicalCase,
  DiagnosisCode,
  ModelName,
} from '../types'

const DIAGNOSIS_LABELS: Record<DiagnosisCode, string> = {
  Normal: 'Normal',
  AnemiaLeve: 'Anemia Leve',
  AnemiaModerada: 'Anemia Moderada',
  AnemiaSevera: 'Anemia Severa',
}

// Corrección de hemoglobina por altitud — MISMA tabla por franjas que el
// backend (ml/preprocessing_pipeline.altitude_adjustment, RM-258-2020-MINSA).
// Devuelve el ajuste NEGATIVO en g/dL que se suma a la Hb observada.
const ALT_BANDS: [number, number, number][] = [
  [1000, 1500, -0.15], [1500, 2000, -0.35], [2000, 2500, -0.65], [2500, 3000, -1.1],
  [3000, 3500, -1.55], [3500, 3600, -1.85], [3600, 3700, -2.0], [3700, 3800, -2.15],
  [3800, 3900, -2.3], [3900, 4000, -2.5], [4000, 4100, -2.7], [4100, 4200, -2.9],
  [4200, 4300, -3.1], [4300, 4400, -3.3], [4400, 4500, -3.55],
]

function altitudeAdjustment(altitudeM: number): number {
  if (!altitudeM || altitudeM <= 1000) return 0
  for (const [low, high, adj] of ALT_BANDS) {
    if (altitudeM >= low && altitudeM < high) return adj
  }
  if (altitudeM >= 4500) return -3.8
  return 0
}

// Clasificación por puntos de corte OMS (igual que classify_anemia del backend).
function classify(hbc: number, ageMonths: number): DiagnosisCode {
  const [normal, leve, moderada] = ageMonths < 60 ? [11.0, 10.0, 7.0] : [11.5, 11.0, 8.0]
  if (hbc >= normal) return 'Normal'
  if (hbc >= leve) return 'AnemiaLeve'
  if (hbc >= moderada) return 'AnemiaModerada'
  return 'AnemiaSevera'
}

function probabilities(code: DiagnosisCode): Record<string, number> {
  const base: Record<DiagnosisCode, number> = {
    Normal: 0.06,
    AnemiaLeve: 0.06,
    AnemiaModerada: 0.06,
    AnemiaSevera: 0.06,
  }
  base[code] = 0.82
  return base
}

/**
 * Construye un reporte de demostración coherente con el caso ingresado.
 * Calcula Hbc y severidad a partir de la Hb y la altitud reales del formulario
 * para que la simulación siga los datos del usuario (no devuelve algo fijo).
 */
export function buildDemoReport(
  caseData: ClinicalCase,
  model: ModelName = 'random_forest',
): AgentRunReport {
  const now = new Date().toISOString()
  const hb = Number(caseData.Hemoglobina) || 0
  const altitude = Number(caseData.AlturaREN) || 0
  const age = Number(caseData.EdadMeses) || 0
  const adjustment = altitudeAdjustment(altitude) // negativo, igual que el backend
  const hbc = Math.round((hb + adjustment) * 100) / 100
  const code = classify(hbc, age)
  const modelLabel = model === 'xgboost' ? 'XGBoost' : 'Random Forest'

  return {
    ok: true,
    run_id: `demo_${Date.now()}`,
    generated_at: now,
    model: modelLabel,
    case: caseData,
    preprocessing: {
      hb_observed: hb,
      altitude_m: altitude,
      adjustment,
      hbc,
      normative_framework: 'OMS 2024 / RM-258-2020-MINSA (simulado)',
    },
    prediction: {
      model: modelLabel,
      diagnosis_code: code,
      diagnosis_label: DIAGNOSIS_LABELS[code],
      probability: 82,
      hbc,
      class_probabilities: probabilities(code),
    },
    explainability: {
      shap: {
        global: [
          { feature: 'Hbc', label: 'Hemoglobina corregida (Hbc)', weight: 1.2, weight_norm: 0.88 },
          { feature: 'AlturaREN', label: 'Altitud de residencia', weight: 0.7, weight_norm: 0.52 },
          { feature: 'EdadMeses', label: 'Edad del niño/a', weight: 0.55, weight_norm: 0.4 },
          { feature: 'Suplementacion', label: 'Suplementación de hierro', weight: 0.3, weight_norm: 0.22 },
        ],
        local: {
          method: 'SHAP',
          model: modelLabel,
          factors: [
            { feature: 'Hbc', label: 'Hemoglobina corregida (Hbc)', weight: 0.74, weight_norm: 0.74 },
            { feature: 'AlturaREN', label: 'Altitud de residencia', weight: 0.43, weight_norm: 0.43 },
            { feature: 'EdadMeses', label: 'Edad del niño/a', weight: 0.3, weight_norm: 0.3 },
            { feature: 'Cred', label: 'Control CRED', weight: 0.16, weight_norm: 0.16 },
          ],
        },
      },
      lime: {
        method: 'LIME',
        model: modelLabel,
        factors: [
          { feature: 'Hbc', label: 'Hemoglobina corregida (Hbc)', weight: 0.69, weight_norm: 0.69 },
          { feature: 'AlturaREN', label: 'Altitud de residencia', weight: 0.4, weight_norm: 0.4 },
          { feature: 'EdadMeses', label: 'Edad del niño/a', weight: 0.27, weight_norm: 0.27 },
        ],
      },
      top_factor: 'Hemoglobina corregida por altitud (Hbc)',
    },
    recommendation: buildRecommendation(code),
    monitoring: {
      total_elapsed_ms: 2450,
      agents_run: 6,
      errors: 0,
      status: 'ok',
    },
    agent_logs: [
      { agent: 'data_agent', status: 'ok', elapsed_ms: 280, message: 'Datos del paciente validados.' },
      { agent: 'preprocessing_agent', status: 'ok', elapsed_ms: 200, message: `Hbc calculada: ${hb} → ${hbc} g/dL (ajuste ${adjustment}).` },
      { agent: 'prediction_agent', status: 'ok', elapsed_ms: 420, message: `Predicción: ${DIAGNOSIS_LABELS[code]} (${modelLabel}).` },
      { agent: 'explainability_agent', status: 'ok', elapsed_ms: 760, message: 'SHAP y LIME generados.' },
      { agent: 'recommendation_agent', status: 'ok', elapsed_ms: 340, message: 'Recomendación MINSA generada.' },
      { agent: 'monitoring_agent', status: 'ok', elapsed_ms: 450, message: 'Reporte consolidado.' },
    ],
    error: null,
  }
}

function buildRecommendation(code: DiagnosisCode): AgentRunReport['recommendation'] {
  const map: Record<DiagnosisCode, { title: string; color: string; items: string[] }> = {
    Normal: {
      title: 'Seguimiento preventivo',
      color: '#16a34a',
      items: [
        'Continuar suplementación preventiva con hierro según esquema MINSA.',
        'Mantener controles CRED según edad.',
        'Reforzar alimentación rica en hierro (sangrecita, hígado, leguminosas).',
        'Control de hemoglobina en 3 meses.',
      ],
    },
    AnemiaLeve: {
      title: 'Tratamiento ambulatorio – Anemia Leve',
      color: '#d97706',
      items: [
        'Iniciar hierro elemental 3 mg/kg/día vía oral.',
        'Administrar en ayunas, alejado de lácteos y té.',
        'Control hematológico en 30 días.',
        'Reforzar consejería nutricional.',
      ],
    },
    AnemiaModerada: {
      title: 'Tratamiento prioritario – Anemia Moderada',
      color: '#ea580c',
      items: [
        'Suplementación intensiva: hierro elemental 4–6 mg/kg/día.',
        'Control hematológico a los 30 y 60 días.',
        'Descartar parasitosis intestinal.',
        'Referencia a médico si no hay respuesta en 30 días.',
      ],
    },
    AnemiaSevera: {
      title: 'Atención urgente – Anemia Severa',
      color: '#dc2626',
      items: [
        'REFERENCIA INMEDIATA a establecimiento de mayor capacidad resolutiva.',
        'Evaluación médica urgente para determinar etiología.',
        'Considerar hospitalización según estado clínico.',
        'Notificación a vigilancia epidemiológica de Puno.',
      ],
    },
  }
  const r = map[code]
  return {
    diagnosis_code: code,
    title: r.title,
    color: r.color,
    items: r.items,
    source: 'MINSA · Estrategia CRED (referencial · simulado)',
  }
}

// Retrocompatibilidad: reporte de demostración fijo (caso Juliaca).
export function mockAgentRunResponse(): AgentRunReport {
  return buildDemoReport(
    {
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
    'random_forest',
  )
}
