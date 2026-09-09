# ApuLab Control GC · N2 Implementation Candidate

```text
REPOSITORY = Kas01000101/ApuLabControl_GC
BRANCH = research/control-active
STARTING_SHA = 9c3cdc8d17ab0c513a1e93a7ab211f98107e6921
N1_CONTROL_STATUS = FROZEN
N1_CONTROL_FROZEN_SHA = b717a70b685f382044276b7a30bec5b556e94e9c
N2_SOURCE_PARITY = READY
N2_IMPLEMENTATION = AUTHORIZED
N2_CONTROL_STATUS = VALIDATION_PENDING
MERGE = NO
VERCEL = DISCONNECTED
PRODUCTION_DEPLOY = NO
```

## Scientific contract

N2 consumes `public/control/study-config.json` and validates that exactly one battery satisfies the frozen criterion.

```text
A = 24.0 V
B = 28.0 V
C = 32.0 V
criterion = voltage > 24.0 V && voltage < 32.0 V
correct = B
source = Kas01000101/ApuLabStationGame@2f94e9e701172ab455767757225110606b983597
```

The participant-facing control does not re-evaluate POWER, V⎓, COM, VΩ or physical probe manipulation. It preserves the N2 cognitive sequence:

```text
observe A/B/C
→ register each measurement
→ 3/3 gate
→ compare with criterion
→ submit a choice
→ revise after a wrong submission
→ complete on B only
```

## Control presentation

The cloned N2 remains underneath as the source task artifact. A late N2-local adapter overlays a flat neutral interface and suppresses participant interaction with the game layer. The control view contains no AYNI/Yachay narrative, reward, confetti, game audio or animated carousel.

## Telemetry

A dedicated parent bridge accepts only allowlisted N2 control events and injects authoritative parent session identity. Participant/session credentials and PII-like fields from the iframe are discarded.

Primary runtime events:

- `level_started`
- `battery_viewed`
- `measurement_registered`
- `all_three_measured`
- `choice_submitted`
- `choice_changed`
- `help_requested`
- `level_completed`

Optional error/correction event names remain allowlisted for future compatible states but are not fabricated when the flat control does not expose a polarity interaction.

## Persistence and idempotency

`apulab.control.n2.state.v1` persists current battery, A/B/C registrations, measurement order, submitted choices, attempt count, response-change count, help count and completion. `level_completed` is one-shot across refresh.

## Validation gate

`.github/workflows/control-n2-validation.yml` must pass before N2 can be frozen. It checks:

- build;
- static N1 and N2 audits;
- byte-equivalent generated N1 vs the frozen N1 branch;
- unchanged N3–N7 generated output vs control `main`;
- N1 frozen participant-view regression;
- N2 physical/refresh/idempotency/navigation E2E;
- N2 telemetry/privacy/audio E2E;
- app shell, smoke, SFX and N3–N7 downstream regressions;
- same-head N2 screenshot artifact.

Visual QA remains a manual gate after the workflow artifact is generated.
