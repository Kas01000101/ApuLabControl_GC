# ApuLabControl_GC · N3 Audit

## Status

```text
REPOSITORY = Kas01000101/ApuLabControl_GC
WORKING_BRANCH = research/control-active

N1_CONTROL_STATUS = FROZEN
N1_CONTROL_FROZEN_SHA = b717a70b685f382044276b7a30bec5b556e94e9c
N1_CHECKPOINT = research/control-n1-freeze
N1_PR = #2 · DRAFT · N1 ONLY

N2_CONTROL_STATUS = FROZEN
N2_CONTROL_FROZEN_SHA = dbb60df8f509aa0fe461db015445b28d0e78b5cc
N2_CHECKPOINT = research/control-n2-freeze
N2_PR = #3 · DRAFT
N2_VALIDATION_RUN = 34231422620 · SUCCESS
N2_EVIDENCE_ARTIFACT = control-n2-validation-evidence
N2_EVIDENCE_ARTIFACT_ID = 10058841535
N2_VISUAL_QA = PASS

N3_AUDIT_STATUS = COMPLETE
N3_IMPLEMENTATION_STATUS = NOT STARTED
N3_IMPLEMENTATION_AUTHORIZED = NO

VERCEL = DISCONNECTED
MERGE = NO
PRODUCTION_DEPLOY = NO
```

This document is an **audit only**. It does not authorize or implement the N3 control condition.

---

# 1. Source lineage

The active N3 is **not** built from the historical `final/level3` source.

`build-mission01-seven-source.mjs` explicitly removes the historical Level 3 from the active build and keeps legacy source levels `1, 2, 4, 5, 6`. The current seven-level sequence remaps the old programming levels:

```text
historical source Level 4 → current N3
historical source Level 5 → current N4
historical source Level 6 → current N5
```

Therefore the authoritative packed source for current N3 is:

```text
src/missions/mission01/final/level4/
  part00.b64
  part01.b64
  part02.b64
```

The current generated N3 is then transformed by the shared programming patch pipeline.

### Source conclusion

```text
N3_SOURCE_LINEAGE = CLEAR
CURRENT_N3_SOURCE = historical Level 4 packed source
HISTORICAL_LEVEL3_ACTIVE = NO
```

This remap is a high-risk implementation detail: future N3 control work must target **generated current N3**, not create a new dependency on the deleted historical Level 3.

---

# 2. Build and patch pipeline affecting N3

The relevant current pipeline is:

```text
build-mission01-seven-source.mjs
  ↓
current N3 generated from historical source Level 4
  ↓
patch-mission01-programming-flow.mjs
  ↓
patch-mission01-repeatable-help.mjs
  ↓
patch-mission01-programming-guide-structure.mjs
  ↓
patch-mission01-runtime-identity.mjs
  ↓
patch-mission01-programming-polish.mjs
  ↓
patch-mission01-celebration-confetti.mjs
  ↓
help responsiveness / interaction / guide consolidation patches
  ↓
normalize-mission01-optional-help.mjs
  ↓
patch-mission01-guide-visibility.mjs
  ↓
patch-mission01-transition-dispose.mjs
  ↓
patch-mission01-explore-glow.mjs
  ↓
stabilize-mission01-runtime.mjs
  ↓
static audits
```

### Important shared-patch risk

Most of the N3 presentation/runtime patches also touch N4 and N5. Editing those shared scripts to create the control condition would create unnecessary regression risk.

Recommended future architecture:

```text
shared experimental-derived N3
  ↓
late N3-local control adapter
  ↓
flat control presentation
```

The adapter should be N3-only and should not rewrite shared N4/N5 behavior.

```text
IMPLEMENTATION_RISK = HIGH
PREFERRED_STRATEGY = LATE N3-LOCAL ADAPTER
```

---

# 3. Current N3 task core

## 3.1 Learning task

N3 is the first programming/navigation task in the active seven-level sequence.

The current conceptual task is:

```text
observe orientation
  ↓
construct an ordered program
  ↓
execute the program
  ↓
observe trajectory
  ↓
reach the target
```

The current task family uses the 8×8 programming board defined for this progression. The current automated N3 tests do **not** expose a stable QA accessor for exact start/goal coordinates, so coordinate-level start/goal values are not presently machine-frozen. That must be resolved as part of the N3 implementation contract before N3 can later be frozen.

## 3.2 Available commands

The N3 command vocabulary is:

```text
AVANZAR
GIRAR IZQ.
GIRAR DER.
```

Semantics explicitly established by the N3 exploration content:

```text
AVANZAR
= move one cell in the current facing direction

GIRAR IZQ. / GIRAR DER.
= change orientation without changing cell
```

## 3.3 Verified successful program

Both current gameplay E2E suites use the same successful six-command program:

```text
AVANZAR
AVANZAR
AVANZAR
GIRAR DER.
AVANZAR
AVANZAR
```

Machine representation:

```text
forward, forward, forward, right, forward, forward
```

The tests verify that six real program blocks are inserted, the program is executed, and the success overlay appears.

This is currently the strongest machine-verified behavioral task-core contract for N3.

## 3.4 Program editing and execution

Current verified interaction includes:

- command palette blocks identified with `data-command`,
- insertion into the program editor,
- keyboard-accessible insertion through `Enter`,
- ordered execution,
- active instruction highlighting,
- movement animation,
- turn animation,
- success detection.

`patch-mission01-programming-polish.mjs` fixes current movement timing at approximately:

```text
move = 500 ms
turn = 360 ms
```

Those timings and animated emphasis are presentation characteristics, not scientific/task-core requirements for the future control condition.

## 3.5 Errors

Current N3 E2E proves the valid route, but it does **not** contain a dedicated wrong-route/failure assertion for N3.

The shared collision-feedback reinforcement starts at N4, not N3. Therefore N3 error semantics should not be inferred from N4 collision behavior.

```text
N3_WRONG_ROUTE_CONTRACT = NOT MACHINE-FROZEN
```

Before N3 control can later be frozen, a failure/correction E2E should explicitly establish what happens when a participant submits a wrong program.

## 3.6 Completion and navigation

Current N3 completion is represented by the success overlay. Runtime identity normalization guarantees:

```text
ready = level 3
complete = 3 → 4
```

The current programming-flow QA also requires `CONTINUAR AL NIVEL 4`.

The structured disposer is preserved for N3 so its renderer/RAF can be cleaned before navigating away.

---

# 4. Current help / pedagogical layer

## 4.1 EXPLORAR

N3 currently has **exactly four** EXPLORAR concepts:

1. AYNI and orientation.
2. AVANZAR.
3. GIRAR.
4. Reach the goal.

Current N3 specifically requires EXPLORAR before running the program.

The current shared code also adds a yellow visual treatment and a dedicated pulsing glow/halo to N3 EXPLORAR until its first click.

## 4.2 GUÍA

GUÍA is optional after EXPLORAR and is structured as three steps:

1. `ARRASTRA LOS BLOQUES`
2. `ORDENA LA SECUENCIA`
3. `INICIA LA PRUEBA`

The guide uses active/pending/completed visual states and an animated strike-through treatment.

## 4.3 Help lifecycle

Closing N3 EXPLORAR resets it so it can be reopened from the first step. The guide can likewise be reopened through its own lifecycle.

### Control-condition implication

The conceptual instructional support can be preserved, but the following current presentation is game-layer contamination for GC:

- AYNI identity in help copy,
- music-note/audio references (`DO`, `RE`, `MI`),
- yellow reward-like emphasis,
- pulsing EXPLORAR glow,
- animated strike-through effects.

---

# 5. Current game/presentation layer

Current N3 includes presentation that is not part of the programming task core:

- AYNI name and character face/eyes,
- Mars/scene theming inherited from the programming source,
- Three.js rover rendering,
- EXPLORAR glow/halo,
- animated active instruction effects,
- movement bounce/squash,
- audio/music-note framing,
- Bitácora,
- success celebration,
- three waves of confetti on completion.

The global celebration patch explicitly injects confetti into N3.

These features must not be mistaken for required active-control behavior.

---

# 6. Telemetry audit

The app shell currently installs dedicated research bridges for:

```text
Level1ControlTelemetryBridge
Level2ControlTelemetryBridge
Level6TelemetryBridge
Level7TelemetryBridge
```

There is **no dedicated Level3 telemetry bridge installed in `src/main.ts`**.

The current N3 gameplay E2E verifies interaction and completion but does not assert behavioral event output for N3.

Therefore:

```text
N3_RESEARCH_TELEMETRY = NOT DEMONSTRATED
N3_LEVEL3_CONTROL_BRIDGE = ABSENT
```

A future N3 control implementation should add an observational N3-only bridge rather than reuse game feedback as telemetry.

Candidate research events to define during implementation review, not active today:

```text
level_started
program_modified
program_started
movement_executed
turn_executed
program_failed
help_requested
level_completed
```

Candidate derived metrics:

```text
first_program_length
final_program_length
run_attempt_count
first_attempt_success
final_success
program_change_count
help_used
help_count
time_to_first_action_ms
completion_time_ms
```

These names are recommendations for the future control implementation and are **not claimed as current N3 events**.

---

# 7. Persistence audit

The current N3 E2E does not reload the page during:

- partial program construction,
- failed execution,
- successful completion.

No N3-specific persistence bridge/state contract is installed at app level.

`Mission01Screen` contains historical key migration logic for remapped programming levels, but that is not sufficient evidence of participant-state persistence for N3.

Therefore:

```text
N3_REFRESH_PERSISTENCE = NOT DEMONSTRATED
N3_COMPLETION_IDEMPOTENCY = NOT DEMONSTRATED
```

Future N3 implementation must explicitly decide and test minimum persisted state, including at least:

```text
program contents
current task completion state
attempt counters / research counters
terminal completion one-shot guard
```

Do not infer persistence from N4/N5 behavior.

---

# 8. Current tests and guards

## Behavioral

### `tests/e2e/mission01-gameplay.cjs`

N3:

```text
open N3
complete EXPLORAR
insert F F F R F F
assert 6 program blocks
run
wait success
assert goal feedback
```

### `tests/e2e/mission01-gameplay-n3-n6.cjs`

N3 again verifies:

```text
F F F R F F
→ success overlay
```

## Static/shared

Current shared audits additionally protect:

- N1–N7 numbering/navigation,
- N3 exclusion of deleted RASTREAR/TP source content,
- logical 1672×941 stage,
- help lifecycle,
- inline JavaScript syntax,
- N3→N4 identity,
- structured transition cleanup.

## Missing N3-specific guards

There is currently no N3-specific frozen contract for:

- exact start cell,
- exact goal cell,
- initial facing direction,
- exact 8×8 board coordinate contract,
- wrong-program feedback,
- refresh persistence,
- idempotent completion,
- N3 research telemetry,
- control-condition neutrality.

Those gaps should become explicit acceptance tests before implementation is considered complete.

---

# 9. N2 frozen regression protection for future N3 work

Phase 15 is satisfied by maintaining the existing N2 frozen regression suite rather than introducing a second duplicate runtime test.

The existing N2 protection already covers the required frozen contract through:

```text
scripts/audit-mission01-control-n2.mjs
tests/e2e/mission01-control-n2.cjs
tests/e2e/mission01-control-n2-telemetry.cjs
research/control-n2-freeze @ dbb60df8...
```

Together these verify:

- A/B/C = 24/28/32,
- range `>24 && <32`,
- 3/3 gate,
- wrong A does not complete,
- correct B completes,
- attempt semantics,
- `responseChangeCount`,
- refresh persistence,
- telemetry/privacy,
- audio neutralization,
- no N1 instrumentation re-test.

For any future N3 implementation workflow, N1 and N2 generated outputs must be compared against their frozen checkpoints before N3 can be frozen.

---

# 10. KEEP / REMOVE / FLATTEN / NEUTRALIZE / REPLACE matrix

| Classification | Current N3 element | Control rationale |
|---|---|---|
| KEEP | programming/navigation problem | core active task |
| KEEP | board topology | preserve problem difficulty |
| KEEP | start state | must remain treatment-equivalent once exact coordinates are frozen |
| KEEP | goal state | must remain treatment-equivalent once exact coordinates are frozen |
| KEEP | facing/orientation semantics | core reasoning requirement |
| KEEP | AVANZAR | core command |
| KEEP | GIRAR IZQ. | core command |
| KEEP | GIRAR DER. | core command |
| KEEP | ordered program state | core response artifact |
| KEEP | ability to edit/correct program | active problem solving |
| KEEP | execute program action | core interaction |
| KEEP | trajectory/result of each command | needed to reason about program |
| KEEP | success criterion | same problem/outcome |
| KEEP | N3 → N4 navigation | sequence contract |
| KEEP | optional conceptual help availability | preserve assistance without game reward |
| REMOVE | AYNI narrative identity | game/narrative layer |
| REMOVE | character face/eyes/personality | game identity |
| REMOVE | Bitácora reward framing | game/reward layer |
| REMOVE | EXPLORAR pulsing glow | attention manipulation/game emphasis |
| REMOVE | confetti | celebration/reward |
| REMOVE | music-note DO/RE/MI framing | audio/game framing |
| REMOVE | game SFX/music in N3 | condition contamination |
| FLATTEN | Three.js board scene | retain topology in neutral 2D presentation |
| FLATTEN | rover model | replace visually with neutral directional marker |
| FLATTEN | target/flag | neutral target cell |
| FLATTEN | block palette/editor visual style | retain mechanics, remove game polish |
| FLATTEN | trajectory animation | retain observable movement with minimal neutral transition |
| NEUTRALIZE | EXPLORAR copy | preserve orientation/command concepts without AYNI/audio narrative |
| NEUTRALIZE | GUÍA copy | preserve how-to support without game language |
| NEUTRALIZE | active instruction highlighting | simple accessible state, no glow/bounce |
| NEUTRALIZE | wrong-program feedback | conceptual, non-celebratory, non-punitive |
| NEUTRALIZE | completion | neutral completion modal, no reward/confetti |
| REPLACE | N3 telemetry | dedicated observational Level3 control bridge |
| REPLACE | N3 persistence | explicit GC state/persistence contract |
| REPLACE | game presentation shell | N3-local flat control adapter |

---

# 11. Proposed future control architecture — NOT IMPLEMENTED

The safest future implementation path is:

```text
current generated N3 remains source/task reference
        ↓
patch-mission01-control-n3.mjs   [N3 only]
        ↓
/control/n3-control.css
/control/n3-control.js
        ↓
Level3ControlTelemetryBridge.ts
```

Constraints:

1. Do not alter N1/N2 frozen outputs.
2. Do not modify N4–N7 output.
3. Do not modify `ApuLabStationGame`.
4. Do not rewrite shared N3/N4/N5 source patches merely to obtain a flat presentation.
5. Preserve the same programming problem and success criterion.
6. Establish exact board/start/goal/facing parity before declaring N3 implementation ready.
7. Add N3-specific refresh, idempotency and telemetry E2E.
8. Add same-head visual QA before N3 freeze.

---

# 12. Risk register

| Risk | Severity | Reason |
|---|---|---|
| editing shared programming patches changes N4/N5 | HIGH | many patches iterate over levels 3–5 |
| accidentally changing N1/N2 frozen outputs | HIGH | cumulative build pipeline |
| using deleted historical Level 3 as source | HIGH | current N3 is remapped historical L4 |
| changing board/task difficulty while flattening | HIGH | control must preserve active task equivalence |
| inventing persistence semantics from another level | HIGH | current N3 persistence is not demonstrated |
| assuming telemetry exists because later levels have it | HIGH | no Level3 bridge is installed |
| retaining hidden game audio/reward while overlaying UI | MEDIUM/HIGH | underlay runtime currently contains game presentation |
| coordinate drift | HIGH | exact start/goal/facing are not currently frozen by N3-specific QA |

---

# 13. Audit conclusion

```text
N3_AUDIT_STATUS = COMPLETE

SOURCE_LINEAGE = MAPPED
BUILD_PIPELINE = MAPPED
TASK_CORE = MAPPED
COMMANDS = MAPPED
SUCCESSFUL_PROGRAM = MAPPED
HELP_LAYER = MAPPED
GAME_LAYER = MAPPED
TESTS = MAPPED
SHARED_DEPENDENCIES = MAPPED
N1_N2_REGRESSION_RISK = MAPPED

N3_EXACT_START_GOAL_COORDINATES = NOT YET MACHINE-FROZEN
N3_WRONG_ROUTE_CONTRACT = NOT YET MACHINE-FROZEN
N3_RESEARCH_TELEMETRY = NOT DEMONSTRATED
N3_REFRESH_PERSISTENCE = NOT DEMONSTRATED
N3_COMPLETION_IDEMPOTENCY = NOT DEMONSTRATED

IMPLEMENTATION_RISK = HIGH
N3_IMPLEMENTATION_STATUS = NOT STARTED
N3_IMPLEMENTATION_AUTHORIZED = NO
```

**STOP.** The next action requires a separate explicit authorization for N3 implementation after review of this audit.