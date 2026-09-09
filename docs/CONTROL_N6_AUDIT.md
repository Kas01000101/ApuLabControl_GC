# CONTROL N6 AUDIT — VERIFIED GENERATED BASELINE ONLY

## STATUS

- `N6_AUDIT_STATUS = COMPLETE`
- `N6_BASELINE_STATUS = VERIFIED / GAPS DOCUMENTED`
- `N6_IMPLEMENTATION_STATUS = NOT STARTED`
- `N6_IMPLEMENTATION_AUTHORIZED = NO`
- `N6_RESEARCH_TELEMETRY = PARTIAL`
- `N6_PERSISTENCE = NOT DEMONSTRATED`
- `N6_TERMINAL_IDEMPOTENCY = NOT DEMONSTRATED`
- `N6_EXACT_SEQUENCE_REQUIRED = CONDITIONAL`
- `N6_ONLY_VALID_SEQUENCE = NO`
- `N7 = UNCHANGED`

This document is audit-only. It records the real generated Study Build baseline and does not create or modify participant-facing N6 runtime behavior.

## FROZEN PRECONDITIONS

The audit was opened only after the N5 freeze checkpoint and exact frozen regression were active.

- N1 frozen: `b717a70b685f382044276b7a30bec5b556e94e9c`
- N2 frozen: `dbb60df8f509aa0fe461db015445b28d0e78b5cc`
- N3 frozen: `a150e2039a5f35c6dabb6bb8cb6eed8ca6d9532e`
- N4 frozen: `b9178428d31e4b608457b3c7af103d723da92781`
- N5 frozen: `ef2da8c90773f3c3b79c4e7a0f1576a801bd3283`
- N5 freeze ref: `research/control-n5-freeze`
- N5 PR: `#6`, DRAFT / OPEN / NO MERGE

Post-freeze validation on `research/control-active` passed frozen N1–N5 checks plus N6/N7 generated parity and downstream N6/N7 browser regressions.

## GENERATED BASELINE HASH

- `N6_BASELINE_HASH = 53cfd03663c5604a3878132f2e9313caa638bb413935fa4b730415c647ff9bca`
- `N7_BASELINE_HASH = 03e125bf9bb41f960039343a652dad358060a271c1c1050b61347f59d4e02eca`
- N7 remained unchanged during this audit.

`public/missions/mission01/level6.html` is generated during `prepare:missions`; it is not a committed source-of-truth file. The hash above is therefore the generated-runtime baseline lock.

## SOURCE MAP

### Build entrypoint

- `package.json`
  - `prepare:missions` defines the authoritative generation order.

### Upstream shell / remap chain

1. `scripts/build-mission01-seven-source.mjs`
2. shared Mission 01 patches
3. `scripts/generate-mission01-levels67.mjs`
4. `scripts/finalize-mission01-level67-manifest.mjs`
5. `scripts/patch-mission01-level67-scene-ready.mjs`
6. N4/N5 legacy programming patches
7. `scripts/build-mission01-level6-from-level5.mjs`
   - reconstructs N6 from the generated N5 programming shell;
   - marker: `APULAB_LEVEL6_FROM_LEVEL5_V1`;
   - preserves the board/editor/AYNI architecture and adds the scientific task.
8. `scripts/patch-mission01-level6-runtime-identity.mjs`
9. `scripts/patch-mission01-level6-palette-fit.mjs`
10. `scripts/patch-mission01-level6-transient-ui.mjs`
11. `scripts/patch-mission01-level6-study-flow.mjs`
12. `scripts/patch-mission01-level6-contract-hardening.mjs`
13. `scripts/patch-mission01-level6-remove-repeat-residue.mjs`
14. `scripts/patch-mission01-level6-final-ux.mjs`
15. `scripts/patch-mission01-level6-final-ux-fit.mjs`
16. N7 generation/patch chain
17. later N5 final-loop/goal/stabilization patches
18. N6/N7 audits
19. late GC adapters for frozen N3/N4/N5

### N6 configuration

- `scripts/config/mission01-level6.mjs`

### N6 audits

- `scripts/audit-mission01-level6-n5-parity.mjs`
- `scripts/audit-mission01-level6-runtime-identity.mjs`
- `scripts/audit-mission01-level6-contract-hardening.mjs`
- `scripts/audit-mission01-level6-final-ux.mjs`
- `scripts/audit-mission01-level67-shell.mjs`
- `scripts/audit-mission01-full-seven.mjs`

### N6 browser contracts already present

- `tests/e2e/mission01-level6-navigation-identity.cjs`
- `tests/e2e/mission01-level6-contract.cjs`
- `tests/e2e/mission01-level6-final-position.cjs`

These are existing GE/baseline regression tests. No N6 control-condition E2E was created during this audit.

### Telemetry

- `src/systems/Level6TelemetryBridge.ts`
- installed by `src/main.ts`
- shared services:
  - `src/systems/TelemetryService.ts`
  - `src/systems/GameState.ts`
  - `src/systems/LocalQueueService.ts`
  - `src/systems/SyncService.ts`

There is no `Level6ControlTelemetryBridge.ts` in the audited baseline. The real installed bridge is `Level6TelemetryBridge.ts`.

### Navigation

- `src/ui/Mission01Screen.ts`
- N6 runtime direct bridge: `6 -> 7`
- fallback same-origin postMessage: `6 -> 7`

## SCIENTIFIC TASK CONTRACT

### Identity

- Title: `INVESTIGAR`
- Subtitle: `DATOS CIENTÍFICOS · Obtén, interpreta y comunica el resultado.`
- Objective: `INVESTIGA LA ZONA Y ENVÍA EL RESULTADO`

### Board geometry

Coordinates are zero-based.

- Grid: `8 × 8`
- Start: `row 5, column 1`
- Initial orientation: `EAST`
- Scientific zone: `row 5, column 4`
- Communication point: `row 2, column 4`
- Obstacles:
  - `r1c0`
  - `r2c2`
  - `r1c6`
  - `r5c7`

The EAST interpretation is confirmed behaviorally: the validated path begins with three `forward` commands from column 1 to column 4 while remaining on row 5.

## AVAILABLE ACTIONS

Movement / control:

- `AVANZAR`
- `GIRAR IZQ.`
- `GIRAR DER.`
- `REPETIR × N`

Scientific:

- `ESCANEAR`
- `ANALIZAR`
- `ENVIAR DATOS`

`REPETIR` is available from the start of N6 and is optional. N6 explicitly removes the N5 unlock/tutorial requirement.

## ACTION ORDER AND CHECKPOINTS

The real scientific dependency order is mandatory, while the literal full program is not.

1. Reach the scientific zone at `r5c4`.
2. `ESCANEAR` while physically at the scientific zone.
3. `ANALIZAR` only after a successful scan and while still at the scientific zone.
4. Move to the communication point at `r2c4`.
5. `ENVIAR DATOS` only after analysis and while physically at the communication point.
6. Finish the run at the communication point.

Therefore:

- `ARRIVAL_AT_COMMUNICATION_POINT != AUTO_SEND`
- `SEND_BEFORE_ANALYZE = INVALID`
- `ANALYZE_BEFORE_SCAN = INVALID`
- `SCAN_OUTSIDE_SCIENCE_ZONE = INVALID`
- `ANALYZE_OUTSIDE_SCIENCE_ZONE = INVALID`
- `SEND_OUTSIDE_COMMUNICATION_POINT = INVALID`
- sending and then moving away from the communication point does **not** complete N6.

## REFERENCE PROGRAMS VS SUCCESS SEMANTICS

Existing E2E validates this no-repeat reference program:

`forward, forward, forward, scan, analyze, left, forward, forward, forward, send`

It also validates a successful program using two `REPETIR` blocks.

Consequently:

- `N6_ONLY_VALID_SEQUENCE = NO`
- `N6_EXACT_SEQUENCE_REQUIRED = CONDITIONAL`

Conditional means:

- the scientific causal order and zone constraints are required;
- the exact movement sequence is not required;
- use of REPETIR is not required;
- a literal canonical program is not the success criterion.

## DATA / RESULT SEMANTICS

The generated baseline does not demonstrate a numeric sensor measurement.

Observed scientific state is qualitative:

- successful `ESCANEAR` -> `DATO OBTENIDO`
- successful `ANALIZAR` -> `RESULTADO: ZONA DE INTERÉS IDENTIFICADA`
- successful `ENVIAR DATOS` -> result transmitted to ApuLab Station

Open methodological gap: if GE is expected to preserve a specific measured scientific value, that value is not demonstrated by this N6 runtime. Future GC implementation must not invent one without a separate scientific-contract decision.

## SUCCESS CRITERION

Final success requires all of the following in the same executed run:

- scan completed validly;
- analysis completed validly;
- data send completed validly;
- final rover position remains at the communication point.

REPETIR is not part of the success criterion.

## ATTEMPT DEFINITION

An attempt begins when a non-empty, structurally runnable program starts execution and `program_started` is emitted.

- Empty program does not count as a scientific run.
- An empty REPETIR body is rejected before execution.
- `level6Attempt` increments once for each actual program execution.
- A run that reaches a wrong zone/order/action error still counts as an attempt.
- Editing and running again creates a new attempt.

## ERROR / CORRECTION

The runtime preserves an explicit error-correction loop.

### Invalid scientific states

- ANALIZAR before ESCANEAR -> soft failure with explanatory feedback.
- ESCANEAR outside the scientific zone -> soft failure.
- ANALIZAR after leaving the scientific zone -> soft failure.
- ENVIAR before analysis -> soft failure.
- ENVIAR away from the communication point -> soft failure.

### Correction behavior

- The program is preserved after a scientific error.
- Valid scientific progress reached earlier in the run is preserved when a later action fails.
- Editing is re-enabled.
- The participant can correct the sequence and run again.
- `LIMPIAR` is the explicit full reset: program, rover and scientific flags are reset.
- Movement/blocking errors use the inherited programming correction mechanism.

This error -> interpretation -> correction loop is part of the task core and should be preserved in any future GC implementation.

## PERSISTENCE

`N6_PERSISTENCE = NOT DEMONSTRATED`

Observed persistence/storage:

- completion writes `apulab.level6.finalProgram` to localStorage;
- completion writes `apulab.level6.idea` to localStorage;
- raw iframe telemetry is buffered in `sessionStorage['apulab.level6.telemetry']`.

Not demonstrated as refresh-safe restoration:

- partial program;
- attempt counters;
- successful scan state;
- successful analysis state;
- state immediately before send;
- failed-attempt/correction state;
- completion UI/state after refresh.

No dedicated N6 persistence adapter or N6 refresh E2E was found. Completion storage alone is not sufficient to classify the requested research persistence contract as PASS.

## TELEMETRY

`N6_RESEARCH_TELEMETRY = PARTIAL`

### Installed bridge

`Level6TelemetryBridge.ts` is installed by `src/main.ts` and accepts only same-origin messages from the Mission 01 iframe.

Allowed event types include:

- `level_started`
- `level_completed`
- `help_requested`
- `program_started`
- `program_modified`
- `science_action`
- `science_zone_reached`
- `communication_point_reached`
- `explore_opened`
- `bitacora_opened`
- `data_sent`
- `premature_action`
- `scan_started`
- `scan_completed`
- `analyze_started`
- `analyze_completed`

### Useful research variables present

The generated runtime records, depending on event:

- attempt number/count;
- elapsed/completion time;
- help count/source;
- premature-action count and reason;
- program edit count/type;
- valid/invalid science actions;
- rover position for scientific actions;
- science action order;
- first-attempt success;
- whether REPETIR was used spontaneously;
- repeat instances / expanded repeat commands;
- final block counts.

### Why telemetry is PARTIAL rather than PASS

- event coverage is substantial and the bridge is installed;
- privacy filtering is present;
- `level_started` initialization is explicitly idempotent;
- however, terminal `level_completed` one-shot/idempotency is not demonstrated;
- no N6 research-specific persistence/reload contract demonstrates event continuity across refresh;
- the iframe still maintains its own local session telemetry buffer in addition to parent ingestion.

## PRIVACY

`N6_PRIVACY = PASS` for the audited bridge-level identity handling.

- The parent bridge ignores `participant_id` and `session_id` supplied by the iframe payload.
- It injects the parent `GameState` identity instead.
- Study authentication passes only the repository-returned `participant_id` into `GameState`.
- No name, email, credential or other direct PII was found in the N6 event payload contract.
- `GameState` intentionally records `user_agent: 'web'` instead of the full browser User-Agent fingerprint.

Participant/session identifiers are treated as pseudonymous research identifiers, not participant-facing identity fields.

## IDEMPOTENCY

### Initialization

`N6_LEVEL_STARTED_IDEMPOTENCY = PASS`

`patch-mission01-level6-remove-repeat-residue.mjs` installs an explicit `__apulabLevel6TelemetryInitialized` guard so `level_started` is emitted once even if the runtime is evaluated around the document load boundary.

### Terminal completion

`N6_TERMINAL_IDEMPOTENCY = NOT DEMONSTRATED`

The audited `completeLevel()` emits `level_completed`, but no equivalent one-shot `completed` guard or persisted terminal-event marker was demonstrated. `TelemetryService.recordEvent()` generates a fresh `event_id` for each call, so storage-layer UUID generation does not deduplicate repeated completion calls.

Future implementation must explicitly prove one-shot terminal behavior rather than infer it from the success overlay.

## HELP / ANSWER LEAKAGE

Final baseline help contains two participant-facing systems:

1. `EXPLORAR` with two steps.
2. A fixed five-step visual guide on the board.

The fixed guide explicitly communicates the scientific order:

1. go to the scientific zone;
2. obtain information;
3. interpret the datum;
4. go to the communication point;
5. send the result.

Therefore:

- `N6_SEQUENCE_LEAKAGE = YES` in the GE/baseline presentation.
- This is presentation/scaffolding, not evidence that the scientific task should be reduced to ordering labels in GC.

Future active-control direction after explicit authorization:

- `EXPLORAR -> REMOVE`
- game guide -> `REPLACE WITH NEUTRAL AYUDA`
- duplicate GUÍA -> `NO`
- AYUDA may explain command semantics and task constraints but should be reviewed for answer leakage.

## AUDIO

The N6 scientific commands reuse the inherited command execution path (`playCmd`). The success path calls inherited `successMusic()` and `launchConfetti(...)`.

The existing global SFX-off browser regression passes, but audio is not required to satisfy the scientific causal contract.

Audit classification:

- command/success tones -> game presentation; `REMOVE / NEUTRALIZE` for future GC;
- textual scientific consequence -> task-relevant; `KEEP`.

No audio changes were made during audit.

## GAME LAYER / VISUAL BASELINE

The real generated N6 remains game-based and 3D.

Observed baseline presentation includes:

- Three.js/WebGL board;
- AYNI rover;
- 3D obstacles/rocks;
- 3D scientific-zone marker;
- 3D communication beacon;
- movement/turn animation inherited from programming shell;
- Mars/game environment;
- animated/pulsing checkpoint callouts;
- animated five-step progress guide;
- EXPLORAR;
- reward success overlay;
- confetti;
- success music/SFX.

The final-UX patch groups ESCANEAR and ANALIZAR visually under `INVESTIGAR`; `INVESTIGAR` is a visual/semantic container, **not** an additional executable command.

## KEEP / REMOVE / FLATTEN / NEUTRALIZE / REPLACE

### KEEP

- 8×8 logical task space / equivalent spatial state;
- start, scientific zone and communication point relationships;
- obstacle constraints insofar as they remain part of the matched reasoning task;
- movement/action construction;
- ESCANEAR semantics;
- ANALIZAR dependency on prior scan;
- ENVIAR DATOS dependency on analysis;
- scientific-zone constraint;
- communication-point constraint;
- final-position criterion;
- action -> consequence -> interpretation -> next action;
- wrong-order/wrong-zone feedback and self-correction;
- multiple valid programs;
- optional spontaneous REPETIR reuse as behavior, not victory requirement.

### REMOVE

- AYNI as game character presentation;
- EXPLORAR;
- confetti;
- reward framing;
- celebratory glow;
- game-only SFX/music;
- pulsing/attention effects that cue the answer path.

### FLATTEN

- WebGL/Three.js board -> static/flat 2D equivalent;
- 3D obstacles -> static 2D obstacles;
- 3D scientific marker -> static scientific-zone representation;
- 3D communication beacon -> static communication-point representation;
- animated rover movement -> static route/action consequence.

### NEUTRALIZE

- completion overlay;
- error styling;
- checkpoint emphasis;
- command palette styling;
- progress feedback.

### REPLACE

- AYNI-dependent instructions -> neutral task subject/marker;
- game guide -> neutral `AYUDA` preserving semantics without turning N6 into a passive sequencing question.

## ACTIVE-CONTROL PRINCIPLE FOR FUTURE N6

Future GC must **not** become `ordena ESCANEAR / ANALIZAR / ENVIAR DATOS`.

The baseline requires real stateful actions and consequences:

`ACTION -> CONSEQUENCE -> INTERPRETATION -> NEXT ACTION`

Content matching therefore requires an active flat interaction where the participant:

- moves/positions the task state;
- invokes scientific actions;
- receives state-dependent consequences;
- encounters invalid-order/invalid-zone feedback;
- corrects the sequence;
- reaches the final communication state.

Same scientific reasoning; different presentation.

## NAVIGATION

`N6_TO_N7_TRANSITION = VERIFIED`

- N6 root identity is 6.
- ready message identifies level 6.
- direct parent bridge completes `6 -> 7`.
- fallback postMessage completes `6 -> 7`.
- browser regression validates both paths.

## SHARED DEPENDENCIES / RISK

N6 is generated from the N5 programming shell before the late GC N5 adapter is applied. It also sits in a build chain shared with N7 and several historical programming patches.

Risks for a future N6 control implementation:

1. rewriting shared N5/N6/N7 builders can alter frozen N5 or downstream N7;
2. inherited game UI/audio/help behavior is distributed across multiple legacy patches;
3. generated HTML is not itself the source-of-truth file;
4. a broad shared-patch rewrite would make regression attribution difficult.

Preferred future architecture after explicit `IMPLEMENT N6 CONTROL` authorization:

- late, N6-local adapter after the exact generated N6 baseline is verified;
- exact frozen N1–N5 regressions before and after;
- exact N7 generated parity;
- no shared patch rewrite unless separately reviewed.

If a future implementation cannot remain N6-local and requires a shared rewrite, stop for review rather than modifying frozen/downstream semantics implicitly.

## OPEN GAPS

1. `N6_PERSISTENCE = NOT DEMONSTRATED` for intermediate/reload state.
2. `N6_TERMINAL_IDEMPOTENCY = NOT DEMONSTRATED`.
3. `N6_RESEARCH_TELEMETRY = PARTIAL` until terminal one-shot and refresh semantics are proven.
4. No numeric scientific measurement/value is demonstrated; the current result is qualitative.
5. GE help/guide explicitly scaffolds the scientific order and must be reconsidered for GC answer leakage.
6. Participant-facing N6 is still WebGL/AYNI/game-layer heavy and therefore not yet an active-control condition.
7. Global `BUILD_ID` in `src/main.ts` still reads `2026.09.09-control-n4-active`; this is a stale build label, not an N6 scientific-contract fact. It was not modified during audit.

## AUDIT CONCLUSION

The real N6 baseline is reconstructable and internally coherent:

- two physical checkpoints are real;
- ESCANEAR -> ANALIZAR -> ENVIAR DATOS is a causal scientific dependency, not a literal-only program;
- movement and REPETIR permit multiple valid full programs;
- final position at the communication point is required;
- error/correction behavior is real and should be preserved;
- N6 has installed, privacy-filtered telemetry but research telemetry is only PARTIAL because terminal one-shot and refresh continuity are not demonstrated;
- N6 persistence is NOT DEMONSTRATED;
- the presentation remains game-based and must be flattened/neutralized only in a separately authorized implementation phase.

No N6 runtime, control adapter, CSS, telemetry bridge, persistence adapter, N6 control E2E, participant screenshot, N7 runtime, frozen checkpoint, main branch, Vercel configuration, production deployment, or experimental repository content was modified by this audit.

`N6_IMPLEMENTATION_STATUS = NOT STARTED`

`N6_IMPLEMENTATION_AUTHORIZED = NO`

`STOP = REACHED`
