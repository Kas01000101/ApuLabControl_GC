import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const fail = (code) => { throw new Error(`mission01_control_n2_audit:${code}`); };
const read = (path) => readFile(resolve(ROOT, path), 'utf8');

const [html, js, css, bridge, main, configText] = await Promise.all([
  read('public/missions/mission01/level2.html'),
  read('public/control/n2-control.js'),
  read('public/control/n2-control.css'),
  read('src/systems/Level2ControlTelemetryBridge.ts'),
  read('src/main.ts'),
  read('public/control/study-config.json'),
]);
const config = JSON.parse(configText);
const n2 = config?.level2;

if (!html.includes('APULAB_CONTROL_N2_V1')) fail('html_marker');
if (!html.includes('/control/n2-control.css')) fail('css_link');
if (!html.includes('/control/n2-control.js')) fail('js_script');
if (!html.includes('measuredValues')) fail('cloned_measured_values_missing');
if (!html.includes('battery-next')) fail('cloned_battery_selector_missing');

if (config.sourceRepository !== 'Kas01000101/ApuLabStationGame') fail('source_repo');
if (config.sourceCommit !== '2f94e9e701172ab455767757225110606b983597') fail('source_commit');
if (!n2 || !Array.isArray(n2.batteries) || n2.batteries.length !== 3) fail('three_batteries');
const expected = [['A', 24], ['B', 28], ['C', 32]];
for (const [index, [id, voltage]] of expected.entries()) {
  if (n2.batteries[index]?.id !== id || Number(n2.batteries[index]?.voltage) !== voltage) fail(`battery_${id}`);
}
if (Number(n2.requiredVoltage?.minExclusive) !== 24) fail('range_min');
if (Number(n2.requiredVoltage?.maxExclusive) !== 32) fail('range_max');
const compatible = n2.batteries.filter((battery) =>
  Number(battery.voltage) > Number(n2.requiredVoltage.minExclusive) &&
  Number(battery.voltage) < Number(n2.requiredVoltage.maxExclusive)
);
if (compatible.length !== 1 || compatible[0].id !== 'B' || n2.correctBatteryId !== 'B') fail('correct_battery');

for (const token of [
  'apulab.control.n2.state.v1',
  'apulab-control-n2-telemetry',
  'battery_viewed',
  'measurement_registered',
  'all_three_measured',
  'choice_submitted',
  'choice_changed',
  'help_requested',
  'level_completed',
  'selectionAttemptCount',
  'responseChangeCount',
  'measurementOrder',
  'completion_time_ms',
  'registeredCount() !== 3',
  'Compara nuevamente tus mediciones con el requisito.',
]) if (!js.includes(token)) fail(`js_${token}`);

// N2 Control must not re-test N1 instrumentation concepts. Match semantic
// tokens instead of raw substrings so COMPARAR / COMPROBAR do not trigger COM.
if (/22[–-]24/.test(js)) fail('forbidden_legacy_range');
if (js.includes('V⎓')) fail('forbidden_vdc_mode');
if (/(^|[^A-Za-z0-9_])COM([^A-Za-z0-9_]|$)/m.test(js)) fail('forbidden_com_jack');
if (js.includes('VΩ')) fail('forbidden_vohm_jack');
for (const [code, forbidden] of [
  ['ayni', 'AYNI'],
  ['yachay', 'Yachay'],
  ['confetti', 'confetti'],
]) {
  if (js.includes(forbidden)) fail(`forbidden_${code}`);
}
if (!js.includes("CONFIG_URL = '/control/study-config.json'")) fail('shared_config_consumption');
if (!js.includes('selected === CONFIG.correctBatteryId')) fail('dynamic_correctness');
if (!js.includes('window.__apulabControlN2State')) fail('state_probe');
if (!js.includes('window.__apulabControlN2Config')) fail('config_probe');

if (!css.includes('APULAB_CONTROL_N2_V1')) fail('css_marker');
if (!css.includes('position: fixed')) fail('flat_overlay');
if (!css.includes('body.apulab-control-n2-active')) fail('underlay_neutralization');

for (const token of ['apulab-control-n2-telemetry', "condition: 'control'", 'level: 2', 'LEVEL2_CONTROL_EVENT_TYPES']) {
  if (!bridge.includes(token)) fail(`bridge_${token}`);
}
if (!main.includes("import { installLevel2ControlTelemetryBridge } from './systems/Level2ControlTelemetryBridge';")) fail('main_import');
if (!main.includes('installLevel2ControlTelemetryBridge();')) fail('main_install');

console.info('[mission01] CONTROL N2 AUDIT = PASS');
console.info('[mission01] N2 parity: A=24.0 · B=28.0 · C=32.0 · criterion >24 && <32 · correct B');
console.info('[mission01] N2 control: 3/3 registration · wrong-choice correction · persistence · telemetry · no N1 re-test');
