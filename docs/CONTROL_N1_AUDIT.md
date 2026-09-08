# ApuLab Control GC · N1 Audit Report

Status: **PHASE A ONLY · AUDIT COMPLETE · NO RUNTIME IMPLEMENTATION**

## 1. Source snapshot

- Protected experimental repository: `Kas01000101/ApuLabStationGame`
- Protected source commit: `2f94e9e701172ab455767757225110606b983597`
- Protected source tree: `e5651dcaee3f6d1c180a4a755b582e44735bd2c4`
- Control repository: `Kas01000101/ApuLabControl_GC`
- Baseline main commit: `2e53ea7d35757b0a6dbb4ab5fc2b655bffbd4294`
- Baseline tree: `e5651dcaee3f6d1c180a4a755b582e44735bd2c4`
- Audit branch: `research/control-active`, created from the baseline commit above.

The identical source/destination tree SHA establishes byte-level baseline parity before this documentation commit. No source write is permitted or required for N1 control work.

## 2. File map

| Area | File / location | Role in N1 | Scope |
|---|---|---|---|
| Packed source substrate | `src/missions/mission01/final/level1/part00.b64` … `part04.b64` | Compressed/base64 source from which N1 is reconstructed | N1-specific |
| Source builder | `scripts/build-mission01.mjs` | Gunzips packed N1 and applies the first N1 semantic/visual patch set | Shared builder |
| Seven-level orchestrator | `scripts/build-mission01-seven-source.mjs` | Executes the legacy source builder in the active seven-level sequence | Shared |
| Generated runtime | `public/missions/mission01/level1.html` | Build output; not a source of truth to edit directly | Generated |
| N1 pedagogy | `scripts/patch-mission01-level1-pedagogy.mjs` | EXPLORAR/GUÍA hierarchy and N1 presentation | N1-specific |
| N1 Explore card | `scripts/patch-mission01-level1-explore-panel.mjs` | Yellow contextual panel | N1-specific |
| N1 HUD style | `scripts/patch-mission01-level1-hud-dark-lines.mjs` | Game-styled EXPLORAR/GUÍA buttons | N1-specific |
| N1 guide animation | `scripts/patch-mission01-level1-guide-strike.mjs` | Animated task strike-through | N1-specific, later consolidated |
| N1 audio | `scripts/patch-mission01-level1-audio.mjs` | WebAudio feedback/chime | N1-specific |
| N1 intermediate lock | `scripts/verify-mission01-level1-output.mjs` | Locks an intermediate generated N1 artifact before later patches | N1-specific |
| N1 observer optimization | `scripts/patch-mission01-level1-observer-opt.mjs` | Limits pedagogical observer scope | N1-specific |
| N1 audio boost | `scripts/patch-mission01-level1-audio-boost.mjs` | Boosts N1 SFX and chains a Level-2 patch import | N1 file with shared side effect |
| N1 guide layout | `scripts/patch-mission01-level1-guide-layout.mjs` | N1 guide geometry | N1-specific |
| Shared celebration | `scripts/patch-mission01-celebration-confetti.mjs` | Adds confetti to N1–N5 | Shared |
| Shared help controller | `scripts/patch-mission01-help-interaction-controller.mjs` | Keeps table interactive while GUÍA is open | N1/N2 shared |
| Shared guide consolidation | `scripts/consolidate-mission01-guide-runtime.mjs` | Removes duplicate guide owners and decouples GUÍA from RAF/Three.js | N1/N2 shared |
| Native N1 checklist | `scripts/patch-mission01-native-guide-checklist.mjs` | Final native checklist renderer/state mapping | N1-specific |
| Optional help | `scripts/normalize-mission01-optional-help.mjs` | Makes N1 EXPLORAR/GUÍA optional and gameplay available immediately | Shared |
| Guide visibility | `scripts/patch-mission01-guide-visibility.mjs` | Guarantees visible help panel | Shared |
| Transition cleanup | `scripts/patch-mission01-transition-dispose.mjs` | Disposes N1 renderer on transition | Shared |
| Explore attention | `scripts/patch-mission01-explore-glow.mjs` | Adds animated attention to N1/N3/N5 | Shared |
| Final stabilization | `scripts/stabilize-mission01-runtime.mjs` | Local Three runtime, Poppins, SFX contract, restores N1 from intermediate 28.0 to final 15.0 V | Shared N1–N7 |
| Navigation shell | `src/ui/Mission01Screen.ts` | Single iframe and N1→N2 transition bridge | Shared |
| App shell | `src/app/ApuLabApp.ts` | Session entry, intro, global ambient music, Mission01 start | Shared |
| Ambient music | `src/three/effects/AmbientMusic.ts` | Global looping track `/assets/audio/specular-city.mp3` | Shared |
| Session state | `src/systems/GameState.ts`, `SessionService.ts` | Pseudonymous participant/session state | Shared |
| Telemetry stack | `TelemetryService.ts`, `LocalQueueService.ts`, `SyncService.ts`, research repository provider | Global raw-event queue/sync infrastructure | Shared |
| E2E N1/N2 | `tests/e2e/mission01-electronics.cjs` | Physical N1 success path and final 15.0 V contract | N1/N2 shared test |
| Smoke | `tests/e2e/mission01-smoke.cjs` | Runtime N1→N7, WebGL/help/navigation | Shared regression |
| SFX contract | `tests/e2e/mission01-sfx.cjs` | SFX-off behavior N1→N7 | Shared regression |

## 3. Build pipeline

The tracked `public/missions/mission01/level1.html` is generated output. The effective source path is:

`level1/part*.b64` → `build-mission01.mjs` → `build-mission01-seven-source.mjs` → N1 patches → shared patches → `stabilize-mission01-runtime.mjs` → final audits/build output.

A direct edit to `public/missions/mission01/level1.html` would be overwritten by `npm run prepare:missions` / `npm run build` and is therefore prohibited as an implementation strategy.

| Script | Purpose | N1 impact | Shared impact | Phase-B action |
|---|---|---|---|---|
| `build-mission01-seven-source.mjs` | Active seven-level source orchestration | High | High | KEEP |
| `build-mission01.mjs` | Reconstructs packed N1 and creates core state/UI | Critical | High | AVOID EDIT if a post-build N1 adapter can work |
| `patch-mission01-level1-pedagogy.mjs` | EXPLORAR/GUÍA presentation | High | None | ADAPT/neutralize only if still effective after consolidation |
| `patch-mission01-level1-explore-panel.mjs` | Explore card presentation | Medium | None | NEUTRALIZE |
| `patch-mission01-level1-hud-dark-lines.mjs` | Game HUD styling | Medium | None | NEUTRALIZE |
| `patch-mission01-level1-guide-strike.mjs` | Animated guide strike | Medium | None | Do not target alone; later consolidation supersedes its runtime |
| `patch-mission01-level1-audio.mjs` | N1 WebAudio SFX | High | None | DISABLE/REMOVE in N1 only |
| `verify-mission01-level1-output.mjs` | Intermediate integrity lock | High | None | Must be repositioned/adapted if a later N1 control patch changes the final output |
| `patch-mission01-level1-observer-opt.mjs` | Observer optimization | Low | None | KEEP unless obsolete after flattening |
| `patch-mission01-level1-audio-boost.mjs` | SFX + imports Level-2 patch | High | **N2 side effect** | Do not delete wholesale; preserve N2 import path |
| `patch-mission01-celebration-confetti.mjs` | Shared confetti N1–N5 | High | N2–N5 | Do not change globally; suppress N1 locally |
| `patch-mission01-help-responsiveness.mjs` | Help/camera interaction | Medium | N2 | Preserve behavioral responsiveness |
| `patch-mission01-help-interaction-controller.mjs` | Nonblocking GUÍA/table | High | N2 | KEEP behavior |
| `consolidate-mission01-guide-runtime.mjs` | Single guide owner; decouples guide from render | Critical | N2 | KEEP behavior; avoid global rewrite |
| `patch-mission01-native-guide-checklist.mjs` | Final N1 guide states | High | None | KEEP semantics, NEUTRALIZE styling/copy |
| `normalize-mission01-optional-help.mjs` | Immediate gameplay; help optional | Critical | N2–N5 | KEEP N1 semantics; do not alter other levels |
| `patch-mission01-guide-visibility.mjs` | Visible help panel | Medium | N2–N5 | KEEP |
| `patch-mission01-transition-dispose.mjs` | Renderer cleanup | Medium | N2–N5 | KEEP until N1 renderer is replaced; then N1-local transition cleanup |
| `patch-mission01-explore-glow.mjs` | Glow N1/N3/N5 | High game-layer | N3/N5 | Suppress N1 locally, leave N3/N5 intact |
| `stabilize-mission01-runtime.mjs` | Final local Three/Poppins/SFX and N1=15V | Critical | N1–N7 | KEEP globally; control adaptation must not alter N2–N7 |

### Critical pipeline observation

N1 is intentionally **28.0 V at an intermediate build stage** and is restored to **15.0 V** only by the later stabilization script. Any Phase-B control patch must target the final 15.0-V runtime and must not mistake the intermediate 28.0 marker for the study value.

## 4. Real N1 task core

The final generated baseline artifact from the control baseline build was inspected in addition to source scripts/tests. Effective state is:

- `PRACTICE_BATTERY_VOLTAGE = 15.0`.
- Battery POWER is interactive.
- Multimeter POWER is interactive.
- Multimeter mode is fixed to `DCV` / `V⎓`.
- Black and red meter leads are already connected (`blackLeadConnected = true`, `redLeadConnected = true`).
- The participant manipulates the **probe tips**, not the meter-side COM/VΩ plugs.
- Black/red probe tips can be placed on positive or negative battery terminals.
- Measurement semantic states: `none`, `one`, `conventional`, `reversed`, `same-point`.
- Meter off → no reading; battery off / incomplete / invalid arrangement → `0.0 V` when meter is on.
- Conventional red→+ and black→− → `+15.0 V`.
- Reversed red→− and black→+ → `-15.0 V`.
- Same terminal is rejected/handled as invalid; each terminal accepts one probe.
- Correct measurement immediately satisfies completion. There is no independent reading quiz after measurement.
- EXPLORAR and GUÍA are optional in the final baseline; gameplay is unlocked from the start.

### Important parity decision

**Do not add manual COM/VΩ insertion as a new evaluated task in GC N1.** The baseline runtime and E2E path treat those leads as already connected. Making GC require cable-jack insertion would make the control task harder than the experimental baseline.

## 5. Game layer identified

The current N1 game layer includes:

- AYNI/Yachay/mission narrative in title, aria/copy and success text.
- 3D Three.js/WebGL battery, multimeter, cables/probes, workbench and camera.
- OrbitControls/camera tweening and Explore focus camera tour.
- visual halos/glows/pulses and animated attention around EXPLORAR and scientific objects.
- global ambient music from the app shell.
- synthesized WebAudio UI/guide/confetti SFX in N1.
- two confetti systems (native completion pieces plus the later shared celebration layer).
- celebratory success popup (`¡FELICITACIONES!`).
- unlock language and Bitácora as a reward/progression device.
- animated guide strike-through and reward-oriented visual styling.
- dark game HUD / yellow-lavender action treatment.
- physical-button press/glow microfeedback beyond what is required to communicate state.

Pedagogical scaffolding itself is **not** classified as game layer. Neutral instructions about two points, sign, polarity and current challenge state must remain.

## 6. Classification matrix

Counts use one **primary** action per row so totals are reproducible.

| Component | Current GE/baseline | GC action | Shared? | Risk | File / source |
|---|---|---|---|---|---|
| Scientific value 15.0 V | Final runtime value | KEEP | No | Low | `stabilize-mission01-runtime.mjs` |
| Battery POWER | Clickable physical control | KEEP | No | Low | generated from `build-mission01.mjs` |
| Multimeter POWER | Clickable physical control | KEEP | No | Low | generated from `build-mission01.mjs` |
| DCV/V⎓ mode | Preconfigured, not participant-evaluated | KEEP | No | Low | N1 generated state |
| COM/VΩ lead state | Preconnected, not participant-evaluated | KEEP | No | Low | N1 generated state |
| Red/black movable probes | Drag/snap | KEEP | No | Medium | N1 generated state |
| Positive/negative terminals | Measurement targets | KEEP | No | Low | N1 generated state |
| Measurement state model | none/one/conventional/reversed/same-point | KEEP | No | Low | N1 generated state |
| Incomplete measurement | 0.0 V / one-point feedback | KEEP | No | Low | N1 generated state |
| Conventional reading | +15.0 V | KEEP | No | Low | N1 generated state |
| Reversed reading | -15.0 V | KEEP | No | Low | N1 generated state |
| Same-point / occupied terminal correction | Invalid state with correction | KEEP | No | Low | N1 generated state |
| Self-correction path | Immediate probe repositioning | KEEP | No | Low | N1 generated handlers |
| Completion criterion | Correct measurement = complete | KEEP | No | Low | N1 generated state |
| GUÍA conceptual scaffold | Optional, nonblocking | KEEP | Partly | Low | native checklist + shared help controller |
| EXPLORAR conceptual content | Optional 4-concept explanation | KEEP | Partly | Medium | `build-mission01.mjs` / optional-help patch |
| aria-live / status semantics | Screen-reader corrective status | KEEP | No | Low | N1 generated DOM/runtime |
| N1→N2 navigation contract | postMessage/legacy bridge | KEEP | Yes | Medium | `Mission01Screen.ts` |
| 1672×941 logical stage | Shared logical canvas contract | KEEP | Yes | Low | stage audit/runtime |
| Pseudonymous session architecture | participant/session state | KEEP | Yes | Medium | `GameState.ts`, `SessionService.ts` |
| Local event queue/privacy guard | event IDs, local queue, forbidden PII keys | KEEP | Yes | Medium | `TelemetryService.ts`, `LocalQueueService.ts` |
| Poppins / legibility | Shared typography | KEEP | Yes | Low | stabilizer / runtime |
| AYNI/Yachay/mission narrative | Narrative framing | REMOVE | Partly | Low | N1 generated copy/title |
| Ambient music exposure | Global looping track | REMOVE | Yes | High | `ApuLabApp.ts`, `AmbientMusic.ts` |
| N1 synthesized SFX | UI ticks/chimes/clicks | REMOVE | No | Medium | `patch-mission01-level1-audio*.mjs` |
| Confetti | Native + shared celebration | REMOVE | Yes | High | N1 runtime + `patch-mission01-celebration-confetti.mjs` |
| Bitácora unlock/reward progression | Unlock card/reward language | REMOVE | No | Medium | N1 generated success/journal DOM |
| EXPLORAR glow/halo attention | Animated attention | REMOVE | Yes | High | `patch-mission01-explore-glow.mjs` |
| Battery 3D representation | Procedural Three.js | FLATTEN | No | High | packed source / N1 generated runtime |
| Multimeter 3D representation | Procedural Three.js | FLATTEN | No | High | packed source / N1 generated runtime |
| Probes/cables/terminals 3D | Procedural drag targets | FLATTEN | No | High | packed source / N1 generated runtime |
| Workbench/scene | Immersive 3D environment | FLATTEN | No | Medium | N1 generated runtime |
| EXPLORAR camera tour/focus | Camera tween + 3D focus | FLATTEN | Partly | High | N1 generated runtime / help patches |
| Success modal/copy | Celebratory dialog | NEUTRALIZE | No | Medium | N1 generated DOM/runtime |
| Guide animated strike styling | Animated pink strike/checklist | NEUTRALIZE | No | Medium | native guide checklist patch |
| HUD game styling/progress language | Yellow/lavender game HUD | NEUTRALIZE | No | Medium | N1 HUD/pedagogy patches |
| Corrective feedback presentation | Mix of neutral and celebratory copy | NEUTRALIZE | No | Low | N1 generated state/guide |
| Physical/glow microfeedback | Press animations, emissive/glow effects | NEUTRALIZE | No | Medium | N1 generated runtime |
| N1 Three.js/WebGL renderer | Required by baseline N1 visual runtime | REPLACE | Package shared | High | N1 generated runtime + local Three vendor |
| N1 task-level telemetry path | No dedicated N1 bridge/events confirmed in final generated N1 | REPLACE | Yes infra | High | add N1-local observational adapter in Phase B |

Classification totals:

- KEEP: **22**
- REMOVE: **6**
- FLATTEN: **5**
- NEUTRALIZE: **5**
- REPLACE: **2**

## 7. Assets

### N1 final runtime

No N1-specific PNG/JPG/WebP/GLTF model asset was found in the generated N1 artifact. Scientific objects are predominantly procedural Three.js geometry/canvas textures. The generated N1 directly references:

- `/vendor/three/three.module.js` — shared runtime.
- `/vendor/three/OrbitControls.js` — shared runtime.
- Google Fonts Poppins stylesheet — shared typography dependency.

### Shared game-audio asset

`src/three/effects/AmbientMusic.ts` uses `/assets/audio/specular-city.mp3`. This is global/shared and must **not** be deleted for N1 because N2–N7 are regression-locked. If Phase B removes music from GC N1 exposure, use a control-condition/local suppression mechanism rather than deleting the shared asset.

### N1-specific sound

N1 feedback SFX are synthesized using Web Audio API; they do not depend on separate audio files.

## 8. State and handlers

Effective N1 state variables include battery power, meter power, fixed DCV mode, preconnected leads, probe terminal assignments, challenge state, optional-help state and completion state.

Primary handlers:

- canvas pointer down/move/up/cancel for probe drag/snap;
- physical action hit routing for battery/meter POWER;
- EXPLORAR click lifecycle;
- GUÍA toggle;
- success/journal dialog interactions;
- N1→N2 completion postMessage.

The final help controller intentionally allows table interaction while GUÍA is open and blocks manipulation only while EXPLORAR is actively running. That behavioral property is pedagogical usability, not reward, and should be preserved.

## 9. Telemetry audit

### Confirmed global infrastructure

- `SessionService` records `session_started` after creating a demo/study session.
- `TelemetryService` creates a random `event_id`, records session/scene/event/payload/timestamp and queues it.
- `LocalQueueService` stores events in localStorage, deduplicates by `event_id`, limits payload size, and rejects PII-like keys including name, email, school, credential/password and participant code.
- `SyncService` batches, retries and removes acknowledged idempotent events.

### Confirmed N1 gap

The final generated N1 artifact contains no dedicated task telemetry calls/events and no N1 telemetry bridge was found in `src/systems` (dedicated bridges exist for Levels 6 and 7, not Level 1). Therefore baseline N1 currently confirms **session-level telemetry infrastructure but not task-level N1 research events**.

Phase B must not invent a quiz or alter the task to obtain telemetry. The required N1 observational mapping should attach to existing actions/state transitions only:

- `level_started`
- `first_action`
- `help_requested`
- `probe_attempt` or equivalent
- `measurement_state`
- `polarity_state`
- `measurement_completed`
- `level_completed`

Derived outcomes should be computed from raw events rather than emitted as duplicated analytical facts whenever possible.

## 10. Persistence audit

### What exists

- Telemetry queue persistence exists in localStorage.
- Mission01 sequence/program migration keys exist in the shared navigation layer.
- N1 itself does **not** persist battery/meter/probe/completion state in its generated runtime.
- `GameState` holds session/participant state in memory and creates a new random session ID for a new app/session lifecycle.
- The app shows a browser unload warning while intro/Mission01 progress is at risk, which acknowledges that refresh can lose current task state.

### Consequence for Phase B

The requested research invariant “refresh must not duplicate attempts/completion or lose valid progress” is **not already provided by N1 task runtime**. It must be addressed with an N1-local research/persistence adapter or another narrowly scoped mechanism. Do not modify global N2–N7 task persistence to solve N1.

This is an implementation risk, not a reason to change the experimental source.

## 11. Tests and E2E

### Existing evidence

`tests/e2e/mission01-electronics.cjs` physically validates the final N1 path:

1. final source contains `PRACTICE_BATTERY_VOLTAGE = 15.0` and not stale 28.0;
2. battery POWER;
3. multimeter POWER;
4. red probe → positive terminal;
5. black probe → negative terminal;
6. success overlay appears and contains `15.0 V`.

Crucially, it does **not** connect meter-side COM/VΩ plugs. That confirms those connections are preconfigured in the tested baseline.

`mission01-smoke.cjs` validates current WebGL/help/runtime N1→N7 and is useful as a baseline regression reference. `mission01-sfx.cjs` validates SFX-off behavior across N1→N7.

### N1 test gaps to cover before Phase-B acceptance

The existing electronics E2E does not physically assert:

- one-probe/incomplete `0.0 V` consequence;
- reversed polarity `-15.0 V`;
- correction from reversed to conventional;
- repeated probe attempts;
- help use telemetry;
- refresh/idempotency behavior;
- neutralized success presentation.

Phase B should add N1-control-specific E2E/guards without changing N2–N7 expected behavior.

## 12. Shared dependencies

Shared dependency groups identified: **16**.

1. `package.json` prepare/build pipeline.
2. `build-mission01-seven-source.mjs`.
3. `build-mission01.mjs` shared legacy builder.
4. `patch-mission01-level1-audio-boost.mjs` because it chains a Level-2 patch.
5. `patch-mission01-celebration-confetti.mjs`.
6. `patch-mission01-help-responsiveness.mjs`.
7. `patch-mission01-help-interaction-controller.mjs`.
8. `consolidate-mission01-guide-runtime.mjs`.
9. `normalize-mission01-optional-help.mjs`.
10. `patch-mission01-guide-visibility.mjs`.
11. `patch-mission01-transition-dispose.mjs`.
12. `patch-mission01-explore-glow.mjs`.
13. `stabilize-mission01-runtime.mjs`.
14. `Mission01Screen.ts` navigation shell.
15. `ApuLabApp.ts` + `AmbientMusic.ts` global shell/audio.
16. `GameState` + Session/Telemetry/Queue/Sync/repository research stack.

High-risk principle for Phase B: prefer a **new N1-local control transformation/adapter applied after final baseline stabilization** rather than editing shared patches that also own N2–N7 behavior. If one shared pipeline line must be changed to invoke that N1-local transformer, regression-lock N2–N7 by comparing generated hashes/behavior before and after.

## 13. Risks

### HIGH · Generated-source architecture

N1 does not live as a conventional single source file. It is reconstructed from packed chunks and then rewritten by a long patch chain. Editing the wrong stage can be overwritten or can reintroduce game presentation later.

### HIGH · Shared patch side effects

Several later scripts affect N1 together with N2–N7. Global deletion of confetti, glow, help or stabilization code would violate scope.

### HIGH · Renderer flattening

Baseline N1 is genuinely WebGL/Three.js and current smoke contracts expect a WebGL canvas. A 2D N1 requires a new N1-only rendering strategy plus updates to N1-specific expectations while retaining N2–N7 unchanged.

### HIGH · Task telemetry/persistence gap

The existing modern telemetry infrastructure is not connected to N1 task actions, and N1 task state is not refresh-persistent. Research instrumentation must be added observationally without changing task difficulty or introducing PII.

### MEDIUM · Audio is both local and global

N1 has WebAudio SFX and the app shell has shared ambient music. Disabling both for the control must not break or alter N2–N7 in this N1-only phase.

### MEDIUM · Baseline reward layer is duplicated

N1 contains its own completion confetti and later also receives a shared global celebration patch. Suppressing only one leaves game reward presentation in place.

## 14. Proposed implementation plan — Phase B, not executed

Phase B must start only after explicit authorization `IMPLEMENT N1 CONTROL`.

1. Preserve `main` baseline and continue only on `research/control-active`.
2. Add N1-control regression guards before changing runtime:
   - final value 15.0 V;
   - preconfigured DCV + COM/VΩ;
   - one-probe 0.0 state;
   - reversed -15.0 state;
   - correction to +15.0;
   - correct measurement = completion;
   - no post-measurement quiz.
3. Capture/lock N2–N7 baseline outputs/behavior before N1 transformation.
4. Introduce a **single N1-local control transformation layer** late in the build pipeline, after the experimental N1 has reached its final 15.0-V stabilized state.
5. Preserve the existing scientific state machine and action semantics.
6. Replace/flatten only the N1 renderer/presentation to 2D while keeping the same battery/meter/probe/terminal affordances.
7. Keep DCV and COM/VΩ preconfigured; do not create new connection tasks.
8. Neutralize N1 narrative and game HUD copy.
9. Neutralize corrective feedback presentation while preserving its semantic content.
10. Remove N1 reward layer: native confetti, shared-confetti effect on N1, unlock reward, celebratory language.
11. Disable N1 synthesized SFX and N1 exposure to ambient music through an N1/control-local mechanism; do not delete global audio assets/modules.
12. Remove N1 Explore attention glow and convert the optional conceptual Explore aid to static/simple 2D support.
13. Preserve GUÍA as optional, nonblocking pedagogical scaffolding; replace animated strike effects with neutral state indicators.
14. Add an N1-only telemetry bridge that records existing task actions/state transitions; no new evaluation UI.
15. Add N1-local refresh/idempotency handling sufficient for research events/completion without changing N2–N7 persistence.
16. Run `npm ci` and `npm run build`.
17. Run N1 control E2E covering incomplete, reversed, corrected and completed measurement.
18. Run N2–N7 regression checks and compare baseline behavior/hashes where appropriate.
19. Verify protected source HEAD remains `2f94e9e701172ab455767757225110606b983597`.
20. Stop. No N2 work, no merge, no production deploy.

## 15. Phase-A gate

```text
SOURCE PROTECTION
PASS

BASELINE
PASS

N1 SOURCE MAPPED
YES

N1 BUILD PIPELINE MAPPED
YES

TASK CORE IDENTIFIED
YES

GAME LAYER IDENTIFIED
YES

KEEP ITEMS
22

REMOVE ITEMS
6

FLATTEN ITEMS
5

NEUTRALIZE ITEMS
5

REPLACE ITEMS
2

SHARED DEPENDENCIES
16

IMPLEMENTATION RISK
HIGH

READY FOR N1 IMPLEMENTATION
YES
```

`READY = YES` means the implementation path is technically defined; it does **not** authorize implementation. Phase A stops here.