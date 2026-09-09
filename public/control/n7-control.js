(()=>{
'use strict';
// APULAB_CONTROL_N7_V1
if(document.getElementById('apulab-control-n7'))return;

const CONFIG={
  grid:{rows:8,columns:8},
  start:{row:7,column:1,orientation:'NORTH'},
  sample:{row:2,column:5},
  final:{row:6,column:6},
  obstacles:[{row:6,column:3},{row:5,column:0},{row:4,column:7},{row:1,column:2}],
  blockLimit:30
};
const INSTRUMENTS={
  temperature:{id:'temperature',name:'TEMPERATURA',description:'Mide la temperatura de la muestra.',reading:'−58 °C',readingType:'temperature',relevant:false,
    interpretation:'Dato válido: conocemos la temperatura de la muestra, pero este dato no determina la composición de materiales solicitada.'},
  proximity:{id:'proximity',name:'PROXIMIDAD',description:'Mide la distancia o proximidad de la muestra.',reading:'0.4 m',readingType:'distance',relevant:false,
    interpretation:'Dato válido: conocemos la proximidad de la muestra, pero este dato no determina los materiales que contiene.'},
  materials:{id:'materials',name:'ANALIZADOR DE MATERIALES',description:'Identifica los materiales presentes en la muestra.',reading:'HIERRO · SILICATOS',readingType:'composition',relevant:true,
    interpretation:'Este resultado proporciona evidencia sobre la composición material de la muestra.'}
};
const OR=['NORTH','EAST','SOUTH','WEST'];
const D=[[-1,0],[0,1],[1,0],[0,-1]];
const OB=new Set(CONFIG.obstacles.map(x=>`${x.row}:${x.column}`));
const CMDS=new Set(['forward','left','right','analyzeSample']);
const now=()=>Date.now();
const clone=x=>JSON.parse(JSON.stringify(x));
const parse=x=>{try{return JSON.parse(x)}catch{return null}};
const safe=x=>String(x||'').replace(/[^A-Za-z0-9._-]/g,'_').slice(0,80);
const lifecycle=(()=>{try{let v=sessionStorage.getItem('apulab.control.n7.lifecycle');if(!v){v=`n7-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;sessionStorage.setItem('apulab.control.n7.lifecycle',v)}return safe(v)}catch{return'n7-session'}})();
const KEY=`apulab.control.n7.state.v1.${lifecycle}`;
const TEL=`apulab.control.n7.telemetry.v1.${lifecycle}`;
const MAX_TELEMETRY=500;

const validItem=x=>x&&(
  (x.type==='cmd'&&CMDS.has(x.cmd))||
  (x.type==='repeat'&&Number.isInteger(x.count)&&x.count>=2&&x.count<=9&&Array.isArray(x.body)&&x.body.every(y=>y?.type==='cmd'&&CMDS.has(y.cmd)))
);
const cleanProgram=x=>Array.isArray(x)?x.filter(validItem).slice(0,CONFIG.blockLimit).map(clone):[];
const topCount=p=>p.length;
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
  position:{...CONFIG.start},
  attemptCount:0,
  programEditCount:0,
  responseChangeCount:0,
  helpCount:0,
  firstAttemptSuccess:null,
  finalSuccess:false,
  startedAt:now(),
  firstActionAt:null,
  firstInstrumentChoiceAt:null,
  relevantChoiceAt:null,
  completedAt:null,
  lastSubmittedProgram:null,
  lastFailedSubmission:null,
  lastFailure:null,
  pendingExecution:null,
  correctionMode:false,
  sampleReached:false,
  instrumentPanelOpen:false,
  resultPanelOpen:false,
  selectedInstrument:null,
  firstInstrument:null,
  finalInstrument:null,
  instrumentSelectionCount:0,
  instrumentChangeCount:0,
  changedAfterIrrelevantFeedback:false,
  hadIrrelevantFeedback:false,
  observedResults:[],
  relevantInstrumentUsed:false,
  finalPointReached:false,
  completed:false,
  missionFinalized:false,
  levelStartedEventEmitted:false,
  terminalEventEmitted:false,
  missionCompletedEventEmitted:false,
  feedback:''
});
let state=(()=>{
  try{
    const x=parse(localStorage.getItem(KEY));
    if(!x||x.version!==1)return fresh();
    const p=x.position&&Number.isInteger(x.position.row)&&Number.isInteger(x.position.column)&&OR.includes(x.position.orientation)
      ?x.position:{...CONFIG.start};
    return{
      ...fresh(),...x,
      program:cleanProgram(x.program),
      lastSubmittedProgram:x.lastSubmittedProgram?cleanProgram(x.lastSubmittedProgram):null,
      lastFailedSubmission:x.lastFailedSubmission?cleanProgram(x.lastFailedSubmission):null,
      position:p,
      observedResults:Array.isArray(x.observedResults)?x.observedResults.filter(v=>v&&INSTRUMENTS[v.instrument]).slice(-12):[],
      pendingExecution:x.pendingExecution&&Array.isArray(x.pendingExecution.expanded)?x.pendingExecution:null
    };
  }catch{return fresh()}
})();
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}};
const telemetry=()=>{try{return parse(localStorage.getItem(TEL))||[]}catch{return[]}};
const sanitize=o=>{
  const banned=/name|nombre|apellido|email|school|colegio|teacher|profesor|phone|credential|password|token|(^|_)ip($|_)|fingerprint|browser|device|free.?text|identity/i;
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
  const entry=sanitize({event,condition:'GC',level:7,study_attempt_id:lifecycle,elapsed_ms:Math.max(0,now()-state.startedAt),...payload});
  try{
    const list=telemetry();list.push(entry);localStorage.setItem(TEL,JSON.stringify(list.slice(-MAX_TELEMETRY)));
    parent.postMessage({type:'apulab-control-n7-telemetry',event,payload:entry},location.origin);
  }catch{}
  return entry;
};
const firstAction=()=>{if(state.firstActionAt==null){state.firstActionAt=now();save();emit('first_action',{time_to_first_action_ms:state.firstActionAt-state.startedAt})}};
const sameProgram=(a,b)=>JSON.stringify(a||[])===JSON.stringify(b||[]);
const at=(p)=>state.position.row===p.row&&state.position.column===p.column;
const sampleDistance=()=>Math.abs(state.position.row-CONFIG.sample.row)+Math.abs(state.position.column-CONFIG.sample.column);
const isAdjacentToSample=()=>sampleDistance()===1;
const isFinal=()=>at(CONFIG.final);

function persistPosition(row,column,dir){
  state.position={row,column,orientation:OR[dir]};
  if(isAdjacentToSample()&&!state.sampleReached){
    state.sampleReached=true;
    emit('sample_reached',{row,column,distance:1});
  }
  if(isFinal()&&!state.finalPointReached){
    state.finalPointReached=true;
    emit('final_point_reached',{row,column,relevant_data_obtained:state.relevantInstrumentUsed});
  }
  save();
}
function resetExecutionPosition(){
  state.position={...CONFIG.start};
  state.sampleReached=false;
  state.finalPointReached=false;
  state.lastFailure=null;
  state.pendingExecution=null;
  state.correctionMode=false;
}
function structuralError(){
  if(!state.program.length)return'EMPTY_PROGRAM';
  if(state.program.some(x=>x.type==='repeat'&&!x.body.length))return'EMPTY_REPEAT';
  return null;
}
function failRun(code,step,extra={}){
  state.lastFailure={code,top:step?.top??null,repeatBody:step?.repeatBody??null,...extra};
  state.correctionMode=true;
  state.pendingExecution=null;
  state.finalSuccess=false;
  state.lastFailedSubmission=clone(state.program);
  state.feedback=({
    EDGE:'La secuencia intenta salir del tablero. Revisa la instrucción señalada y ajusta el programa.',
    BLOCKED:'La secuencia intenta entrar en una celda bloqueada. Revisa la instrucción señalada y ajusta el programa.',
    ANALYZE_AWAY_FROM_SAMPLE:'ANALIZAR MUESTRA solo puede ejecutarse desde una celda adyacente a la muestra.'
  })[code]||'La secuencia no puede continuar. Revisa la instrucción señalada.';
  emit('sequence_failed',{failure_code:code,top_index:state.lastFailure.top,program_preserved:true,...extra});
  emit('feedback_shown',{feedback_code:code});
  save();render();
}
function walkSteps(expanded,startIndex=0){
  let row=state.position.row,column=state.position.column,dir=OR.indexOf(state.position.orientation);
  if(dir<0)dir=0;
  for(let i=startIndex;i<expanded.length;i++){
    const step=expanded[i],cmd=step.cmd;
    if(cmd==='left')dir=(dir+3)%4;
    else if(cmd==='right')dir=(dir+1)%4;
    else if(cmd==='forward'){
      const nr=row+D[dir][0],nc=column+D[dir][1];
      if(nr<0||nr>=8||nc<0||nc>=8){persistPosition(row,column,dir);failRun('EDGE',step,{step_index:i+1});return false}
      if(OB.has(`${nr}:${nc}`)){persistPosition(row,column,dir);failRun('BLOCKED',step,{step_index:i+1,row:nr,column:nc});return false}
      row=nr;column=nc;persistPosition(row,column,dir);
    }else if(cmd==='analyzeSample'){
      persistPosition(row,column,dir);
      emit('sample_analyze_requested',{adjacent:isAdjacentToSample(),row,column});
      if(!isAdjacentToSample()){emit('premature_action',{attempted_action:'analyze_sample',reason:'not_adjacent_to_sample',row,column});failRun('ANALYZE_AWAY_FROM_SAMPLE',step,{step_index:i+1,row,column});return false}
      state.pendingExecution={expanded:clone(expanded),nextIndex:i+1};
      state.instrumentPanelOpen=true;
      state.resultPanelOpen=false;
      state.feedback='Selecciona un instrumento y observa el dato que produce.';
      emit('instrument_panel_opened',{selection_order:state.instrumentSelectionCount+1});
      save();render();return false;
    }
  }
  persistPosition(row,column,dir);
  state.pendingExecution=null;
  if(state.relevantInstrumentUsed&&isFinal())return completeLevel();
  state.finalSuccess=false;
  state.feedback=state.relevantInstrumentUsed
    ?'Ya tienes evidencia sobre la composición. Aún debes terminar en el punto final.'
    :'La ejecución terminó sin obtener evidencia suficiente sobre la composición de la muestra.';
  if(isFinal()&&!state.relevantInstrumentUsed)emit('premature_action',{attempted_action:'complete_at_final_point',reason:'relevant_data_required'});
  state.lastFailedSubmission=clone(state.program);
  save();render();return false;
}
function submit(){
  firstAction();
  const structural=structuralError();
  if(structural){
    state.feedback=structural==='EMPTY_PROGRAM'?'Agrega al menos una instrucción antes de comprobar.':'Cada REPETIR necesita al menos una instrucción dentro.';
    emit('premature_action',{attempted_action:'submit',reason:structural.toLowerCase(),attempt_count:state.attemptCount});
    save();render();return;
  }
  if(state.correctionMode){
    state.correctionMode=false;
    state.lastFailure=null;
    state.feedback='Programa conservado. Ajusta lo necesario y vuelve a comprobar.';
    save();render();return;
  }
  if(state.lastFailedSubmission&&!sameProgram(state.lastFailedSubmission,state.program))state.responseChangeCount+=1;
  state.attemptCount+=1;
  const expanded=expand(state.program);
  state.lastSubmittedProgram=clone(state.program);
  state.lastFailure=null;
  state.pendingExecution=null;
  state.position={...CONFIG.start};
  state.sampleReached=false;
  state.finalPointReached=false;
  const metrics={attempt_count:state.attemptCount,top_blocks:topCount(state.program),executable_blocks:expanded.length,repeat_used:repeatCount(state.program)>0,repeat_instances:repeatCount(state.program)};
  emit('program_started',metrics);
  save();
  walkSteps(expanded,0);
}
function resumeExecution(){
  const pending=state.pendingExecution;
  state.instrumentPanelOpen=false;state.resultPanelOpen=false;
  if(!pending){save();render();return}
  const copy=clone(pending);
  state.pendingExecution=null;
  save();render();
  walkSteps(copy.expanded,copy.nextIndex);
}
function selectInstrument(id){
  firstAction();
  const instrument=INSTRUMENTS[id];if(!instrument)return;
  const previous=state.selectedInstrument;
  if(previous&&previous!==id){
    state.instrumentChangeCount+=1;
    emit('instrument_changed',{from_instrument:previous,to_instrument:id,instrument_change_count:state.instrumentChangeCount,changed_after_irrelevant_feedback:state.hadIrrelevantFeedback});
  }
  state.selectedInstrument=id;
  state.finalInstrument=id;
  state.instrumentSelectionCount+=1;
  if(!state.firstInstrument){state.firstInstrument=id;state.firstInstrumentChoiceAt=now()}
  if(state.hadIrrelevantFeedback&&previous!==id)state.changedAfterIrrelevantFeedback=true;
  state.observedResults.push({instrument:id,reading:instrument.reading,relevant:instrument.relevant});
  emit('instrument_selected',{instrument_type:id,selection_order:state.instrumentSelectionCount,relevant_to_question:instrument.relevant,reading_type:instrument.readingType,strategy_changed:Boolean(previous&&previous!==id)});
  emit('sample_analyzed',{instrument_type:id,reading_type:instrument.readingType,relevant_to_question:instrument.relevant});
  if(instrument.relevant){
    if(!state.relevantInstrumentUsed){state.relevantChoiceAt=now();emit('relevant_instrument_selected',{instrument_type:id,selection_order:state.instrumentSelectionCount,time_to_relevant_choice_ms:state.relevantChoiceAt-state.startedAt})}
    state.relevantInstrumentUsed=true;
  }else{
    state.hadIrrelevantFeedback=true;
  }
  state.instrumentPanelOpen=false;
  state.resultPanelOpen=true;
  state.feedback=instrument.interpretation;
  save();render();
}
function changeInstrument(){
  firstAction();
  state.resultPanelOpen=false;
  state.instrumentPanelOpen=true;
  emit('instrument_panel_opened',{selection_order:state.instrumentSelectionCount+1,strategy_change:true});
  save();render();
}
function continueAfterResult(){
  firstAction();
  resumeExecution();
}
function completeLevel(){
  if(!state.relevantInstrumentUsed||!isFinal())return false;
  state.completed=true;
  state.finalSuccess=true;
  state.completedAt??=now();
  if(state.firstAttemptSuccess===null)state.firstAttemptSuccess=state.attemptCount===1;
  state.feedback='Actividad completada. La evidencia relevante fue obtenida y el programa terminó en el punto final.';
  if(!state.terminalEventEmitted){
    state.terminalEventEmitted=true;
    const payload={
      attempt_count:state.attemptCount,
      first_attempt_success:Boolean(state.firstAttemptSuccess),
      final_success:true,
      response_change_count:state.responseChangeCount,
      help_used:state.helpCount>0,
      help_count:state.helpCount,
      program_edit_count:state.programEditCount,
      instrument_first:state.firstInstrument,
      instrument_final:state.finalInstrument,
      instrument_selection_count:state.instrumentSelectionCount,
      instrument_change_count:state.instrumentChangeCount,
      changed_after_irrelevant_feedback:state.changedAfterIrrelevantFeedback,
      time_to_first_action_ms:state.firstActionAt==null?null:state.firstActionAt-state.startedAt,
      time_to_first_instrument_choice_ms:state.firstInstrumentChoiceAt==null?null:state.firstInstrumentChoiceAt-state.startedAt,
      time_to_relevant_choice_ms:state.relevantChoiceAt==null?null:state.relevantChoiceAt-state.startedAt,
      completion_time_ms:state.completedAt-state.startedAt,
      repeat_used:repeatCount(state.program)>0,
      repeat_instances:repeatCount(state.program),
      final_block_count:topCount(state.program),
      final_position:{row:state.position.row,column:state.position.column}
    };
    emit('level_completed',payload);
  }
  save();render();return true;
}
function finalizeMission(){
  firstAction();
  if(!state.completed)return;
  state.missionFinalized=true;
  if(!state.missionCompletedEventEmitted){
    state.missionCompletedEventEmitted=true;
    emit('mission_completed',{final_success:true,completed_level:7,no_next_level:true});
    try{parent.postMessage({type:'apulab-mission-complete',mission:1,level:7},location.origin)}catch{}
  }
  save();render();
}
function mutate(fn,kind='edit'){
  if(state.completed)return;
  firstAction();
  const wasCorrection=state.correctionMode;
  fn();
  if(wasCorrection){
    state.correctionMode=false;
    state.lastFailure=null;
    emit('sequence_corrected',{edit_kind:kind,program_preserved:true});
  }
  state.program=cleanProgram(state.program);
  state.programEditCount+=1;
  emit('program_modified',{edit_kind:kind,program_edit_count:state.programEditCount,top_blocks:topCount(state.program),repeat_used:repeatCount(state.program)>0});
  save();render();
}
function addCmd(cmd){if(CMDS.has(cmd)&&topCount(state.program)<CONFIG.blockLimit)mutate(()=>state.program.push({type:'cmd',cmd}),'add')}
function addRepeat(){if(topCount(state.program)<CONFIG.blockLimit)mutate(()=>state.program.push({type:'repeat',count:2,body:[]}),'add_repeat')}
function removeTop(i){mutate(()=>state.program.splice(i,1),'remove')}
function moveTop(i,d){const j=i+d;if(j<0||j>=state.program.length)return;mutate(()=>{const[x]=state.program.splice(i,1);state.program.splice(j,0,x)},'reorder')}
function setRepeat(i,count){mutate(()=>{const x=state.program[i];if(x?.type==='repeat')x.count=Math.max(2,Math.min(9,Number(count)||2))},'repeat_count')}
function addRepeatBody(i,cmd){if(!CMDS.has(cmd))return;mutate(()=>{const x=state.program[i];if(x?.type==='repeat'&&x.body.length<12)x.body.push({type:'cmd',cmd})},'repeat_body_add')}
function removeRepeatBody(i,j){mutate(()=>{const x=state.program[i];if(x?.type==='repeat')x.body.splice(j,1)},'repeat_body_remove')}
function clearProgram(){mutate(()=>{state.program=[];state.lastFailure=null;state.correctionMode=false;state.pendingExecution=null;state.instrumentPanelOpen=false;state.resultPanelOpen=false;resetExecutionPosition()},'clear');emit('program_cleared',{})}

document.title='ApuLab Control · Actividad 7 · La muestra desconocida';
document.documentElement.dataset.apulabControl='n7';
document.body.classList.add('apulab-control-n7-active');
[...document.body.children].filter(x=>x.tagName!=='SCRIPT').forEach(x=>{x.setAttribute('aria-hidden','true');x.style.setProperty('display','none','important')});
try{document.querySelectorAll('audio,video').forEach(m=>{m.pause?.();m.muted=true})}catch{}

const layer=document.createElement('section');
layer.id='apulab-control-n7';
layer.innerHTML=`
<header class="n7-head">
  <div><span>ACTIVIDAD 7 DE 7 · LA MUESTRA DESCONOCIDA</span><h1>Elige el instrumento según el dato que necesitas</h1><p>Pregunta científica: ¿De qué material está hecha esta piedra?</p></div>
  <button id="n7-help" class="n7-btn secondary">AYUDA</button>
</header>
<main class="n7-main">
  <section class="n7-panel board-panel">
    <div class="panel-title"><strong>ESPACIO DE TRABAJO · 8 × 8</strong><span id="n7-state-summary">LISTO</span></div>
    <div id="n7-board" class="n7-board" role="grid" aria-label="Cuadrícula científica 8 por 8"></div>
    <div class="n7-legend"><span><i class="sample-key"></i>MUESTRA</span><span><i class="final-key"></i>PUNTO FINAL</span><span><i class="ob-key"></i>BLOQUEO</span></div>
  </section>
  <aside class="n7-panel editor-panel">
    <div class="panel-title"><strong>PROGRAMA</strong><span id="n7-count">0 / 30</span></div>
    <ol id="n7-program" class="n7-program"></ol>
    <button id="n7-clear" class="n7-btn secondary full">LIMPIAR</button>
  </aside>
</main>
<section class="n7-controls" aria-label="Comandos">
  <div class="n7-command-group"><strong>MOVIMIENTO</strong>
    <button class="n7-cmd" data-cmd="forward">AVANZAR</button>
    <button class="n7-cmd" data-cmd="left">GIRAR IZQ.</button>
    <button class="n7-cmd" data-cmd="right">GIRAR DER.</button>
  </div>
  <div class="n7-command-group"><strong>CONTROL</strong><button id="n7-add-repeat" class="n7-cmd">REPETIR × N</button></div>
  <div class="n7-command-group science"><strong>CIENCIA</strong><button class="n7-cmd" data-cmd="analyzeSample">ANALIZAR MUESTRA</button></div>
  <button id="n7-submit" class="n7-btn primary">COMPROBAR</button>
</section>
<div id="n7-feedback" class="n7-feedback" role="status"></div>
<aside id="n7-help-panel" class="n7-help" hidden>
  <div><h2>AYUDA</h2>
    <p><strong>Programa:</strong> AVANZAR mueve una celda; los giros cambian la orientación 90°; REPETIR ejecuta varias veces las instrucciones colocadas dentro.</p>
    <p><strong>Muestra:</strong> ANALIZAR MUESTRA funciona únicamente desde una celda adyacente a la muestra.</p>
    <p><strong>Instrumentos:</strong> TEMPERATURA mide temperatura; PROXIMIDAD mide distancia o proximidad; ANALIZADOR DE MATERIALES identifica materiales presentes.</p>
    <p>Observa el dato que produce cada instrumento y decide si responde la pregunta científica. La ayuda no indica una ruta ni selecciona un instrumento por ti.</p>
    <button id="n7-help-close" class="n7-btn secondary">CERRAR</button>
  </div>
</aside>
<section id="n7-instruments" class="n7-modal" hidden>
  <div class="card instrument-card"><h2>Selecciona un instrumento</h2><p>Necesitamos saber de qué material está hecha esta piedra. ¿Qué instrumento es el más indicado?</p>
    <div class="instrument-grid">
      <button data-instrument="temperature"><strong>TEMPERATURA</strong><span>Mide la temperatura de la muestra.</span></button>
      <button data-instrument="proximity"><strong>PROXIMIDAD</strong><span>Mide la distancia o proximidad de la muestra.</span></button>
      <button data-instrument="materials"><strong>ANALIZADOR DE MATERIALES</strong><span>Identifica los materiales presentes en la muestra.</span></button>
    </div>
  </div>
</section>
<section id="n7-result" class="n7-modal" hidden>
  <div class="card result-card"><h2>RESULTADO</h2><strong id="n7-result-reading"></strong><p id="n7-result-interpretation"></p>
    <div class="result-actions"><button id="n7-change-instrument" class="n7-btn secondary">CAMBIAR INSTRUMENTO</button><button id="n7-result-continue" class="n7-btn primary">CONTINUAR</button></div>
  </div>
</section>
<section id="n7-complete" class="n7-complete" hidden>
  <div class="card"><h2>ACTIVIDAD COMPLETADA</h2><p>Obtuviste evidencia sobre la composición y terminaste en el punto final.</p><button id="n7-finalize" class="n7-btn primary">FINALIZAR MISIÓN</button></div>
</section>`;
document.body.appendChild(layer);

const $=s=>layer.querySelector(s);
const label={forward:'AVANZAR',left:'GIRAR IZQ.',right:'GIRAR DER.',analyzeSample:'ANALIZAR MUESTRA'};
function renderBoard(){
  const board=$('#n7-board');board.innerHTML='';
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    const cell=document.createElement('div');cell.className='n7-cell';cell.setAttribute('role','gridcell');cell.dataset.row=String(r);cell.dataset.column=String(c);
    if(OB.has(`${r}:${c}`)){cell.classList.add('obstacle');cell.innerHTML='<strong>BLOQUEO</strong>'}
    if(r===CONFIG.sample.row&&c===CONFIG.sample.column){cell.classList.add('sample');cell.innerHTML='<strong>MUESTRA</strong><small>r2 · c5</small>'}
    if(r===CONFIG.final.row&&c===CONFIG.final.column){cell.classList.add('final');cell.innerHTML='<strong>PUNTO FINAL</strong><small>r6 · c6</small>'}
    if(r===CONFIG.start.row&&c===CONFIG.start.column){cell.classList.add('start');const t=document.createElement('small');t.className='start-tag';t.textContent='INICIO';cell.appendChild(t)}
    if(r===state.position.row&&c===state.position.column){
      const m=document.createElement('span');m.className='position-marker';m.textContent=({NORTH:'↑',EAST:'→',SOUTH:'↓',WEST:'←'})[state.position.orientation]||'↑';m.setAttribute('aria-label',`posición ${state.position.orientation}`);cell.appendChild(m);
    }
    board.appendChild(cell);
  }
}
function topRow(item,i){
  const li=document.createElement('li');li.className='n7-row';if(state.lastFailure?.top===i)li.classList.add('failed');
  const n=document.createElement('span');n.className='num';n.textContent=String(i+1);
  const body=document.createElement('div');
  const actions=document.createElement('div');actions.className='row-actions';
  const up=document.createElement('button');up.textContent='↑';up.title='Subir';up.onclick=()=>moveTop(i,-1);
  const down=document.createElement('button');down.textContent='↓';down.title='Bajar';down.onclick=()=>moveTop(i,1);
  const del=document.createElement('button');del.textContent='×';del.title='Eliminar';del.onclick=()=>removeTop(i);
  actions.append(up,down,del);
  if(item.type==='cmd'){body.innerHTML=`<strong>${label[item.cmd]}</strong>`}
  else{
    body.className='repeat-card';
    const head=document.createElement('div');head.className='repeat-head';head.innerHTML='<strong>REPETIR</strong>';
    const input=document.createElement('input');input.type='number';input.min='2';input.max='9';input.value=String(item.count);input.setAttribute('aria-label','Cantidad de repeticiones');input.onchange=()=>setRepeat(i,input.value);head.appendChild(input);
    const rb=document.createElement('div');rb.className='repeat-body';
    if(!item.body.length){const em=document.createElement('em');em.textContent='Agrega instrucciones al REPETIR';rb.appendChild(em)}
    item.body.forEach((x,j)=>{const s=document.createElement('span');s.textContent=label[x.cmd];const b=document.createElement('button');b.textContent='×';b.onclick=()=>removeRepeatBody(i,j);s.appendChild(b);rb.appendChild(s)});
    const add=document.createElement('div');add.className='repeat-add';
    for(const cmd of CMDS){const b=document.createElement('button');b.textContent=label[cmd];b.onclick=()=>addRepeatBody(i,cmd);add.appendChild(b)}
    body.append(head,rb,add);
  }
  li.append(n,body,actions);return li;
}
function renderProgram(){
  const ol=$('#n7-program');ol.innerHTML='';
  if(!state.program.length){const li=document.createElement('li');li.className='empty';li.textContent='Agrega instrucciones para construir el programa.';ol.appendChild(li)}
  state.program.forEach((x,i)=>ol.appendChild(topRow(x,i)));
  $('#n7-count').textContent=`${topCount(state.program)} / ${CONFIG.blockLimit}`;
}
function render(){
  renderBoard();renderProgram();
  const summary=$('#n7-state-summary');
  summary.textContent=state.completed?'COMPLETADO':state.correctionMode?'REVISAR':state.relevantInstrumentUsed?'EVIDENCIA OBTENIDA':state.sampleReached?'MUESTRA LOCALIZADA':'LISTO';
  $('#n7-feedback').textContent=state.feedback||'Construye un programa. ANALIZAR MUESTRA requiere estar adyacente a la muestra.';
  $('#n7-help-panel').hidden=true;
  $('#n7-instruments').hidden=!state.instrumentPanelOpen;
  $('#n7-result').hidden=!state.resultPanelOpen;
  if(state.resultPanelOpen&&state.selectedInstrument){
    const ins=INSTRUMENTS[state.selectedInstrument];
    $('#n7-result-reading').textContent=ins.reading;
    $('#n7-result-interpretation').textContent=ins.interpretation;
  }
  $('#n7-complete').hidden=!state.completed;
  const fin=$('#n7-finalize');
  fin.textContent=state.missionFinalized?'MISIÓN COMPLETADA':'FINALIZAR MISIÓN';
  fin.disabled=state.missionFinalized;
  $('#n7-submit').textContent=state.correctionMode?'AJUSTAR PROGRAMA':'COMPROBAR';
  const disabled=state.completed;
  layer.querySelectorAll('.n7-cmd,#n7-clear,#n7-submit').forEach(b=>b.disabled=disabled);
}
layer.querySelectorAll('.n7-cmd[data-cmd]').forEach(b=>b.addEventListener('click',()=>addCmd(b.dataset.cmd)));
$('#n7-add-repeat').onclick=addRepeat;
$('#n7-clear').onclick=clearProgram;
$('#n7-submit').onclick=submit;
$('#n7-help').onclick=()=>{firstAction();state.helpCount+=1;emit('help_requested',{help_count:state.helpCount});save();$('#n7-help-panel').hidden=false};
$('#n7-help-close').onclick=()=>{$('#n7-help-panel').hidden=true};
layer.querySelectorAll('[data-instrument]').forEach(b=>b.addEventListener('click',()=>selectInstrument(b.dataset.instrument)));
$('#n7-change-instrument').onclick=changeInstrument;
$('#n7-result-continue').onclick=continueAfterResult;
$('#n7-finalize').onclick=finalizeMission;

if(!state.levelStartedEventEmitted){
  state.levelStartedEventEmitted=true;
  emit('level_started',{question_id:'material_composition',grid_rows:8,grid_columns:8});
  save();
}
if(state.completed&&!state.terminalEventEmitted)completeLevel();
render();

window.apulabControlN7QA={
  getState:()=>clone(state),
  getTelemetry:()=>clone(telemetry()),
  getLifecycle:()=>lifecycle,
  config:clone(CONFIG),
  instruments:clone(INSTRUMENTS),
  actions:{addCmd,addRepeat,submit,selectInstrument,changeInstrument,continueAfterResult,finalizeMission},
  clearLifecycle:()=>{try{localStorage.removeItem(KEY);localStorage.removeItem(TEL);sessionStorage.removeItem('apulab.control.n7.lifecycle')}catch{}}
};
})();