# N3 Baseline Contract · SECUENCIAR / MOVIMIENTO Y ORIENTACIÓN

## Scope

This document freezes the **current executable N3 task core** before any Control Group transformation. It records facts only. It does **not** authorize or implement N3 GC.

```text
REPOSITORY = Kas01000101/ApuLabControl_GC
WORKING_BRANCH = research/control-active
SOURCE_REPOSITORY = Kas01000101/ApuLabStationGame
SOURCE_COMMIT = 2f94e9e701172ab455767757225110606b983597

N1_CONTROL_STATUS = FROZEN
N1_CONTROL_FROZEN_SHA = b717a70b685f382044276b7a30bec5b556e94e9c

N2_CONTROL_STATUS = FROZEN
N2_CONTROL_FROZEN_SHA = dbb60df8f509aa0fe461db015445b28d0e78b5cc

N3_IMPLEMENTATION_STATUS = NOT STARTED
N3_IMPLEMENTATION_AUTHORIZED = NO
```

---

## Source lineage

The current executable N3 is **not** the historical Level 3. The active seven-level builder removes historical Level 3 and remaps the historical programming levels so that historical Level 4 becomes current N3.

Authoritative chain:

```text
Kas01000101/ApuLabStationGame
@ 2f94e9e701172ab455767757225110606b983597

src/missions/mission01/final/level4/
  part00.b64
  part01.b64
  part02.b64
        ↓
scripts/build-mission01.mjs
        ↓
scripts/build-mission01-seven-source.mjs
  historical L3 excluded
  historical L4 retained as source
        ↓
current generated public/missions/mission01/level3.html
        ↓
shared N3/N4/N5 presentation/runtime integration patches
```

The source repository remains read-only. No source write is required to determine the baseline.

---

# N3_BASELINE_CONTRACT

```text
N3_BASELINE_CONTRACT

GRID_ROWS =
8

GRID_COLUMNS =
8

COORDINATE_INDEXING =
ZERO_BASED

COORDINATE_ORIGIN =
TOP_LEFT_LOGICAL_CELL

ROW_SEMANTICS =
row increases downward / SOUTH

COLUMN_SEMANTICS =
column increases rightward / EAST

START_ROW =
6

START_COLUMN =
1

INITIAL_ORIENTATION_RAW =
0

INITIAL_ORIENTATION_SEMANTIC =
NORTH

ORIENTATION_ENUM =
0=NORTH
1=EAST
2=SOUTH
3=WEST

GOAL_ROW =
3

GOAL_COLUMN =
3

COMMANDS =
forward
left
right

CANONICAL_PROGRAM =
forward,
forward,
forward,
right,
forward,
forward

EXPECTED_BLOCK_COUNT =
6

PROGRAM_BLOCK_LIMIT =
8

SUCCESS_CONDITION =
after executing the submitted program, roverState.column equals goal.column AND roverState.row equals goal.row

SUCCESS_REQUIRES_GOAL_POSITION =
YES

SUCCESS_REQUIRES_FINAL_ORIENTATION =
NO

SUCCESS_REQUIRES_EXACT_PROGRAM =
NO

SUCCESS_REQUIRES_MAX_BLOCKS =
NO

BLOCK_LIMIT =
8

OBSTACLES =
NONE

WALKABLE_CELLS =
all 64 cells where row=0..7 and column=0..7

ROUTE_CONSTRAINTS =
movement must remain inside row=0..7 and column=0..7; submitted program is mechanically capped to 8 commands

N3_SINGLE_VALID_PROGRAM =
NO

CANONICAL_E2E_PROGRAM =
forward, forward, forward, right, forward, forward

ONLY_VALID_PROGRAM =
NO
```

---

## Evidence for geometry

The generated runtime creates the logical board with nested loops over rows and columns from `0` through `7`, producing an 8×8 tile array. The same runtime defines:

```js
const start={c:1,r:6,dir:0};
const goal={c:3,r:3};
```

The coordinate fields therefore mean:

```text
c = column
r = row
```

`cellPos(c,r)` maps increasing columns to increasing world X and increasing rows to increasing world Z. Logical interpretation uses row/column rather than ambiguous `(x,y)` notation.

---

## Orientation semantics

Forward movement uses:

```js
dc = [0, 1, 0, -1][dir]
dr = [-1, 0, 1, 0][dir]
```

Therefore:

| Raw direction | Semantic direction | Forward delta |
|---:|---|---|
| 0 | NORTH | row − 1 |
| 1 | EAST | column + 1 |
| 2 | SOUTH | row + 1 |
| 3 | WEST | column − 1 |

The initial raw direction is `0`, therefore the initial orientation is **NORTH**.

Right and left use an in-place modulo-4 rotation. `right` adds `+1`; `left` adds `-1`. Neither turn changes row or column.

---

## Command semantics

```text
FORWARD_SEMANTICS =
advance exactly one logical cell in the current orientation; reject movement only when the next row/column would leave the 8×8 board

LEFT_SEMANTICS =
rotate 90 degrees counter-clockwise in place; row and column remain unchanged

RIGHT_SEMANTICS =
rotate 90 degrees clockwise in place; row and column remain unchanged
```

Command labels in the executable participant UI are:

```text
forward = AVANZAR
left    = GIRAR IZQ.
right   = GIRAR DER.
```

---

## Canonical program · logical trajectory

The current E2E canonical program is:

```text
forward
forward
forward
right
forward
forward
```

Its trajectory is deterministic:

| Step | Command | Row | Column | Orientation |
|---:|---|---:|---:|---|
| 0 | — | 6 | 1 | NORTH |
| 1 | forward | 5 | 1 | NORTH |
| 2 | forward | 4 | 1 | NORTH |
| 3 | forward | 3 | 1 | NORTH |
| 4 | right | 3 | 1 | EAST |
| 5 | forward | 3 | 2 | EAST |
| 6 | forward | 3 | 3 | EAST |

Step 6 equals the exact goal `(row=3, column=3)`.

---

## Multiple valid programs

The canonical six-command program is **not** the only valid program. The runtime completes on final goal position, not exact command equality, and the editor accepts up to eight commands.

A second valid sequence within the eight-command limit is:

```text
left
right
forward
forward
forward
right
forward
forward
```

The first two commands rotate WEST and then back NORTH without moving; the remaining six commands follow the canonical trajectory to the same goal. Therefore:

```text
N3_SINGLE_VALID_PROGRAM = NO
ONLY_VALID_PROGRAM = NO
```

The six-command sequence remains the **canonical E2E program**, not a uniqueness claim.

---

## Obstacles and walkability

The runtime creates all 64 board cells. Small pebbles are added decoratively on some tiles, but the forward movement function does not consult an obstacle set, blocked-cell set, collision map, or pebble state. It only rejects out-of-bounds movement before indexing `tiles[row][column]`.

Therefore:

```text
OBSTACLES = NONE
WALKABLE_CELLS = every in-bounds cell
```

This must not be confused with N4 collision mechanics.

---

## Success criterion

The executable success gate is position-only:

```js
if (roverState.c === goal.c && roverState.r === goal.r) {
  completeLevel();
}
```

Consequences:

- goal position is required;
- final orientation is not checked;
- exact program contents are not checked;
- six blocks are not required by the success predicate;
- the editor independently caps the program to eight commands;
- an out-of-bounds step aborts execution before completion.

---

## Frozen baseline boundary

The scientific/task core to preserve in a future GC transformation is:

- 8×8 logical grid;
- start `(row=6, column=1)`;
- initial orientation NORTH;
- goal `(row=3, column=3)`;
- commands `forward`, `left`, `right` with the semantics above;
- program construction/reordering/removal;
- execution of a submitted sequence;
- opportunity for an incorrect sequence and subsequent correction;
- completion by final goal position;
- eight-command editor capacity;
- no effective obstacles.

Game-layer presentation such as AYNI narrative, EXPLORAR attention, glow, confetti, celebration, audio and reward presentation is **not** part of this baseline task core.

```text
N3_BASELINE_GEOMETRY = VERIFIED
N3_BASELINE_STATUS = FROZEN
N3_IMPLEMENTATION_STATUS = NOT STARTED
N3_IMPLEMENTATION_AUTHORIZED = NO
```
