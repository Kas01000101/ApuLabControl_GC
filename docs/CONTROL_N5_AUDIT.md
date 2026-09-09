# CONTROL N5 AUDIT · SIMPLIFICAR · BUCLES

> Audit-only research document. N5 control implementation is **not authorized** in this phase.

## STATUS

- `N4_FREEZE_STATUS = FROZEN`
- `N4_FREEZE_SHA = b9178428d31e4b608457b3c7af103d723da92781`
- `N5_AUDIT_STATUS = COMPLETE`
- `N5_BASELINE_STATUS = VERIFIED / GAPS DOCUMENTED`
- `N5_IMPLEMENTATION_STATUS = NOT STARTED`
- `N5_IMPLEMENTATION_AUTHORIZED = NO`
- `N5_ONLY_VALID_PROGRAM = NO`
- `N5_PERSISTENCE = NOT DEMONSTRATED`
- `N5_RESEARCH_TELEMETRY = PARTIAL / NOT RESEARCH-GRADE`
- `N5_PRIVACY = NOT DEMONSTRATED`
- `N5_IDEMPOTENCY = NOT DEMONSTRATED`
- `VERCEL = DISCONNECTED`
- `MERGE = NO`
- `PRODUCTION_DEPLOY = NO`

Verified generated baseline:

- N5 generated SHA-256: `8b0f0740fafd3022870d95291074aeff652e95fe3322671bf110bf138de578e8`
- Validation run: `34298272112`
- N5/N6/N7 downstream regression: PASS on N4 frozen candidate SHA `b9178428d31e4b608457b3c7af103d723da92781`

---

## SOURCE MAP

N5 is generated through the shared Mission 01 programming chain and then specialized by N5-local patches. Material N5 patches include:

- `scripts/patch-mission01-level5-single-challenge.mjs`
- `scripts/patch-mission01-level5-no-repeat-glow.mjs`
- `scripts/patch-mission01-level5-final-loops.mjs`
- `scripts/patch-mission01-level5-goal-position.mjs`
- `scripts/patch-mission01-level5-goal-runtime.mjs`

The final N5 transformation is intentionally N5-local and verifies that N1–N4 and N6–N7 remain unchanged while its goal-position patch is applied.

Because N5 still shares legacy programming infrastructure with other levels, a future control transformation should prefer a **late N5-local adapter** rather than rewriting shared patches.

If a future N5 implementation appears to require a shared patch that can alter N1–N4 or N6–N7, stop and review the dependency before writing.

---

## VERIFIED SCIENTIFIC TASK CONTRACT

### Grid and route

Internal coordinates are zero-based.

- `GRID_ROWS = 8`
- `GRID_COLUMNS = 8`
- `START_ROW = 6`
- `START_COLUMN = 0`
- `INITIAL_ORIENTATION = EAST` (`dir = 1` in the inherited movement model)
- `GOAL_ROW = 3`
- `GOAL_COLUMN = 6`
- `BLOCK_LIMIT = 30` editor steps

Final obstacle cells from the verified N5 stage:

```text
(r2,c0)
(r3,c3)
(r4,c7)
(r4,c1)
(r2,c2)
(r1,c4)
(r3,c5)
(r5,c2)
(r2,c6)
```

The goal was deliberately moved from G1 to G4, i.e. three rows downward while keeping column G, and the former obstacle blocking the pedagogical route on row 7 was moved so that the reference route is clear.

### Commands

Initial command set:

- `forward` → AVANZAR
- `left` → GIRAR IZQ.
- `right` → GIRAR DER.

After the first successful route:

- `repeat` → REPETIR × N

REPETIR starts hidden/locked and is unavailable during the first solution.

### Reference long solution

The existing physical E2E uses:

```text
forward × 6
left
forward × 3
```

Equivalent sequence:

```text
forward, forward, forward, forward, forward, forward,
left,
forward, forward, forward
```

This is 10 executable blocks and reaches the same N5 goal at `(r3,c6)`.

### Reference compact solution

The existing E2E then constructs:

```text
REPETIR × 6 { forward }
left
REPETIR × 3 { forward }
```

Under N5's research counting function, a repeat container plus its one body instruction contributes 2 executable blocks, so this reference compact representation is counted as 5 executable blocks.

### Success semantics

N5 is a two-phase task:

```text
PHASE 1
construct route without REPETIR
→ execute
→ reach goal
→ record initial program size
→ show repeated pattern
→ unlock REPETIR

PHASE 2
reconstruct / refactor route using REPETIR
→ execute
→ reach the same goal
→ require REPETIR to be present
→ require final executable-block count < initial executable-block count
→ complete N5
```

Therefore:

- the first successful route does **not** complete N5;
- REPETIR must be used in the final route;
- the final program must be shorter than the participant's own first successful program;
- exact final orientation is not part of the completion gate;
- exact literal canonical sequence is not required;
- exact `10 → 5` is a reference E2E, not an only-valid-program requirement;
- `N5_ONLY_VALID_PROGRAM = NO`.

A repeat-containing program that reaches the goal but is not shorter than the initial program is explicitly rejected as incomplete.

---

## TASK CORE

The construct to preserve in a future GC transformation is:

```text
build a working non-loop solution
→ observe repetition in the successful sequence
→ acquire REPETIR
→ refactor the same route with a loop
→ compare before/after program size
→ execute the shorter program successfully
```

The active participant action is essential. N5 must not become a passive explanation of loops or a multiple-choice recognition task.

The scientific comparison is the participant's **own before/after program**, not a forced canonical answer.

---

## CURRENT PRESENTATION / GAME LAYER

Current N5 is still GE-style game presentation. It includes:

- Three.js/WebGL board;
- AYNI rover;
- 3D obstacles;
- animated movement/turn execution;
- flag/goal game object;
- `EXPLORAR`;
- `BITÁCORA`;
- fixed four-step game-styled guide;
- animated/static pattern highlighting inside the program;
- contextual visual attention on REPETIR after the first route;
- game audio/SFX inherited from the programming shell;
- success overlay/reward presentation.

### Important repeat-attention finding

The legacy `is-new` repeat animation and legacy arrow are removed from the final runtime, but the current baseline still applies a **contextual REPETIR attention state after the first successful route** via `level5-repeat-ready` and related focus styling.

Therefore the verified current GE baseline is:

- REPETIR hidden before first success;
- no REPETIR attention before first success;
- pattern is highlighted after first success;
- REPETIR becomes visible/unlocked after pattern recognition;
- REPETIR receives contextual attention until first use;
- the old separate arrow is absent in the final-loop runtime.

This is a presentation characteristic, not a scientific requirement.

---

## FUTURE CONTROL CLASSIFICATION

| Component | Classification | Rationale |
|---|---|---|
| 8×8 route logic | KEEP | Defines the same planning problem. |
| Start / goal / obstacles | KEEP | Required content matching. |
| `forward/left/right` semantics | KEEP | Core sequencing primitives. |
| REPETIR hidden in phase 1 | KEEP | Required discovery progression. |
| First working program | KEEP | Baseline for within-task refactoring. |
| Pattern recognition | KEEP | Core loop concept. |
| REPETIR in phase 2 | KEEP | Core loop abstraction. |
| Final program shorter than first | KEEP | Defines simplification construct. |
| Exact canonical program | DO NOT REQUIRE | Current runtime allows multiple solutions. |
| AYNI 3D rover | REMOVE / REPLACE | Replace with neutral state/orientation marker. |
| WebGL movement | FLATTEN | Preserve state transitions without game animation. |
| 3D obstacles/flag | FLATTEN | Neutral 2D blocked cells and target. |
| Pattern cue | KEEP / NEUTRALIZE | Preserve recognition signal without game reward effects. |
| REPETIR glow/attention | NEUTRALIZE / REMOVE | Not required by task semantics. |
| EXPLORAR | REMOVE | Game/tutorial layer. |
| Fixed game guide | REPLACE | Neutral AYUDA; preserve concepts, avoid solution leakage. |
| BITÁCORA reward framing | REMOVE / REPLACE | Research summary may remain neutrally. |
| Audio / SFX | REMOVE / NEUTRALIZE | Not required for loop reasoning. |
| Success reward layer | REPLACE | Neutral completion state. |
| N5 → N6 navigation | KEEP | Required study progression. |

---

## PERSISTENCE

Current N5 writes learned-state flags:

- `apulab.level5.repeatUnlocked`
- `apulab.repeat.learned`

and stores inline telemetry in session storage.

However, this audit does not demonstrate refresh-safe restoration of:

- the current partial program;
- the first successful long program;
- `initialBlockCount`;
- current phase (`discover` / `compress`);
- pattern-shown state;
- repeat-use state;
- attempts / edits;
- final compact program;
- completed overlay / terminal state.

The runtime state object is initialized in memory on page load, and no N5 control persistence adapter is installed.

Therefore:

`N5_PERSISTENCE = NOT DEMONSTRATED`

A future implementation must test refresh at least during: partial phase-1 program, post-first-success/pre-repeat, partial phase-2 refactor, and completed state.

---

## TELEMETRY

N5 already has useful inline behavioral telemetry. Observed events include:

- `level_started`
- `program_started`
- `program_modified`
- `initial_program_completed`
- `pattern_highlighted`
- `repeat_unlocked`
- `repeat_added`
- `repeat_count_changed`
- `block_moved_into_repeat`
- `program_refactored`
- `goal_reached`
- `level_completed`

The runtime also records variables such as:

- participant/session identity;
- attempt number;
- program edit count;
- blocks before;
- blocks after;
- block reduction;
- reduction percentage;
- repeat count;
- repeat instances;
- time to repeat unlock;
- completion time.

These are strong candidates for the eventual N5 research contract because they directly characterize loop discovery and refactoring behavior.

### Research-grade gap

`src/main.ts` installs control telemetry bridges for N1, N2, N3 and N4, plus existing N6/N7 bridges. It does **not** install a Level 5 control telemetry bridge.

The N5 inline runtime reads `apulab.study.participant_id` directly and posts the event payload to the parent. This audit does not demonstrate the same explicit privacy sanitization, schema enforcement, terminal idempotency, or research bridge behavior already required for frozen control levels.

Therefore:

- `N5_RESEARCH_TELEMETRY = PARTIAL / NOT RESEARCH-GRADE`
- `N5_PRIVACY = NOT DEMONSTRATED`
- `N5_IDEMPOTENCY = NOT DEMONSTRATED`

The in-memory `completed` and `level5RefactorEventSent` guards reduce duplicate events within one page lifetime, but they are not evidence of refresh-safe terminal idempotency.

---

## RESEARCH OUTCOME INTERPRETATION

N5 telemetry is **task-performance telemetry**, not automatically a generalized learning-transfer measure.

Appropriate within-task measures include:

- first successful program size;
- final loop-based program size;
- absolute and percentage reduction;
- attempts before first success;
- attempts after REPETIR unlock;
- number of edits during refactor;
- whether REPETIR was used;
- repeat multiplicity;
- time to first successful route;
- time from first success to valid compact solution.

Because the participant's first program can vary, analyses should retain both `blocks_before` and `blocks_after` rather than interpreting `blocks_after` alone.

---

## RISK

### High

- forcing the 10-block reference solution as the only valid first program;
- forcing the 5-block reference compact solution as the only valid final program;
- allowing REPETIR before the participant has produced a working non-loop solution;
- removing the before/after comparison and reducing the task to “use a loop once”;
- changing route geometry while converting presentation;
- treating inline telemetry as already privacy/idempotency-complete.

### Medium

- keeping a strong REPETIR glow in GC, which would alter salience relative to a neutral active-control condition;
- over-highlighting the repeated run and leaking the compact solution rather than supporting recognition;
- changing executable-block counting semantics during the control rewrite;
- restoring learned REPETIR across refresh in a way that accidentally skips phase 1 for a new research attempt.

### Low

- visual labels and non-scientific copy differences that do not alter task logic, provided the final GC remains neutral and active.

---

## FUTURE N5 CONTROL IMPLEMENTATION — NOT AUTHORIZED YET

If a later prompt explicitly authorizes `IMPLEMENT N5 CONTROL`, the preferred sequence is:

```text
verify research/control-active HEAD
→ verify research/control-n4-freeze exact SHA
→ run frozen N1/N2/N3/N4 regressions
→ lock N5 baseline hash and scientific contract
→ implement late N5-local adapter
→ flatten to neutral 2D active control
→ preserve phase 1 non-loop solution
→ preserve pattern recognition
→ preserve phase 2 REPETIR refactor
→ preserve shorter-than-own-baseline criterion
→ add persistence
→ add research telemetry bridge
→ privacy
→ idempotency
→ N5→N6
→ downstream N6/N7 regressions
→ same-head screenshots
→ manual visual QA
→ freeze N5 only after every gate passes
```

Do not implement N5 during this audit-only phase.

---

## AUDIT CONCLUSION

`N5_AUDIT = COMPLETE`

The verified N5 scientific core is **working sequence → detect repetition → refactor with REPETIR → produce a shorter successful program on the same route**. The current runtime allows multiple valid solutions and uses the participant's own first solution as the comparison baseline.

No N5 runtime, telemetry bridge, persistence adapter, E2E, or participant-facing presentation was modified by this audit.

`N5_IMPLEMENTATION = NOT STARTED`

`STOP = REACHED`
