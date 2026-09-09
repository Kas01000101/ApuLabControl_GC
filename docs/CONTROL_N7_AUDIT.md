# CONTROL N7 AUDIT — VERIFIED GENERATED BASELINE ONLY

## STATUS

- `N7_AUDIT_STATUS = COMPLETE`
- `N7_BASELINE_STATUS = VERIFIED / GAPS DOCUMENTED`
- `N7_IMPLEMENTATION_STATUS = NOT STARTED`
- `N7_IMPLEMENTATION_AUTHORIZED = NO`
- `N7_CONTROL_ADAPTER = NOT CREATED`
- `N7_CONTROL_CSS = NOT CREATED`
- `N7_CONTROL_TELEMETRY_BRIDGE = NOT CREATED`
- `N7_CONTROL_E2E = NOT CREATED`
- `N7_CONTROL_SCREENSHOTS = NOT CREATED`
- `N7_RESEARCH_TELEMETRY = PARTIAL / BEHAVIORAL BASELINE PRESENT`
- `N7_PARTIAL_PERSISTENCE = NOT DEMONSTRATED`
- `N7_TERMINAL_IDEMPOTENCY = NOT DEMONSTRATED`
- `N7_LEVEL_STARTED_IDEMPOTENCY = NOT DEMONSTRATED`
- `N7_ONLY_VALID_PROGRAM = NO`
- `N7_REPEAT_REQUIRED = NO`
- `N8 = DOES NOT EXIST`

This document is audit-only. It records the real generated Study Build baseline in `Kas01000101/ApuLabControl_GC` and does not create or modify participant-facing N7 behavior.

## FROZEN PRECONDITIONS

The audit was opened only after N6 had passed full same-head validation and Visual QA and was frozen.

- N1 frozen: `b717a70b685f382044276b7a30bec5b556e94e9c`
- N2 frozen: `dbb60df8f509aa0fe461db015445b28d0e78b5cc`
- N3 frozen: `a150e2039a5f35c6dabb6bb8cb6eed8ca6d9532e`
- N4 frozen: `b9178428d31e4b608457b3c7af103d723da92781`
- N5 frozen: `ef2da8c90773f3c3b79c4e7a0f1576a801bd3283`
- N6 frozen: `6fc3288fbb533e1ed841e31748d3bb44c50daa65`
- N6 freeze ref: `research/control-n6-freeze`
- N6 PR: `#7`, DRAFT / OPEN / NO MERGE
- N6 successful validation run: `34314251401`
- N6 evidence artifact: `10089688009`
- N6 evidence SHA-256: `ac5393e68224df1cf2838ffe8635f328b634f54120460bce0f248dc664324b3f`

An exact N6 frozen-regression workflow is active on `research/control-active` and compares N6 participant/runtime artifacts against `origin/research/control-n6-freeze` before any future N7 implementation work.

## GENERATED BASELINE HASH

- `N7_BASELINE_HASH = 03e125bf9bb41f960039343a652dad358060a271c1c1050b61347f59d4e02eca`

The N7 exact-parity gate passed on the N6 freeze candidate and again when the N6 frozen regression was activated. `public/missions/mission01/level7.html` is generated during `prepare:missions`; it is not a committed source-of-truth file. The hash above is therefore the generated-runtime baseline lock.

## SOURCE MAP

### Configuration

- `scripts/config/mission01-level7.mjs`
  - identity, geometry, scientific question scaffolding, instrument options, obstacles, Explore states, fixed guide.

### Generation / patch chain

1. `scripts/build-mission01-level7-from-level5.mjs`
   - reconstructs N7 from the programming shell;
   - marker: `APULAB_LEVEL7_FROM_LEVEL5_V1`;
   - establishes the N7 board/editor/AYNI architecture.
2. `scripts/patch-mission01-level7-render-loop.mjs`
3. `scripts/patch-mission01-level7-accessibility.mjs`
4. `scripts/patch-mission01-level7-sample-sensors.mjs`
5. `scripts/patch-mission01-level7-sensor-ui-lifecycle.mjs`
6. `scripts/patch-mission01-level7-remove-repeat-residue.mjs`
7. `scripts/patch-mission01-level7-instrument-choice-v2.mjs`
   - replaces the old sensor/equip flow with the scientific instrument-choice task;
   - adds behavioral study telemetry and final-point gating.
8. `scripts/patch-mission01-level7-interaction-finalize.mjs`
   - normalizes click/drag/keyboard interaction;
   - makes N7 terminal and forbids any fake level 8.
9. `scripts/patch-mission01-level7-module-scope.mjs`
10. `scripts/patch-mission01-level7-final-gdd.mjs`
    - canonical final labels, fixed five-step guide, two visible checkpoints, canonical telemetry names.
11. `scripts/patch-mission01-level7-final-labels.mjs`

Later N5 stabilization and GC adapters for frozen N3–N6 run after the N7 chain. The current N6 frozen regression proves those late control adapters do not change the N7 generated hash.

### Existing N7 audits

- `scripts/audit-mission01-level7-instrument-choice.mjs`
- `scripts/audit-mission01-level7-final-gdd.mjs`
- `scripts/audit-mission01-level7-n5-parity.mjs`
- `scripts/audit-mission01-level67-shell.mjs`
- `scripts/audit-mission01-full-seven.mjs`

### Browser contract

- `tests/e2e/mission01-level7-contract.cjs`
  - validates final identity;
  - fixed guide;
  - two checkpoints;
  - exactly three instruments;
  - graceful invalid-position failure;
  - non-relevant and relevant data;
  - strategy changes;
  - materials-first success;
  - success with and without `REPETIR`;
  - terminal no-N8 behavior;
  - canonical telemetry event presence.

### Telemetry

- `src/systems/Level7TelemetryBridge.ts`
- installed by `src/main.ts`
- shared services:
  - `src/systems/TelemetryService.ts`
  - `src/systems/GameState.ts`

The parent bridge accepts only same-origin messages from a Mission 01 iframe and only allowlisted N7 event names. It replaces incoming `participant_id` and `session_id` with trusted `GameState` values.

### Navigation / terminal behavior

- `src/ui/Mission01Screen.ts`
  - Mission 01 has exactly seven available levels;
  - a level-complete request from level 7 is not allowed to advance because level 7 is terminal.
- N7's own final action emits `apulab-mission-complete` and disables the terminal CTA.
- No `level8.html`, `nextLevel:8`, or `CONTINUAR AL NIVEL 8` is permitted by the final audits.

## SCIENTIFIC TASK CONTRACT

### Identity

- Level: `7 / 7`
- Title: `LA MUESTRA DESCONOCIDA`
- Subtitle: `ELIGE EL INSTRUMENTO SEGÚN EL DATO QUE NECESITAS.`
- Initial objective: `PASO 1 · LLEVA AYNI A LA MUESTRA`
- Scientific question shown by the selector: `Necesitamos saber de qué material está hecha esta piedra. ¿Qué instrumento es el más indicado?`

### Board geometry

Coordinates below are zero-based.

- Grid: inherited programming grid `8 × 8`
- Start: `row 7, column 1`
- Initial orientation: `NORTH`
  - config stores `dir: 0`;
  - the browser-validated path confirms NORTH behaviorally.
- Sample: `row 2, column 5`
- Final point: `row 6, column 6`
- Obstacles in config are stored as `[column,row]`:
  - `[3,6]` -> `r6c3`
  - `[0,5]` -> `r5c0`
  - `[7,4]` -> `r4c7`
  - `[2,1]` -> `r1c2`

The rover does **not** need to occupy the sample cell. `ANALIZAR MUESTRA` requires Manhattan adjacency to the sample (`distance == 1`).

## AVAILABLE PROGRAM ACTIONS

Movement / control:

- `AVANZAR`
- `GIRAR IZQ.`
- `GIRAR DER.`
- `REPETIR × N`

Science:

- `ANALIZAR MUESTRA`

N6 commands are explicitly absent from final N7:

- no `LEER SENSOR` / `read`;
- no `REGISTRAR DATO` / `record`;
- no `ENVIAR DATOS` / `send`.

`REPETIR` is available from the start and is optional. N7 has no repeat unlock/tutorial requirement.

## INSTRUMENT DECISION CONTRACT

Exactly three instrument options are shown when `ANALIZAR MUESTRA` executes adjacent to the sample.

### TEMPERATURA

- reading: `−58 °C`
- scientific interpretation: valid temperature datum;
- relevance to the stated material-composition question: `false`;
- soft feedback explains that temperature does not establish composition.

### PROXIMIDAD

- reading: `0.4 m`
- scientific interpretation: valid distance/proximity datum;
- relevance to the stated material-composition question: `false`;
- soft feedback explains that distance does not establish contained materials.

### ANALIZADOR DE MATERIALES

- reading/result:
  - `HIERRO`
  - `SILICATOS`
- relevance to the stated material-composition question: `true`.
- selecting this instrument unlocks progression to the final point.

The final baseline deliberately does not use `CORRECTO`, `INCORRECTO`, `RESPUESTA EQUIVOCADA`, or loss language. Non-relevant choices return valid-but-not-useful scientific feedback and permit a strategy change.

Instrument descriptions themselves state what each instrument measures. This is part of the verified baseline difficulty and must not be strengthened or weakened asymmetrically if a future GC adaptation is authorized.

## REQUIRED SCIENTIFIC / TASK FLOW

The causal task flow is:

1. Construct a movement/science program.
2. Reach a cell adjacent to the unknown sample.
3. Execute `ANALIZAR MUESTRA` while adjacent to the sample.
4. Choose one of three instruments.
5. Observe the datum/result.
6. If the datum does not answer the material question, optionally change instrument and inspect another datum.
7. Obtain the relevant materials result (`HIERRO`, `SILICATOS`).
8. Reach the final point at `r6c6`.
9. Complete Mission 01.

Consequently:

- `ANALYZE_AWAY_FROM_SAMPLE = INVALID`
- invalid sample-position execution preserves the program and produces a graceful correction state;
- `TEMPERATURE = VALID_DATA / NOT_SUFFICIENT_FOR_QUESTION`
- `PROXIMITY = VALID_DATA / NOT_SUFFICIENT_FOR_QUESTION`
- `MATERIALS = RELEVANT_DATA`
- `MATERIALS_FIRST = VALID_PATH`
- trying all three instruments is **not** required;
- `REPETIR` is **not** required;
- an exact full movement program is **not** required;
- N7 has no next gameplay level.

## REFERENCE PROGRAMS VS SUCCESS SEMANTICS

Existing E2E validates a no-repeat route and an alternate successful route using one `REPETIR` block.

The no-repeat test reaches sample adjacency using:

`forward, forward, forward, forward, right, forward, forward, forward, forward, analyzeSample`

After obtaining relevant materials data, it reaches the final point with:

`forward, right, forward, forward, forward`

These sequences are reference programs, not the success definition.

Therefore:

- `N7_ONLY_VALID_PROGRAM = NO`
- `N7_REPEAT_REQUIRED = NO`
- `N7_MATERIALS_FIRST_VALID = YES`
- `N7_STRATEGY_CHANGE_VALID = YES`

## SUCCESS CRITERION

Final gameplay success requires both:

- `relevantInstrumentUsed == true`; and
- rover physically at the final point.

The final GDD audit explicitly locks the victory gate to relevant data plus final-point position. `REPETIR`, trying every instrument, or reproducing the reference route are not success criteria.

After success:

- completion overlay becomes visible;
- final CTA is `FINALIZAR MISIÓN`;
- activating it changes the CTA to `MISIÓN COMPLETADA` and disables it;
- N7 emits semantic mission completion;
- no N8 navigation is created.

## ATTEMPT DEFINITION

The baseline increments `attemptCount` only after structural runnable-program checks:

- empty program -> no attempt;
- `REPETIR` with an empty body -> no attempt;
- structurally runnable non-empty program -> `attemptCount += 1` and `program_started`.

This is a useful baseline for a future study adapter, but current N7 does not expose the same terminal attempt schema as frozen GC levels N3–N6.

## ERROR / CORRECTION BASELINE

Current N7 provides active correction behavior:

- collision / blocked path -> offending program location highlighted;
- edge failure -> offending block highlighted;
- `ANALIZAR MUESTRA` away from sample -> graceful scientific-position error;
- failed program is preserved;
- main action changes to `AJUSTAR PROGRAMA`;
- a subsequent action returns the editor to a modifiable state.

Existing N7 E2E physically proves the analyze-away-from-sample preservation path. It does not define a research-grade error/correction telemetry schema comparable to frozen GC N4/N6.

## TELEMETRY BASELINE

Canonical final runtime event names include:

- `level_started`
- `program_started`
- `program_modified`
- `sample_reached`
- `sample_analyze_requested`
- `instrument_modal_opened`
- `instrument_selected`
- `sample_analyzed`
- `instrument_changed`
- `relevant_instrument_selected`
- `final_point_reached`
- `explore_opened`
- `bitacora_opened`
- `level_completed`

Behavioral metrics present in the baseline include, depending on event:

- instrument type;
- selection order;
- whether the datum is relevant to the question;
- first instrument;
- final instrument;
- instrument selection count;
- instrument change count;
- `changed_after_irrelevant_feedback`;
- time to first choice;
- time to relevant choice;
- help-before-relevant-choice;
- program edit count;
- completion time;
- `used_repeat_n7`;
- `repeat_instances_n7`.

The browser contract validates the presence of canonical events and validates `instrument_selected` relevance metadata.

## TELEMETRY / PRIVACY GAPS

The existing N7 parent bridge is a GE/baseline bridge, not a GC research adapter.

Verified safeguards:

- same-origin message required;
- message source must be a Mission 01 iframe;
- event name must be allowlisted;
- incoming participant/session IDs are discarded and replaced with trusted `GameState` identity.

Not demonstrated / not yet standardized for future GC:

- no explicit `condition: 'control'` tagging;
- no broad prohibited-identity-field sanitizer equivalent to the frozen control bridges;
- no terminal payload with the complete frozen-control schema (`attempt_count`, `first_attempt_success`, `final_success`, `response_change_count`, etc.);
- no dedicated control telemetry message type;
- no privacy E2E for N7.

The current runtime payloads observed in the N7 source are behavioral, not free-text participant identity data, but a future GC implementation must still add the same explicit privacy contract used by frozen control levels.

## PERSISTENCE BASELINE / GAPS

Explicit N7-specific persistence observed at terminal success includes:

- `apulab.level7.finalProgram`
- `apulab.level7.instrumentMetrics`
- `apulab.mission01.completed`

Telemetry is stored in `sessionStorage` under `apulab.level7.telemetry` before being bridged to the parent.

The current N7 browser contract does **not** reload the page to validate restoration of:

- partial program;
- rover position;
- sample checkpoint;
- instrument selector state;
- readings history;
- first/final instrument state;
- relevant-data state;
- final-point state;
- error/correction state;
- completed overlay.

Therefore:

- `N7_PARTIAL_PERSISTENCE = NOT DEMONSTRATED`
- `N7_COMPLETION_RESTORE_AFTER_REFRESH = NOT DEMONSTRATED`

This audit does not infer PASS from terminal localStorage keys alone.

## IDEMPOTENCY GAPS

Current N7 E2E does not reload after completion and does not deliberately invoke terminal completion twice.

The N7 runtime records `level_started` during initialization and the audited baseline does not expose the explicit persisted initialization/terminal guards used by frozen GC levels.

Therefore:

- `N7_LEVEL_STARTED_IDEMPOTENCY = NOT DEMONSTRATED`
- `N7_TERMINAL_IDEMPOTENCY = NOT DEMONSTRATED`

A future GC implementation must test these explicitly rather than replaying telemetry after refresh.

## PRESENTATION BASELINE — NOT A CONTROL CONDITION

Current N7 is intentionally game-like and uses the shared GE programming shell. The generated baseline includes, among other elements:

- Three.js / WebGL board;
- visible AYNI rover;
- animated checkpoint/beacon effects;
- fixed five-step guide;
- Explore and Bitácora interactions;
- success music;
- confetti / celebratory completion behavior;
- glowing/pulsing checkpoint presentation.

This is valid as the audited N7 baseline but is **not** yet a GC participant-facing presentation.

If N7 GC implementation is later authorized, it must preserve scientific/task difficulty while adapting presentation to the established control condition:

- flat 2D;
- neutral;
- active, not passive;
- no visible AYNI/WebGL;
- no confetti/reward effects;
- no celebratory audio;
- no game glow;
- no answer-revealing help;
- same question, data, instrument alternatives, causal constraints, success semantics, and comparable interaction demand.

## FUTURE GC COMPARABILITY CONTRACT — DOCUMENTED ONLY

No implementation is authorized by this audit. If implementation is later authorized, the minimum scientific comparability contract is:

- same 8×8 task geometry unless a separately approved study decision changes both arms;
- same start/sample/final-point logic;
- same three instruments;
- same exact observed data (`−58 °C`, `0.4 m`, `HIERRO`, `SILICATOS`);
- same material-composition question;
- same rule that temperature/proximity are valid but non-relevant data;
- same materials result as relevant evidence;
- same ability to change strategy after non-relevant feedback;
- materials-first remains valid;
- exact full program not required;
- `REPETIR` optional;
- same relevant-data + final-point success gate;
- terminal Mission 01 behavior with no N8.

Implementation should be a late N7-local adapter over the exact verified generated baseline. A shared builder rewrite that could alter frozen N1–N6 would require separate review and must not be used opportunistically.

## AUDIT CONCLUSION

`N7_BASELINE = VERIFIED`

`N7_SCIENTIFIC_QUESTION = VERIFIED`

`N7_INSTRUMENT_OPTIONS = VERIFIED`

`N7_DATA_VALUES = VERIFIED`

`N7_RELEVANT_DATA_GATE = VERIFIED`

`N7_MULTIPLE_VALID_STRATEGIES = VERIFIED`

`N7_REPEAT_OPTIONAL = VERIFIED`

`N7_TERMINAL_NO_N8 = VERIFIED`

`N7_RESEARCH_TELEMETRY = PARTIAL / GAPS DOCUMENTED`

`N7_PARTIAL_PERSISTENCE = NOT DEMONSTRATED`

`N7_TERMINAL_IDEMPOTENCY = NOT DEMONSTRATED`

`N7_LEVEL_STARTED_IDEMPOTENCY = NOT DEMONSTRATED`

`N7_CONTROL_PRESENTATION = NOT IMPLEMENTED`

`N7_IMPLEMENTATION_STATUS = NOT STARTED`

`N7_IMPLEMENTATION_AUTHORIZED = NO`

`N7_AUDIT_STATUS = COMPLETE`

**STOP after this audit. No N7 control implementation is authorized in this phase.**
