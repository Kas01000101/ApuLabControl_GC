import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const N3 = resolve(ROOT, 'public/missions/mission01/level3.html');
const html = await readFile(N3, 'utf8');
const fail = (code, detail = '') => {
  throw new Error(`mission01_control_n3_baseline:${code}${detail ? `:${detail}` : ''}`);
};

const matchRequired = (regex, code) => {
  const match = html.match(regex);
  if (!match) fail(code);
  return match;
};

// Geometry: exact logical board and zero-based coordinate bounds.
if (!html.includes('for(let r=0;r<8;r++){tiles[r]=[];for(let c=0;c<8;c++){')) fail('grid_8x8');
const startMatch = matchRequired(/const start=\{c:(\d+),r:(\d+),dir:(\d+)\};/, 'start');
const goalMatch = matchRequired(/const goal=\{c:(\d+),r:(\d+)\};/, 'goal');
const start = { c: Number(startMatch[1]), r: Number(startMatch[2]), dir: Number(startMatch[3]) };
const goal = { c: Number(goalMatch[1]), r: Number(goalMatch[2]) };
if (start.c !== 1 || start.r !== 6 || start.dir !== 0) fail('start_value', JSON.stringify(start));
if (goal.c !== 3 || goal.r !== 3) fail('goal_value', JSON.stringify(goal));
if (!html.includes("if(nc<0||nc>7||nr<0||nr>7)throw new Error('EDGE')")) fail('edge_bounds');

// Command set and semantics.
for (const token of [
  "forward:{label:'AVANZAR'",
  "left:{label:'GIRAR IZQ.'",
  "right:{label:'GIRAR DER.'",
  "const dc=[0,1,0,-1][roverState.dir],dr=[-1,0,1,0][roverState.dir]",
  "const delta=cmd==='right'?1:-1",
  'roverState.dir=(old+delta+4)%4',
]) if (!html.includes(token)) fail('command_semantics', token);

const executeStart = html.indexOf('async function executeCommand(cmd)');
const executeEnd = html.indexOf('async function runProgram()', executeStart);
if (executeStart < 0 || executeEnd < 0) fail('execute_command_block');
const executeBlock = html.slice(executeStart, executeEnd);
if (/\bobstacle\b|\bblocked\b|collisionMap|blockedCells/i.test(executeBlock)) fail('unexpected_obstacle_gate');
if (!executeBlock.includes('roverState.c=nc;roverState.r=nr')) fail('forward_position_update');

// Decorative pebbles exist but are not movement constraints.
if (!html.includes("if(((r*11+c*7)%17)===3){const pebble=")) fail('decorative_pebble_marker');

// Editor capacity is eight commands; this is an input cap, not the success predicate.
if (!html.includes('for(let i=0;i<8;i++){')) fail('editor_eight_slots');
const sliceCount = (html.match(/program=program\.slice\(0,8\)/g) || []).length;
if (sliceCount < 2) fail('program_limit_8', String(sliceCount));

// Success is final goal position only.
const successToken = 'if(roverState.c===goal.c&&roverState.r===goal.r){';
if (!html.includes(successToken)) fail('position_success_gate');
const successStart = html.indexOf(successToken);
const successWindow = html.slice(Math.max(0, successStart - 220), successStart + 360);
if (/roverState\.dir|program\s*===|JSON\.stringify\(program\)|program\.length\s*[=!<>]/.test(successWindow)) {
  fail('success_gate_has_extra_requirement');
}
if (!successWindow.includes('completeLevel()')) fail('completion_call');

const DIRECTIONS = [
  { name: 'NORTH', dc: 0, dr: -1 },
  { name: 'EAST', dc: 1, dr: 0 },
  { name: 'SOUTH', dc: 0, dr: 1 },
  { name: 'WEST', dc: -1, dr: 0 },
];
const apply = (program) => {
  const state = { ...start };
  for (const cmd of program) {
    if (cmd === 'forward') {
      const d = DIRECTIONS[state.dir];
      state.c += d.dc;
      state.r += d.dr;
      if (state.c < 0 || state.c > 7 || state.r < 0 || state.r > 7) return { ...state, valid: false };
    } else if (cmd === 'right') {
      state.dir = (state.dir + 1) % 4;
    } else if (cmd === 'left') {
      state.dir = (state.dir + 3) % 4;
    } else {
      fail('unknown_test_command', cmd);
    }
  }
  return { ...state, valid: true };
};

const canonical = ['forward','forward','forward','right','forward','forward'];
const canonicalFinal = apply(canonical);
if (!canonicalFinal.valid || canonicalFinal.r !== goal.r || canonicalFinal.c !== goal.c) {
  fail('canonical_program', JSON.stringify(canonicalFinal));
}
if (canonical.length !== 6) fail('canonical_length');

// Explicit counterexample proves the canonical program is not the only valid one.
const alternate = ['left','right','forward','forward','forward','right','forward','forward'];
const alternateFinal = apply(alternate);
if (!alternateFinal.valid || alternateFinal.r !== goal.r || alternateFinal.c !== goal.c) {
  fail('alternate_valid_program', JSON.stringify(alternateFinal));
}
if (alternate.join(',') === canonical.join(',')) fail('alternate_not_distinct');
if (alternate.length > 8) fail('alternate_exceeds_editor_limit');

console.info('[control-n3-baseline] N3_BASELINE_AUDIT = PASS');
console.info('[control-n3-baseline] GRID = 8x8 · zero-based rows/columns');
console.info('[control-n3-baseline] START = row=6 column=1 orientation=0/NORTH');
console.info('[control-n3-baseline] GOAL = row=3 column=3');
console.info('[control-n3-baseline] COMMANDS = forward,left,right · turns rotate in place');
console.info('[control-n3-baseline] CANONICAL = forward,forward,forward,right,forward,forward · 6 blocks');
console.info('[control-n3-baseline] BLOCK_LIMIT = 8 · OBSTACLES = NONE · ONLY_VALID_PROGRAM = NO');
console.info('[control-n3-baseline] SUCCESS = final row/column equals goal row/column; orientation/exact program not required');
