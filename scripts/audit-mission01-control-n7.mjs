import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const ROOT=process.cwd();
const html=await readFile(resolve(ROOT,'public/missions/mission01/level7.html'),'utf8');
const js=await readFile(resolve(ROOT,'public/control/n7-control.js'),'utf8');
const css=await readFile(resolve(ROOT,'public/control/n7-control.css'),'utf8');
const bridge=await readFile(resolve(ROOT,'src/systems/Level7TelemetryBridge.ts'),'utf8');
const fail=code=>{throw new Error(`mission01_control_n7_audit:${code}`)};

for(const token of [
  'APULAB_CONTROL_N7_V1','/control/n7-control.css','/control/n7-control.js'
])if(!html.includes(token))fail(`html_missing:${token}`);

for(const token of [
  "start:{row:7,column:1,orientation:'NORTH'}",
  'sample:{row:2,column:5}',
  'final:{row:6,column:6}',
  '{row:6,column:3}','{row:5,column:0}','{row:4,column:7}','{row:1,column:2}',
  'sampleDistance()===1',
  'ANALIZAR MUESTRA','TEMPERATURA','PROXIMIDAD','ANALIZADOR DE MATERIALES',
  '−58 °C','0.4 m','HIERRO · SILICATOS',
  "condition:'GC'","level:7",
  'levelStartedEventEmitted','terminalEventEmitted','missionCompletedEventEmitted',
  'instrumentSelectionCount','instrumentChangeCount','changedAfterIrrelevantFeedback',
  'responseChangeCount','programEditCount','firstAttemptSuccess',
  "type:'apulab-control-n7-telemetry'",
  'apulab-mission-complete',
  "NORTH:'↑'",
  'FINALIZAR MISIÓN','MISIÓN COMPLETADA'
])if(!js.includes(token))fail(`js_missing:${token}`);

for(const forbidden of [
  'INCORRECTO','RESPUESTA EQUIVOCADA','PERDISTE','ERROR DE INSTRUMENTO',
  'nextLevel:8','level8.html','CONTINUAR AL NIVEL 8',
  'EXPLORAR','BITÁCORA','launchConfetti','successMusic',
  'data-command="scan"','data-command="send"'
])if(js.includes(forbidden))fail(`js_forbidden:${forbidden}`);

if(!css.includes('html[data-apulab-control="n7"]'))fail('css_scope');
if(!css.includes('.instrument-grid'))fail('instrument_grid_css');
if(!bridge.includes("'apulab-control-n7-telemetry'"))fail('bridge_control_type');
if(!bridge.includes("condition: isControlMessage ? 'GC'"))fail('bridge_condition');
if(!bridge.includes('level: 7'))fail('bridge_level');
for(const token of ['participant_code','full_name','email','school','teacher','phone','free_text','browser','device','fingerprint'])
  if(!bridge.includes(token))fail(`bridge_privacy_missing:${token}`);

console.info('[mission01] CONTROL N7 AUDIT OK · flat 2D · exact science data · adjacency · persistence/idempotency markers · privacy bridge · no N8');
