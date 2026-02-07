# Analisis Tecnico de la App "El Impostor"

Fecha de analisis inicial: 2026-02-07
Proyecto: `c:\Users\ivan.barriga\Documentos\Trabajo\DEV\Impostor`

## Objetivo
Mantener un registro vivo de hallazgos tecnicos para marcar su estado a medida que se corrigen.

Estados validos:
- `PENDIENTE`: detectado, aun no corregido
- `EN PROGRESO`: en implementacion
- `CORREGIDO`: implementado y validado

## Hallazgos y estado

| ID | Severidad | Estado | Hallazgo | Evidencia principal | Criterio de correccion |
|---|---|---|---|---|---|
| A-001 | Alta | PENDIENTE | API key expuesta en frontend | `vite.config.ts`, `services/geminiService.ts` | Mover llamadas Gemini a backend/edge function y no inyectar clave privada en cliente |
| A-002 | Alta | EN PROGRESO | Configuracion incoherente entre `App` y `Setup` | `App.tsx`, `screens/SetupScreen.tsx` | Unificar fuente de verdad de `categories`, `timerEnabled`, `timerSeconds`, `winCondition` |
| A-003 | Alta | PENDIENTE | Pipeline de pistas incompleto (no se capturan ni usan) | `screens/RoundScreen.tsx`, `App.tsx`, `screens/DebateScreen.tsx` | Capturar pistas por jugador, validarlas y pasarlas a debate/votacion |
| A-004 | Media | PENDIENTE | Votacion sin desempate explicito | `screens/VoteScreen.tsx` | Definir regla de empate (segunda vuelta, azar, no expulsion, etc.) y aplicarla |
| A-005 | Media | EN PROGRESO | Dependencia de estilos/clases no garantizadas | `index.html`, ausencia de `index.css`, varias pantallas | Crear hoja de estilos base y/o configuracion Tailwind consistente para clases usadas |
| A-006 | Media-Baja | PENDIENTE | Deuda tecnica por codigo/props no usados | `types.ts`, `screens/LibraryScreen.tsx`, `screens/RoundScreen.tsx`, `services/geminiService.ts` | Eliminar o integrar elementos huerfanos (`GameSession`, `validateClue`, props/estados sin uso) |
| A-007 | Alta | CORREGIDO | Gestion de jugadores en pantalla de nombres (orden, alta, baja) sin sincronizar con configuracion | `screens/SetupScreen.tsx` | Permitir reordenar por drag and drop, anadir y borrar jugadores, manteniendo `playerCount` sincronizado |
| A-008 | Media | CORREGIDO | La palabra secreta hacia wrap en recuadros estrechos | `screens/RevealScreen.tsx`, `screens/GameOverScreen.tsx`, `components/FitSingleLineText.tsx` | Autoajustar tamano de fuente a ancho disponible y forzar una sola linea |
| A-009 | Alta | CORREGIDO | Inicio de partida lento por espera bloqueante de IA | `App.tsx`, `services/geminiService.ts` | Limitar tiempo de espera de palabra IA y usar fallback local rapido |
| A-010 | Alta | CORREGIDO | Generacion de palabra acoplada siempre a IA | `types.ts`, `screens/SetupScreen.tsx`, `App.tsx` | Usar `INITIAL_WORDS` por defecto y habilitar IA solo por opcion explicita |
| A-011 | Alta | CORREGIDO | Catalogo insuficiente de palabras por dificultad | `constants.ts` | Tener 150 palabras por cada dificultad manteniendo nivel |
| A-012 | Baja | CORREGIDO | Switch "Palabra por IA" desalineado (thumb fuera del track) | `screens/SetupScreen.tsx` | Ajustar posicionamiento y desplazamiento del thumb para mantenerlo dentro del track |
| A-013 | Alta | CORREGIDO | Orden inconsistente entre revelar rol, pistas y votacion | `App.tsx`, `screens/RevealScreen.tsx`, `screens/RoundScreen.tsx`, `screens/VoteScreen.tsx` | Aleatorizar solo el primer jugador al revelar y mantener ese orden para el resto de fases |
| A-014 | Baja | CORREGIDO | CTA final redirigia a menu principal en vez de nueva partida | `screens/GameOverScreen.tsx`, `App.tsx` | Cambiar texto a "Nueva Partida" y redirigir a pantalla de setup |
| A-015 | Media | CORREGIDO | Cortina de revelar exigia apertura excesiva y se percibia estatica | `screens/RevealScreen.tsx` | Mostrar CTA desde ~40% de apertura y redisenar cortina estilo persiana metalica |
| A-016 | Alta | CORREGIDO | Repeticion posible de palabra entre partidas por seleccion aleatoria sin historial | `App.tsx` | Registrar palabras usadas por dificultad y excluirlas en toda la sesion |
| A-017 | Alta | CORREGIDO | Sin manejo al agotar palabras locales por dificultad | `App.tsx`, `screens/SetupScreen.tsx` | Mostrar mensaje, permitir activar IA o cambiar dificultad, y persistir decision en sesion |
| A-018 | Media | CORREGIDO | Flujo de agotamiento usaba dialogs nativos de navegador | `App.tsx` | Sustituir `confirm/alert` por modal propia con estetica del juego y decisiones asincronas |
| A-019 | Baja | CORREGIDO | Boton "Saltar todo" demasiado pequeno en ronda de pistas | `screens/RoundScreen.tsx` | Incrementar area tactil y tamano visual del boton |
| A-020 | Alta | CORREGIDO | Riesgo de fuga visual de rol/palabra al pasar rapido de agente | `screens/RevealScreen.tsx` | Forzar cierre de persiana antes de avanzar y bloquear interaccion durante la transicion |
| A-021 | Media | CORREGIDO | Solo existia un tema visual | `App.tsx`, `index.css` | Agregar selector global con 3 temas (actual, claro y loco) y cambio en caliente |
| A-022 | Baja | CORREGIDO | Falta de modo fiesta para revelar impostor a Ivan de forma temporal | `App.tsx`, `screens/RevealScreen.tsx` | Activacion secreta por pulsacion larga solo en turno de Ivan y una sola vez por palabra |
| A-023 | Media | CORREGIDO | Dificultades agotadas no se distinguian ni se bloqueaban en configuracion | `screens/SetupScreen.tsx` | Marcar dificultad agotada con texto tachado y deshabilitar su boton de seleccion |

## Bitacora de correcciones

Agregar una linea por cada cambio aplicado:

| Fecha | ID | Nuevo estado | Cambio aplicado | Validacion |
|---|---|---|---|---|
| 2026-02-07 | A-001 | PENDIENTE | Detectado en analisis inicial | Build local OK, riesgo aun abierto |
| 2026-02-07 | A-002 | PENDIENTE | Detectado en analisis inicial | Build local OK, riesgo aun abierto |
| 2026-02-07 | A-003 | PENDIENTE | Detectado en analisis inicial | Build local OK, riesgo aun abierto |
| 2026-02-07 | A-004 | PENDIENTE | Detectado en analisis inicial | Build local OK, riesgo aun abierto |
| 2026-02-07 | A-005 | PENDIENTE | Detectado en analisis inicial | Build local OK, warning CSS presente |
| 2026-02-07 | A-006 | PENDIENTE | Detectado en analisis inicial | Build local OK, deuda aun abierta |
| 2026-02-07 | A-002 | EN PROGRESO | `SetupScreen` ahora usa `categories` compartidas y sincroniza `playerCount` con lista de jugadores | `npm run build` OK |
| 2026-02-07 | A-007 | CORREGIDO | Se anadio mover arriba/abajo, eliminar y anadir jugadores en vista de nombres | `npm run build` OK |
| 2026-02-07 | A-007 | CORREGIDO | Reordenacion migrada a drag and drop tactil/desktop (sin botones de subir/bajar) | `npm run build` OK |
| 2026-02-07 | A-005 | EN PROGRESO | Se creo `index.css` con estilos de `custom-scrollbar` y `no-scrollbar` para ocultar/suavizar scroll en movil | `npm run build` OK |
| 2026-02-07 | A-005 | EN PROGRESO | `custom-scrollbar` actualizado para ocultar la barra en todas las plataformas, manteniendo scroll funcional | `npm run build` OK |
| 2026-02-07 | A-008 | CORREGIDO | Se implemento componente de auto-fit de texto en una linea para palabra secreta (reveal y game over) | `npm run build` OK |
| 2026-02-07 | A-009 | CORREGIDO | `startGame` ahora usa timeout de 1500 ms para IA y fallback local para arrancar sin bloqueo largo | `npm run build` OK |
| 2026-02-07 | A-010 | CORREGIDO | Se agrego toggle de IA para palabra en Setup (apagado por defecto) y App solo consulta IA si el toggle esta activo | `npm run build` OK |
| 2026-02-07 | A-011 | CORREGIDO | `INITIAL_WORDS` ampliado y validado a 150 terminos por dificultad (600 total) | `npm run build` OK |
| 2026-02-07 | A-012 | CORREGIDO | Se corrigio layout del switch de IA usando posicion absoluta estable (`left-1`) y desplazamiento `translate-x-0/6` | `npm run build` OK |
| 2026-02-07 | A-013 | CORREGIDO | Orden de mesa fijado al iniciar partida y reutilizado en revelar, pistas y votacion (sin random adicional) | `npm run build` OK |
| 2026-02-07 | A-009 | CORREGIDO | Timeout de palabra IA ajustado de 1500 ms a 5000 ms para redes reales y menor fallback prematuro | `npm run build` OK |
| 2026-02-07 | A-014 | CORREGIDO | Boton final actualizado a "Nueva Partida" y cambio de destino a `SETUP` | `npm run build` OK |
| 2026-02-07 | A-015 | CORREGIDO | CTA "Siguiente agente" ajustado a umbral de 40% y cortina actualizada con look de persiana metalica | `npm run build` OK |
| 2026-02-07 | A-015 | CORREGIDO | CTA de revelar ajustado para mostrarse tambien durante arrastre (sin requerir soltar la persiana) | `npm run build` OK |
| 2026-02-07 | A-016 | CORREGIDO | Se agrego registro de palabras usadas por dificultad (sessionStorage) y seleccion sin repeticion hasta agotar pool | `npm run build` OK |
| 2026-02-07 | A-017 | CORREGIDO | Al agotar palabras locales se muestra decision: activar IA (persistente) o cambiar dificultad; inicio cancelado vuelve a configuracion | `npm run build` OK |
| 2026-02-07 | A-017 | CORREGIDO | Modo temporal de prueba activado: `INITIAL_WORDS` reducido a 1 palabra por dificultad para validar agotamiento y mensajes | `npm run build` OK |
| 2026-02-07 | A-017 | CORREGIDO | Modo temporal de prueba retirado: `INITIAL_WORDS` vuelve al pool completo (150 por dificultad) | `npm run build` OK |
| 2026-02-07 | A-018 | CORREGIDO | Reemplazo de `window.confirm/alert` por modal estilizada en `App` para flujo de palabras agotadas/IA | `npm run build` OK |
| 2026-02-07 | A-019 | CORREGIDO | Boton "Saltar todo" ampliado (padding, tipografia y borde) para mejor uso tactil | `npm run build` OK |
| 2026-02-07 | A-020 | CORREGIDO | Al pulsar "Siguiente agente" ahora se baja primero la persiana y luego cambia de jugador tras 240ms | `npm run build` OK |
| 2026-02-07 | A-021 | CORREGIDO | Selector de temas agregado con persistencia local y 3 modos: `Actual`, `Claro`, `Loco` | `npm run build` OK |
| 2026-02-07 | A-022 | CORREGIDO | Easter egg: en `RevealScreen`, pulsacion larga sobre "REVELAR ROL" muestra impostor(es) solo para `Ivan/Ivan`, y se consume por palabra actual | `npm run build` OK |
| 2026-02-07 | A-023 | CORREGIDO | Setup ahora detecta dificultades agotadas en sesion y las muestra tachadas + bloqueadas para seleccion | `npm run build` OK |

## Regla de actualizacion durante ejecucion

Cada vez que se corrija un hallazgo:
1. Cambiar su `Estado` en la tabla principal.
2. Anadir una fila en `Bitacora de correcciones` con fecha y validacion.
3. Si la correccion no queda completa, dejar `EN PROGRESO` y documentar el bloqueo.
