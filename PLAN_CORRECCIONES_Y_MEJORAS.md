# Plan de corrección frontend: sidebar tipo historial, cabecera limpia y flujo conversacional correcto

## Objetivo

Corregir la interfaz actual de AnemIA después del rediseño visual, manteniendo el frontend moderno pero solucionando problemas de organización, flujo conversacional y comportamiento de configuración.

La corrección debe enfocarse en:

- Limpiar el sidebar.
- Eliminar secciones innecesarias de acciones/resultados.
- Convertir el historial en una lista real de consultas recientes tipo ChatGPT/Gemini/Claude.
- Dejar la cabecera minimalista y correcta.
- Corregir el botón de ocultar sidebar en escritorio.
- Corregir el flujo de conversación mensaje por mensaje.
- Arreglar el menú de configuración para que no se congele.
- Eliminar la opción de descargar PDF desde configuración.
- Mantener intacto backend, base de datos, endpoints y payloads.

---

## Restricción absoluta

No modificar:

- Backend.
- Base de datos.
- Migraciones.
- Seeds.
- Modelos.
- Controladores.
- Servicios.
- Middlewares.
- Rutas API.
- Endpoints.
- Payloads.
- Contratos de API.
- Variables de entorno.
- Lógica de persistencia.
- Lógica de negocio.
- Respuestas del backend.

Solo se puede modificar frontend, componentes visuales, estado local de UI, layout, estilos y animaciones.

---

## Problemas detectados en la interfaz actual

### 1. Sidebar saturado

Actualmente el sidebar muestra:

- Navegación.
- Acciones.
- Resultados.
- Información.

Esto hace que parezca un panel de botones, no una experiencia conversacional moderna.

### 2. Historial mal planteado

Actualmente existe un botón “Historial”, pero debería mostrarse una lista real de consultas recientes, de forma lineal, como en ChatGPT, Gemini o Claude.

No quiero un botón suelto de historial. Quiero una sección donde aparezcan directamente las consultas realizadas.

### 3. Botón “Ocultar” sidebar en escritorio

En la vista web de escritorio/PC aparece el botón “Ocultar” en el sidebar, pero no debe aparecer en desktop.

En PC el sidebar debe estar visible por defecto y no debe mostrar el botón de ocultar.

El botón para abrir/cerrar sidebar solo debe aparecer en móvil o pantallas pequeñas.

### 4. Cabecera incorrecta

En la cabecera, encima del texto “Caso Juliaca · 20 jun. 2026”, debe aparecer el logo del sistema, no el botón de ocultar sidebar.

La cabecera debe estar limpia y enfocada en el contexto de la conversación.

### 5. Flujo de conversación roto

Al manejar una conversación, los mensajes no siguen una secuencia natural mensaje por mensaje.

El problema actual es que debajo de la conversación aparecen gráficos, resultados o elementos de consultas anteriores, especialmente de la primera consulta, y se quedan guardados visualmente. Esto rompe el entendimiento del flujo conversacional.

El chat debe funcionar como una conversación lineal:

```text
Mensaje del usuario
Respuesta del asistente
Resultado asociado a esa respuesta, si aplica
Mensaje del usuario
Respuesta del asistente
Resultado asociado a esa respuesta, si aplica
...
```

No deben aparecer resultados antiguos fuera de contexto debajo de los mensajes nuevos.

### 6. Menú de configuración se congela

Al hacer clic en la tuerca de configuración/preferencias y cambiar modo claro/oscuro o tocar cualquier opción, el botón queda congelado o no permite volver a presionarlo hasta recargar la página.

Esto debe corregirse.

### 7. Opción de descargar PDF en configuración

La opción de descargar PDF no debe estar dentro del menú de configuración.

Debe eliminarse de configuración.

Las demás opciones de configuración pueden quedarse.

---

## Resultado esperado

Después de la corrección:

- El sidebar debe parecer una barra lateral de aplicación conversacional.
- Debe mostrar directamente las consultas recientes.
- No debe mostrar secciones “Acciones” ni “Resultados”.
- El botón “Historial” debe desaparecer como botón suelto.
- Las consultas recientes deben aparecer como lista lineal.
- En escritorio, el sidebar debe estar visible y sin botón “Ocultar”.
- En móvil, sí puede existir botón para mostrar/ocultar sidebar.
- La cabecera debe mostrar logo del sistema + nombre de conversación + fecha.
- El chat debe seguir flujo mensaje por mensaje.
- Los resultados deben asociarse al mensaje/respuesta correspondiente.
- El menú de configuración debe funcionar sin congelarse.
- La opción de descargar PDF debe eliminarse del menú de configuración.
- Backend y base de datos deben quedar intactos.

---

## Fase 1: Limpiar sidebar

Eliminar completamente del sidebar las secciones:

```text
ACCIONES
RESULTADOS
```

También eliminar sus botones visuales:

- Analizar con agentes.
- Cargar caso ejemplo.
- Nuevo caso.
- Ver agentes y XAI.
- Reporte PDF.

No deben aparecer como bloques permanentes en el sidebar.

Si estas acciones siguen siendo necesarias, reubicarlas dentro del área principal de la conversación o como comandos del chat, sin saturar el sidebar.

---

## Fase 2: Rediseñar sidebar como historial conversacional

El sidebar debe quedar con estructura tipo ChatGPT/Gemini/Claude.

Estructura sugerida:

```text
[Logo AnemIA]
AnemIA
Asistente Clínico

[Botón Nueva consulta]

Consultas recientes
- Caso Juliaca · 20 jun.
- Evaluación niña 53.62 meses
- Consulta anemia leve
- Reporte San Román
- Análisis Random Forest
- Seguimiento CRED

Información
- Acerca
```

La sección de consultas recientes debe mostrar directamente las conversaciones/consultas existentes.

No debe ser un botón llamado “Historial”.

Debe ser una lista lineal visible.

Cada consulta reciente debe tener:

- Título corto.
- Fecha o subtítulo breve.
- Estado opcional.
- Hover.
- Estado activo.
- Animación sutil.
- Click para abrir esa conversación si la lógica ya existe.

Si no existe backend para historial real, usar únicamente el estado local disponible o la información ya existente en frontend. No inventar endpoints nuevos ni datos falsos persistentes.

---

## Fase 3: Botón “Nueva consulta”

En lugar de tener “Nuevo caso” dentro de acciones, moverlo arriba del historial como botón principal:

```text
+ Nueva consulta
```

Este botón debe:

- Limpiar o iniciar una conversación según la lógica existente.
- No cambiar payloads.
- No llamar endpoints nuevos.
- Usar la función actual si ya existe.
- Tener animación hover/tap con Framer Motion.

---

## Fase 4: Botón de ocultar sidebar solo móvil

Corregir el comportamiento responsive:

### Escritorio / PC

- Sidebar visible por defecto.
- No mostrar botón “Ocultar”.
- No mostrar botón de esconder sidebar dentro del sidebar.
- No mostrar botón de ocultar encima de “Caso Juliaca”.
- El layout debe asumir que el sidebar está presente.

### Móvil / tablet pequeña

- Sidebar puede iniciar oculto.
- Mostrar botón de menú/sidebar en la cabecera.
- El botón debe abrir/cerrar sidebar.
- Usar overlay o drawer si corresponde.
- Cerrar sidebar al seleccionar una consulta si mejora UX.

Usar breakpoint claro, por ejemplo:

```text
desktop: >= 1024px
mobile/tablet: < 1024px
```

Si el proyecto usa Tailwind, usar clases tipo:

```text
hidden lg:block
lg:hidden
```

o lógica equivalente.

---

## Fase 5: Cabecera corregida

La cabecera debe quedar limpia.

Debe mostrar:

```text
[Logo pequeño del sistema] Caso Juliaca · 20 jun. 2026
Caso clínico · 21 jun. 2026
                                      [Botón configuración]
```

Reglas:

- Encima o junto a “Caso Juliaca” debe aparecer el logo del sistema.
- No debe aparecer el botón de ocultar sidebar en desktop.
- No debe aparecer botón “Historial” en la cabecera.
- No deben aparecer acciones del caso en la cabecera.
- El extremo derecho debe mantener únicamente el botón de configuración/preferencias.

En móvil sí puede aparecer un botón de menú/sidebar, pero solo para abrir/cerrar la barra lateral.

---

## Fase 6: Corregir flujo conversacional

Este es el ajuste más importante.

Actualmente los resultados, gráficos o cards de la primera consulta quedan renderizados debajo y rompen el flujo de conversación.

Se debe reestructurar el render de conversación para que cada elemento pertenezca a un turno de conversación.

### Modelo visual esperado

Cada interacción debe representarse así:

```text
Turno 1
- Mensaje usuario
- Respuesta asistente
- Resultados/cards de ese turno, si aplica

Turno 2
- Mensaje usuario
- Respuesta asistente
- Resultados/cards de ese turno, si aplica

Turno 3
- Mensaje usuario
- Respuesta asistente
- Resultados/cards de ese turno, si aplica
```

### Regla

No renderizar resultados globales al final de la pantalla si pertenecen a una consulta anterior.

Los resultados deben estar asociados al mensaje/respuesta que los generó.

### Implementación sugerida

Revisar si existe algo similar a:

```tsx
messages.map(...)
results.map(...)
charts.map(...)
analysisResult && <ResultCard />
```

Si existe un render separado de resultados globales, evitarlo.

Convertirlo a estructura por mensaje o por turno:

```tsx
type ChatTurn = {
  id: string;
  userMessage?: Message;
  assistantMessage?: Message;
  result?: AnalysisResult;
  charts?: ChartData[];
  createdAt: string;
};
```

O, si ya existe arreglo de mensajes:

```tsx
type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  result?: AnalysisResult;
  charts?: ChartData[];
};
```

Luego renderizar:

```tsx
messages.map((message) => (
  <ChatMessage key={message.id} message={message}>
    {message.result && <ResultCard result={message.result} />}
    {message.charts && <Charts data={message.charts} />}
  </ChatMessage>
))
```

No cambiar la respuesta del backend. Solo reorganizar el estado y render del frontend.

---

## Fase 7: Limpiar resultados antiguos al iniciar nueva consulta

Cuando el usuario presione “Nueva consulta” o cargue un nuevo caso:

- Limpiar mensajes de la conversación actual según lógica existente.
- Limpiar resultados visuales anteriores.
- Limpiar gráficos anteriores.
- Limpiar estados `analysisResult`, `currentReport`, `charts`, `xai`, o equivalentes, si existen.
- No borrar historial real si existe.
- No afectar backend.

Debe evitarse que el primer resultado quede pegado en consultas posteriores.

---

## Fase 8: Corregir menú de configuración

Problema: al cambiar modo claro/oscuro o tocar una opción, el botón se congela y requiere recargar la página.

Revisar:

- Estado `isOpen`.
- Eventos `onClick`.
- Eventos fuera del dropdown.
- Bloqueos por overlay.
- `pointer-events`.
- `z-index`.
- Animaciones con `AnimatePresence`.
- Estados que se quedan en loading.
- Uso incorrecto de `disabled`.
- Propagación de eventos.
- Re-render que desmonta mal el botón.
- Conflicto entre theme toggle y dropdown.

### Reglas de corrección

- El botón de configuración siempre debe poder volver a abrirse.
- Cambiar modo claro/oscuro no debe congelar el dropdown.
- Cambiar tamaño de fuente no debe congelar el dropdown.
- Al seleccionar una opción, el menú puede cerrarse o mantenerse abierto, pero debe seguir funcionando.
- No debe requerirse recargar la página.
- La animación de cierre/apertura no debe bloquear clicks.
- El overlay no debe quedar invisible encima del botón.

### Verificación específica

Hacer pruebas manuales:

1. Abrir configuración.
2. Cambiar a modo oscuro.
3. Volver a abrir configuración.
4. Cambiar a modo claro.
5. Volver a abrir configuración.
6. Cambiar tamaño de fuente.
7. Volver a abrir configuración.
8. Cerrar haciendo click fuera.
9. Abrir otra vez.
10. Confirmar que no se congela.

---

## Fase 9: Eliminar opción “Descargar PDF” de configuración

Quitar del menú de configuración cualquier opción relacionada a:

- Descargar PDF.
- Exportar PDF.
- Reporte PDF.

La configuración debe quedar con opciones como:

- Modo claro/oscuro.
- Tamaño de tipografía.
- Preferencias visuales.
- Historial de reportes PDF solo si se pidió explícitamente como historial, no como descarga directa.
- Reiniciar preferencias visuales, si ya existe.

Importante:

- No eliminar la funcionalidad de PDF si existe en otra parte del sistema.
- Solo eliminar la opción desde configuración.
- No tocar backend.

---

## Fase 10: Animaciones con Framer Motion

Mantener y mejorar animaciones, pero corregir si alguna causa congelamiento.

Aplicar Framer Motion en:

- Lista de consultas recientes.
- Hover de cada consulta.
- Estado activo de consulta.
- Entrada de mensajes.
- Entrada de resultados asociados al mensaje.
- Dropdown de configuración.
- Modo oscuro/claro.
- Botón “Nueva consulta”.
- Sidebar móvil.

Evitar:

- Animaciones que dejen overlays bloqueando clicks.
- `pointer-events: none` mal aplicado.
- `z-index` incorrecto.
- Animaciones infinitas innecesarias.
- Estados `disabled` pegados.

---

## Fase 11: Validación visual

Validar en escritorio:

- Sidebar visible por defecto.
- No aparece botón “Ocultar”.
- No aparece botón de sidebar encima de “Caso Juliaca”.
- La cabecera muestra logo del sistema + conversación + fecha + configuración.
- No aparecen secciones “Acciones” ni “Resultados” en sidebar.
- El historial aparece como lista de consultas recientes.
- El contenido principal aprovecha el espacio.
- El chat mantiene flujo lineal.

Validar en móvil:

- Aparece botón de menú/sidebar.
- Sidebar abre/cierra correctamente.
- Lista de consultas recientes se ve bien.
- No rompe el chat.
- Configuración funciona.

---

## Fase 12: Validación funcional

Probar:

1. Cargar caso ejemplo.
2. Iniciar nueva consulta.
3. Enviar mensaje.
4. Ejecutar análisis con agentes.
5. Ver respuestas.
6. Hacer segunda consulta.
7. Verificar que los resultados de la primera no quedan pegados fuera de contexto.
8. Cambiar modo oscuro.
9. Cambiar modo claro.
10. Cambiar tamaño de tipografía.
11. Abrir/cerrar configuración repetidamente.
12. Generar o ver reporte si la función existe fuera de configuración.
13. Revisar consola del navegador.

---

## Fase 13: Comandos de validación

Ejecutar según gestor del proyecto.

Con npm:

```bash
npm run lint
npm run build
npm run dev
```

Con pnpm:

```bash
pnpm lint
pnpm build
pnpm dev
```

Con yarn:

```bash
yarn lint
yarn build
yarn dev
```

Si algún script no existe, indicarlo claramente y ejecutar el equivalente disponible.

---

## Checklist obligatorio

Claude Code debe confirmar:

- [ ] Eliminé las secciones “Acciones” y “Resultados” del sidebar.
- [ ] Eliminé el botón suelto “Historial”.
- [ ] Reemplacé historial por una lista visible de consultas recientes.
- [ ] Moví “Nueva consulta” como acción principal arriba del historial.
- [ ] En escritorio el sidebar aparece abierto por defecto.
- [ ] En escritorio no aparece botón “Ocultar”.
- [ ] En escritorio no aparece botón de sidebar encima del caso.
- [ ] En móvil sí existe botón para abrir/cerrar sidebar.
- [ ] La cabecera muestra logo + nombre de conversación + fecha + configuración.
- [ ] El panel principal aprovecha el espacio.
- [ ] El chat sigue secuencia mensaje por mensaje.
- [ ] Los resultados se asocian al mensaje/respuesta correspondiente.
- [ ] Ya no quedan resultados antiguos pegados debajo.
- [ ] Nueva consulta limpia resultados visuales anteriores.
- [ ] El menú de configuración ya no se congela.
- [ ] Cambiar modo claro/oscuro no requiere recargar.
- [ ] Cambiar tipografía no requiere recargar.
- [ ] Eliminé la opción de descargar PDF desde configuración.
- [ ] No toqué backend.
- [ ] No toqué base de datos.
- [ ] No cambié endpoints.
- [ ] No cambié payloads.
- [ ] No cambié contratos API.
- [ ] Ejecuté validaciones disponibles.

---

Prompt maestro para Claude Code

Necesito que sigas al pie de la letra la ejecucion de este plan ubicado en H:\- ANDRE'S FILES ¡KEEP OUT! -\UNIVERSIDAD\CICLO VII\INTELIGENCIA ARTIFICIAL\PROYECTO\sistema-multiagente-anemia-IA\PLAN_CORRECCIONES_Y_MEJORAS.md y corrijas la interfaz actual del frontend de AnemIA con una nueva iteración enfocada en sidebar, cabecera, historial conversacional, flujo del chat y menú de configuración.

Restricción absoluta:
No toques backend, base de datos, migraciones, seeds, modelos, controladores, servicios, middlewares, rutas API, endpoints, payloads, contratos API, variables de entorno, lógica de persistencia ni lógica de negocio. Solo puedes modificar frontend, layout, estilos, componentes UI, estado local de interfaz y animaciones.

Cambios obligatorios:

1. Elimina completamente del sidebar las secciones “Acciones” y “Resultados”.
También elimina visualmente de ahí los botones: Analizar con agentes, Cargar caso ejemplo, Nuevo caso, Ver agentes y XAI, Reporte PDF. Si esas acciones siguen siendo necesarias, reubícalas en el área principal o como comandos/acciones contextuales del chat, pero no como bloques permanentes del sidebar.

2. Elimina el botón suelto “Historial”.
En lugar de un botón de historial, el sidebar debe mostrar directamente una lista lineal de consultas recientes, como ChatGPT, Gemini o Claude. Debe verse como una cinta/lista de conversaciones recientes, con títulos cortos, fecha/subtítulo, estado activo y hover animado.

3. Agrega arriba de esa lista un botón “Nueva consulta”.
Debe usar la lógica existente para iniciar/limpiar una consulta. No inventes endpoints nuevos ni cambies payloads.

4. En la versión web de escritorio/PC, el sidebar debe aparecer abierto por defecto y no debe mostrarse el botón “Ocultar”.
Tampoco debe aparecer un botón de ocultar/mostrar sidebar encima de “Caso Juliaca”.
Ese botón solo debe existir en móvil o pantallas pequeñas.

5. En la cabecera, encima o al lado de “Caso Juliaca · 20 jun. 2026” debe aparecer el logo del sistema, no el botón de ocultar sidebar.
La cabecera en escritorio debe mostrar únicamente: logo pequeño del sistema, nombre de conversación, fecha/subtítulo y al extremo derecho el botón de configuración.

6. Corrige el flujo de conversación.
Ahora mismo, al manejar una conversación, no se sigue una secuencia mensaje por mensaje. Los gráficos, resultados o cards de la primera consulta quedan renderizados debajo y se mantienen en consultas posteriores, rompiendo el entendimiento de la conversación.
El chat debe funcionar como una conversación lineal:
mensaje del usuario -> respuesta del asistente -> resultados asociados a esa respuesta, si aplica -> siguiente mensaje -> siguiente respuesta -> resultados de ese turno.
No renderices resultados globales al final si pertenecen a una consulta anterior. Asocia resultados, gráficos o cards al mensaje/respuesta que los generó.

7. Al iniciar “Nueva consulta” o cargar un nuevo caso, limpia resultados visuales anteriores, gráficos anteriores y estados de análisis anteriores que ya no correspondan a la conversación actual. No borres historial real si existe.

8. Corrige el menú de configuración/preferencias.
Actualmente, al cambiar modo oscuro/claro o tocar cualquier opción, el botón se congela y obliga a recargar la página. Revisa estado open/close, overlays, z-index, pointer-events, AnimatePresence, eventos onClick, disabled states y re-render. El botón debe poder abrirse y cerrarse siempre, sin recargar.

9. Elimina del menú de configuración la opción de descargar PDF.
No elimines la funcionalidad PDF si existe en otra parte; solo quítala de configuración. Las demás opciones pueden quedarse.

10. Mantén y mejora Framer Motion, pero evita animaciones que bloqueen clicks.
Usa animaciones sutiles en lista de consultas recientes, mensajes, resultados asociados, botón Nueva consulta, dropdown de configuración y sidebar móvil.

Validaciones:
Verifica en escritorio:
- Sidebar abierto por defecto.
- Sin botón “Ocultar”.
- Sin botón de sidebar encima del caso.
- Cabecera con logo + nombre de conversación + fecha + configuración.
- Sidebar con lista de consultas recientes.
- Sin secciones “Acciones” ni “Resultados”.
- Chat con flujo lineal correcto.
- Configuración no se congela.

Verifica en móvil:
- Botón de menú/sidebar aparece.
- Sidebar abre/cierra correctamente.
- Configuración funciona.
- Chat no se rompe.

Ejecuta lint/build/dev si existen. Entrega reporte en español con archivos modificados, cambios realizados, validaciones y confirmación explícita de que no tocaste backend, DB, endpoints, payloads ni lógica funcional.
