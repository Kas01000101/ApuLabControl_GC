import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const fail = (code) => { throw new Error(`mission01_control_n4_audit:${code}`); };

const [html, js, css, configText] = await Promise.all([
  readFile(resolve(ROOT, 'public/missions/mission01/level4.html'), 'utf8'),
  readFile(resolve(ROOT, 'public/control/n4-control.js'), 'utf8'),
  readFile(resolve(ROOT, 'public/control/n4-control.css'), 'utf8'),
  readFile(resolve(ROOT, 'public/control/study-config.json'), 'utf8'),
]);
const config = JSON.parse(configText).level4;
if (config?.grid?.rows !== 8 || config?.grid?.columns !== 8 || config?.start?.row !== 6 || config?.start?.column !== 1 || config?.start?.orientation !== 'NORTH' || config?.goal?.row !== 2 || config?.goal?.column !== 3 || config?.blockLimit !== 30) fail('config_contract');
const obstacles = new Set((config?.obstacles || []).map((x) => `${x.row}:${x.column}`));
if (obstacles.size !== 2 || !obstacles.has('4:1') || !obstacles.has('4:2')) fail('obstacles');
if (config?.commands?.forward !== 'AVANZAR' || config?.commands?.left !== 'GIRAR IZQ.' || config?.commands?.right !== 'GIRAR DER.') fail('commands');
for (const token of ['APULAB_CONTROL_N4_V1','/control/n4-control.css','/control/n4-control.js']) if (!html.includes(token)) fail(`html:${token}`);
for (const token of ["const STORAGE_KEY = 'apulab.control.n4.state.v1'","const MESSAGE_TYPE = 'apulab-control-n4-telemetry'","CONFIG?.blockLimit === 30","obstacleSet.has('4:1')","obstacleSet.has('4:2')","window.__apulabControlN4State","AJUSTAR PROGRAMA","collision_detected","sequence_corrected","level_completed","{ type: 'apulab-level-complete', level: 4, nextLevel: 5 }"]) if (!js.includes(token)) fail(`js:${token}`);
for (const forbidden of ['confetti','AYNI','EXPLORAR','WebGLRenderer','playSuccessMusic']) if (js.includes(forbidden)) fail(`game_layer:${forbidden}`);
for (const token of ['#apulab-control-n4','.is-obstacle','.is-collision','.control-n4-help-panel']) if (!css.includes(token)) fail(`css:${token}`);
console.info('[audit] CONTROL N4 V1 PASS · baseline geometry/commands/block-limit/correction/presentation contract locked');