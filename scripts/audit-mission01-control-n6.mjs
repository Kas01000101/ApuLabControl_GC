import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const LEVEL6 = resolve(ROOT, 'public/missions/mission01/level6.html');
const LEVEL7 = resolve(ROOT, 'public/missions/mission01/level7.html');
const CONTROL_JS = resolve(ROOT, 'public/control/n6-control.js');
const CONTROL_CSS = resolve(ROOT, 'public/control/n6-control.css');
const BRIDGE = resolve(ROOT, 'src/systems/Level6TelemetryBridge.ts');
const EXPECTED_N7 = '03e125bf9bb41f960039343a652dad358060a271c1c1050b61347f59d4e02eca';
const hash = (text) => createHash('sha256').update(Buffer.from(text, 'utf8')).digest('hex');
const fail = (code) => { throw new Error(`audit_control_n6:${code}`); };

const [html, js, css, bridge, n7] = await Promise.all([
  readFile(LEVEL6, 'utf8'),
  readFile(CONTROL_JS, 'utf8'),
  readFile(CONTROL_CSS, 'utf8'),
  readFile(BRIDGE, 'utf8'),
  readFile(LEVEL7, 'utf8'),
]);

for (const token of [
  'APULAB_CONTROL_N6_V1',
  '/control/n6-control.css',
  '/control/n6-control.js',
]) if (!html.includes(token)) fail(`html_missing:${token}`);

for (const token of [
  "grid:{rows:8,columns:8}",
  "start:{row:5,column:1,orientation:'EAST'}",
  "science:{row:5,column:4}",
  "communication:{row:2,column:4}",
  "{row:1,column:0}",
  "{row:2,column:2}",
  "{row:1,column:6}",
  "{row:5,column:7}",
  "new Set(['forward','left','right'])",
  "new Set(['scan','analyze','send'])",
  "REPETIR × N",
  "SCAN_OUTSIDE_SCIENCE_ZONE",
  "ANALYZE_BEFORE_SCAN",
  "ANALYZE_OUTSIDE_SCIENCE_ZONE",
  "SEND_BEFORE_ANALYZE",
  "SEND_OUTSIDE_COMMUNICATION_POINT",
  "result.dataSent&&!result.finalAtCommunication",
  "terminalEventEmitted",
  "levelStartedEventEmitted",
  "condition:'GC'",
  "time_to_science_zone_ms",
  "time_scan_to_analyze_ms",
  "time_analysis_to_communication_ms",
  "repeat_instances",
  "DATO OBTENIDO",
  "RESULTADO INTERPRETADO",
  "RESULTADO ENVIADO",
]) if (!js.includes(token)) fail(`js_missing:${token}`);

for (const forbidden of [
  'temperature','temperatura','distance','distancia','material value','sensor number',
  'confetti','successMusic','launchConfetti','WebGLRenderer','AYNI',
]) if (js.toLowerCase().includes(forbidden.toLowerCase())) fail(`invented_or_game_residue:${forbidden}`);

for (const token of [
  '#apulab-control-n6',
  '.n6-board',
  '.science-zone',
  '.communication',
  '.position-marker',
  '.n6-help',
  '.n6-complete',
  'animation:none!important',
]) if (!css.includes(token)) fail(`css_missing:${token}`);

for (const forbidden of ['@keyframes','box-shadow:0 0 22px','animation:level6','confetti']) {
  if (css.includes(forbidden)) fail(`css_game_effect:${forbidden}`);
}

for (const token of [
  "data.type === 'apulab-control-n6-telemetry'",
  "participant_id: state.participantId",
  "session_id: state.sessionId",
  "condition: 'GC'",
  "level: 6",
]) if (!bridge.includes(token)) fail(`bridge_missing:${token}`);

for (const pii of ['credential','password','full_name','email','school','phone','free_text']) {
  if (!bridge.includes(pii)) fail(`bridge_privacy_filter_missing:${pii}`);
}

if (hash(n7) !== EXPECTED_N7) fail(`n7_parity:${hash(n7)}`);
if (/Ordena\s+ESCANEAR|order these three actions/i.test(js)) fail('passive_ordering_task');
if (/canonical|only_valid/i.test(js)) fail('canonical_only_residue');

console.info('[audit] CONTROL N6 OK · flat 2D active task · scientific causal constraints · persistence/idempotency hooks · N7 exact parity');
