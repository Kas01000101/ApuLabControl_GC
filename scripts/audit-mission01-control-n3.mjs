import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const R=process.cwd(), fail=(c,d='')=>{throw new Error(`mission01_control_n3_audit:${c}${d?`:${d}`:''}`)};
const [html,l4,js,css,cfgRaw,bridge]=await Promise.all([
 readFile(resolve(R,'public/missions/mission01/level3.html'),'utf8'),
 readFile(resolve(R,'public/missions/mission01/level4.html'),'utf8'),
 readFile(resolve(R,'public/control/n3-control.js'),'utf8'),
 readFile(resolve(R,'public/control/n3-control.css'),'utf8'),
 readFile(resolve(R,'public/control/study-config.json'),'utf8'),
 readFile(resolve(R,'src/systems/Level3ControlTelemetryBridge.ts'),'utf8')]);
const c=JSON.parse(cfgRaw).level3;
if(c?.grid?.rows!==8||c?.grid?.columns!==8)fail('grid');
if(c?.start?.row!==6||c?.start?.column!==1||c?.start?.orientation!=='NORTH')fail('start');
if(c?.goal?.row!==3||c?.goal?.column!==3||c?.blockLimit!==8)fail('goal_or_limit');
if(c?.commands?.forward!=='AVANZAR'||c?.commands?.left!=='GIRAR IZQ.'||c?.commands?.right!=='GIRAR DER.')fail('commands');
for(const t of ['<!-- APULAB_CONTROL_N3_V1 -->','href="/control/n3-control.css"','src="/control/n3-control.js"'])if(!html.includes(t))fail('adapter',t);
if(l4.includes('APULAB_CONTROL_N3_V1'))fail('leak_n4');
for(const t of ["const STORAGE_KEY = 'apulab.control.n3.state.v1'","new Set(['forward', 'left', 'right'])",'final.row === CONFIG.goal.row','final.column === CONFIG.goal.column','state.terminalEventEmitted = true','SECUENCIA COMPLETADA','La trayectoria alcanza la meta.'])if(!js.includes(t))fail('runtime',t);
for(const t of ['EXPLORAR','AYNI','confetti','¡Casi!','¡Inténtalo otra vez!'])if(js.includes(t))fail('game_residue',t);
if(/\banimation\s*:|@keyframes|box-shadow\s*:/.test(css))fail('animated_or_reward_css');
for(const t of ['Observa la posición inicial y la meta.','Construye una secuencia con los comandos disponibles.','Comprueba el recorrido.','Si no llega a la meta, modifica la secuencia e inténtalo nuevamente.'])if(!js.includes(t))fail('help',t);
for(const t of ['AVANZA 3 VECES','GIRA A LA DERECHA','USA 6 BLOQUES'])if(js.includes(t))fail('answer_leak',t);
for(const t of ["'sequence_submitted'","'sequence_failed'","'sequence_corrected'","'help_requested'","'level_completed'","condition: 'control'",'level: 3','participant_code: _ignoredCode','email: _ignoredEmail','school: _ignoredSchool','phone: _ignoredPhone'])if(!bridge.includes(t))fail('telemetry',t);
const D=[[-1,0],[0,1],[1,0],[0,-1]];
function run(p){let r=6,col=1,d=0,v=true;for(const x of p){if(x==='left')d=(d+3)%4;else if(x==='right')d=(d+1)%4;else if(x==='forward'){r+=D[d][0];col+=D[d][1];if(r<0||r>7||col<0||col>7){v=false;break}}}return v&&r===3&&col===3}
const canonical=['forward','forward','forward','right','forward','forward'];
const alternate=['left','right','forward','forward','forward','right','forward','forward'];
if(!run(canonical))fail('canonical'); if(!run(alternate))fail('alternate'); if(run(['forward','forward']))fail('invalid');
console.info('[control-n3] N3_CONTROL_STATIC_AUDIT = PASS');
console.info('[control-n3] CANONICAL_PROGRAM = PASS · ALTERNATE_VALID_PROGRAM = PASS · INVALID_PROGRAM != SUCCESS');
