# CONTROL N4 AUDIT · PLANIFICAR Y CORREGIR

> Audit-only research document. N4 implementation is **not authorized**.

## STATUS

- `N4_AUDIT_STATUS = COMPLETE`
- `N4_BASELINE_STATUS = VERIFIED / GAPS DOCUMENTED`
- `N4_IMPLEMENTATION_STATUS = NOT STARTED`
- `N4_IMPLEMENTATION_AUTHORIZED = NO`
- `N4_RESEARCH_TELEMETRY = NOT DEMONSTRATED`
- `N4_PERSISTENCE = NOT DEMONSTRATED`
- `N4_ONLY_VALID_PROGRAM = NO`
- `SHARED_CHANGE_REQUIRES_REVIEW = YES`
- `VERCEL = DISCONNECTED`
- `MERGE = NO`
- `PRODUCTION_DEPLOY = NO`

Audit baseline:

- N3 frozen checkpoint: `a150e2039a5f35c6dabb6bb8cb6eed8ca6d9532e`
- N4 generated SHA-256: `195821ccd3d0b67870b0ba1977b09dc1e3c36b8d11ec66f76a5b816782dd3104`
- Audit source artifact: `control-n4-audit-source`
- Audit artifact ID: `10083001684`
- Audit run: `34295574900`

---

## SOURCE MAP

### Verified legacy source

The active seven-level builder uses `scripts/build-mission01-seven-source.mjs`, which derives a temporary builder from `scripts/build-mission01.mjs` and keeps the legacy sources for Levels 1, 2, 4, 5 and 6 while excluding the old Level 3.

N4 source payload:

- `src/missions/mission01/final/level4/part00.b64`
- `src/missions/mission01/final/level4/part01.b64`
- `src/missions/mission01/final/level4/part02.b64`

Verified legacy source contract in `scripts/build-mission01.mjs`:

- source SHA-256: `6280407de00b0000246f9c867c8afc56aaa6517201d0eed1ef478f92f83c3090`
- source bytes: `65468`

### N4-local patch

`scripts/patch-mission01-level4-single-challenge.mjs` collapses the legacy multi-scenario flow to exactly one scenario and rewrites the active scenario to:

```js
{start:{c:1,r:6,dir:0},goal:{c:3,r:2},obstacles:[[1,4],[2,4]]}
```

It also removes `advanceScenario()` from the successful path, ensures N4 → N5 completion identity, and cleans legacy Level 5 completion/global identity residues.

### Shared patch chain affecting N4

The current `prepare:missions` chain applies multiple shared transformations before/after the N4-local single-challenge patch. Material N4 dependencies include:

- `scripts/patch-mission01-programming-flow.mjs`
- `scripts/patch-mission01-repeatable-help.mjs`
- `scripts/patch-mission01-programming-guide-structure.mjs`
- `scripts/patch-mission01-runtime-identity.mjs`
- `scripts/patch-mission01-programming-polish.mjs`
- `scripts/patch-mission01-celebration-confetti.mjs`
- shared help / guide lifecycle patches
- `scripts/patch-mission01-level4-single-challenge.mjs`
- `scripts/patch-mission01-explore-glow.mjs`
- `scripts/stabilize-mission01-runtime.mjs`

Because several of these also touch N3 and/or N5, a future N4 control transformation must not modify them casually. The preferred implementation architecture is a **late N4-local adapter**.

---

## RUNTIME MAP

Current N4 is a legacy game runtime, not a research-control runtime.

- fixed logical stage: `1672 × 941`
- board UI: `SIMULADOR 8 × 8`
- board canvas: `950 × 664`
- renderer: Three.js `WebGLRenderer`
- participant avatar: AYNI rover in 3D
- obstacle representation: 3D rock groups
- program state: in-memory `program[]`
- program editor capacity: `MAX_PROGRAM_STEPS = 30`
- execution: sequential command loop with animated movement/rotation
- completion route: direct parent bridge when available, otherwise `postMessage({type:'apulab-level-complete', level:4, nextLevel:5})`

Visible HUD identity is currently **RUTA BLOQUEADA**. The journal/pedagogical identity recorded on completion is **PLANIFICAR Y CORREGIR**. This naming mismatch is an audit finding; it is not changed here.

---

## SCIENTIFIC TASK CONTRACT

### GEOMETRY

Coordinates are zero-based internally.

- `GRID_ROWS = 8`
- `GRID_COLUMNS = 8`
- `START_ROW = 6`
- `START_COLUMN = 1`
- `INITIAL_ORIENTATION = NORTH`
- `GOAL_ROW = 2`
- `GOAL_COLUMN = 3`
- `OBSTACLE_CELLS = [(row 4, col 1), (row 4, col 2)]`
- `BLOCK_LIMIT = 30`

`dir = 0` is verified as NORTH because forward displacement uses:

```js
dc = [0, 1, 0, -1][dir]
dr = [-1, 0, 1, 0][dir]
```

Therefore `dir 0` advances one row upward (`r - 1`).

### COMMANDS

Active command set:

- `forward` → AVANZAR
- `left` → GIRAR IZQ.
- `right` → GIRAR DER.

Semantics:

- `forward`: advance exactly one cell in the current orientation; fail at board edge; fail on an obstacle.
- `left`: rotate 90° counter-clockwise; no displacement.
- `right`: rotate 90° clockwise; no displacement.

### CANONICAL PROGRAM

The existing gameplay E2E verifies:

```text
forward
right
forward
forward
left
forward
forward
forward
```

Trajectory:

```text
(c1,r6,N)
→ (c1,r5,N)
→ turn E
→ (c2,r5,E)
→ (c3,r5,E)
→ turn N
→ (c3,r4,N)
→ (c3,r3,N)
→ (c3,r2,N)
```

This reaches the active goal while avoiding both obstacle cells.

### SUCCESS CRITERION

The runtime executes commands in order and stops early when:

```text
roverState.c == goal.c
AND
roverState.r == goal.r
```

If the loop finishes at the goal, it calls `completeLevel()`.

Therefore:

- success is based on goal position;
- final orientation is not required;
- exact canonical sequence is not required;
- the canonical E2E is not an only-valid-program contract;
- `N4_ONLY_VALID_PROGRAM = NO`.

---

## ERROR / CORRECTION

### Obstacle collision

A forward move into a blocked cell throws `BLOCKED`.

`failProgram(index, err)` then:

1. stores `lastFailureIndex`;
2. sets `needsAdjustment = true`;
3. increments `collisionCount`;
4. records the collision cell;
5. emits inline telemetry `collision_detected` and `feedback_shown`;
6. visually marks the failing program row;
7. displays neutral-conceptually useful but game-styled blocked feedback;
8. changes the run button to `AJUSTAR PROGRAMA`;
9. disables editing until the adjustment action is entered.

The existing program is **not erased**.

`beginAdjustProgram()` then:

- resets AYNI to start;
- re-enables editing;
- preserves the program;
- tells the participant to modify only what is needed;
- emits `program_restarted`;
- returns the run button to `INICIAR PRUEBA`.

The first edit after a collision sets `changedSequenceAfterFeedback = true` and emits `program_modified_after_failure`.

### Attempt semantics

`attemptCount` increments when an actual program execution starts. Entering the intermediate `AJUSTAR PROGRAMA` state does not itself increment the attempt counter.

### Edge failure

A forward move outside coordinates `0..7` throws `EDGE`. It displays edge feedback and ends that execution, but it does not use the obstacle-specific collision correction state.

### Task-core conclusion

The verified core is:

```text
observe obstacle layout
→ build a sequence
→ execute
→ encounter / identify an error when applicable
→ preserve and modify the sequence
→ execute again
→ reach the goal
```

The **opportunity to fail and self-correct is part of the task core**. The 3D shake, emissive rock pulse, musical tones and reward effects are not required to preserve that construct.

---

## PERSISTENCE

Current generated N4 writes:

- `apulab.level4.telemetry`
- `apulab.level4.finalProgram`
- `apulab.level4.idea`

However, the active runtime does **not** demonstrate restoration of the current N4 `program[]`, failed-attempt correction state, attempt counter, collision state, or completed overlay after refresh.

A function named `readLevel4Program()` exists, but it reads legacy/N3 keys for **journal display** (`apulab.level3.successProgram`, `apulab_level4_success_program`, `apulab.level3.program`); it does not rehydrate the active N4 editor state.

The build-time `patchLevel4()` historically attempts to write `apulab.level4.successProgram` on navigation, but that key is absent from the final generated N4 runtime snapshot. This is a source/runtime divergence that must be resolved only during a future authorized N4 implementation review.

Therefore:

- partial-program refresh = NOT DEMONSTRATED
- failed-attempt refresh = NOT DEMONSTRATED
- correction refresh = NOT DEMONSTRATED
- completion refresh = NOT DEMONSTRATED
- `N4_PERSISTENCE = NOT DEMONSTRATED`

---

## TELEMETRY

### Existing inline legacy telemetry

The N4 page maintains `telemetryLog`, exposes `window.__apulabLevel4Telemetry`, and stores the last events in `apulab.level4.telemetry`.

Observed raw event names include:

- `level5_started` **(legacy identity defect: wrong level name)**
- `program_started`
- `command_executed`
- `collision_detected`
- `feedback_shown`
- `program_restarted`
- `program_modified_after_failure`
- `block_added`
- `block_removed`
- `block_reordered`
- `program_cleared`
- `goal_reached`
- `hint_requested`
- `level4_completed`

Completion payload includes at least:

- final sequence
- attempt count
- collision count
- failure command index
- changed-sequence-after-feedback
- hint count
- completion time

### Research telemetry gap

`src/main.ts` installs Level 1, Level 2, Level 3, Level 6 and Level 7 telemetry bridges. There is no `Level4ControlTelemetryBridge` or equivalent research bridge installed.

No privacy/idempotency parity with frozen N3 has been demonstrated for N4.

Therefore:

`N4_RESEARCH_TELEMETRY = NOT DEMONSTRATED`

The existing inline telemetry is useful baseline evidence, but it must not be treated as research-grade parity.

---

## AUDIO

Current N4 contains game/audio feedback:

- DO / RE / MI command tones;
- `playBlockedFeedback()` on obstacle collision;
- `playSuccessMusic()` on completion;
- audio mapping text in the editor.

Future control classification:

- command tones → `NEUTRALIZE / REMOVE`
- collision tones → `NEUTRALIZE / REMOVE`
- success music → `REMOVE`

No audio is changed in this audit.

---

## HELP

Current N4 exposes both:

- `EXPLORAR` — optional, four-step game/tutorial presentation;
- `GUÍA` — structured three-step help.

The three guide states are context-sensitive:

1. `PLANEA TU CAMINO`
2. `OBSERVA DÓNDE FALLÓ`
3. `AJUSTA Y VUELVE A PROBAR`

After a collision, the guide explicitly points the participant back to the stop location / failing instruction and then to a minimal correction.

For a future Active Control transformation:

- EXPLORAR → `REMOVE`
- GUÍA → `REPLACE` with neutral `AYUDA`
- conceptual plan / inspect failure / adjust sequence content → `KEEP`, rewritten neutrally without game framing or solution leakage.

---

## GAME LAYER

Current participant-facing game layer includes:

- AYNI 3D rover;
- WebGL/Three.js board presentation;
- animated rover movement and turns;
- 3D rock obstacles;
- collision shake / emissive obstacle pulse;
- animated instruction highlighting;
- EXPLORAR;
- GUÍA game styling;
- Bitácora framing;
- command-note audio;
- blocked feedback tones;
- success music;
- native confetti;
- global celebration-confetti runtime;
- success overlay / reward presentation.

These are not assumed to be scientific task-core requirements.

---

## KEEP / REMOVE / FLATTEN / NEUTRALIZE / REPLACE

| Component | Classification | Audit rationale |
|---|---|---|
| 8×8 grid logic | KEEP | Defines the planning space. |
| Start / orientation / goal | KEEP | Required for the same reasoning problem. |
| Two obstacle cells | KEEP | Required for the correction opportunity. |
| `forward/left/right` semantics | KEEP | Core sequence-construction primitives. |
| 30-step editor capacity | KEEP initially | Baseline value is verified; changing it would alter task constraints. |
| Real sequence construction | KEEP | Core participant action. |
| Goal-position success | KEEP | Current success semantics; exact sequence is not required. |
| Collision opportunity | KEEP | Core error/correction construct. |
| Preserve program after collision | KEEP | Enables genuine self-correction. |
| Failure-command identification | KEEP | Mechanism supports debugging construct; presentation can be flattened. |
| AYNI | REMOVE / REPLACE | Replace by neutral orientation/state marker. |
| 3D/WebGL movement | FLATTEN | Preserve state transition, not game animation. |
| 3D rocks | FLATTEN | Preserve blocked cells as neutral 2D obstacles. |
| Collision shake / emissive pulse | FLATTEN / NEUTRALIZE | Preserve error indication without game effects. |
| Animated active-block glow | NEUTRALIZE | A static execution/error indicator is sufficient. |
| EXPLORAR | REMOVE | Extra tutorial/game layer. |
| GUÍA | REPLACE | Neutral `AYUDA`, no solution leakage. |
| Bitácora game framing | REMOVE / REPLACE | Research state may log evidence without participant reward framing. |
| Command tones | NEUTRALIZE / REMOVE | Not required by task semantics. |
| Collision tones | REMOVE | Not required to expose the error. |
| Success music | REMOVE | Celebratory reward layer. |
| Confetti (both implementations) | REMOVE | Reward layer. |
| Success overlay | REPLACE | Neutral completion state. |
| N4 → N5 navigation | KEEP | Required study progression. |

---

## SHARED DEPENDENCIES

N4 shares legacy programming infrastructure with N5 and several historical transformations with the legacy N3 source chain. The frozen N3 Active Control adapter is applied late, after the legacy mission generation chain.

Any future modification to a shared programming/help/polish/celebration patch can therefore alter:

- generated N3 before its control adapter;
- N4 baseline behavior;
- N5 behavior.

From the N3 freeze onward, the CI must continue to prove:

- N1 frozen regression;
- N2 frozen regression;
- N3 exact frozen regression against `a150e2039a5f35c6dabb6bb8cb6eed8ca6d9532e`.

If a future N4 transformation requires editing a shared patch:

`SHARED_CHANGE_REQUIRES_REVIEW`

Preferred architecture:

**late N4-local adapter**, analogous in isolation strategy to the frozen N3 control transformation, without editing the N3 checkpoint.

---

## RISK

### High

- shared patch edits affecting N3/N4/N5 simultaneously;
- treating inline legacy telemetry as research telemetry;
- changing obstacle geometry or editor capacity while redesigning presentation;
- replacing final-position success with canonical/exact-program success;
- introducing persistence that silently changes attempt semantics.

### Medium

- neutralizing collision feedback too aggressively and removing the actual debugging signal;
- retaining animation/audio that changes salience relative to other control levels;
- conflating `RUTA BLOQUEADA` presentation title with the pedagogical construct `PLANIFICAR Y CORREGIR`.

### Low

- purely local flat visual replacement after the scientific contract and frozen regressions are locked.

---

## OPEN GAPS

1. `level5_started` is still emitted at N4 start; the event identity is inconsistent.
2. No Level 4 research telemetry bridge exists.
3. No N4 partial/failed/corrected/completed refresh contract has been physically demonstrated.
4. Final generated runtime does not retain the build-time `apulab.level4.successProgram` navigation write; source/runtime divergence should be traced before implementation.
5. The current canonical E2E proves one valid program. Runtime semantics prove exact-program matching is not required, but no dedicated alternate-valid-program N4 research test exists yet.
6. Current HUD title is `RUTA BLOQUEADA`; completion journal identity is `PLANIFICAR Y CORREGIR`.
7. N4 contains both native and global celebration-confetti mechanisms, increasing game-layer salience.

These gaps are documentation findings only. None is corrected in this audit.

---

## AUDIT DECISION

The verified N4 task core is suitable for a later Active Control transformation **only if** the following are preserved:

- 8×8 geometry;
- start `r6 c1 NORTH`;
- goal `r2 c3`;
- obstacles `r4 c1` and `r4 c2`;
- 30-step capacity;
- AVANZAR / GIRAR IZQ. / GIRAR DER. semantics;
- position-based success;
- genuine obstacle failure;
- preservation of the participant program after collision;
- self-correction and rerun opportunity;
- N4 → N5 navigation.

Future work must remove or neutralize the game layer without altering those constructs, and must independently establish persistence and research telemetry contracts.

**No N4 implementation has been started.**
