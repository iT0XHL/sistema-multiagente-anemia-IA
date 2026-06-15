# AnemIA · Asistente Clínico para Anemia Infantil

## Descripción del Proyecto

Prototipo académico de un asistente conversacional clínico tipo chatbot para el diagnóstico de anemia infantil en la región de Puno, Perú. Implementa un sistema multiagente especializado con lógica de ajuste por altitud, diagnóstico estimado por ML simulado, explicabilidad XAI y recomendaciones terapéuticas MINSA.

**Contexto académico:** Trabajo de investigación sobre anemia infantil en zonas altoandinas del Perú, donde la altitud geográfica distorsiona la interpretación de hemoglobina.

> ⚠️ **PROTOTIPO ACADÉMICO.** No reemplaza el diagnóstico ni el tratamiento realizado por profesionales de salud. Toda recomendación debe ser validada por personal médico autorizado.

---

## Sistema Multiagente (6 Agentes)

| Agente | Función |
|--------|---------|
| Agente 1 · Registro Clínico | Recibe y valida los datos del caso clínico |
| Agente 2 · Clínico-Contextual | Calcula Hb corregida por altitud (OMS 2024/MINSA) |
| Agente 3 · Predictivo ML | Estima diagnóstico (Normal/Leve/Moderada/Severa) |
| Agente 4 · Explicabilidad XAI | Genera valores SHAP simulados de importancia de variables |
| Agente 5 · Terapéutico | Propone recomendaciones referenciales MINSA-CRED |
| Agente 6 · Coordinador Reporte | Consolida reporte clínico unificado descargable |

---

## Variables del Dataset Real

### Entrada
- `Prov_EESS`, `Dist_EESS` — Establecimiento de salud
- `Sexo`, `EdadMeses` — Datos del niño
- `Juntos`, `SIS`, `Qaliwarma`, `Cred`, `Suplementacion`, `Consejeria`, `Sesion` (0/1)
- `Hemoglobina` — Valor observado (g/dL)
- `ProvinciaREN`, `DistritoREN`, `AlturaREN` — Residencia del niño

### Derivadas
- `Hbc` — Hemoglobina corregida por altitud
- `Dx_anemia` — Normal / AnemiaLeve / AnemiaModerada / AnemiaSevera

---

## Caso de Ejemplo Precargado (Juliaca)

```
Prov_EESS: SANROMAN    | Dist_EESS: JULIACA
Sexo: F                | EdadMeses: 53.62
Juntos: 0              | SIS: 1
Qaliwarma: 0           | Cred: 1
Suplementacion: 1      | Consejeria: 0
Sesion: 0              | Hemoglobina: 13.7 g/dL
ProvinciaREN: SANROMAN | DistritoREN: JULIACA
AlturaREN: 3877 m.s.n.m.

→ Hbc ≈ 11.40 g/dL (ajuste -2.30 g/dL)
→ Diagnóstico: Normal (Bajo riesgo)
```

---

## Tecnologías Utilizadas

- **Backend**: Hono (TypeScript) + Cloudflare Workers/Pages
- **Frontend**: HTML5 + TailwindCSS + Vanilla JS
- **Librerías**: Chart.js, html2canvas, jsPDF, FontAwesome
- **Despliegue**: Wrangler Pages / Cloudflare

---

## Funcionalidades Implementadas

- [x] Chatbot conversacional con burbujas de chat
- [x] Formulario clínico por bloques con toggles Sí/No
- [x] Cálculo de Hbc por altitud (tabla OMS 2024 / MINSA)
- [x] Diagnóstico estimado (4 categorías) según OMS
- [x] Indicador de nivel de riesgo con gauge visual
- [x] Gráfico XAI de factores influyentes (SHAP-like)
- [x] Recomendaciones terapéuticas por categoría (MINSA)
- [x] Reporte clínico unificado descargable (PDF)
- [x] Panel de agentes activos (sidebar)
- [x] Caso de ejemplo precargado (Juliaca)
- [x] Respuestas contextuales por texto libre
- [x] Diseño responsivo (desktop + móvil)

---

## Despliegue

- **Plataforma**: Cloudflare Pages
- **Estado**: ✅ En desarrollo local
- **Última actualización**: Junio 2024
