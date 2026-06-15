/* ============================================================
   AnemIA · Asistente Clínico Multiagente · Puno, Perú
   Lógica conversacional y cálculos clínicos
   ============================================================ */

'use strict';

// ── Estado global ─────────────────────────────────────────────
let state = {
  caseData: null,
  hbcResult: null,
  diagResult: null,
  step: 'idle'          // idle | registered | hbc | diag | xai | rec | report
};

// ── Datos por defecto (caso Juliaca) ──────────────────────────
const defaultCase = {
  prov_eess:     'SANROMAN',
  dist_eess:     'JULIACA',
  sexo:          'F',
  edadMeses:     53.62,
  juntos:        0,
  sis:           1,
  qaliwarma:     0,
  cred:          1,
  suplementacion:1,
  consejeria:    0,
  sesion:        0,
  hemoglobina:   13.7,
  provinciaREN:  'SANROMAN',
  distritoREN:   'JULIACA',
  alturaREN:     3877
};

// ── Provincias y distritos de Puno ────────────────────────────
const punoData = {
  'PUNO':        ['PUNO','ACORA','AMANTANI','ATUNCOLLA','CAPACHICA','CHUCUITO','COATA','HUATA','MAÑAZO','PAUCARCOLLA','PICHACANI','PLATERIA','SAN ANTONIO','TIQUILLACA','VILQUE'],
  'AZANGARO':   ['AZANGARO','ACHAYA','ARAPA','ASILLO','CAMINACA','CHUPA','JOSE DOMINGO CHOQUEHUANCA','MUÑANI','POTONI','SAMAN','SAN ANTON','SAN JOSE','SAN JUAN DE SALINAS','SANTIAGO DE PUPUJA','TIRAPATA'],
  'CARABAYA':   ['MACUSANI','AJOYANI','AYAPATA','COASA','CORANI','CRUCERO','ITUATA','OLLACHEA','SAN GABAN','USICAYOS'],
  'CHUCUITO':   ['JULI','DESAGUADERO','HUACULLANI','KELLUYO','PISACOMA','POMATA','ZEPITA'],
  'EL COLLAO':  ['ILAVE','CAPAZO','PILCUYO','SANTA ROSA','CONDURIRI'],
  'HUANCANE':   ['HUANCANE','COJATA','HUATASANI','INCHUPALLA','PUSI','ROSASPATA','TARACO','VILQUE CHICO'],
  'LAMPA':      ['LAMPA','CABANILLA','CALAPUJA','NICASIO','OCUVIRI','PALCA','PARATIA','PUCARA','SANTA LUCIA','VILAVILA'],
  'MELGAR':     ['AYAVIRI','ANTAUTA','CUPI','LLALLI','MACARI','NUÑOA','ORURILLO','SANTA ROSA','UMACHIRI'],
  'MOHO':       ['MOHO','CONIMA','HUAYRAPATA','TILALI'],
  'PUNO2':      ['SAN ROMAN','JULIACA','CABANA','CABANILLAS','CARACOTO'],
  'SANROMAN':   ['JULIACA','CABANA','CABANILLAS','CARACOTO'],
  'SAN ANTONIO DE PUTINA': ['PUTINA','ANANEA','PEDRO VILCA APAZA','QUILCAPUNCU','SINA'],
  'SANDIA':     ['SANDIA','CUYOCUYO','LIMBANI','PATAMBUCO','PHARA','QUIACA','SAN JUAN DEL ORO','YANAHUAYA','ALTO INAMBARI','SAN PEDRO DE PUTINA PUNCO'],
  'YUNGUYO':    ['YUNGUYO','ANAPIA','COPANI','CUTURAPI','OLLARAYA','TINICACHI','UNICACHI']
};

// Alturas referenciales por distrito (msnm)
const distAlturas = {
  'JULIACA':3827,'PUNO':3827,'AZANGARO':3860,'ILAVE':3870,'JULI':3812,
  'HUANCANE':3840,'AYAVIRI':3900,'MACUSANI':4320,'LAMPA':3900,
  'DESAGUADERO':3810,'MOHO':3820,'PUTINA':3870,'SANDIA':1820,
  'SAN GABAN':850,'ACORA':3850,'CAPACHICA':3830,'CHUCUITO':3855,
  'CARACOTO':3810,'CABANA':3840,'CABANILLAS':3840
};

// ── Cálculo de Hb corregida por altitud (OMS 2024 / MINSA) ───
function calcHbc(hb, alturaM) {
  // Factor de corrección (MINSA/OMS): por cada 100m sobre 1000m, se resta ~0.032
  // Fórmula simplificada usada en el estudio de Puno
  let ajuste = 0;
  if (alturaM > 1000) {
    const h = alturaM / 1000;
    // Ajuste = -0.032 * (alturaM/1000) para >1000 msnm
    // Tabla MINSA: a 3500→ -1.85, a 3800→ -2.3, a 4000→ -2.7 (interpolado)
    ajuste = -(0.000032 * alturaM + 0.00000026 * alturaM * alturaM / 1000);
    // Tabla de referencia MINSA 2017 / OMS 2024 (Valores específicos)
    if (alturaM >= 3500 && alturaM < 3600) ajuste = -1.85;
    else if (alturaM >= 3600 && alturaM < 3700) ajuste = -2.00;
    else if (alturaM >= 3700 && alturaM < 3800) ajuste = -2.15;
    else if (alturaM >= 3800 && alturaM < 3900) ajuste = -2.30;
    else if (alturaM >= 3900 && alturaM < 4000) ajuste = -2.50;
    else if (alturaM >= 4000 && alturaM < 4100) ajuste = -2.70;
    else if (alturaM >= 4100 && alturaM < 4200) ajuste = -2.90;
    else if (alturaM >= 4200 && alturaM < 4300) ajuste = -3.10;
    else if (alturaM >= 4300 && alturaM < 4400) ajuste = -3.30;
    else if (alturaM >= 4400 && alturaM < 4500) ajuste = -3.55;
    else if (alturaM >= 4500) ajuste = -3.80;
    else if (alturaM >= 1000 && alturaM < 1500) ajuste = -0.15;
    else if (alturaM >= 1500 && alturaM < 2000) ajuste = -0.35;
    else if (alturaM >= 2000 && alturaM < 2500) ajuste = -0.65;
    else if (alturaM >= 2500 && alturaM < 3000) ajuste = -1.10;
    else if (alturaM >= 3000 && alturaM < 3500) ajuste = -1.55;
  }
  return Math.round((hb + ajuste) * 100) / 100;
}

// ── Clasificación diagnóstica (OMS / MINSA) ──────────────────
function clasificarAnemia(hbc, edadMeses, sexo) {
  // Puntos de corte OMS por edad (niños < 5 años y 5-11 años)
  // hbc en g/dL
  let normal, leve, moderada;
  if (edadMeses < 60) { // < 5 años
    normal   = 11.0;
    leve     = 10.0;
    moderada = 7.0;
  } else { // 5-11 años
    normal   = 11.5;
    leve     = 11.0;
    moderada = 8.0;
  }
  if (hbc >= normal)   return { dx: 'Normal',         code: 'normal',    sev: 'Ninguna', riesgo: 'Bajo',  pct: 10 };
  if (hbc >= leve)     return { dx: 'Anemia Leve',    code: 'leve',      sev: 'Leve',    riesgo: 'Moderado', pct: 45 };
  if (hbc >= moderada) return { dx: 'Anemia Moderada',code: 'moderada',  sev: 'Moderada',riesgo: 'Alto',  pct: 72 };
  return                      { dx: 'Anemia Severa',  code: 'severa',    sev: 'Severa',  riesgo: 'Muy alto', pct: 95 };
}

// ── Probabilidad estimada (simulación ML) ────────────────────
function simularML(datos, hbc, dx) {
  // Pesos simulados basados en importancia de variables del modelo real
  let score = 0;
  // Hemoglobina corregida (mayor peso)
  if (dx.code !== 'normal') {
    const deficit = 11.0 - hbc;
    score += Math.min(deficit * 15, 60);
  }
  // Edad (niños < 24 meses más vulnerables)
  if (datos.edadMeses < 24) score += 8;
  else if (datos.edadMeses < 48) score += 5;
  // Suplementación y CRED
  if (!datos.suplementacion) score += 5;
  if (!datos.cred) score += 4;
  // Programas sociales
  if (!datos.sis) score += 3;
  if (!datos.juntos) score += 2;
  // Altitud
  if (datos.alturaREN > 4000) score += 5;
  else if (datos.alturaREN > 3500) score += 3;

  // Convertir a probabilidad de anemia
  let prob = dx.code === 'normal' ? Math.max(5, 25 - score) : Math.min(95, 40 + score);
  return Math.round(prob);
}

// ── Importancia de variables (XAI simulado - SHAP-like) ───────
function calcXAI(datos, hbc) {
  const ajuste = Math.abs(datos.hemoglobina - hbc);
  return [
    { label: 'Hemoglobina ajustada (Hbc)', anemia: Math.min(0.45, 0.30 + ajuste * 0.04), sinAnemia: Math.min(0.20, 0.12 + (datos.hemoglobina - 10) * 0.01) },
    { label: 'Altitud residencia (AlturaREN)', anemia: 0.18, sinAnemia: 0.08 },
    { label: 'Edad (meses)',  anemia: datos.edadMeses < 24 ? 0.15 : 0.10, sinAnemia: 0.07 },
    { label: 'Suplementación (Fe)', anemia: datos.suplementacion ? 0.05 : 0.13, sinAnemia: datos.suplementacion ? 0.10 : 0.04 },
    { label: 'Control CRED', anemia: datos.cred ? 0.04 : 0.10, sinAnemia: datos.cred ? 0.09 : 0.03 },
    { label: 'Hemoglobina observada', anemia: 0.12, sinAnemia: 0.18 },
  ];
}

// ── Recomendaciones terapéuticas (MINSA) ─────────────────────
function getRecomendaciones(dx, datos) {
  const base = {
    normal: {
      titulo: 'Seguimiento preventivo',
      color: 'green',
      items: [
        'Continuar suplementación preventiva con hierro (1 mg/kg/día) según esquema MINSA.',
        'Mantener controles CRED según edad: mensual hasta los 11 meses, bimestral de 12-23 meses.',
        'Reforzar alimentación complementaria rica en hierro (sangrecita, hígado, leguminosas).',
        'Control en 3 meses para verificar niveles de hemoglobina.',
        'Consejería nutricional a la madre o cuidador principal.'
      ]
    },
    leve: {
      titulo: 'Tratamiento ambulatorio – Anemia Leve',
      color: 'amber',
      items: [
        'Iniciar suplementación terapéutica con hierro elemental: 3 mg/kg/día vía oral.',
        'Administrar en ayunas o entre comidas, alejado de lácteos y té.',
        'Control hematológico en 30 días para evaluar respuesta al tratamiento.',
        'Reforzar orientación alimentaria: consumo diario de alimentos fuente de hierro hemínico.',
        'Activar programa SIS para cobertura de suplementos si no cuenta con ellos.',
        'Registrar en sistema SIEN/HIS del establecimiento de salud.'
      ]
    },
    moderada: {
      titulo: 'Tratamiento prioritario – Anemia Moderada',
      color: 'orange',
      items: [
        'Suplementación terapéutica intensiva: hierro elemental 4–6 mg/kg/día vía oral.',
        'Evaluar tolerancia gástrica; si hay intolerancia considerar fraccionamiento de dosis.',
        'Control hematológico estricto a los 30 y 60 días.',
        'Descartar parasitosis intestinal; solicitar examen parasitológico.',
        'Notificación al coordinador de estrategia CRED del establecimiento.',
        'Referencia a médico especialista si no hay respuesta tras 30 días de tratamiento.',
        'Evaluar necesidad de consejería familiar intensiva y visita domiciliaria.'
      ]
    },
    severa: {
      titulo: 'Atención urgente – Anemia Severa',
      color: 'red',
      items: [
        'REFERENCIA INMEDIATA al Hospital o Centro de Salud II-2 / III.',
        'Evaluación médica urgente para determinar etiología (hemolítica, nutricional, parasitaria).',
        'Considerar hospitalización según estado clínico y tolerancia oral.',
        'Evaluación pediátrica para posible transfusión si Hbc < 7 g/dL con compromiso hemodinámico.',
        'Notificación obligatoria en el sistema de vigilancia epidemiológica de Puno.',
        'Coordinación con programa Juntos y SIS para acompañamiento familiar.',
        'Seguimiento post-alta con control en 15 días.'
      ]
    }
  };
  return base[dx.code] || base.normal;
}

// ── Utilidades de UI ──────────────────────────────────────────
function scrollToBottom() {
  const chat = document.getElementById('chat-messages');
  if (chat) chat.scrollTop = chat.scrollHeight;
}

function showTyping(show) {
  const el = document.getElementById('typing-indicator');
  if (el) el.classList.toggle('hidden', !show);
  if (show) scrollToBottom();
}

function setAgentActive(agentKey) {
  document.querySelectorAll('.agent-item').forEach(el => {
    if (el.dataset.agent === agentKey) {
      el.classList.add('active');
      el.classList.remove('done');
    } else if (el.classList.contains('active')) {
      el.classList.remove('active');
      el.classList.add('done');
    }
  });
}

function addMessage(html, type = 'bot', delay = 0) {
  return new Promise(resolve => {
    setTimeout(() => {
      const container = document.getElementById('chat-messages');
      const wrap = document.createElement('div');
      wrap.className = 'msg-fade-in';

      if (type === 'bot') {
        wrap.innerHTML = `
          <div class="flex items-end gap-2">
            <div class="avatar-bot w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center">
              <i class="fas fa-user-nurse text-white text-sm"></i>
            </div>
            <div class="bubble-bot px-4 py-3 text-sm text-gray-800">${html}</div>
          </div>`;
      } else if (type === 'user') {
        wrap.innerHTML = `
          <div class="flex justify-end">
            <div class="bubble-user px-4 py-2.5 text-sm">${html}</div>
          </div>`;
      } else if (type === 'card') {
        wrap.innerHTML = `
          <div class="flex items-start gap-2">
            <div class="avatar-bot w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1">
              <i class="fas fa-user-nurse text-white text-sm"></i>
            </div>
            <div class="flex-1">${html}</div>
          </div>`;
      }

      container.appendChild(wrap);
      showTyping(false);
      scrollToBottom();

      // Si hay prefill pendiente, aplicarlo ahora que el DOM ya tiene el formulario
      if (_pendingPrefill) {
        // Pequeño tick para asegurar que el navegador pintó el DOM
        requestAnimationFrame(() => applyPrefill(_pendingPrefill));
      }

      resolve(wrap);
    }, delay);
  });
}

function typewriterMsg(html, type = 'bot', delay = 0) {
  showTyping(true);
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(addMessage(html, type, 200));
    }, delay);
  });
}

// ── Datos de prefill para aplicar tras insertar el formulario ─
let _pendingPrefill = null;

// ── Formulario de registro clínico ───────────────────────────
function buildFormCard(prefill = {}) {
  // Guardar prefill para aplicarlo después de que el DOM esté listo
  _pendingPrefill = prefill;

  const toggl = (id, label) => `
    <div class="flex items-center justify-between py-1.5">
      <span class="text-xs text-gray-700">${label}</span>
      <label class="toggle-switch">
        <input type="checkbox" id="${id}" />
        <span class="toggle-slider"></span>
      </label>
    </div>`;

  // Generar todas las opciones de provincia (sin preselección - se hará por JS)
  const provOptions = Object.keys(punoData).map(k =>
    `<option value="${k}">${k}</option>`
  ).join('');

  return `
  <div class="chat-card w-full max-w-lg" id="form-card">
    <div class="card-header">
      <i class="fas fa-clipboard-list text-sm"></i>
      <h3>Agente 1 · Registro Clínico — Nuevo caso</h3>
    </div>
    <div class="card-body space-y-1">
      <!-- Establecimiento -->
      <p class="form-section-title"><i class="fas fa-hospital-alt mr-1"></i>Establecimiento de salud</p>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs text-gray-600 mb-1">Provincia EESS</label>
          <select id="f-prov-eess" class="form-select" onchange="updateDist('f-prov-eess','f-dist-eess')">
            <option value="">Seleccionar…</option>${provOptions}
          </select>
        </div>
        <div>
          <label class="block text-xs text-gray-600 mb-1">Distrito EESS</label>
          <select id="f-dist-eess" class="form-select">
            <option value="">Seleccionar…</option>
          </select>
        </div>
      </div>

      <!-- Datos del niño -->
      <p class="form-section-title mt-3"><i class="fas fa-child mr-1"></i>Datos del niño/a</p>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs text-gray-600 mb-1">Sexo</label>
          <select id="f-sexo" class="form-select">
            <option value="F">Femenino (F)</option>
            <option value="M">Masculino (M)</option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-gray-600 mb-1">Edad (meses)</label>
          <input id="f-edad" type="number" step="0.01" min="0" max="180" class="form-input" placeholder="ej. 53.62" />
        </div>
      </div>

      <!-- Programas y controles -->
      <p class="form-section-title mt-3"><i class="fas fa-shield-alt mr-1"></i>Programas y controles sociales</p>
      <div class="grid grid-cols-2 gap-x-4">
        ${toggl('f-juntos', 'Juntos')}
        ${toggl('f-sis', 'SIS')}
        ${toggl('f-qaliwarma', 'Qali Warma')}
        ${toggl('f-cred', 'Control CRED')}
        ${toggl('f-suplementacion', 'Suplementación Fe')}
        ${toggl('f-consejeria', 'Consejería')}
        ${toggl('f-sesion', 'Sesión demostrativa')}
      </div>

      <!-- Datos clínicos -->
      <p class="form-section-title mt-3"><i class="fas fa-vial mr-1"></i>Datos clínicos</p>
      <div>
        <label class="block text-xs text-gray-600 mb-1">Hemoglobina observada (g/dL)</label>
        <input id="f-hb" type="number" step="0.1" min="0" max="25" class="form-input" placeholder="ej. 13.7" />
      </div>

      <!-- Residencia (REN) -->
      <p class="form-section-title mt-3"><i class="fas fa-map-marker-alt mr-1"></i>Residencia del niño (REN)</p>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block text-xs text-gray-600 mb-1">Provincia REN</label>
          <select id="f-prov-ren" class="form-select" onchange="updateDist('f-prov-ren','f-dist-ren'); updateAltitud()">
            <option value="">Seleccionar…</option>${provOptions}
          </select>
        </div>
        <div>
          <label class="block text-xs text-gray-600 mb-1">Distrito REN</label>
          <select id="f-dist-ren" class="form-select" onchange="updateAltitud()">
            <option value="">Seleccionar…</option>
          </select>
        </div>
      </div>
      <div>
        <label class="block text-xs text-gray-600 mb-1">Altitud residencia (m.s.n.m.)</label>
        <input id="f-altura" type="number" step="1" min="0" max="6000" class="form-input" placeholder="ej. 3877" />
      </div>

      <button class="btn-primary mt-4" onclick="submitForm()">
        <i class="fas fa-paper-plane"></i> Enviar caso al sistema
      </button>
      <p class="text-center text-xs text-gray-400 mt-2">
        <i class="fas fa-lock text-xs mr-1"></i>Los datos son procesados localmente. Este prototipo no almacena información personal.
      </p>
    </div>
  </div>`;
}

// ── Aplicar prefill al formulario después de insertar en el DOM ──
function applyPrefill(p) {
  if (!p || !Object.keys(p).length) return;

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el && val !== undefined && val !== '') el.value = val;
  };
  const setChk = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.checked = !!val;
  };

  // Provincia EESS → poblar distritos → seleccionar distrito
  if (p.prov_eess) {
    setVal('f-prov-eess', p.prov_eess);
    updateDist('f-prov-eess', 'f-dist-eess');
    if (p.dist_eess) setVal('f-dist-eess', p.dist_eess);
  }

  // Sexo y edad
  if (p.sexo)      setVal('f-sexo', p.sexo);
  if (p.edadMeses) setVal('f-edad', p.edadMeses);

  // Toggles
  setChk('f-juntos',        p.juntos);
  setChk('f-sis',           p.sis);
  setChk('f-qaliwarma',     p.qaliwarma);
  setChk('f-cred',          p.cred);
  setChk('f-suplementacion',p.suplementacion);
  setChk('f-consejeria',    p.consejeria);
  setChk('f-sesion',        p.sesion);

  // Hemoglobina
  if (p.hemoglobina) setVal('f-hb', p.hemoglobina);

  // Provincia REN → poblar distritos → seleccionar distrito
  if (p.provinciaREN) {
    setVal('f-prov-ren', p.provinciaREN);
    updateDist('f-prov-ren', 'f-dist-ren');
    if (p.distritoREN) setVal('f-dist-ren', p.distritoREN);
  }

  // Altitud
  if (p.alturaREN) setVal('f-altura', p.alturaREN);

  _pendingPrefill = null;
}

// Actualizar distritos según provincia
window.updateDist = function(provId, distId) {
  const prov = document.getElementById(provId)?.value;
  const distSel = document.getElementById(distId);
  if (!distSel) return;
  const opciones = punoData[prov] || [];
  distSel.innerHTML = '<option value="">Seleccionar…</option>' +
    opciones.map(d => `<option value="${d}">${d}</option>`).join('');
};

// Autocompletar altitud
window.updateAltitud = function() {
  const dist = document.getElementById('f-dist-ren')?.value;
  if (dist && distAlturas[dist]) {
    document.getElementById('f-altura').value = distAlturas[dist];
  }
};

// ── Helpers de validación visual ─────────────────────────────
function markError(id, hasError) {
  const el = document.getElementById(id);
  if (!el) return;
  if (hasError) {
    el.style.borderColor = '#ef4444';
    el.style.boxShadow  = '0 0 0 3px rgba(239,68,68,0.15)';
  } else {
    el.style.borderColor = '';
    el.style.boxShadow  = '';
  }
}

function clearErrors() {
  ['f-prov-eess','f-dist-eess','f-edad','f-hb','f-prov-ren','f-dist-ren','f-altura'].forEach(id => markError(id, false));
  const msg = document.getElementById('form-error-msg');
  if (msg) msg.remove();
}

function showFormError(text) {
  let msg = document.getElementById('form-error-msg');
  if (!msg) {
    msg = document.createElement('div');
    msg.id = 'form-error-msg';
    msg.className = 'flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 mt-2';
    const btn = document.querySelector('#form-card .btn-primary');
    if (btn) btn.parentNode.insertBefore(msg, btn);
  }
  msg.innerHTML = `<i class="fas fa-exclamation-circle mt-0.5 flex-shrink-0"></i><span>${text}</span>`;
}

// ── Enviar formulario ─────────────────────────────────────────
window.submitForm = async function() {
  const get = id => document.getElementById(id);
  const chk = id => document.getElementById(id)?.checked ? 1 : 0;

  clearErrors();

  const datos = {
    prov_eess:     get('f-prov-eess')?.value?.trim(),
    dist_eess:     get('f-dist-eess')?.value?.trim(),
    sexo:          get('f-sexo')?.value?.trim() || 'F',
    edadMeses:     parseFloat(get('f-edad')?.value),
    juntos:        chk('f-juntos'),
    sis:           chk('f-sis'),
    qaliwarma:     chk('f-qaliwarma'),
    cred:          chk('f-cred'),
    suplementacion:chk('f-suplementacion'),
    consejeria:    chk('f-consejeria'),
    sesion:        chk('f-sesion'),
    hemoglobina:   parseFloat(get('f-hb')?.value),
    provinciaREN:  get('f-prov-ren')?.value?.trim(),
    distritoREN:   get('f-dist-ren')?.value?.trim(),
    alturaREN:     parseFloat(get('f-altura')?.value)
  };

  // ── Validar campos requeridos con feedback visual ──────────
  let errors = [];

  if (!datos.prov_eess) { markError('f-prov-eess', true); errors.push('Provincia EESS'); }
  if (!datos.dist_eess) { markError('f-dist-eess', true); errors.push('Distrito EESS'); }
  if (isNaN(datos.edadMeses) || datos.edadMeses <= 0) { markError('f-edad', true); errors.push('Edad en meses'); }
  if (isNaN(datos.hemoglobina) || datos.hemoglobina <= 0) { markError('f-hb', true); errors.push('Hemoglobina'); }
  if (!datos.provinciaREN) { markError('f-prov-ren', true); errors.push('Provincia REN'); }
  if (!datos.distritoREN)  { markError('f-dist-ren', true); errors.push('Distrito REN'); }
  if (isNaN(datos.alturaREN) || datos.alturaREN <= 0) { markError('f-altura', true); errors.push('Altitud de residencia'); }

  if (errors.length > 0) {
    showFormError(`Completa los siguientes campos obligatorios: <strong>${errors.join(', ')}</strong>.`);
    // Scroll al formulario
    document.getElementById('form-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  state.caseData = datos;
  state.step = 'registered';

  // Deshabilitar formulario
  document.querySelectorAll('#form-card button, #form-card input, #form-card select').forEach(el => {
    el.disabled = true;
    el.style.opacity = '0.7';
  });

  await runPipeline(datos);
};

// ── Pipeline de agentes ───────────────────────────────────────
async function runPipeline(datos) {
  const sexoStr = datos.sexo === 'F' ? 'Niña' : 'Niño';
  const edadStr = datos.edadMeses < 12
    ? `${datos.edadMeses.toFixed(1)} meses`
    : `${(datos.edadMeses / 12).toFixed(1)} años (${datos.edadMeses.toFixed(1)} m)`;

  // Mensaje usuario
  await addMessage(`Listo, ya envié los datos. ${sexoStr}, ${edadStr}, Hb: ${datos.hemoglobina} g/dL, altitud ${datos.alturaREN} m.s.n.m.`, 'user', 300);

  // ── AGENTE 1 confirmación ────
  setAgentActive('registro');
  showTyping(true);
  await typewriterMsg(`
    <div class="flex items-center gap-2 mb-2">
      <span class="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center"><i class="fas fa-check text-teal-600 text-xs"></i></span>
      <span class="font-semibold text-teal-700 text-sm">Agente 1 · Registro Clínico</span>
    </div>
    <p>Datos recibidos correctamente. ${sexoStr} de <strong>${edadStr}</strong> del distrito de <strong>${datos.dist_eess}</strong>, provincia <strong>${datos.prov_eess}</strong>.</p>
    <p class="mt-1 text-gray-500 text-xs">Transfiriendo al Agente Clínico-Contextual…</p>
    <div class="processing-bar"></div>`, 'bot', 800);

  // ── AGENTE 2: Ajuste por altitud ────
  await new Promise(r => setTimeout(r, 1800));
  setAgentActive('contextual');
  showTyping(true);

  const hbc = calcHbc(datos.hemoglobina, datos.alturaREN);
  const ajuste = Math.round((hbc - datos.hemoglobina) * 100) / 100;
  state.hbcResult = { hbc, ajuste };

  await typewriterMsg(`
    <div class="flex items-center gap-2 mb-2">
      <span class="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center"><i class="fas fa-mountain text-teal-600 text-xs"></i></span>
      <span class="font-semibold text-teal-700 text-sm">Agente 2 · Clínico-Contextual</span>
    </div>
    <p>Apliqué el ajuste por altitud <strong>(OMS 2024 / MINSA)</strong> para la localidad de <strong>${datos.distritoREN}</strong> a <strong>${datos.alturaREN} m.s.n.m.</strong></p>`, 'bot', 500);

  await new Promise(r => setTimeout(r, 600));

  // Tarjeta Hbc
  await addMessage(`
  <div class="chat-card w-full max-w-sm">
    <div class="card-header">
      <i class="fas fa-tint text-sm"></i>
      <h3>Hemoglobina corregida por altitud</h3>
    </div>
    <div class="card-body">
      <div class="grid grid-cols-3 gap-2 mb-3">
        <div class="metric-box">
          <div class="metric-val">${datos.hemoglobina}</div>
          <div class="metric-label">Hb observada<br/>(g/dL)</div>
        </div>
        <div class="flex items-center justify-center">
          <div class="text-center">
            <i class="fas fa-arrow-right text-teal-400 text-lg"></i>
            <div class="text-xs text-gray-500 mt-1">ajuste<br/><strong class="text-red-500">${ajuste < 0 ? ajuste : '+'+ajuste}</strong></div>
          </div>
        </div>
        <div class="metric-box" style="border-color:#0d9488; background:#f0fdfa;">
          <div class="metric-val" style="color:#0d9488;">${hbc}</div>
          <div class="metric-label">Hbc corregida<br/>(g/dL)</div>
        </div>
      </div>
      <div class="result-row">
        <span class="label">Altitud</span>
        <span class="value">${datos.alturaREN} m.s.n.m.</span>
      </div>
      <div class="result-row">
        <span class="label">Factor de corrección</span>
        <span class="value text-red-500">${ajuste} g/dL</span>
      </div>
      <div class="result-row">
        <span class="label">Marco normativo</span>
        <span class="value text-xs">OMS 2024 / RM-258-2020-MINSA</span>
      </div>
    </div>
  </div>`, 'card', 400);

  await new Promise(r => setTimeout(r, 500));
  await typewriterMsg(`Hb observada <strong>${datos.hemoglobina} g/dL</strong> → Hbc corregida <strong>${hbc} g/dL</strong>. Enviando al Agente Predictivo…
    <div class="processing-bar"></div>`, 'bot', 300);

  // ── AGENTE 3: Predictivo ML ────
  await new Promise(r => setTimeout(r, 2000));
  setAgentActive('predictivo');
  showTyping(true);

  const dx = clasificarAnemia(hbc, datos.edadMeses, datos.sexo);
  const prob = simularML(datos, hbc, dx);
  state.diagResult = { dx, prob };

  const badgeClass = { normal:'badge-normal', leve:'badge-leve', moderada:'badge-moderada', severa:'badge-severa' }[dx.code];
  const riesgoColor = { 'Bajo':'text-green-600 bg-green-50', 'Moderado':'text-amber-600 bg-amber-50', 'Alto':'text-orange-600 bg-orange-50', 'Muy alto':'text-red-600 bg-red-50' }[dx.riesgo];
  const riesgoIcon  = { 'Bajo':'fa-shield-alt text-green-500', 'Moderado':'fa-exclamation-circle text-amber-500', 'Alto':'fa-exclamation-triangle text-orange-500', 'Muy alto':'fa-times-circle text-red-500' }[dx.riesgo];

  await typewriterMsg(`
    <div class="flex items-center gap-2 mb-2">
      <span class="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center"><i class="fas fa-brain text-purple-600 text-xs"></i></span>
      <span class="font-semibold text-purple-700 text-sm">Agente 3 · Modelo Predictivo ML</span>
    </div>
    <p>Procesé las variables del caso con el modelo supervisado de clasificación. Resultado obtenido:</p>`, 'bot', 500);

  await new Promise(r => setTimeout(r, 600));

  await addMessage(`
  <div class="chat-card w-full max-w-sm">
    <div class="card-header" style="background:linear-gradient(135deg,#7c3aed,#6d28d9);">
      <i class="fas fa-robot text-sm"></i>
      <h3>Diagnóstico estimado · Modelo v1.0</h3>
    </div>
    <div class="card-body">
      <div class="text-center mb-3">
        <span class="severity-chip text-base px-4 py-1.5 ${badgeClass}">${dx.dx}</span>
      </div>
      <div class="result-row">
        <span class="label">Diagnóstico estimado</span>
        <span class="value">${dx.dx}</span>
      </div>
      <div class="result-row">
        <span class="label">Severidad</span>
        <span class="value">${dx.sev}</span>
      </div>
      <div class="result-row">
        <span class="label">Probabilidad estimada</span>
        <span class="value">${prob}%</span>
      </div>
      <div class="result-row">
        <span class="label">Nivel de riesgo</span>
        <span class="value">
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${riesgoColor}">
            <i class="fas ${riesgoIcon} text-xs"></i> ${dx.riesgo}
          </span>
        </span>
      </div>
      <div class="mt-3">
        <p class="text-xs text-gray-500 mb-1">Indicador de riesgo estimado</p>
        <div class="risk-gauge">
          <div class="risk-pointer" id="risk-ptr"></div>
        </div>
        <div class="flex justify-between text-xs text-gray-400 mt-1">
          <span>Bajo</span><span>Moderado</span><span>Alto</span><span>Muy alto</span>
        </div>
      </div>
      <div class="result-row mt-1">
        <span class="label text-xs">Modelo</span>
        <span class="value text-xs">Random Forest · Versión 1.0 (simulado)</span>
      </div>
    </div>
  </div>`, 'card', 400);

  // Animar puntero de riesgo
  setTimeout(() => {
    const ptr = document.getElementById('risk-ptr');
    if (ptr) ptr.style.left = dx.pct + '%';
  }, 800);

  await new Promise(r => setTimeout(r, 500));
  await typewriterMsg(`Diagnóstico: <strong>${dx.dx}</strong>. Severidad: <strong>${dx.sev}</strong>. Probabilidad: <strong>${prob}%</strong>. Nivel de riesgo: <strong>${dx.riesgo}</strong>.
    <p class="text-xs text-gray-400 mt-1">Pasando al Agente de Explicabilidad XAI…</p>
    <div class="processing-bar"></div>`, 'bot', 300);

  // ── AGENTE 4: XAI ────
  await new Promise(r => setTimeout(r, 2000));
  setAgentActive('xai');
  showTyping(true);

  const xaiData = calcXAI(datos, hbc);
  await typewriterMsg(`
    <div class="flex items-center gap-2 mb-2">
      <span class="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center"><i class="fas fa-lightbulb text-blue-600 text-xs"></i></span>
      <span class="font-semibold text-blue-700 text-sm">Agente 4 · Explicabilidad XAI</span>
    </div>
    <p>Apliqué valores SHAP simulados para identificar los factores que más influyen en el diagnóstico del caso:</p>`, 'bot', 500);

  await new Promise(r => setTimeout(r, 600));
  await addMessage(buildXAICard(xaiData), 'card', 400);

  await new Promise(r => setTimeout(r, 400));
  const topFactor = xaiData[0].label;
  await typewriterMsg(`El factor con mayor influencia en el diagnóstico es <strong>${topFactor}</strong>. La altitud y la suplementación también tienen peso relevante en el modelo.
    <p class="text-xs text-gray-400 mt-1">Activando Agente Terapéutico…</p>
    <div class="processing-bar"></div>`, 'bot', 300);

  // ── AGENTE 5: Recomendación terapéutica ────
  await new Promise(r => setTimeout(r, 2000));
  setAgentActive('terapeutico');
  showTyping(true);

  const rec = getRecomendaciones(dx, datos);
  await typewriterMsg(`
    <div class="flex items-center gap-2 mb-2">
      <span class="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center"><i class="fas fa-pills text-green-600 text-xs"></i></span>
      <span class="font-semibold text-green-700 text-sm">Agente 5 · Recomendación Terapéutica</span>
    </div>
    <p>Basado en el diagnóstico <strong>${dx.dx}</strong> y las guías clínicas MINSA vigentes, genero la siguiente recomendación referencial:</p>`, 'bot', 500);

  await new Promise(r => setTimeout(r, 600));
  await addMessage(buildRecCard(rec, dx), 'card', 400);

  await new Promise(r => setTimeout(r, 400));
  await typewriterMsg(`Recomendación generada bajo protocolo <strong>MINSA – Estrategia CRED</strong>. Esta es una orientación referencial; la validación y prescripción corresponde al profesional de salud responsable.
    <p class="text-xs text-gray-400 mt-1">Agente Coordinador generando reporte unificado…</p>
    <div class="processing-bar"></div>`, 'bot', 300);

  // ── AGENTE 6: Reporte unificado ────
  await new Promise(r => setTimeout(r, 2000));
  setAgentActive('reporte');
  showTyping(true);

  await typewriterMsg(`
    <div class="flex items-center gap-2 mb-2">
      <span class="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center"><i class="fas fa-file-medical text-gray-600 text-xs"></i></span>
      <span class="font-semibold text-gray-700 text-sm">Agente 6 · Coordinador de Reporte</span>
    </div>
    <p>He consolidado todos los resultados del pipeline multiagente. El reporte clínico unificado está listo:</p>`, 'bot', 500);

  await new Promise(r => setTimeout(r, 700));
  await addMessage(buildReportCard(datos, hbc, ajuste, dx, prob, rec), 'card', 400);

  // Marcar todos agentes como done
  document.querySelectorAll('.agent-item').forEach(el => {
    el.classList.remove('active');
    el.classList.add('done');
  });

  await new Promise(r => setTimeout(r, 400));
  await typewriterMsg(`
    <i class="fas fa-check-circle text-green-500 mr-1"></i>
    Reporte clínico unificado generado. Puedes descargarlo en formato PDF o comenzar una <button onclick="resetChat()" class="text-teal-600 underline text-sm font-medium">nueva consulta</button>.
    <p class="text-xs text-amber-600 mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2">
      <i class="fas fa-exclamation-triangle mr-1"></i>
      <strong>Recordatorio:</strong> Este prototipo es académico. El diagnóstico y tratamiento deben ser realizados y validados por profesionales de salud autorizados.
    </p>`, 'bot', 400);

  state.step = 'report';
}

// ── Tarjeta XAI ───────────────────────────────────────────────
function buildXAICard(xaiData) {
  const maxVal = Math.max(...xaiData.map(d => Math.max(d.anemia, d.sinAnemia)));
  const bars = xaiData.map(d => {
    const pA  = Math.round((d.anemia / maxVal) * 100);
    const pSA = Math.round((d.sinAnemia / maxVal) * 100);
    return `
    <div class="xai-bar-wrap">
      <span class="xai-label">${d.label}</span>
      <div class="flex-1 space-y-1">
        <div class="xai-bar-track"><div class="xai-bar-fill" style="width:${pA}%;background:#ef4444;" title="Anemia"></div></div>
        <div class="xai-bar-track"><div class="xai-bar-fill" style="width:${pSA}%;background:#3b82f6;" title="Sin anemia"></div></div>
      </div>
      <span class="xai-value text-gray-600">${d.anemia.toFixed(2)}</span>
    </div>`;
  }).join('');

  return `
  <div class="chat-card w-full max-w-md">
    <div class="card-header" style="background:linear-gradient(135deg,#1d4ed8,#1e40af);">
      <i class="fas fa-chart-bar text-sm"></i>
      <h3>Factores influyentes (XAI · SHAP)</h3>
    </div>
    <div class="card-body">
      <div class="flex gap-4 mb-3 text-xs">
        <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-sm bg-red-400 inline-block"></span>Anemia</span>
        <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-sm bg-blue-400 inline-block"></span>Sin anemia</span>
      </div>
      ${bars}
      <p class="text-xs text-gray-400 mt-2 italic">Valores SHAP simulados basados en importancia relativa del modelo. Escala normalizada.</p>
    </div>
  </div>`;
}

// ── Tarjeta recomendación ─────────────────────────────────────
function buildRecCard(rec, dx) {
  const colorMap = {
    green:  { bg:'#f0fdf4', border:'#86efac', header:'#15803d', icon:'fa-check-circle text-green-500' },
    amber:  { bg:'#fefce8', border:'#fde047', header:'#854d0e', icon:'fa-exclamation-circle text-amber-500' },
    orange: { bg:'#fff7ed', border:'#fed7aa', header:'#9a3412', icon:'fa-exclamation-triangle text-orange-500' },
    red:    { bg:'#fef2f2', border:'#fca5a5', header:'#991b1b', icon:'fa-times-circle text-red-500' }
  };
  const c = colorMap[rec.color] || colorMap.green;
  const items = rec.items.map(i => `
    <div class="rec-item"><i class="fas fa-check-circle text-xs"></i><span>${i}</span></div>`).join('');

  return `
  <div class="chat-card w-full max-w-md" style="border-color:${c.border}; background:${c.bg};">
    <div class="card-header" style="background:${c.header};">
      <i class="fas fa-pills text-sm"></i>
      <h3>${rec.titulo}</h3>
    </div>
    <div class="card-body">
      <div class="flex items-center gap-2 mb-3">
        <i class="fas ${c.icon} text-lg"></i>
        <div>
          <p class="text-xs text-gray-500">Diagnóstico base</p>
          <p class="font-semibold text-sm">${dx.dx} · Riesgo ${dx.riesgo}</p>
        </div>
      </div>
      <p class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Orientaciones MINSA:</p>
      ${items}
      <p class="text-xs text-gray-400 mt-3 italic border-t pt-2">
        <i class="fas fa-info-circle mr-1"></i>
        Recomendación referencial basada en Resolución Ministerial MINSA. Validar con profesional de salud.
      </p>
    </div>
  </div>`;
}

// ── Tarjeta reporte unificado ─────────────────────────────────
function buildReportCard(datos, hbc, ajuste, dx, prob, rec) {
  const fecha = new Date().toLocaleDateString('es-PE', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' });
  const sexoStr  = datos.sexo === 'F' ? 'Femenino' : 'Masculino';
  const edadStr  = datos.edadMeses < 12 ? `${datos.edadMeses.toFixed(1)} meses` : `${(datos.edadMeses/12).toFixed(1)} años (${datos.edadMeses.toFixed(1)} m)`;
  const progr = [
    datos.juntos?'Juntos':'',
    datos.sis?'SIS':'',
    datos.qaliwarma?'Qali Warma':'',
    datos.cred?'CRED':'',
    datos.suplementacion?'Suplementación Fe':'',
    datos.consejeria?'Consejería':'',
    datos.sesion?'Sesión demostrativa':''
  ].filter(Boolean).join(', ') || 'Ninguno registrado';

  return `
  <div class="chat-card w-full max-w-lg" id="report-card">
    <div class="card-header">
      <i class="fas fa-file-medical-alt text-sm"></i>
      <h3>Reporte Clínico Unificado · AnemIA</h3>
    </div>
    <div class="card-body" id="report-content">
      <div class="flex items-center justify-between mb-3">
        <div>
          <p class="text-xs text-gray-500">Fecha de generación</p>
          <p class="text-sm font-semibold">${fecha}</p>
        </div>
        <span class="severity-chip ${{'normal':'badge-normal','leve':'badge-leve','moderada':'badge-moderada','severa':'badge-severa'}[dx.code]}">${dx.dx}</span>
      </div>

      <div class="report-section">
        <h4><i class="fas fa-hospital-alt mr-1"></i>Establecimiento de Salud</h4>
        <div class="grid grid-cols-2 gap-1">
          <div class="result-row"><span class="label">Provincia EESS</span><span class="value">${datos.prov_eess}</span></div>
          <div class="result-row"><span class="label">Distrito EESS</span><span class="value">${datos.dist_eess}</span></div>
        </div>
      </div>

      <div class="report-section">
        <h4><i class="fas fa-child mr-1"></i>Datos del Paciente</h4>
        <div class="grid grid-cols-2 gap-1">
          <div class="result-row"><span class="label">Sexo</span><span class="value">${sexoStr}</span></div>
          <div class="result-row"><span class="label">Edad</span><span class="value">${edadStr}</span></div>
          <div class="result-row"><span class="label">Provincia REN</span><span class="value">${datos.provinciaREN}</span></div>
          <div class="result-row"><span class="label">Distrito REN</span><span class="value">${datos.distritoREN}</span></div>
          <div class="result-row"><span class="label">Altitud residencia</span><span class="value">${datos.alturaREN} m.s.n.m.</span></div>
        </div>
      </div>

      <div class="report-section">
        <h4><i class="fas fa-shield-alt mr-1"></i>Programas y Controles</h4>
        <p class="text-sm text-gray-700">${progr}</p>
      </div>

      <div class="report-section">
        <h4><i class="fas fa-tint mr-1"></i>Evaluación Clínica</h4>
        <div class="grid grid-cols-2 gap-1">
          <div class="result-row"><span class="label">Hemoglobina observada</span><span class="value">${datos.hemoglobina} g/dL</span></div>
          <div class="result-row"><span class="label">Ajuste por altitud</span><span class="value text-red-600">${ajuste} g/dL</span></div>
          <div class="result-row"><span class="label">Hemoglobina corregida (Hbc)</span><span class="value font-bold text-teal-700">${hbc} g/dL</span></div>
          <div class="result-row"><span class="label">Normativa</span><span class="value text-xs">OMS 2024 / MINSA</span></div>
        </div>
      </div>

      <div class="report-section">
        <h4><i class="fas fa-robot mr-1"></i>Resultado del Modelo ML</h4>
        <div class="grid grid-cols-2 gap-1">
          <div class="result-row"><span class="label">Diagnóstico estimado</span><span class="value">${dx.dx}</span></div>
          <div class="result-row"><span class="label">Severidad</span><span class="value">${dx.sev}</span></div>
          <div class="result-row"><span class="label">Probabilidad</span><span class="value">${prob}%</span></div>
          <div class="result-row"><span class="label">Nivel de riesgo</span><span class="value">${dx.riesgo}</span></div>
          <div class="result-row"><span class="label">Modelo</span><span class="value text-xs">Random Forest v1.0 (simulado)</span></div>
        </div>
      </div>

      <div class="report-section">
        <h4><i class="fas fa-pills mr-1"></i>Recomendación Referencial</h4>
        <p class="text-sm font-semibold text-gray-800 mb-1">${rec.titulo}</p>
        ${rec.items.slice(0,3).map(i => `<div class="rec-item text-xs"><i class="fas fa-check-circle text-xs"></i><span>${i}</span></div>`).join('')}
        ${rec.items.length > 3 ? `<p class="text-xs text-gray-400">+ ${rec.items.length - 3} recomendaciones adicionales</p>` : ''}
      </div>

      <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700 mb-3">
        <i class="fas fa-exclamation-triangle mr-1"></i>
        <strong>Nota académica:</strong> Este reporte es generado por un prototipo de investigación. No reemplaza el diagnóstico clínico profesional. Toda decisión médica debe ser tomada por personal de salud autorizado.
      </div>

      <div class="flex gap-2 mt-2">
        <button class="btn-primary" onclick="downloadPDF()">
          <i class="fas fa-download"></i> Descargar PDF
        </button>
        <button class="btn-secondary" onclick="printReport()">
          <i class="fas fa-print"></i> Imprimir
        </button>
      </div>
    </div>
  </div>`;
}

// ── Descarga PDF ──────────────────────────────────────────────
window.downloadPDF = async function() {
  const el = document.getElementById('report-content');
  if (!el) return;
  const btn = el.querySelector('button');
  if (btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Generando PDF…'; btn.disabled = true; }

  try {
    const canvas = await html2canvas(document.getElementById('report-card'), { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pW = pdf.internal.pageSize.getWidth();
    const pH = pdf.internal.pageSize.getHeight();
    const ratio = canvas.width / canvas.height;
    const imgW = pW - 20;
    const imgH = imgW / ratio;
    let yPos = 10;
    if (imgH > pH - 20) {
      const pages = Math.ceil(imgH / (pH - 20));
      for (let i = 0; i < pages; i++) {
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, 10 - i * (pH - 20), imgW, imgH);
      }
    } else {
      pdf.addImage(imgData, 'PNG', 10, yPos, imgW, imgH);
    }
    const fname = `AnemIA_Reporte_${state.caseData?.distritoREN || 'Puno'}_${new Date().toISOString().slice(0,10)}.pdf`;
    pdf.save(fname);
  } catch(e) {
    alert('Error al generar PDF. Puede usar la opción de impresión.');
  }
  if (btn) { btn.innerHTML = '<i class="fas fa-check mr-2"></i>Descargado'; btn.disabled = false; }
};

window.printReport = function() {
  const content = document.getElementById('report-card');
  if (!content) return;
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><title>Reporte AnemIA</title>
    <script src="https://cdn.tailwindcss.com"><\/script>
    <style>body{font-family:Arial,sans-serif;padding:20px;max-width:800px;margin:0 auto}
    .badge-normal{background:#dcfce7;color:#15803d;padding:3px 10px;border-radius:999px;}
    .badge-leve{background:#fef9c3;color:#854d0e;padding:3px 10px;border-radius:999px;}
    .badge-moderada{background:#ffedd5;color:#9a3412;padding:3px 10px;border-radius:999px;}
    .badge-severa{background:#fee2e2;color:#991b1b;padding:3px 10px;border-radius:999px;}
    </style></head><body>${content.innerHTML}</body></html>`);
  w.document.close();
  setTimeout(() => { w.print(); }, 800);
};

// ── Cargar caso de ejemplo ────────────────────────────────────
window.loadExample = async function() {
  if (state.step !== 'idle') {
    const ok = confirm('Esto reiniciará la conversación actual. ¿Continuar?');
    if (!ok) return;
    await resetChat(false);
  }
  await addMessage(`Quiero cargar el caso de ejemplo: niña de Juliaca, 53.6 meses, Hb 13.7 g/dL, altitud 3877 m.`, 'user', 200);
  await typewriterMsg(`Perfecto, cargué el <strong>caso de ejemplo de Juliaca</strong> con los datos precargados. Revísalos y haz clic en <strong>Enviar caso</strong> cuando estés listo:`, 'bot', 600);
  await new Promise(r => setTimeout(r, 600));
  await addMessage(buildFormCard(defaultCase), 'card', 300);
};

// ── Reset chat ────────────────────────────────────────────────
window.resetChat = async function(confirm_reset = true) {
  if (confirm_reset && state.step !== 'idle') {
    const ok = confirm('¿Deseas iniciar una nueva consulta? Se borrarán los datos actuales.');
    if (!ok) return;
  }
  state = { caseData: null, hbcResult: null, diagResult: null, step: 'idle' };
  const chat = document.getElementById('chat-messages');
  if (chat) chat.innerHTML = '';
  document.querySelectorAll('.agent-item').forEach(el => {
    el.classList.remove('active', 'done');
  });
  initChat();
};

// ── Mensaje de bienvenida ─────────────────────────────────────
async function initChat() {
  await typewriterMsg(`
    <div class="flex items-center gap-2 mb-2">
      <span class="text-xl">👋</span>
      <span class="font-semibold text-teal-700">¡Hola! Soy <strong>AnemIA</strong></span>
    </div>
    <p>Soy tu asistente clínico conversacional para el <strong>diagnóstico de anemia infantil</strong> en la región de Puno, Perú.</p>
    <p class="mt-2">Utilizo un sistema de <strong>6 agentes especializados</strong> que procesan tus datos clínicos para:</p>
    <ul class="mt-2 space-y-1 text-sm">
      <li class="flex items-center gap-2"><span class="w-4 h-4 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0"><i class="fas fa-mountain text-teal-600 text-xs"></i></span>Calcular la Hb corregida por altitud (OMS 2024 / MINSA)</li>
      <li class="flex items-center gap-2"><span class="w-4 h-4 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0"><i class="fas fa-brain text-purple-600 text-xs"></i></span>Estimar el diagnóstico con modelo ML supervisado</li>
      <li class="flex items-center gap-2"><span class="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0"><i class="fas fa-lightbulb text-blue-600 text-xs"></i></span>Explicar los factores influyentes (XAI · SHAP)</li>
      <li class="flex items-center gap-2"><span class="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0"><i class="fas fa-pills text-green-600 text-xs"></i></span>Proponer recomendaciones referenciales MINSA</li>
    </ul>`, 'bot', 200);

  await new Promise(r => setTimeout(r, 800));

  await typewriterMsg(`Por favor, registra los datos del paciente en el formulario. Puedes usar el <strong>caso de ejemplo de Juliaca</strong> para una demostración completa.`, 'bot', 300);

  await new Promise(r => setTimeout(r, 600));
  await addMessage(buildFormCard({}), 'card', 400);
}

// ── Enviar mensaje por input ──────────────────────────────────
window.sendMessage = async function() {
  const input = document.getElementById('user-input');
  const text = input?.value?.trim();
  if (!text) return;
  input.value = '';

  await addMessage(text, 'user');

  // Respuestas contextuales
  const t = text.toLowerCase();
  if (t.includes('diagnos') || t.includes('resultado')) {
    if (state.diagResult) {
      await typewriterMsg(`El diagnóstico estimado es: <strong>${state.diagResult.dx.dx}</strong>. Severidad: <strong>${state.diagResult.dx.sev}</strong>. Probabilidad: <strong>${state.diagResult.prob}%</strong>.`, 'bot', 600);
    } else {
      await typewriterMsg(`Aún no he procesado ningún caso. Por favor completa el formulario con los datos del paciente.`, 'bot', 600);
    }
  } else if (t.includes('hemoglobina') || t.includes('hb') || t.includes('hbc')) {
    if (state.hbcResult) {
      await typewriterMsg(`La hemoglobina corregida (Hbc) calculada es <strong>${state.hbcResult.hbc} g/dL</strong>, con un ajuste de <strong>${state.hbcResult.ajuste} g/dL</strong> por la altitud de ${state.caseData?.alturaREN} m.s.n.m.`, 'bot', 600);
    } else {
      await typewriterMsg(`Ingresa los datos del paciente en el formulario para que pueda calcular la hemoglobina corregida por altitud.`, 'bot', 600);
    }
  } else if (t.includes('tratamiento') || t.includes('recomendacion') || t.includes('recomendación')) {
    if (state.diagResult) {
      const rec = getRecomendaciones(state.diagResult.dx, state.caseData);
      await typewriterMsg(`La recomendación es: <strong>${rec.titulo}</strong>. Consulta la tarjeta de recomendación detallada más arriba.`, 'bot', 600);
    } else {
      await typewriterMsg(`Primero necesito procesar los datos del paciente para generar una recomendación.`, 'bot', 600);
    }
  } else if (t.includes('nuevo') || t.includes('nueva') || t.includes('otro caso')) {
    await resetChat();
  } else if (t.includes('hola') || t.includes('buenas') || t.includes('buenos')) {
    await typewriterMsg(`¡Hola! Estoy listo para ayudarte. Completa el formulario con los datos del paciente para iniciar el análisis.`, 'bot', 600);
  } else if (t.includes('gracias') || t.includes('thank')) {
    await typewriterMsg(`¡Con gusto! Recuerda que soy un prototipo académico y todas las decisiones clínicas deben ser validadas por un profesional de salud. ¿Deseas iniciar un nuevo caso?`, 'bot', 600);
  } else if (t.includes('altitud') || t.includes('ajuste') || t.includes('correccion')) {
    await typewriterMsg(`El ajuste por altitud se aplica usando la tabla de corrección de hemoglobina de la <strong>OMS 2024 / MINSA (RM-258-2020)</strong>. Por ejemplo, a 3877 m.s.n.m. (Juliaca), se resta aproximadamente 2.64 g/dL al valor observado para obtener la Hbc.`, 'bot', 600);
  } else if (t.includes('puno') || t.includes('altiplano')) {
    await typewriterMsg(`Puno es una de las regiones con mayor prevalencia de anemia infantil en el Perú. Su altitud promedio (3,800-4,500 m.s.n.m.) requiere una corrección especial de la hemoglobina para evitar diagnósticos incorrectos. Este sistema incorpora esa corrección de forma automática.`, 'bot', 600);
  } else {
    await typewriterMsg(`Entendido. Puedo ayudarte a analizar datos de anemia infantil. Completa el formulario o usa el <strong>caso de ejemplo de Juliaca</strong> para ver el sistema en acción.`, 'bot', 600);
  }
};

// Enviar con Enter
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('user-input');
  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }
  initChat();
});
