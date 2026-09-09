# N2 Scientific Decision · Source Parity Resolution

## Status

```text
N2_AUDIT_STATUS = COMPLETE
N2_SCIENTIFIC_DECISION = RECORDED
N2_SOURCE_PARITY = READY
N2_IMPLEMENTATION_STATUS = NOT STARTED
N2_CONTROL_STATUS = NOT FROZEN
N1_CONTROL_STATUS = FROZEN
N1_CONTROL_FROZEN_SHA = b717a70b685f382044276b7a30bec5b556e94e9c
```

This document resolves the source-of-truth conflict for **N2 · COMPARAR** only. It does **not** implement, patch, restyle, reconfigure, deploy, merge, or freeze N2.

---

## 1. Protected sources

Experimental repository:

```text
Kas01000101/ApuLabStationGame
SOURCE SHA = 2f94e9e701172ab455767757225110606b983597
ACCESS MODE = READ / AUDIT / COMPARE / DOCUMENT ONLY
```

Control repository:

```text
Kas01000101/ApuLabControl_GC
main = 2e53ea7d35757b0a6dbb4ab5fc2b655bffbd4294
N1 freeze branch = research/control-n1-freeze
N2 audit / future work branch = research/control-active
```

No write to `Kas01000101/ApuLabStationGame` is authorized by this decision.

---

## 2. Evidence considered

### A. Frozen GE executable / source audit

At experimental SHA `2f94e9e701172ab455767757225110606b983597`, the verified physical N2 E2E measures:

```text
A / pink  = 24.0 V
B / green = 28.0 V
C / coral = 32.0 V
```

The same E2E selects **B / green** and requires the N2 success state to accept **28.0 V**.

The prior read-only source audit identified the historical GE compatibility rule as:

```text
voltage > 24.0
AND
voltage < 32.0
```

For the frozen A/B/C set, this accepts only:

```text
B = 28.0 V
```

### B. GDD v3.0 / evaluation protocol

`ApuLab_GDD_Investigacion_Control_Activo_v3_0_2026-09-06` specifies N2 as:

```text
three batteries
measure / observe all alternatives
register data
compare against a requirement
select the compatible battery
```

The document writes the requirement as:

```text
22–24 V inclusive
```

Applied to `24 / 28 / 32`, that would accept:

```text
A = 24.0 V
```

The same GDD also requires the active control to preserve the **same data, order and success criterion** as GE and to consume shared study configuration.

### C. IAC accepted abstract / brief

Paper ID `117269` establishes the ApuLab educational/game-based framing and progressive scientific challenges, but it does **not** specify N2 battery voltages or a numeric compatibility range. Therefore it cannot resolve this numeric conflict.

---

## 3. Conflict

Before this decision:

```text
GE executable values: 24 / 28 / 32
GE accepted candidate: B / 28.0 V
GE historical acceptance rule: >24.0 && <32.0

GDD v3.0 written requirement: 22–24 V inclusive
GDD-derived candidate over the same values: A / 24.0 V
```

These cannot both be used in a content-matched GE↔GC comparison.

---

## 4. Scientific decision

For the **control implementation that must match the frozen experimental treatment**, the authoritative N2 runtime source is the frozen GE Study Build/source snapshot at:

```text
AUTHORITATIVE_SOURCE =
Kas01000101/ApuLabStationGame@2f94e9e701172ab455767757225110606b983597
```

Canonical N2 values for the future GC implementation:

```text
BATTERY_A = 24.0 V
BATTERY_B = 28.0 V
BATTERY_C = 32.0 V

REQUIRED_RANGE = voltage > 24.0 V AND voltage < 32.0 V

CORRECT_BATTERY = B
CORRECT_VALUE = 28.0 V
```

### Rationale

The study is intended to compare **modality** while keeping task content matched. Because the experimental repository is protected and frozen read-only for this workflow, changing GC to `22–24 V / A=24` would create a different scientific decision from the one participants receive in the frozen GE executable. That would violate content matching and weaken internal validity.

Therefore the later GC must reproduce the frozen GE's three values and accepted candidate, while removing only the treatment-specific game presentation.

This decision does **not** claim that `>24 && <32` is a real-world engineering requirement. It is the frozen **study task criterion** used to preserve experimental equivalence.

---

## 5. GDD v3.0 disposition

The N2 `22–24 V` line in GDD v3.0 is now classified as:

```text
PROTOCOL_VALUE_STATUS = SUPERSEDED_FOR_N2_RUNTIME_PARITY
```

The GDD itself also states that decisions affecting content, feedback, difficulty or Study Build must be synchronized before official data collection. Therefore a future protocol/GDD revision must record the frozen runtime criterion before the final Study Build freeze.

Required before official sample collection:

```text
GDD_N2_SYNC = REQUIRED
STUDY_CONFIG_HASH = REQUIRED
GE_BUILD_SHA = REQUIRED
GC_BUILD_SHA = REQUIRED
```

No library/PDF source is modified by this repository decision.

---

## 6. Canonical future shared config

A later implementation should consume one explicit config instead of hardcoding independent GE/GC values. Conceptual target:

```json
{
  "level2": {
    "batteries": [
      { "id": "A", "voltage": 24.0 },
      { "id": "B", "voltage": 28.0 },
      { "id": "C", "voltage": 32.0 }
    ],
    "requiredVoltage": {
      "minExclusive": 24.0,
      "maxExclusive": 32.0
    },
    "correctBatteryId": "B"
  }
}
```

This config is a future implementation target only. It is not created or consumed by this decision commit.

---

## 7. N2 implementation gate

With the source decision recorded:

```text
N2_SOURCE_PARITY = READY
```

However implementation still requires explicit authorization:

```text
IMPLEMENT N2 CONTROL = NOT AUTHORIZED YET
```

When authorization is given, the implementation must:

- remain on `research/control-active`;
- transform the cloned N2 rather than build an unrelated task from scratch;
- preserve A/B/C = `24/28/32`, 3/3 measurement/registration, comparison, wrong-choice opportunity and correction;
- accept B / `28.0 V` only;
- keep N1 concepts from becoming new evaluated questions;
- neutralize game presentation/audio/reward/narrative without reducing the cognitive task;
- add N2-specific telemetry, persistence, refresh/idempotency E2E and current-head screenshots;
- run the frozen N1 regression contract on every change;
- not modify `ApuLabStationGame`.

---

## 8. Stop condition

```text
N1 = FROZEN
N2 AUDIT = COMPLETE
N2 SCIENTIFIC DECISION = RECORDED
N2 SOURCE PARITY = READY
N2 IMPLEMENTATION = NOT STARTED
MERGE = NO
VERCEL = DISCONNECTED
PRODUCTION DEPLOY = NO
```

**STOP. Await explicit authorization: `IMPLEMENT N2 CONTROL`.**
