import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AnemIA · Asistente Clínico Puno</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" />
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/static/styles.css" />
</head>
<body class="bg-gray-100 font-inter min-h-screen flex flex-col">

  <!-- Header -->
  <header class="bg-teal-700 text-white shadow-md z-10">
    <div class="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
      <div class="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center shadow-inner">
        <i class="fas fa-stethoscope text-white text-lg"></i>
      </div>
      <div class="flex-1">
        <h1 class="text-lg font-semibold leading-tight">AnemIA &middot; Asistente Clínico</h1>
        <p class="text-teal-200 text-xs">Sistema Multiagente · Diagnóstico de Anemia Infantil · Puno, Perú</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
        <span class="text-xs text-teal-200 hidden sm:block">Sistema activo</span>
      </div>
    </div>
  </header>

  <!-- Disclaimer banner -->
  <div class="bg-amber-50 border-b border-amber-200 px-4 py-2">
    <div class="max-w-4xl mx-auto flex items-start gap-2">
      <i class="fas fa-exclamation-triangle text-amber-500 text-sm mt-0.5 flex-shrink-0"></i>
      <p class="text-amber-700 text-xs leading-relaxed">
        <strong>Prototipo académico.</strong> No reemplaza el diagnóstico ni el tratamiento realizado por profesionales de salud. Toda recomendación debe ser validada por personal médico autorizado.
      </p>
    </div>
  </div>

  <!-- Main layout -->
  <div class="flex-1 flex overflow-hidden max-w-4xl w-full mx-auto relative">

    <!-- Chat container -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <div id="chat-messages" class="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
        <!-- Messages injected by JS -->
      </div>

      <!-- Typing indicator -->
      <div id="typing-indicator" class="hidden px-4 pb-2">
        <div class="flex items-end gap-2">
          <div class="avatar-bot w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center">
            <i class="fas fa-user-nurse text-white text-sm"></i>
          </div>
          <div class="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
            <div class="flex gap-1 items-center">
              <span class="w-2 h-2 bg-teal-400 rounded-full typing-dot"></span>
              <span class="w-2 h-2 bg-teal-400 rounded-full typing-dot" style="animation-delay:0.2s"></span>
              <span class="w-2 h-2 bg-teal-400 rounded-full typing-dot" style="animation-delay:0.4s"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Input area -->
      <div class="border-t border-gray-200 bg-white px-4 py-3">
        <div class="flex items-center gap-2">
          <input
            id="user-input"
            type="text"
            placeholder="Escribe un mensaje o pregunta..."
            class="flex-1 border border-gray-300 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition"
            autocomplete="off"
          />
          <button
            id="send-btn"
            onclick="sendMessage()"
            class="w-10 h-10 rounded-full bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center transition shadow-md flex-shrink-0"
          >
            <i class="fas fa-paper-plane text-sm"></i>
          </button>
        </div>
        <div class="flex items-center justify-between mt-2 px-1">
          <button onclick="loadExample()" class="text-xs text-teal-600 hover:text-teal-800 flex items-center gap-1 transition">
            <i class="fas fa-flask text-xs"></i>
            Cargar caso ejemplo (Juliaca)
          </button>
          <button onclick="resetChat()" class="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition">
            <i class="fas fa-redo-alt text-xs"></i>
            Nueva consulta
          </button>
        </div>
      </div>
    </main>

    <!-- Agent panel sidebar -->
    <aside class="hidden lg:flex flex-col w-48 border-l border-gray-200 bg-white p-3 flex-shrink-0">
      <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
        <i class="fas fa-robot mr-1"></i>Agentes del sistema
      </p>
      <div class="space-y-1" id="agent-list">
        <div class="agent-item flex items-center gap-2 p-2 rounded-lg transition" data-agent="registro">
          <span class="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0 transition"></span>
          <div>
            <p class="text-xs font-medium text-gray-700">Registro</p>
            <p class="text-xs text-gray-400">Clínico</p>
          </div>
        </div>
        <div class="agent-item flex items-center gap-2 p-2 rounded-lg transition" data-agent="contextual">
          <span class="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0 transition"></span>
          <div>
            <p class="text-xs font-medium text-gray-700">Contextual</p>
            <p class="text-xs text-gray-400">Altitud / Hbc</p>
          </div>
        </div>
        <div class="agent-item flex items-center gap-2 p-2 rounded-lg transition" data-agent="predictivo">
          <span class="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0 transition"></span>
          <div>
            <p class="text-xs font-medium text-gray-700">Predictivo</p>
            <p class="text-xs text-gray-400">ML · Diagnóstico</p>
          </div>
        </div>
        <div class="agent-item flex items-center gap-2 p-2 rounded-lg transition" data-agent="xai">
          <span class="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0 transition"></span>
          <div>
            <p class="text-xs font-medium text-gray-700">Explicabilidad</p>
            <p class="text-xs text-gray-400">XAI · SHAP</p>
          </div>
        </div>
        <div class="agent-item flex items-center gap-2 p-2 rounded-lg transition" data-agent="terapeutico">
          <span class="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0 transition"></span>
          <div>
            <p class="text-xs font-medium text-gray-700">Terapéutico</p>
            <p class="text-xs text-gray-400">Recomendación</p>
          </div>
        </div>
        <div class="agent-item flex items-center gap-2 p-2 rounded-lg transition" data-agent="reporte">
          <span class="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0 transition"></span>
          <div>
            <p class="text-xs font-medium text-gray-700">Coordinador</p>
            <p class="text-xs text-gray-400">Reporte PDF</p>
          </div>
        </div>
      </div>

      <div class="mt-auto pt-3 border-t border-gray-100">
        <p class="text-xs text-gray-400 leading-relaxed">
          <i class="fas fa-graduation-cap mr-1 text-teal-500"></i>
          Prototipo de investigación.<br/>
          <span class="text-teal-600 font-medium">UNA Puno · 2024</span>
        </p>
      </div>
    </aside>
  </div>

  <script src="/static/app.js"></script>
</body>
</html>`)
})

export default app
