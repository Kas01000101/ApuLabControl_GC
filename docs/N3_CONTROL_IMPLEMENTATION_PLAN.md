# N3 Control Implementation Plan · Future Work Only

## Status

```text
N3_BASELINE_STATUS = FROZEN
N3_BASELINE_GEOMETRY = VERIFIED
N3_IMPLEMENTATION_PLAN = COMPLETE
N3_IMPLEMENTATION_STATUS = NOT STARTED
N3_IMPLEMENTATION_AUTHORIZED = NO
N3_RISK = HIGH
```

This document is a **future implementation plan only**. It intentionally contains no N3 Control runtime implementation.

---

## 1. Transformation principle

Future implementation should preserve the cloned N3 task core and apply a late, N3-local Control Group transform:

```text
CLONED CURRENT N3 TASK CORE
        ↓
N3-LOCAL LATE ADAPTER
        ↓
FLAT ACTIVE CONTROL PRESENTATION
```

Preferred architecture:

- leave the shared N3/N4/N5 source/build patches intact;
- inject the future Control transform after the shared pipeline has generated current N3;
- scope all future control presentation/runtime behavior strictly to Level 3;
- add dedicated N3 research telemetry/persistence through N3-local assets and a parent bridge;
- preserve generated N4–N7 byte parity.

If implementation appears to require editing shared N3/N4/N5 code, stop first and report:

```text
SHARED_CHANGE_REQUIRES_REVIEW
```

---

## 2. KEEP · scientific/task core

The future GC must preserve exactly:

- logical grid: 8×8;
- start: row 6, column 1;
- initial orientation: NORTH (`dir=0`);
- goal: row 3, column 3;
- command set:
  - `forward` / AVANZAR;
  - `left` / GIRAR IZQ.;
  - `right` / GIRAR DER.;
- forward = one cell in current direction;
- left/right = 90° rotation in place;
- zero-based row/column coordinate semantics;
- all in-bounds cells walkable;
- no effective obstacles;
- program editing, removal and reordering;
- program capacity of 8 commands;
- wrong-sequence opportunity;
- neutral correction opportunity;
- completion by final goal position;
- canonical E2E program as a regression reference, not as the only accepted answer:
  - `forward, forward, forward, right, forward, forward`.

The GC must continue to accept any participant sequence that satisfies the same inherited success condition within the inherited editor capacity.

---

## 3. REMOVE · game-layer treatment

Plan to remove from participant-facing N3 Control presentation:

- EXPLORAR as an attention/game element;
- EXPLORAR glow/halo/pulse;
- AYNI character/narrative treatment when it is not needed to represent state;
- confetti;
- reward language;
- celebratory success presentation;
- game-specific glow/halo;
- celebratory SFX;
- music or game audio associated with N3;
- animated reward effects unrelated to the sequencing task.

Removing those elements must not change geometry, command semantics, evaluation, correction opportunity or success behavior.

---

## 4. Neutral help convention

Future N3 Control should use one optional neutral control:

```text
AYUDA = YES
EXPLORAR = NO
REDUNDANT GUÍA = NO
```

Suggested process-only help content:

1. Revisa el punto inicial y la meta.
2. Ordena los comandos.
3. Comprueba la secuencia.
4. Corrige si es necesario.

The help must not reveal the canonical program, a required turn index, or the correct next command.

Forbidden answer-leak example:

```text
El comando 4 debe ser GIRAR DERECHA.
```

---

## 5. Target flat participant UI

Future GC can use a neutral 2D representation while preserving the logical 8×8 task:

```text
┌──────────────────────────────────────────────────────────┐
│ NIVEL 3 · SECUENCIAR                         [ AYUDA ]    │
├────────────────────────────┬─────────────────────────────┤
│                            │ SECUENCIA                   │
│ TABLERO 8×8                │                             │
│                            │ 1.                          │
│ START                      │ 2.                          │
│ GOAL                       │ 3.                          │
│ orientación inicial        │ 4.                          │
│                            │ 5.                          │
│                            │ 6.                          │
├────────────────────────────┴─────────────────────────────┤
│ [ AVANZAR ] [ GIRAR IZQ. ] [ GIRAR DER. ]               │
│                                                          │
│                   [ COMPROBAR ]                          │
└──────────────────────────────────────────────────────────┘
```

Requirements:

- start and goal visibly distinguishable without narrative;
- initial orientation unambiguous;
- board cells legible;
- command labels legible;
- sequence order legible;
- no game animation required to understand correctness;
- no answer leak;
- same task logic as inherited experimental N3.

A static trajectory preview must not reveal the correct route. If movement visualization is retained, it should communicate participant-submitted execution only.

---

## 6. Error and self-correction

Required future flow:

```text
wrong program
→ submit / COMPROBAR
→ neutral feedback
→ edit existing sequence
→ submit again
```

Recommended neutral feedback:

```text
Revisa la secuencia y comprueba nuevamente el recorrido.
```

Do not automatically clear the whole program after a wrong attempt unless inherited task behavior requires it. The current inherited task allows editing after an unsuccessful execution, so GC should preserve that opportunity.

Do not identify the exact wrong command when doing so would reveal the solution.

---

## 7. Attempt semantics

Freeze future research semantics as:

```text
ATTEMPT = one explicit COMPROBAR / EJECUTAR action on the current sequence
```

Do **not** count as attempts:

- add block;
- remove block;
- reorder block;
- drag intermediate event;
- hover;
- focus;
- opening help.

Suggested derived variables:

```text
attempt_count
first_attempt_success
final_success
response_change_count
initial_program_length
final_program_length
```

`response_change_count` should increase only when a participant changes the submitted sequence after at least one submission, using one documented rule consistently.

---

## 8. Future telemetry contract

Current state:

```text
Level3ControlTelemetryBridge = NOT PRESENT
N3_RESEARCH_TELEMETRY = NOT DEMONSTRATED
```

Future implementation may add, but this phase does not create:

```text
src/systems/Level3ControlTelemetryBridge.ts
```

Proposed raw events:

```text
level_started
command_added
command_removed
command_reordered
sequence_submitted
sequence_failed
sequence_corrected
help_requested
level_completed
```

Recommended event payload principles:

- command event may record command type and resulting sequence length;
- reorder event should record structural change without raw pointer traces;
- submission records attempt number and sequence length;
- failed submission records only task-relevant outcome;
- corrected event occurs when a later submitted sequence differs from a previously submitted failed sequence;
- completion includes final attempt count and completion duration;
- `level_completed` must be terminal and idempotent.

Derived research fields:

```text
condition = control
level = 3
attempt_count
first_attempt_success
final_success
response_change_count
help_used
help_count
time_to_first_action_ms
completion_time_ms
initial_program_length
final_program_length
```

Privacy:

- do not collect name, email, school, classroom, credentials, passwords or participant codes as raw task payload;
- pseudonymous `participant_id` / `session_id` may remain service-level metadata under the same privacy model used by frozen N1/N2;
- keep an event allowlist in the future parent bridge.

Do not add metrics unrelated to observable N3 task behavior.

---

## 9. Future persistence contract

The current N3 baseline does not demonstrate refresh persistence. Future Control implementation must explicitly add and validate it without changing the task core.

Persist at minimum:

```text
program
attemptCount
firstAttemptResult
responseChangeCount
helpCount
completionState
levelStartedAt
completionTimestamp
terminalEventEmitted
```

Required refresh scenarios:

1. refresh after partial program;
2. refresh after failed attempt;
3. refresh after correction/edit;
4. refresh after completion.

Expected behavior:

- partial sequence restores exactly;
- failed-attempt count/result restores;
- corrected sequence restores;
- completed state restores;
- terminal completion event does not fire again after refresh.

---

## 10. Future idempotency

Future implementation must enforce:

```text
level_completed = exactly once per N3 completion lifecycle
```

Also guard any paired terminal/measurement-style completion event if one is later introduced.

Refresh after completion must not duplicate terminal events in either child raw messages or parent telemetry queue.

---

## 11. Future validation strategy

Future N3 GC candidate must be validated on one exact candidate SHA with:

- `npm ci`;
- `npm run build`;
- frozen N1 participant-view regression;
- frozen N2 static/physical/telemetry regressions;
- N3 baseline static contract;
- N3 Control physical E2E;
- N3 refresh/persistence E2E;
- N3 telemetry/privacy/idempotency E2E;
- current N4–N7 generated output parity;
- app-shell regression;
- N1–N7 smoke regression;
- SFX/audio-neutrality regression;
- existing N4–N7 gameplay contracts.

Any N1/N2 frozen drift or N4–N7 output drift is a blocking regression.

---

## 12. Future screenshot evidence

Capture from the same candidate SHA:

```text
n3_gc_initial.png
n3_gc_sequence_partial.png
n3_gc_incorrect_sequence.png
n3_gc_corrected_sequence.png
n3_gc_completed.png
```

Visual QA checklist:

```text
[ ] start visible
[ ] goal visible
[ ] orientation understandable
[ ] board legible
[ ] commands legible
[ ] sequence legible
[ ] no EXPLORAR
[ ] AYUDA neutral
[ ] no AYNI narrative
[ ] no confetti
[ ] no reward
[ ] no game glow
[ ] no answer leak
[ ] error interpretable
[ ] correction possible
[ ] completion neutral
[ ] same task logic as inherited N3
```

No future N3 freeze branch or implementation PR should be created until implementation, automated validation and visual QA all pass.

---

## 13. Proposed future file architecture

Only after explicit authorization `IMPLEMENT N3 CONTROL`, expected implementation may include N3-local files such as:

```text
public/control/n3-control.css
public/control/n3-control.js
src/systems/Level3ControlTelemetryBridge.ts
scripts/audit-mission01-control-n3.mjs
tests/e2e/mission01-control-n3.cjs
tests/e2e/mission01-control-n3-telemetry.cjs
```

A late N3-only injection point should be preferred over editing shared programming patches. Names are planning targets, not files authorized in the current phase.

---

## 14. Stop boundary

This planning phase ends here.

```text
N3_BASELINE_STATUS = FROZEN
N3_IMPLEMENTATION_PLAN = COMPLETE
N3_IMPLEMENTATION_STATUS = NOT STARTED
N3_IMPLEMENTATION_AUTHORIZED = NO
MERGE = NO
VERCEL = DISCONNECTED
PRODUCTION_DEPLOY = NO
```

Wait for explicit authorization:

```text
IMPLEMENT N3 CONTROL
```
