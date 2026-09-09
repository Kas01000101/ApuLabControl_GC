(()=>{
'use strict';
// APULAB_CONTROL_N6_V1
if(document.getElementById('apulab-control-n6'))return;

const CONFIG={
  grid:{rows:8,columns:8},
  start:{row:5,column:1,orientation:'EAST'},
  science:{row:5,column:4},
  communication:{row:2,column:4},
  obstacles:[{row:1,column:0},{row:2,column:2},{row:1,column:6},{row:5,column:7}],
  blockLimit:30
};
const OB=new Set(CONFIG.obstacles.map(x=>`${x.row}:${x.column}`));
const OR=['NORTH','EAST','SOUTH','WEST'];
const D=[[-1,0],[0,1],[1,0],[0,-1]];
const MOVE=new Set(['forward','left','right']);
const SCI=new Set(['scan','analyze','send']);
const CMDS=new Set([...MOVE,...SCI]);
const now=()=>Date.now();
const clone=x=>JSON.parse(JSON.stringify(x));
const parse=x=>{try{return JSON.parse(x)}catch{return null}};
const safe=x=>String(x||'').replace(/[^A-Za-z0-9._-]/g,'_').slice(0,80);
const lifecycle=(()=>{try{let v=sessionStorage.getItem('apulab.control.n6.lifecycle');if(!v){v=`n6-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;sessionStorage.setItem('apulab.control.n6.lifecycle',v)}return safe(v)}catch{return'n6-session'}})();
const KEY=`apulab.control.n6.state.v1.${lifecycle}`;
const TEL=`apulab.control.n6.telemetry.v1.${lifecycle}`;

const validItem=x=>x&&(
  (x.type==='cmd'&&CMDS.has(x.cmd))||
  (x.type==='repeat'&&Number.isInteger(x.count)&&x.count>=2&&x.count<=9&&Array.isArray(x.body)&&x.body.every(y=>y?.type==='cmd'&&CMDS.has(y.cmd)))
);
const cleanProgram=x=>Array.isArray(x)?x.filter(validItem).slice(0,CONFIG.blockLimit).map(clone):[];
const topCount=p=>p.length;
const executableCount=p=>p.reduce((n,x)=>n+(x.type==='repeat'?x.count*x.body.length:1),0);
const repeatCount=p=>p.filter(x=>x.type==='repeat').length;
const expand=p=>{
  const out=[];
  p.forEach((item,top)=>{
    if(item.type==='cmd')out.push({cmd:item.cmd,top,repeatIteration:null,repeatBody:null});
    else for(let iteration=0;iteration<item.count;iteration++)item.body.forEach((b,body)=>out.push({cmd:b.cmd,top,repeatIteration:iteration,repeatBody:body}));
  });
  return out.slice(0,600);
};
const fresh=()=>({
  version:1,
  program:[],
  attemptCount:0,
  programEditCount:0,
  responseChangeCount:0,
  helpCount:0,
  firstAttemptSuccess:null,
  finalSuccess:false,
  startedAt:now(),
  firstActionAt:null,
  timeToScienceZoneAt:null,
  scanCompletedAt:null,
  analyzeCompletedAt:null,
  communicationReachedAt:null,
  completedAt:null,
  position:{...CONFIG.start},
  scanCompleted:false,
  analysisCompleted:false,
  dataSent:false,
  lastTrajectory:[],
  lastFailure:null,
  lastSubmittedProgram:null,
  lastFailedSubmission:null,
  completed:false,
  levelStartedEventEmitted:false,
  terminalEventEmitted:false,
  feedback:''
});
let state=(()=>{
  try{
    const x=parse(localStorage.getItem(KEY));
    if(!x||x.version!==1)return fresh();
    return{
      ...fresh(),...x,
      program:cleanProgram(x.program),
      lastSubmittedProgram:x.lastSubmittedProgram?cleanProgram(x.lastSubmittedProgram):null,
      lastFailedSubmission:x.lastFailedSubmission?cleanProgram(x.lastFailedSubmission):null,
      position:x.position&&Number.isInteger(x.position.row)&&Number.isInteger(x.position.column)?x.position:{...CONFIG.start}
    };
  }catch{return fresh()}
})();
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}};
const telemetry=()=>{try{return parse(localStorage.getItem(TEL))||[]}catch{return[]}};
const sanitize=o=>{
  const banned=/name|nombre|apellido|email|school|colegio|teacher|profesor|phone|credential|password|token|ip|fingerprint|browser|device|free.?text/i;
  const walk=v=>{
    if(Array.isArray(v))return v.slice(0,100).map(walk);
    if(v&&typeof v==='object'){const z={};for(const[k,val]of Object.entries(v)){if(!banned.test(k))z[k]=walk(val)}return z}
    if(typeof v==='string')return v.slice(0,160);
    if(typeof v==='number'||typeof v==='boolean'||v===null)return v;
    return null;
  };
  return walk(o);
};
const emit=(event,payload={})=>{
  const entry=sanitize({event,condition:'GC',level:6,study_attempt_id:lifecycle,elapsed_ms:Math.max(0,now()-state.startedAt),...payload});
  try{
    const list=telemetry();list.push(entry);localStorage.setItem(TEL,JSON.stringify(list.slice(-400)));
    parent.postMessage({type:'apulab-control-n6-telemetry',event,payload:entry},location.origin);
  }catch{}
  return entry;
};
const firstAction=()=>{if(state.firstActionAt==null){state.firstActionAt=now();save();emit('first_action',{time_to_first_action_ms:state.firstActionAt-state.startedAt})}};
const sameProgram=(a,b)=>JSON.stringify(a||[])===JSON.stringify(b||[]);

function resetTaskState(){
  state.position={...CONFIG.start};
  state.scanCompleted=false;
  state.analysisCompleted=false;
  state.dataSent=false;
  state.lastTrajectory=[];
  state.lastFailure=null;
  state.feedback='';
  state.finalSuccess=false;
  state.timeToScienceZoneAt=null;
  state.scanCompletedAt=null;
  state.analyzeCompletedAt=null;
  state.communicationReachedAt=null;
  state.completedAt=null;
  state.completed=false;
  state.terminalEventEmitted=false;
}
function simulate(program){
  let row=CONFIG.start.row,column=CONFIG.start.column,dir=1;
  let scanCompleted=false,analysisCompleted=false,dataSent=false;
  let failure=null;
  let scienceReachedAt=null,scanAt=null,analyzeAt=null,communicationAt=null;
  const trajectory=[{step:0,row,column,orientation:OR[dir],command:null,top:null}];
  const events=[];
  const expanded=expand(program);
  const at=(p)=>row===p.row&&column===p.column;
  const noteCheckpoint=()=>{
    if(at(CONFIG.science)&&scienceReachedAt==null){scienceReachedAt=now();events.push({event:'science_zone_reached',payload:{row,column}})}
    if(at(CONFIG.communication)&&communicationAt==null){communicationAt=now();events.push({event:'communication_point_reached',payload:{row,column}})}
  };
  noteCheckpoint();
  for(let i=0;i<expanded.length;i++){
    const step=expanded[i],cmd=step.cmd;
    if(cmd==='left')dir=(dir+3)%4;
    else if(cmd==='right')dir=(dir+1)%4;
    else if(cmd==='forward'){
      const nr=row+D[dir][0],nc=column+D[dir][1];
      if(nr<0||nr>=8||nc<0||nc>=8){failure={code:'EDGE',stepIndex:i+1,top:step.top,command:cmd};break}
      if(OB.has(`${nr}:${nc}`)){failure={code:'BLOCKED',stepIndex:i+1,top:step.top,command:cmd,row:nr,column:nc};break}
      row=nr;column=nc;noteCheckpoint();
    }else if(cmd==='scan'){
      events.push({event:'scan_started',payload:{row,column}});
      if(!at(CONFIG.science)){failure={code:'SCAN_OUTSIDE_SCIENCE_ZONE',stepIndex:i+1,top:step.top,command:cmd};events.push({event:'premature_action',payload:{attempted_action:'scan',reason:'outside_scientific_zone',row,column}});break}
      if(!scanCompleted){scanCompleted=true;scanAt=now();events.push({event:'science_action',payload:{action:'scan',valid:true,row,column}});events.push({event:'scan_completed',payload:{row,column}})}
    }else if(cmd==='analyze'){
      events.push({event:'analyze_started',payload:{row,column}});
      if(!scanCompleted){failure={code:'ANALYZE_BEFORE_SCAN',stepIndex:i+1,top:step.top,command:cmd};events.push({event:'premature_action',payload:{attempted_action:'analyze',reason:'scan_required',row,column}});break}
      if(!at(CONFIG.science)){failure={code:'ANALYZE_OUTSIDE_SCIENCE_ZONE',stepIndex:i+1,top:step.top,command:cmd};events.push({event:'premature_action',payload:{attempted_action:'analyze',reason:'outside_scientific_zone',row,column}});break}
      if(!analysisCompleted){analysisCompleted=true;analyzeAt=now();events.push({event:'science_action',payload:{action:'analyze',valid:true,row,column}});events.push({event:'analyze_completed',payload:{row,column,result:'zone_of_interest_identified'}})}
    }else if(cmd==='send'){
      if(!analysisCompleted){failure={code:'SEND_BEFORE_ANALYZE',stepIndex:i+1,top:step.top,command:cmd};events.push({event:'premature_action',payload:{attempted_action:'send',reason:'analysis_required',row,column}});break}
      if(!at(CONFIG.communication)){failure={code:'SEND_OUTSIDE_COMMUNICATION_POINT',stepIndex:i+1,top:step.top,command:cmd};events.push({event:'premature_action',payload:{attempted_action:'send',reason:'outside_communication_point',row,column}});break}
      if(!dataSent){dataSent=true;events.push({event:'science_action',payload:{action:'send',valid:true,row,column}});events.push({event:'data_sent',payload:{row,column}})}
    }
    trajectory.push({step:i+1,row,column,orientation:OR[dir],command:cmd,top:step.top});
  }
  const finalAtCommunication=row===CONFIG.communication.row&&column===CONFIG.communication.column;
  const completed=!failure&&scanCompleted&&analysisCompleted&&dataSent&&finalAtCommunication;
  return{
    row,column,orientation:OR[dir],scanCompleted,analysisCompleted,dataSent,failure,trajectory,events,
    scienceReachedAt,scanAt,analyzeAt,communicationAt,completed,finalAtCommunication
  };
}
const feedbackFor=result=>{
  if(result.failure){
    return({
      EDGE:'La secuencia intenta salir del tablero. Revisa el bloque señalado y corrige el programa.',
      BLOCKED:'La secuencia intenta entrar en una celda bloqueada. Revisa el bloque señalado y corrige el programa.',
      SCAN_OUTSIDE_SCIENCE_ZONE:'ESCANEAR solo es válido cuando el marcador está en la zona científica.',
      ANALYZE_BEFORE_SCAN:'ANALIZAR necesita un ESCANEAR válido previo.',
      ANALYZE_OUTSIDE_SCIENCE_ZONE:'ANALIZAR debe ejecutarse mientras el marcador permanece en la zona científica.',
      SEND_BEFORE_ANALYZE:'ENVIAR DATOS necesita un análisis válido previo.',
      SEND_OUTSIDE_COMMUNICATION_POINT:'ENVIAR DATOS solo es válido desde el punto de comunicación.'
    })[result.failure.code]||'La secuencia no puede continuar. Revisa el bloque señalado.';
  }
  if(result.dataSent&&!result.finalAtCommunication)return'Los datos se enviaron, pero la ejecución debe terminar en el punto de comunicación.';
  if(result.scanCompleted&&result.analysisCompleted&&!result.dataSent)return'El dato fue obtenido e interpretado. Aún falta comunicar el resultado desde el punto de comunicación.';
  if(result.scanCompleted&&!result.analysisCompleted)return'DATO OBTENIDO. Aún falta interpretar el dato.';
  if(result.finalAtCommunication&&!result.dataSent)return'El marcador llegó al punto de comunicación, pero llegar no envía los datos automáticamente.';
  if(!result.scanCompleted)return'La ejecución terminó sin obtener un dato válido en la zona científica.';
  return'La investigación todavía no cumple todas las condiciones.';
};

document.title='ApuLab Control · Actividad 6 · Investigar';
document.documentElement.dataset.apulabControl='n6';
document.body.classList.add('apulab-control-n6-active');
[...document.body.children].filter(x=>x.tagName!=='SCRIPT').forEach(x=>{x.setAttribute('aria-hidden','true');x.style.setProperty('display','none','important')});

const layer=document.createElement('section');
layer.id='apulab-control-n6';
layer.innerHTML=`
<header class="n6-head">
  <div><span>ACTIVIDAD 6 DE 7 · INVESTIGAR</span><h1>Obtén, interpreta y comunica un resultado</h1><p>INVESTIGA LA ZONA Y ENVÍA EL RESULTADO</p></div>
  <button id="n6-help" class="n6-btn secondary">AYUDA</button>
</header>
<main class="n6-main">
  <section class="n6-panel board-panel">
    <div class="panel-title"><strong>ESPACIO DE TRABAJO · 8 × 8</strong><span id="n6-state-summary">LISTO</span></div>
    <div id="n6-board" class="n6-board" role="grid" aria-label="Cuadrícula científica 8 por 8"></div>
    <div class="n6-legend"><span><i class="science-key"></i>ZONA CIENTÍFICA</span><span><i class="comm-key"></i>COMUNICACIÓN</span><span><i class="ob-key"></i>BLOQUEO</span></div>
  </section>
  <aside class="n6-panel editor-panel">
    <div class="panel-title"><strong>PROGRAMA</strong><span id="n6-count">0 / 30</span></div>
    <ol id="n6-program" class="n6-program"></ol>
    <button id="n6-clear" class="n6-btn secondary full">LIMPIAR</button>
  </aside>
</main>
<section class="n6-controls" aria-label="Comandos">
  <div class="n6-command-group"><strong>MOVIMIENTO</strong>
    <button class="n6-cmd" data-cmd="forward">AVANZAR</button>
    <button class="n6-cmd" data-cmd="left">GIRAR IZQ.</button>
    <button class="n6-cmd" data-cmd="right">GIRAR DER.</button>
  </div>
  <div class="n6-command-group"><strong>CONTROL</strong><button id="n6-add-repeat" class="n6-cmd">REPETIR × N</button></div>
  <div class="n6-command-group science"><strong>CIENCIA</strong>
    <button class="n6-cmd" data-cmd="scan">ESCANEAR</button>
    <button class="n6-cmd" data-cmd="analyze">ANALIZAR</button>
    <button class="n6-cmd" data-cmd="send">ENVIAR DATOS</button>
  </div>
  <button id="n6-submit" class="n6-btn primary">COMPROBAR</button>
</section>
<div id="n6-feedback" class="n6-feedback" role="status"></div>
<aside id="n6-help-panel" class="n6-help" hidden>
  <div><h2>AYUDA</h2>
    <p><strong>Movimiento:</strong> AVANZAR mueve una celda. Los giros cambian la orientación 90° sin desplazamiento. REPETIR ejecuta varias veces las instrucciones colocadas dentro.</p>
    <p><strong>Ciencia:</strong> ESCANEAR obtiene información únicamente en la zona científica. ANALIZAR requiere un escaneo válido y debe realizarse en esa zona. ENVIAR DATOS requiere un análisis válido y solo funciona desde el punto de comunicación.</p>
    <p>Llegar a un punto no ejecuta una acción científica automáticamente. Revisa el estado, interpreta el mensaje y modifica tu programa cuando sea necesario.</p>
  </div>
  <button id="n6-help-close" class="n6-btn secondary">CERRAR</button>
</aside>
<div id="n6-complete" class="n6-complete" hidden>
  <div class="card"><h2>ACTIVIDAD COMPLETADA</h2><p>DATO OBTENIDO · RESULTADO INTERPRETADO · RESULTADO ENVIADO</p><button id="n6-continue" class="n6-btn primary">CONTINUAR</button></div>
</div>`;
document.body.appendChild(layer);

const $=id=>document.getElementById(id);
const board=$('n6-board'),programEl=$('n6-program'),feedback=$('n6-feedback');
const labels={forward:'AVANZAR',left:'GIRAR IZQ.',right:'GIRAR DER.',scan:'ESCANEAR',analyze:'ANALIZAR',send:'ENVIAR DATOS'};
const arrows={NORTH:'↑',EAST:'→',SOUTH:'↓',WEST:'←'};

function renderBoard(){
  board.innerHTML='';
  const path=new Set((state.lastTrajectory||[]).map(x=>`${x.row}:${x.column}`));
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    const cell=document.createElement('div');cell.className='n6-cell';cell.dataset.row=r;cell.dataset.column=c;cell.setAttribute('role','gridcell');
    if(OB.has(`${r}:${c}`)){cell.classList.add('obstacle');cell.innerHTML='<small>BLOQ.</small>'}
    if(r===CONFIG.science.row&&c===CONFIG.science.column){cell.classList.add('science-zone');cell.innerHTML='<strong>ZONA<br>CIENTÍFICA</strong>'}
    if(r===CONFIG.communication.row&&c===CONFIG.communication.column){cell.classList.add('communication');cell.innerHTML='<strong>PUNTO DE<br>COMUNICACIÓN</strong>'}
    if(path.has(`${r}:${c}`))cell.classList.add('path');
    if(r===CONFIG.start.row&&c===CONFIG.start.column)cell.classList.add('start');
    if(r===state.position.row&&c===state.position.column){
      const marker=document.createElement('span');marker.className='position-marker';marker.textContent=arrows[state.position.orientation]||'•';marker.setAttribute('aria-label',`Posición actual orientada ${state.position.orientation}`);cell.appendChild(marker);
    }
    if(r===CONFIG.start.row&&c===CONFIG.start.column){const tag=document.createElement('small');tag.className='start-tag';tag.textContent='INICIO';cell.appendChild(tag)}
    board.appendChild(cell);
  }
}
function edit(kind,detail={}){
  if(state.completed)return;
  firstAction();state.programEditCount++;state.feedback='';
  save();emit('program_modified',{edit_type:kind,program_edit_count:state.programEditCount,block_count:topCount(state.program),...detail});render();
}
function renderProgram(){
  programEl.innerHTML='';
  if(!state.program.length){const empty=document.createElement('li');empty.className='empty';empty.textContent='Agrega bloques para construir un programa.';programEl.appendChild(empty)}
  state.program.forEach((it,i)=>{
    const li=document.createElement('li');li.className='n6-row';if(state.lastFailure?.top===i)li.classList.add('failed');
    if(it.type==='cmd')li.innerHTML=`<span class="num">${i+1}</span><strong>${labels[it.cmd]}</strong><span class="row-actions"><button data-up="${i}" aria-label="Subir bloque">↑</button><button data-down="${i}" aria-label="Bajar bloque">↓</button><button data-del="${i}" aria-label="Eliminar bloque">×</button></span>`;
    else li.innerHTML=`<span class="num">${i+1}</span><div class="repeat-card"><div class="repeat-head"><strong>REPETIR × <input data-count="${i}" type="number" min="2" max="9" value="${it.count}" aria-label="Cantidad de repeticiones"></strong><button data-del="${i}" aria-label="Eliminar REPETIR">×</button></div><div class="repeat-body">${it.body.map((b,j)=>`<span>${labels[b.cmd]} <button data-rdel="${i}:${j}" aria-label="Eliminar ${labels[b.cmd]} de REPETIR">×</button></span>`).join('')||'<em>Agrega instrucciones dentro de REPETIR</em>'}</div><div class="repeat-add">${Object.entries(labels).map(([cmd,label])=>`<button data-radd="${i}:${cmd}">+ ${label}</button>`).join('')}</div></div>`;
    programEl.appendChild(li);
  });
  $('n6-count').textContent=`${topCount(state.program)} / ${CONFIG.blockLimit}`;
  programEl.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{state.program.splice(+b.dataset.del,1);edit('remove')});
  programEl.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{const i=+b.dataset.up;if(i>0){[state.program[i-1],state.program[i]]=[state.program[i],state.program[i-1]];edit('reorder')}});
  programEl.querySelectorAll('[data-down]').forEach(b=>b.onclick=()=>{const i=+b.dataset.down;if(i<state.program.length-1){[state.program[i+1],state.program[i]]=[state.program[i],state.program[i+1]];edit('reorder')}});
  programEl.querySelectorAll('[data-count]').forEach(inp=>inp.onchange=()=>{const i=+inp.dataset.count,before=state.program[i].count;state.program[i].count=Math.max(2,Math.min(9,+inp.value||2));if(before!==state.program[i].count)edit('repeat_count',{repeat_n:state.program[i].count})});
  programEl.querySelectorAll('[data-radd]').forEach(b=>b.onclick=()=>{const[i,cmd]=b.dataset.radd.split(':');if(state.program[+i].body.length>=CONFIG.blockLimit)return;state.program[+i].body.push({type:'cmd',cmd});edit('repeat_body_add',{command:cmd})});
  programEl.querySelectorAll('[data-rdel]').forEach(b=>b.onclick=()=>{const[i,j]=b.dataset.rdel.split(':').map(Number);state.program[i].body.splice(j,1);edit('repeat_body_remove')});
}
function summary(){
  if(state.completed)return'COMPLETADO';
  if(state.dataSent)return'DATOS ENVIADOS';
  if(state.analysisCompleted)return'RESULTADO INTERPRETADO';
  if(state.scanCompleted)return'DATO OBTENIDO';
  if(state.lastFailure)return'REVISAR PROGRAMA';
  return'LISTO';
}
function render(){
  renderBoard();renderProgram();
  $('n6-state-summary').textContent=summary();
  feedback.textContent=state.feedback||'';
  $('n6-complete').hidden=!state.completed;
  document.querySelectorAll('.n6-cmd').forEach(b=>b.disabled=state.completed);
  $('n6-submit').disabled=state.completed||state.program.length===0;
  $('n6-clear').disabled=state.completed||(!state.program.length&&!state.lastFailure&&!state.scanCompleted&&!state.analysisCompleted&&!state.dataSent);
}
function addCmd(cmd){
  if(state.completed||!CMDS.has(cmd)||topCount(state.program)>=CONFIG.blockLimit)return;
  state.program.push({type:'cmd',cmd});edit('add',{command:cmd});
}
document.querySelectorAll('.n6-cmd[data-cmd]').forEach(b=>b.onclick=()=>addCmd(b.dataset.cmd));
$('n6-add-repeat').onclick=()=>{if(state.completed||topCount(state.program)>=CONFIG.blockLimit)return;state.program.push({type:'repeat',count:2,body:[]});edit('repeat_add')};
$('n6-clear').onclick=()=>{
  if(state.completed)return;
  const had=state.program.length||state.lastFailure||state.scanCompleted||state.analysisCompleted||state.dataSent;
  state.program=[];resetTaskState();state.lastSubmittedProgram=null;state.lastFailedSubmission=null;
  if(had){firstAction();state.programEditCount++;emit('program_modified',{edit_type:'clear',program_edit_count:state.programEditCount,block_count:0});emit('program_cleared',{})}
  save();render();
};
function structurallyRunnable(){
  if(!state.program.length)return false;
  return !state.program.some(x=>x.type==='repeat'&&x.body.length===0);
}
function applyResult(result,attemptNo){
  state.position={row:result.row,column:result.column,orientation:result.orientation};
  state.scanCompleted=result.scanCompleted;state.analysisCompleted=result.analysisCompleted;state.dataSent=result.dataSent;
  state.lastTrajectory=result.trajectory;state.lastFailure=result.failure?{...result.failure}:null;
  if(result.scienceReachedAt&&state.timeToScienceZoneAt==null)state.timeToScienceZoneAt=result.scienceReachedAt;
  if(result.scanAt&&state.scanCompletedAt==null)state.scanCompletedAt=result.scanAt;
  if(result.analyzeAt&&state.analyzeCompletedAt==null)state.analyzeCompletedAt=result.analyzeAt;
  if(result.communicationAt&&state.communicationReachedAt==null)state.communicationReachedAt=result.communicationAt;
  for(const item of result.events)emit(item.event,{attempt_number:attemptNo,...item.payload});
}
function terminal(){
  if(state.terminalEventEmitted)return false;
  state.terminalEventEmitted=true;
  emit('level_completed',{
    attempt_count:state.attemptCount,
    first_attempt_success:Boolean(state.firstAttemptSuccess),
    final_success:true,
    response_change_count:state.responseChangeCount,
    help_used:state.helpCount>0,
    help_count:state.helpCount,
    premature_action_count:telemetry().filter(x=>x.event==='premature_action').length,
    time_to_first_action_ms:state.firstActionAt==null?null:state.firstActionAt-state.startedAt,
    time_to_science_zone_ms:state.timeToScienceZoneAt==null?null:state.timeToScienceZoneAt-state.startedAt,
    time_scan_to_analyze_ms:state.scanCompletedAt&&state.analyzeCompletedAt?state.analyzeCompletedAt-state.scanCompletedAt:null,
    time_analysis_to_communication_ms:state.analyzeCompletedAt&&state.communicationReachedAt?state.communicationReachedAt-state.analyzeCompletedAt:null,
    completion_time_ms:state.completedAt-state.startedAt,
    program_edit_count:state.programEditCount,
    repeat_used:repeatCount(state.program)>0,
    repeat_instances:repeatCount(state.program),
    final_block_count:topCount(state.program),
    final_executable_command_count:executableCount(state.program)
  });
  save();
  return true;
}
$('n6-submit').onclick=()=>{
  if(state.completed)return;
  firstAction();
  if(!state.program.length){state.feedback='Agrega al menos un bloque antes de comprobar.';render();return}
  if(!structurallyRunnable()){state.feedback='Cada REPETIR necesita al menos una instrucción dentro. Corrige la estructura antes de ejecutar.';emit('feedback_shown',{reason:'empty_repeat_body'});save();render();return}
  if(state.lastFailedSubmission&& !sameProgram(state.lastFailedSubmission,state.program)){state.responseChangeCount++;emit('sequence_corrected',{response_change_count:state.responseChangeCount})}
  state.attemptCount++;
  const attemptNo=state.attemptCount;
  state.lastSubmittedProgram=clone(state.program);
  emit('program_started',{attempt_number:attemptNo,block_count:topCount(state.program),repeat_used:repeatCount(state.program)>0});
  const result=simulate(state.program);applyResult(result,attemptNo);
  const success=result.completed;
  if(state.firstAttemptSuccess==null)state.firstAttemptSuccess=success;
  if(!success){
    state.finalSuccess=false;state.lastFailedSubmission=clone(state.program);state.feedback=feedbackFor(result);
    emit('sequence_failed',{attempt_number:attemptNo,failure_code:result.failure?.code||(!result.finalAtCommunication&&result.dataSent?'FINAL_POSITION':'INCOMPLETE'),failed_step:result.failure?.stepIndex||null});
    emit('feedback_shown',{attempt_number:attemptNo,failure_code:result.failure?.code||'INCOMPLETE'});
    save();render();return;
  }
  state.finalSuccess=true;state.completed=true;state.completedAt=now();state.lastFailure=null;state.lastFailedSubmission=null;state.feedback='Actividad completada.';
  terminal();save();render();
};
$('n6-help').onclick=()=>{if(state.completed)return;firstAction();state.helpCount++;save();emit('help_requested',{help_count:state.helpCount});$('n6-help-panel').hidden=false};
$('n6-help-close').onclick=()=>{$('n6-help-panel').hidden=true};
$('n6-continue').onclick=()=>{if(parent!==window)parent.postMessage({type:'apulab-level-complete',level:6,nextLevel:7},location.origin);else location.href='/missions/mission01/level7.html'};

window.apulabControlN6QA={
  getState:()=>clone({...state,storageKey:KEY,telemetryKey:TEL,topBlockCount:topCount(state.program),executableCommandCount:executableCount(state.program),repeatInstances:repeatCount(state.program)}),
  telemetry:()=>clone(telemetry()),
  simulate:p=>simulate(cleanProgram(p)),
  invokeTerminal:()=>terminal()
};
if(!state.levelStartedEventEmitted){
  state.levelStartedEventEmitted=true;save();emit('level_started',{restored:false});
}
render();
})();
