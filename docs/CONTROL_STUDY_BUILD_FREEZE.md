# ApuLab Control GC · Final Study Build Freeze Manifest

## Status

- Repository: `Kas01000101/ApuLabControl_GC`
- Branch: `research/control-active`
- Condition: **CONTENT-MATCHED ACTIVE CONTROL**
- Participant runtime: **FROZEN / N1–N7**
- Final integration recovery SHA: `6dec950d667366a517f7072a280d4ba3996c8eb0`
- `main`: `2e53ea7d35757b0a6dbb4ab5fc2b655bffbd4294` · READ ONLY
- Merge: **NO**
- Vercel: **DISCONNECTED**
- Production deploy: **NO**

This manifest records the verified frozen Study Build after the final integration harness recovery. The recovery commit changed only the final integration harness and the N7 workflow trigger; participant runtime files were unchanged.

## Frozen level checkpoints

| Level | Frozen SHA | Canonical validation run | Evidence artifact | Artifact ID | Artifact digest | Visual QA |
|---|---|---:|---|---:|---|---|
| N1 · MEDIR | `b717a70b685f382044276b7a30bec5b556e94e9c` | `34210987985` | `control-n1-validation-evidence` | `10050894936` | `sha256:0d9f7fefc7eaef93cf25d989c2d9e9db665d9bbdf33037a0220c681ab4fdba58` | **PASS** |
| N2 · COMPARAR | `dbb60df8f509aa0fe461db015445b28d0e78b5cc` | `34231422620` | `control-n2-validation-evidence` | `10058841535` | `sha256:c3fb2e1a279f2781e25bf8bbff5390342b9c35c160846eae7bf82ec352d03c75` | **PASS** |
| N3 · SECUENCIAR | `a150e2039a5f35c6dabb6bb8cb6eed8ca6d9532e` | `34291053223` | `control-n3-validation-evidence` | `10081729507` | `sha256:e46cba20fadb7f6457009a39ecf9e1ad8678d7ff2a40397a2b10a7a738dca1af` | **PASS** |
| N4 · PLANIFICAR Y CORREGIR | `b9178428d31e4b608457b3c7af103d723da92781` | `34298272112` | `control-n4-validation-evidence` | `10084329786` | `sha256:20a1a20e91c2426be01bbde3ec0c5d1322885310545aab6264f596c4be12ada6` | **PASS** |
| N5 · SIMPLIFICAR · BUCLES | `ef2da8c90773f3c3b79c4e7a0f1576a801bd3283` | `34303779568` | `control-n5-validation-evidence` | `10086160140` | `sha256:d199857e447a5c29c12f383308dc7189a3de4c01a109e0d5bdda06736ac34f04` | **PASS** |
| N6 · INVESTIGAR | `6fc3288fbb533e1ed841e31748d3bb44c50daa65` | `34314251401` | `control-n6-validation-evidence` | `10089688009` | `sha256:ac5393e68224df1cf2838ffe8635f328b634f54120460bce0f248dc664324b3f` | **PASS** |
| N7 · LA MUESTRA DESCONOCIDA | `09bfc0479a5f55d8d7476c5d23f37d9760f4cb02` | `34322031172` | `control-n7-validation-evidence` | `10092389562` | `sha256:156e827fff49142408d2f30c2ab8ca2c1678565402dfb21075e3672b1cfa3a79` | **PASS** |

All seven frozen refs are operationally immutable. No frozen SHA may move.

## Final Study Build integration gate

- Workflow: `Control Study Build Final Gate`
- Successful run ID: `34325611522`
- Exact tested SHA: `6dec950d667366a517f7072a280d4ba3996c8eb0`
- Result: **SUCCESS**
- Evidence artifact: `control-study-build-final-evidence`
- Artifact ID: `10093660654`
- Artifact digest: `sha256:f719e7f6999c6308b9e3c4056b6764178b46b62f518596e12ff461103697e3cd`
- Viewport: `1672x941`
- Runtime errors: `[]`

### Physical transition chain

- N1 → N2: **PASS**
- N2 → N3: **PASS**
- N3 → N4: **PASS**
- N4 → N5: **PASS**
- N5 → N6: **PASS**
- N6 → N7: **PASS**

### Integrated behavioral checks

- N1 physical measurement: **PASS**
- N2 three measurements + B selection: **PASS**
- N3 participant-built sequence: **PASS**
- N4 error → adjust → correction lifecycle: **PASS**
- N5 phase 1 → phase 2 → REPETIR simplification: **PASS**
- N6 movement → ESCANEAR → ANALIZAR → communication → ENVIAR DATOS: **PASS**
- N7 movement → ANALIZAR MUESTRA → instrument selection → materials evidence → final point: **PASS**
- Cross-level persistence contamination: **NOT DETECTED**
- `level_completed` one-shot integration checks: **PASS**
- `mission_completed` one-shot terminal check: **PASS**
- `FINALIZAR MISIÓN` → `MISIÓN COMPLETADA`: **PASS**
- N8 absent: **PASS**

The successful evidence artifact contains `control_study_build_terminal.png` and `summary.json`. The summary records `status = PASS`, the complete transition chain, terminal completion, `no_n8 = true`, `runtime_errors = []`, and viewport `1672x941`.

## Exact frozen regression after harness recovery

- Workflow: `Control Study Frozen Exact Regression`
- Run ID: `34325611600`
- Exact tested SHA: `6dec950d667366a517f7072a280d4ba3996c8eb0`
- Result: **SUCCESS**

Exact frozen checks:

- N1: **PASS**
- N2: **PASS**
- N3: **PASS**
- N4: **PASS**
- N5: **PASS**
- N6: **PASS**
- N7: **PASS**

N7 exact regression includes the generated N7 runtime, control JS/CSS, N7 patch, N7 audit, N7 telemetry bridge, and frozen N7 E2E contract.

## N7 workflow and review state

- N7 canonical frozen validation run remains `34322031172`.
- `Control N7 Validation Gate` is retained for `workflow_dispatch` diagnostics only and does not auto-run on `research/control-active` pushes.
- N7 PR: `#8` · **OPEN / DRAFT / NO MERGE**.
- N7 frozen ref: `research/control-n7-freeze` = `09bfc0479a5f55d8d7476c5d23f37d9760f4cb02`.

## Repository safeguards

- Writable branch for this closure: `research/control-active` only.
- `main` remains unchanged at `2e53ea7d35757b0a6dbb4ab5fc2b655bffbd4294`.
- N1–N7 freeze refs remain unchanged.
- No participant runtime file was modified by the harness recovery or this manifest.
- No PR is authorized for merge.
- Vercel remains disconnected.
- Production deployment remains prohibited.

## Closure rule

This manifest is documentation-only. Final closure is reached only after this manifest commit itself passes both:

1. `Control Study Frozen Exact Regression` = **SUCCESS**
2. `Control Study Build Final Gate` = **SUCCESS**

Until those post-manifest gates succeed, this document records the pre-manifest verified frozen state but does not itself authorize any runtime, merge, deployment, or frozen-ref change.
