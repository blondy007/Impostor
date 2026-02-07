# Sugerencias de Mejora - El Impostor

Fecha: 2026-02-07

## Objetivo
Subir la diversion en mesa (especialmente en modo fiesta) sin romper la simplicidad del flujo actual.

## Prioridad (Impacto vs Esfuerzo)

| Idea | Impacto | Esfuerzo | Prioridad |
|---|---:|---:|---|
| Eventos aleatorios por ronda (reglas locas) | 5 | 2 | Muy alta |
| Sistema de votacion robusto (desempate, abstencion, confirmacion) | 5 | 3 | Muy alta |
| Modos de ronda (1 palabra, frase corta, mudo, mímica) | 4 | 2 | Alta |
| Sonidos y micro-animaciones en momentos clave | 4 | 2 | Alta |
| Roles opcionales extra (detective, abogado, caotico) | 4 | 4 | Media alta |
| Logros/estadisticas de sesion (MVP, engaños, aciertos) | 3 | 3 | Media |
| Modo “Partida rapida” (setup minimo) | 3 | 1 | Media |
| Retos/castigos configurables (modo fiesta) | 3 | 2 | Media |
| Biblioteca comunitaria de palabras | 3 | 4 | Media baja |

## Mejoras Recomendadas (siguiente iteracion)

1. Votacion (base para lo que comentaste)
- Desempate configurable: segunda vuelta, azar, nadie expulsado.
- Opcion de abstencion.
- Confirmacion antes de cerrar voto en movil.
- Registro de resultado claro: quien voto, conteo final y motivo de desempate.

2. Rondas mas divertidas
- Evento aleatorio opcional por ronda:
  - “Ronda muda”: pista sin hablar.
  - “Doble sospecha”: cada jugador acusa a 2.
  - “Pista invertida”: pista que no describa directamente.
  - “Silencio del impostor”: el impostor no puede hablar en debate.

3. Modos de pista
- `Clasico`: 1 palabra.
- `Libre corta`: hasta X caracteres.
- `Mimica`: sin voz (solo gesto).
- `Rapida`: temporizador corto por pista.

4. Mejora de experiencia (UX divertida)
- Sonido y vibracion en:
  - Revelar rol.
  - Cierre de votacion.
  - Expulsion.
  - Victoria.
- Transiciones mas teatrales solo en momentos clave (sin saturar).

## Ideas de Roles Opcionales (toggle por partida)

1. Detective
- Puede ver una pista anonima adicional en una ronda.

2. Abogado
- Si es votado, puede forzar una segunda votacion inmediata.

3. Caotico
- Gana si sobrevive hasta top 3 jugadores, independientemente del ganador principal.

## Modo Fiesta (opcional)

1. Retos automáticos post-votacion
- Mini castigo configurable.
- Puede desactivarse para modo normal.

2. Intensidad
- `Suave`, `Media`, `Caos`.
- Ajusta eventos aleatorios y tiempo de debate.

## Propuesta de roadmap corto

1. Sprint 1
- Sistema de votacion robusto.
- Eventos aleatorios basicos.
- Modo de pista `Clasico` + `Libre corta`.

2. Sprint 2
- Sonidos/animaciones clave.
- Modo fiesta con intensidad.
- Estadisticas simples de sesion.

3. Sprint 3
- Roles opcionales.
- Biblioteca comunitaria.

## Nota tecnica para la siguiente iteracion de votacion
- Mantener la regla ya implementada: jugador eliminado no participa ni en pista ni voto.
- Diseñar votacion como modulo desacoplado (estrategias de desempate intercambiables).
- Guardar decisiones de votacion en sesion para no reconfigurar cada partida.
