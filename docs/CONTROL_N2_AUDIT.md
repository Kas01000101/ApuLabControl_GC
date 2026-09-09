# ApuLab Control GC · N2 Source / Methodology Audit

## Audit status

```text
N2_AUDIT_STATUS = COMPLETE
N2_IMPLEMENTATION_STATUS = NOT_AUTHORIZED
N2_SOURCE_PARITY = BLOCKED
N1_CONTROL_STATUS = FROZEN
N1_CONTROL_FROZEN_SHA = b717a70b685f382044276b7a30bec5b556e94e9c
```

This document is an **audit only**. It does not implement, patch, restyle, reconfigure, or freeze N2.

Experimental source used read-only:

```text
Kas01000101/ApuLabStationGame
2f94e9e701172ab455767757225110606b983597
```

Control baseline:

```text
Kas01000101/ApuLabControl_GC
main = 2e53ea7d35757b0a6dbb4ab5fc2b655bffbd4294
working branch = research/control-active
```

No write to `Kas01000101/ApuLabStationGame` is required or permitted by this audit.

---

## 1. Competence that N2 must preserve

The experimentally relevant task is not a voltage quiz and is not a COM/VΩ quiz.

```text
OBSERVE / MEASURE THREE ALTERNATIVES
        ↓
REGISTER EACH MEASUREMENT
        ↓
COMPARE THE THREE RESULTS
        ↓
APPLY THE SCIENTIFIC CRITERION / RANGE
        ↓
SELECT A CANDIDATE
```

Required properties for any later GC transformation:

- three distinct battery alternatives remain observable/measurable;
- all three measurements must exist before the final decision;
- the participant can make a wrong final choice and correct it;
- the scientific values and accepted candidate must come from one frozen scientific source of truth;
- N2 must remain an active task, not a form or passive slide;
- N1 concepts (`V⎓`, `COM`, `VΩ`) must not become new evaluated questions in N2.

---

## 2. Real N2 source map

### 2.1 Packed canonical source

The current experimental tree stores N2 as five packed source fragments:

```text
src/missions/mission01/final/level2/
  part00.b64   8000 bytes
  part01.b64   8000 bytes
  part02.b64  16000 bytes
  part03.b64  16000 bytes
  part04.b64  11808 bytes
```

The level2 source directory tree in the frozen experimental snapshot is:

```text
aae0feff0d62b1f941313e6db7b92a9d225b95c5
```

These fragments are concatenated, base64-decoded and gunzipped by the Mission 01 builder. They are the source from which the generated N2 HTML originates; `public/missions/mission01/level2.html` is a generated artifact, not an independent canonical source to edit by hand.

### 2.2 Build entry points

Relevant build chain:

```text
package.json
  npm run prepare:missions
        ↓
scripts/build-mission01-seven-source.mjs
        ↓
scripts/build-mission01.mjs (historical template)
        ↓
unpack level2 part*.b64
        ↓
patchLevel2()
        ↓
public/missions/mission01/level2.html
        ↓
N2-specific + shared post-build patches
        ↓
stabilize-mission01-runtime.mjs
        ↓
static Mission 01 audits
```

`patchLevel2()` in the historical builder is intentionally small: it updates level numbering and the Three.js version. The scientific/interactivity core remains in the packed N2 source and later patches mutate presentation/help/integration around it.

The builder historically verifies an N2 generated stage with:

```text
sha256 = e6a93e42ddb2d3e561b09d95ae4416f8d9b1dd0e03e77d16b8891e7d2be3f29c
bytes  = 206358
```

That value is a pipeline-stage integrity contract, not a declaration of the final post-patch Study Build HTML hash.

---

## 3. N2 patch pipeline and ownership

### N2-specific patches

| File | Current responsibility | Audit classification for future GC |
|---|---|---|
| `patch-mission01-level2-optional-explore.mjs` | enables gameplay immediately; EXPLORAR/GUÍA optional; journal initially hidden; choice mode initially off | **NEUTRALIZE / KEEP semantics** |
| `patch-mission01-level2-guide.mjs` | reads `measuredValues.size`; injects progressive 3-step guide; adds guide tick SFX | **KEEP conceptual help / REMOVE SFX / FLATTEN presentation** |
| `repair-mission01-level2-guide-syntax.mjs` | rebuilds the native N2 guide block; uses measurement count and measurement state | **KEEP conceptual state logic / REPLACE game checklist presentation** |
| `patch-mission01-level2-explore-yellow-final.mjs` | yellow game-attention presentation for EXPLORAR | **REMOVE / NEUTRALIZE** |
| `patch-mission01-level23-primary-audio.mjs` | yellow primary styling and UI click sounds; then chains N2 guide patch | **REMOVE game styling/audio; preserve no task-core mutation** |
| `patch-mission01-level12-auto-guide.mjs` | historical Explore→Guide transition; later optional-explore patch supersedes mandatory gating | **REMOVE mandatory/game sequence; KEEP help optionality** |

### Shared patches that can affect N2

N2 also passes through shared Mission 01 patching for help lifecycle, guide visibility, native guide checklist, optional help, transition cleanup, runtime identity, celebration, and final stabilization.

High-risk dependency:

```text
patch-mission01-level1-audio-boost.mjs
        ↓ imports
patch-mission01-level23-primary-audio.mjs
        ↓ imports
patch-mission01-level2-guide.mjs
```

Therefore a later N2 control transformation must **not** casually delete/reorder shared pipeline scripts. The preferred strategy is an N2-local adapter/patch applied late enough to observe the stabilized N2, while the N1 frozen regression contract remains mandatory.

---

## 4. Generated HTML / CSS / JS architecture

Current N2 is a generated single-page level document:

```text
public/missions/mission01/level2.html
```

The packed source contains the main N2 scene/runtime. Later patches inject additional inline `<style>` and `<script>` blocks. Examples observed in the patch layer include:

- `apulab-level23-primary-audio-style`
- `apulab-level2-explore-card-style`
- `apulab-level23-primary-audio-runtime`
- `apulab-level2-explore-card-runtime`
- `apulab-level2-progress-guide-style`
- `apulab-level2-progress-guide-runtime`
- `apulab-level2-explore-yellow-final-runtime`

The final stabilizer rewrites external Three.js imports to local `/vendor/three/*` and adds Poppins to all levels.

### Consequence for GC

Do not reconstruct N2 as a new unrelated page. A future transformation should operate on the cloned/generated N2 and replace/flatten participant-facing layers locally.

---

## 5. Current GE task behavior observed by physical E2E

The frozen experimental E2E performs a real physical measurement flow on the N2 canvas.

Observed sequence:

```text
PINK battery
  red probe → +
  black probe → −
  measured result = 24.0 V
        ↓
NEXT battery
        ↓
GREEN battery
  red probe → +
  black probe → −
  measured result = 28.0 V
        ↓
NEXT battery
        ↓
CORAL battery
  red probe → +
  black probe → −
  measured result = 32.0 V
        ↓
compare overlay becomes visible
        ↓
select GREEN
        ↓
success
```

The current source E2E explicitly requires the green / `28.0 V` candidate to be accepted.

Therefore the **observed GE Study Build contract today** is:

```text
A / pink  = 24.0 V
B / green = 28.0 V
C / coral = 32.0 V
GE accepted = B / 28.0 V
```

This is an observation, not a recommendation for GC.

---

## 6. Battery / multimeter / probes / carousel

| Component | Current role | Future GC classification | Reason |
|---|---|---|---|
| Three batteries A/B/C | scientific alternatives | **KEEP** | central task content |
| Scientific voltage readings | evidence to compare | **KEEP, but source-parity gated** | must match definitive Study Build |
| Multimeter | measurement instrument | **KEEP / FLATTEN** | preserve measurement meaning without extra game manipulation |
| Red/black probes | establish measurement between two points | **KEEP / FLATTEN** | current GE physically measures with conventional polarity |
| COM/VΩ | prior N1 instrument setup concept | **KEEP as preconfigured state, not a new N2 task** | avoid increasing GC difficulty |
| Battery carousel / `#battery-next` | switches alternatives | **REPLACE / FLATTEN** | neutral A/B/C selector can preserve task without game animation |
| animated camera / game presentation | game feel | **REMOVE / FLATTEN** | not required for comparison competence |

A future GC may use neutral tabs/selector A/B/C, but only if each alternative remains individually inspectable and measurable and the scientific exposure remains comparable.

---

## 7. Measurement registration and 3/3 gate

The N2 guide patch exposes a **read-only getter** over the runtime `measuredValues` Map:

```text
window.__apulabLevel2MeasuredCount = () => measuredValues.size
```

The guide derives progress from `0 / 1 / 2 / 3` recorded measurements and explicitly transitions to compare/select only when three measurements exist.

The repaired guide uses:

```text
const count = measuredValues.size
```

and presents the conceptual stages:

```text
1 · MIDE LAS 3 BATERÍAS
2 · COMPARA CON LA PISTA
3 · ELIGE LA CANDIDATA
```

Critical future GC invariant:

```text
all_three_measured === false
→ final selection disabled / unavailable

all_three_measured === true
→ final selection may become available
```

The exact future control UI can change; the 3/3 evidence requirement cannot.

---

## 8. Error and autocorrection semantics

The current N2 guide/runtime recognizes measurement states including:

- one probe only;
- reversed polarity;
- probes placed on different batteries;
- wrong final candidate (`wrongChoiceFeedback`).

Observed/help semantics include:

```text
one probe
→ a second point is still required

reversed polarity
→ negative sign indicates reversed probe polarity

different batteries
→ both probes must measure the same battery

wrong choice
→ compare again with the scientific clue / criterion
```

These are analytically useful error opportunities and should be **KEEP** conceptually. Their presentation should become neutral and non-celebratory in GC.

---

## 9. Compare / completion rule

The current physical E2E demonstrates:

1. all three batteries measured;
2. compare overlay becomes visible;
3. one candidate is selected;
4. green / 28.0 V is currently accepted;
5. success overlay becomes visible.

Future control requirements:

- final decision must remain gated by 3/3 measurements;
- incorrect selection must not erase all prior work;
- participant must be able to compare/correct;
- no correct candidate may be highlighted before evaluated selection;
- completion must not be converted into a second quiz.

The **identity of the correct candidate is currently blocked by source parity** (Section 15).

---

## 10. BITÁCORA / records

Current N2 begins with:

```text
journalUnlocked = false
journalButton.hidden = true
```

and the measurement model itself already maintains a `measuredValues` Map used by the guide/progress layer.

For future GC:

```text
BITÁCORA game presentation
→ REGISTRO DE MEDICIONES
```

Classification: **REPLACE presentation, KEEP measurement-record semantics**.

The control record should expose the participant's own three observed readings without adding hints about which is correct.

---

## 11. EXPLORAR / GUÍA / game attention

Current stabilized N2 allows measurement immediately; EXPLORAR and GUÍA are optional aids.

That optionality should be preserved conceptually because forcing mandatory help in GC would change exposure and difficulty.

Future classification:

- conceptual help content: **KEEP / NEUTRALIZE**;
- yellow attention styling, pulse/glow and game-primary treatment: **REMOVE**;
- guide strike animation and guide tick audio: **REMOVE**;
- help opening/closing as a participant choice: **KEEP**;
- help usage should be measurable in GC telemetry: **KEEP analytically / implement locally later**.

---

## 12. Audio / reward / game layer

Current N2 patch stack can add:

- UI click tones;
- guide tick sound;
- yellow game-primary visual treatment;
- Explore yellow cards;
- shared celebratory/game presentation inherited from Mission 01.

For GC these are **REMOVE / NEUTRALIZE**.

The future N2 control level must not contain:

- music;
- celebratory SFX;
- reward chimes;
- confetti;
- XP/badge/unlock framing;
- game-attention halos/glows;
- emotionally celebratory success copy.

Scientific feedback remains; game reward presentation does not.

---

## 13. Telemetry audit

### Existing shared infrastructure

The application has session-level research infrastructure:

```text
GameState
SessionService
TelemetryService
LocalQueueService
SyncService
```

`TelemetryService` writes events with pseudonymous session context to the local queue and `LocalQueueService` rejects forbidden PII-like payload keys.

### N2-specific finding

The frozen experimental `src/main.ts` installs dedicated bridges for:

```text
Level6TelemetryBridge
Level7TelemetryBridge
```

There is **no dedicated `Level2TelemetryBridge` installed in the source tree**.

The inspected N2-specific patches do not establish an analytically comparable parent telemetry contract for measurement order, all-three-measured, first choice, final choice, attempts, help, or completion.

Therefore:

```text
N2_TELEMETRY_PARITY = NOT_DEMONSTRATED_BY_CURRENT_GE_BRIDGE_LAYER
```

Do not infer that absence of a dedicated bridge means the packed level emits no internal events; that question is separate. What is established is that the current app-level research bridge layer does not expose an N2-specific contract comparable to the frozen N1 GC instrumentation.

Future GC telemetry should be N2-local and observational, not a reason to redesign the task. Expected derived analytics include, when scientifically finalized:

```text
measurement_order
all_three_measured
first_choice
final_choice
attempt_count
first_attempt_success
final_success
response_change_count
help_used
help_count
time_to_first_action_ms
completion_time_ms
```

No implementation is authorized in this audit.

---

## 14. Persistence / refresh audit

The inspected N2 E2E validates the physical three-measurement + choice task, but it does **not** exercise:

- refresh initial;
- refresh after first/second measurement;
- refresh after measurement error;
- refresh after wrong choice;
- refresh after correction;
- refresh after completion;
- terminal-event idempotency after refresh.

The N2-specific patch layer inspected in this audit does not add an N2 persistence adapter.

Therefore:

```text
N2_REFRESH_SAFETY = NOT_DEMONSTRATED
N2_COMPLETION_IDEMPOTENCY = NOT_DEMONSTRATED
```

This is not treated as a defect to fix during the audit. It is a required gate for a future authorized N2 implementation.

Preferred future pattern under the project contract:

```text
N2 level-local state
+
existing SessionService / TelemetryService
```

No global persistence migration should be introduced merely for N2 if a local adapter is sufficient.

---

## 15. Scientific source-parity blocker

Two incompatible contracts currently exist.

### Observed GE implementation

```text
A = 24.0 V
B = 28.0 V
C = 32.0 V

current accepted candidate:
B / 28.0 V
```

### GDD canonical requirement

```text
required range = 22.0–24.0 V
```

Applied to the same observed values:

```text
A / 24.0 V
```

would be the compatible candidate.

Therefore:

```text
N2_SOURCE_PARITY = BLOCKED
```

This audit does not choose one arbitrarily.

Forbidden resolutions:

- modifying `Kas01000101/ApuLabStationGame`;
- changing GE values/rules inside this task;
- hardcoding a different GC answer;
- declaring N2 frozen while the contradiction remains;
- using `18 / 23 / 27` or any other invented dataset.

Required separate scientific decision path:

```text
inspect GE definitive Study Build
inspect GDD
inspect paper/protocol
identify authoritative task configuration
freeze that decision
then authorize GC implementation
```

Until that occurs, the correct-candidate field in a future GC configuration must remain unresolved.

---

## 16. Navigation and lifecycle

The Mission 01 shell uses one iframe and direct same-frame navigation between levels. The transition audit explicitly requires an N2 route:

```text
level: 2, nextLevel: 3
```

and N1/N2 generated pages include pagehide/WebGL cleanup contracts.

Classification: **KEEP navigation semantics**, while any game-styled transition/reward presentation remains neutralized.

A future N2 physical E2E must test the participant-facing CONTINUAR path into N3 rather than relying only on a synthetic parent message.

---

## 17. Existing tests relevant to N2

### `tests/e2e/mission01-electronics.cjs`

Strongest current N2 task-core evidence:

- physical canvas interaction;
- red/black probe placement;
- 24.0 / 28.0 / 32.0 readings;
- three measurements;
- compare overlay;
- green selection;
- success for 28.0 V.

### `tests/e2e/mission01-smoke.cjs`

Confirms N1→N7 shell viability, WebGL availability, Poppins, help lifecycle and no critical runtime errors. For N2 it also explicitly waits for the battery-next control before Explore lifecycle interactions.

### Transition static audit

Confirms N2→N3 route contract and pagehide/WebGL cleanup markers.

### Missing N2 research-specific gates

No current dedicated N2 test demonstrates:

- refresh/persistence;
- terminal idempotency;
- N2-specific research event dump;
- PII audit on N2-specific events;
- GC visual evidence;
- final GE↔GC scientific parity.

These remain future gates after implementation is explicitly authorized.

---

## 18. Shared-dependency risk and frozen N1 impact

### N1 impact

N1 is frozen at:

```text
b717a70b685f382044276b7a30bec5b556e94e9c
```

Every future N2 change must pass:

```text
tests/e2e/mission01-control-n1-freeze.cjs
```

N2 work must not alter:

- `public/control/n1-control.js`
- `public/control/n1-control.css`
- N1 15.0 V scientific contract
- N1 telemetry/persistence/idempotency
- N1 participant-view answer-leak guard
- N1 frozen visual behavior.

Because existing shared scripts chain N1 and N2 patching, future implementation should prefer a late **N2-local adapter** instead of deleting/reordering shared scripts.

### N3 impact

The old electronics Level 3 is excluded from the active seven-level build by `build-mission01-seven-source.mjs`; current N3 belongs to the programming progression after renumbering.

Future N2 transformation must not leak into N3 programming output. N3–N7 generated-output parity should remain a gate while N2 is being transformed.

---

## 19. KEEP / REMOVE / FLATTEN / NEUTRALIZE / REPLACE matrix

| Area | Classification | Frozen rationale |
|---|---|---|
| three-battery comparison competence | **KEEP** | core scientific reasoning |
| A/B/C alternatives | **KEEP** | content parity |
| scientific readings | **KEEP, SOURCE-GATED** | must come from definitive Study Build |
| require 3/3 measurements before choice | **KEEP** | task-order parity |
| measurement record semantics | **KEEP** | evidence for comparison |
| BITÁCORA game presentation | **REPLACE** | neutral `REGISTRO DE MEDICIONES` later |
| multimeter concept | **KEEP** | scientific instrument |
| multimeter game/3D manipulation | **FLATTEN** | preserve reasoning, reduce game feel |
| probe measurement meaning | **KEEP** | two-point measurement |
| draggable/animated probe presentation | **FLATTEN** | only if measurement opportunity remains equivalent |
| COM/VΩ as preconfigured prior knowledge | **KEEP** | do not add new N2 competency |
| COM/VΩ as new question/task | **REMOVE / PROHIBIT** | would increase GC difficulty |
| animated carousel | **REPLACE / FLATTEN** | neutral A/B/C selector later |
| wrong-polarity correction | **KEEP** | meaningful error/correction |
| different-battery probe error | **KEEP** | meaningful scientific error |
| wrong final candidate + retry | **KEEP** | comparison/correction opportunity |
| correct-answer highlight before submit | **REMOVE / PROHIBIT** | answer leak |
| EXPLORAR conceptual support | **KEEP / NEUTRALIZE** | optional help, no game attention |
| GUÍA conceptual support | **KEEP / NEUTRALIZE** | optional help, no reward animation |
| yellow primary/glow/pulse/strike | **REMOVE** | game attention layer |
| guide tick / UI click SFX | **REMOVE** | non-game control condition |
| celebration/confetti/reward | **REMOVE** | non-game control condition |
| neutral corrective feedback | **KEEP / REPLACE presentation** | preserve conceptual feedback |
| navigation N2→N3 | **KEEP** | progression contract |
| current N2 telemetry bridge | **REPLACE / ADD LOCALLY LATER** | comparability not demonstrated |
| current N2 persistence | **REPLACE / ADD LOCALLY LATER** | refresh safety not demonstrated |
| source-parity decision | **BLOCKED** | cannot be invented in GC |

---

## 20. Future implementation architecture — prepared, not executed

Only after a separate authorization and `N2_SOURCE_PARITY = READY`:

```text
stabilized cloned N2
        ↓
late N2-local control adapter
        ↓
neutral A/B/C observation/measurement interface
        ↓
REGISTRO DE MEDICIONES 0/3 → 3/3
        ↓
final decision unlocked only at 3/3
        ↓
neutral wrong-choice correction
        ↓
neutral completion
```

Expected future level-local files may follow the N1 pattern, but **no files are created by this audit**.

No implementation should begin until the scientific values, criterion and accepted candidate are frozen from one authoritative Study Build configuration.

---

## 21. Required future validation gate after authorization

N2 must not freeze without all of:

```text
TASK CORE
CONTROL CONDITION
STATIC AUDIT N2
BUILD
PHYSICAL N2 E2E
REFRESH
IDEMPOTENCY
TELEMETRY RUNTIME
PRIVACY
AUDIO / GAME-LAYER CHECK
CURRENT-HEAD SCREENSHOTS
VISUAL QA
N1 FROZEN REGRESSION
N3–N7 REGRESSION
SOURCE PARITY
SOURCE PROTECTION
```

Expected screenshot set after a future N2 implementation:

```text
n2_gc_initial.png
n2_gc_battery_a.png
n2_gc_battery_b.png
n2_gc_battery_c.png
n2_gc_all_measurements_registered.png
n2_gc_incorrect_choice.png
n2_gc_correct_choice.png
n2_gc_completed.png
```

No screenshot from a different SHA may be reused as freeze evidence.

---

## 22. Audit conclusion / stop point

```text
N1_CONTROL_STATUS = FROZEN
N1_CONTROL_FROZEN_SHA = b717a70b685f382044276b7a30bec5b556e94e9c

N2_AUDIT_STATUS = COMPLETE
N2_SOURCE_PARITY = BLOCKED
N2_IMPLEMENTATION_STATUS = NOT_AUTHORIZED
N2_CONTROL_STATUS = NOT_FROZEN

EXPERIMENTAL_REPO_WRITE = NO
CONTROL_MAIN_WRITE = NO
VERCEL = DISCONNECTED
PRODUCTION_DEPLOY = NO
MERGE = NO
```

**STOP.** The next operation must not implement N2 until a new explicit authorization is provided and the scientific source-parity decision is resolved/documented.