const { chromium } = require('playwright');
const { mkdir, writeFile } = require('node:fs/promises');
const { resolve } = require('node:path');

const BASE_URL=process.env.APULAB_BASE_URL||'http://127.0.0.1:4173';
const OUT=resolve(process.cwd(),'test-results/n7-control');
const errors=[];
let browser,context,page;
const assert=(v,m)=>{if(!v)throw new Error(m)};
const banned=/name|nombre|apellido|email|school|colegio|teacher|profesor|phone|credential|password|token|(^|_)ip($|_)|fingerprint|browser|device|free.?text|identity/i;

async function fresh(){
  if(context)await context.close();
  context=await browser.newContext({viewport:{width:1672,height:941},reducedMotion:'reduce'});
  await context.addInitScript(()=>{
    window.__n7ControlMessages=[];
    window.addEventListener('message',e=>{if(e?.data?.type==='apulab-control-n7-telemetry')window.__n7ControlMessages.push(e.data)});
  });
  page=await context.newPage();
  page.on('pageerror',e=>errors.push(`pageerror: ${e.stack||e}`));
  page.on('console',m=>{if(m.type()==='error')errors.push(`console.error: ${m.text()}`)});
  await page.goto(`${BASE_URL}/missions/mission01/level7.html`,{waitUntil:'networkidle'});
  await page.locator('#apulab-control-n7').waitFor({state:'visible',timeout:12000});
}
async function state(){return page.evaluate(()=>window.apulabControlN7QA?.getState?.())}
async function telemetry(){return page.evaluate(()=>window.apulabControlN7QA?.getTelemetry?.())}
async function messages(){return page.evaluate(()=>window.__n7ControlMessages||[])}
async function shot(name){await page.screenshot({path:resolve(OUT,`${name}.png`),fullPage:true})}
async function add(cmd,n=1){for(let i=0;i<n;i++)await page.locator(`.n7-cmd[data-cmd="${cmd}"]`).click()}
async function clear(){await page.locator('#n7-clear').click()}
async function submit(){await page.locator('#n7-submit').click()}
async function addRouteToSample(includeAnalyze=true){
  await add('forward',4);await add('right');await add('forward',4);if(includeAnalyze)await add('analyzeSample');
}
async function addFinish(){await add('forward');await add('right');await add('forward',3)}
async function choose(id){await page.locator(`[data-instrument="${id}"]`).click();await page.locator('#n7-result:not([hidden])').waitFor({timeout:4000})}
async function continueResult(){await page.locator('#n7-result-continue').click()}
async function changeInstrument(){await page.locator('#n7-change-instrument').click();await page.locator('#n7-instruments:not([hidden])').waitFor({timeout:4000})}
async function addRepeat(count,cmd){
  await page.locator('#n7-add-repeat').click();
  const card=page.locator('.repeat-card').last();
  await card.locator('.repeat-head input').fill(String(count));
  await card.locator('.repeat-head input').press('Enter');
  await card.locator('.repeat-add button',{hasText:cmd==='forward'?'AVANZAR':cmd==='right'?'GIRAR DER.':cmd==='left'?'GIRAR IZQ.':'ANALIZAR MUESTRA'}).click();
}
async function fullNoRepeat(){await addRouteToSample(true);await addFinish()}
async function reload(){await page.reload({waitUntil:'networkidle'});await page.locator('#apulab-control-n7').waitFor({state:'visible',timeout:12000})}
async function visibleTextCount(text,exact=true){
  return page.getByText(text,{exact}).evaluateAll(nodes=>nodes.filter(node=>{const style=getComputedStyle(node);const rect=node.getBoundingClientRect();return style.display!=='none'&&style.visibility!=='hidden'&&style.opacity!=='0'&&rect.width>0&&rect.height>0}).length);
}
function countEvent(list,event){return list.filter(x=>x?.event===event).length}
function scanBanned(value,path='root'){
  if(Array.isArray(value)){for(let i=0;i<value.length;i++)scanBanned(value[i],`${path}[${i}]`);return}
  if(value&&typeof value==='object'){for(const[k,v]of Object.entries(value)){assert(!banned.test(k),`privacy prohibited key ${path}.${k}`);scanBanned(v,`${path}.${k}`)}}
}

(async()=>{
  await mkdir(OUT,{recursive:true});
  browser=await chromium.launch({headless:true});

  await fresh();
  assert(await page.locator('canvas:visible').count()===0,'N7 GC: visible canvas/WebGL leaked');
  const visibleBodyText=await page.locator('body').innerText();
  const visibleControlText=await page.locator('#apulab-control-n7').innerText();
  const visibleAyniCount=await page.getByText('AYNI',{exact:false}).evaluateAll(nodes=>nodes.filter(node=>{const style=getComputedStyle(node);const rect=node.getBoundingClientRect();return style.display!=='none'&&style.visibility!=='hidden'&&style.opacity!=='0'&&rect.width>0&&rect.height>0}).length);
  assert(!/\bAYNI\b/i.test(visibleBodyText),'N7 GC: AYNI participant-facing body text leaked');
  assert(!/\bAYNI\b/i.test(visibleControlText),'N7 GC: AYNI control-layer text leaked');
  assert(visibleAyniCount===0,'N7 GC: AYNI participant-visible locator leaked');
  assert(await visibleTextCount('EXPLORAR',true)===0,'N7 GC: EXPLORAR participant-visible');
  assert(await visibleTextCount('BITÁCORA',true)===0,'N7 GC: Bitácora participant-visible');
  assert(await page.locator('.n7-cell').count()===64,'N7 GC: grid must be 8x8');
  assert(await page.locator('.n7-cell.sample').count()===1,'N7 GC: sample missing');
  assert(await page.locator('.n7-cell.final').count()===1,'N7 GC: final point missing');
  assert(await page.locator('.n7-cell.obstacle').count()===4,'N7 GC: obstacles mismatch');
  assert((await page.locator('.n7-head').textContent()).includes('¿De qué material está hecha esta piedra?'),'N7 GC: scientific question missing');
  assert(await page.locator('.n7-cmd[data-cmd="analyzeSample"]').count()===1,'N7 GC: ANALIZAR MUESTRA missing');
  assert(await visibleTextCount('REPETIR × N',true)===1,'N7 GC: REPETIR must be participant-visible from start');
  for(const old of ['ESCANEAR','ENVIAR DATOS'])assert(await visibleTextCount(old,true)===0,`N7 GC: participant-visible N6 command leaked ${old}`);
  let s=await state();assert(s.attemptCount===0&&!s.completed,'N7 GC: initial state dirty');
  let t=await telemetry();assert(countEvent(t,'level_started')===1,'N7 GC: level_started must emit once');
  await shot('n7_gc_initial');

  await submit();s=await state();assert(s.attemptCount===0,'N7 GC: empty program counted attempt');
  await page.locator('#n7-add-repeat').click();await submit();s=await state();assert(s.attemptCount===0,'N7 GC: empty repeat counted attempt');
  await clear();

  await add('forward');await shot('n7_gc_partial_program');s=await state();assert(s.program.length===1,'N7 GC: partial program add failed');
  await reload();s=await state();assert(s.program.length===1&&s.program[0].cmd==='forward','N7 GC: partial program did not survive refresh');
  t=await telemetry();assert(countEvent(t,'level_started')===1,'N7 GC: level_started replayed after refresh');
  await clear();

  await add('analyzeSample');await submit();s=await state();
  assert(s.correctionMode===true&&!s.completed&&s.program.length===1,'N7 GC: wrong-position failure not correctable/preserved');
  assert(s.lastFailure?.code==='ANALYZE_AWAY_FROM_SAMPLE','N7 GC: wrong-position failure code');
  await shot('n7_gc_analyze_wrong_position');
  await reload();s=await state();assert(s.correctionMode===true&&s.program.length===1,'N7 GC: correction state did not survive refresh');
  await clear();await addRouteToSample(false);await submit();s=await state();
  assert(s.position.row===3&&s.position.column===5&&s.sampleReached===true,'N7 GC: sample-adjacent state incorrect');
  await shot('n7_gc_sample_adjacent');
  await reload();s=await state();assert(s.position.row===3&&s.position.column===5,'N7 GC: sample adjacency did not survive refresh');

  await clear();await addRouteToSample(true);await submit();
  assert(await page.locator('#n7-instruments:not([hidden])').isVisible(),'N7 GC: selector did not open');
  await shot('n7_gc_instrument_selector');
  await reload();assert(await page.locator('#n7-instruments:not([hidden])').isVisible(),'N7 GC: selector-open state did not survive refresh');

  await choose('temperature');
  assert((await page.locator('#n7-result-reading').textContent())==='−58 °C','N7 GC: temperature datum changed');
  assert((await page.locator('#n7-result-interpretation').textContent()).includes('Dato válido'),'N7 GC: temperature not framed as valid data');
  assert(!(await page.locator('#n7-result-interpretation').textContent()).match(/incorrect|equivocad|perdiste/i),'N7 GC: temperature marked wrong');
  await shot('n7_gc_temperature');
  await reload();assert((await page.locator('#n7-result-reading').textContent())==='−58 °C','N7 GC: temperature result did not persist');

  await changeInstrument();await choose('materials');
  const mr=await page.locator('#n7-result-reading').textContent();
  assert(mr.includes('HIERRO')&&mr.includes('SILICATOS'),'N7 GC: materials result changed');
  s=await state();assert(s.instrumentChangeCount>=1&&s.changedAfterIrrelevantFeedback===true&&s.relevantInstrumentUsed===true,'N7 GC: strategy-change metrics missing');
  await shot('n7_gc_strategy_change');
  await shot('n7_gc_materials_result');
  await reload();s=await state();assert(s.relevantInstrumentUsed===true&&s.selectedInstrument==='materials','N7 GC: relevant result did not persist');
  await continueResult();s=await state();assert(!s.completed,'N7 GC: materials result auto-completed without final point');

  await fresh();await addRouteToSample(true);await submit();await choose('proximity');
  assert((await page.locator('#n7-result-reading').textContent())==='0.4 m','N7 GC: proximity datum changed');
  assert((await page.locator('#n7-result-interpretation').textContent()).includes('Dato válido'),'N7 GC: proximity not framed as valid data');
  assert(!(await page.locator('#n7-result-interpretation').textContent()).match(/incorrect|equivocad|perdiste/i),'N7 GC: proximity marked wrong');
  await shot('n7_gc_proximity');await reload();assert((await page.locator('#n7-result-reading').textContent())==='0.4 m','N7 GC: proximity result did not persist');

  await fresh();await fullNoRepeat();await submit();await choose('temperature');await continueResult();s=await state();
  assert(s.position.row===6&&s.position.column===6&&s.finalPointReached===true,'N7 GC: temperature-only route did not reach final point');
  assert(s.completed===false&&s.relevantInstrumentUsed===false,'N7 GC: temperature-only final point completed');
  await shot('n7_gc_final_point');
  await reload();s=await state();assert(s.position.row===6&&s.position.column===6&&!s.completed,'N7 GC: final-point incomplete state did not persist');

  await fresh();await fullNoRepeat();await submit();await choose('materials');await continueResult();
  await page.locator('#n7-complete:not([hidden])').waitFor({timeout:5000});s=await state();
  assert(s.completed===true&&s.relevantInstrumentUsed===true&&s.position.row===6&&s.position.column===6,'N7 GC: materials-first success failed');
  assert(s.firstInstrument==='materials'&&s.instrumentSelectionCount===1,'N7 GC: materials-first semantics changed');
  let preReloadMessages=await messages();assert(preReloadMessages.some(x=>x.event==='level_completed'),'N7 GC: control postMessage missing before reload');
  t=await telemetry();assert(countEvent(t,'level_completed')===1,'N7 GC: terminal event not exactly once at completion');
  scanBanned(t);
  const terminal=t.find(x=>x.event==='level_completed');
  for(const k of ['condition','level','attempt_count','first_attempt_success','final_success','response_change_count','help_used','help_count','program_edit_count','instrument_first','instrument_final','instrument_selection_count','instrument_change_count','changed_after_irrelevant_feedback','time_to_first_action_ms','time_to_first_instrument_choice_ms','time_to_relevant_choice_ms','completion_time_ms','repeat_used','repeat_instances','final_block_count'])
    assert(Object.prototype.hasOwnProperty.call(terminal,k),`N7 GC: terminal payload missing ${k}`);
  await reload();assert(await page.locator('#n7-complete:not([hidden])').isVisible(),'N7 GC: completion overlay not restored');
  t=await telemetry();assert(countEvent(t,'level_completed')===1,'N7 GC: terminal event replayed after refresh');
  assert(countEvent(t,'level_started')===1,'N7 GC: level_started replayed after completion refresh');
  await page.locator('#n7-finalize').click();s=await state();assert(s.missionFinalized===true,'N7 GC: mission finalize state missing');
  assert((await page.locator('#n7-finalize').textContent())==='MISIÓN COMPLETADA'&&await page.locator('#n7-finalize').isDisabled(),'N7 GC: terminal CTA state incorrect');
  assert(!page.url().includes('level8'),'N7 GC: navigated to level8');
  t=await telemetry();assert(countEvent(t,'mission_completed')===1,'N7 GC: mission_completed not exactly once');
  await shot('n7_gc_completed_terminal');
  await reload();t=await telemetry();assert(countEvent(t,'mission_completed')===1&&countEvent(t,'level_completed')===1,'N7 GC: terminal telemetry replayed');
  assert(!page.url().includes('level8'),'N7 GC: N8 appeared after refresh');

  await fresh();await fullNoRepeat();await submit();await choose('temperature');await changeInstrument();await choose('materials');await continueResult();
  await page.locator('#n7-complete:not([hidden])').waitFor({timeout:5000});s=await state();
  assert(s.completed&&s.instrumentChangeCount>=1&&s.changedAfterIrrelevantFeedback,'N7 GC: strategy-change success failed');

  await fresh();await fullNoRepeat();await submit();await choose('proximity');await changeInstrument();await choose('materials');await continueResult();
  await page.locator('#n7-complete:not([hidden])').waitFor({timeout:5000});s=await state();
  assert(s.completed&&s.firstInstrument==='proximity'&&s.finalInstrument==='materials','N7 GC: proximity strategy-change success failed');

  await fresh();
  await addRepeat(4,'forward');await add('right');await addRepeat(4,'forward');await add('analyzeSample');await add('forward');await add('right');await addRepeat(3,'forward');
  await submit();await page.locator('#n7-instruments:not([hidden])').waitFor({timeout:6000});await choose('materials');await continueResult();
  await page.locator('#n7-complete:not([hidden])').waitFor({timeout:5000});s=await state();
  assert(s.completed&&s.program.some(x=>x.type==='repeat'),'N7 GC: alternate repeat program rejected');
  t=await telemetry();const done=t.find(x=>x.event==='level_completed');assert(done?.repeat_used===true&&done?.repeat_instances>=1,'N7 GC: repeat terminal metrics wrong');

  await fresh();await add('forward');await add('right');await add('forward',2);await submit();s=await state();
  assert(s.lastFailure?.code==='BLOCKED'&&s.program.length===4&&!s.completed,'N7 GC: collision contract failed');

  await fresh();await add('forward',8);await submit();s=await state();
  assert(s.lastFailure?.code==='EDGE'&&s.program.length===8&&!s.completed,'N7 GC: edge contract failed');

  await fresh();await page.locator('#n7-help').click();assert(await page.locator('#n7-help-panel:not([hidden])').isVisible(),'N7 GC: help did not open');
  const help=(await page.locator('#n7-help-panel').textContent())||'';
  assert(help.includes('TEMPERATURA')&&help.includes('PROXIMIDAD')&&help.includes('ANALIZADOR DE MATERIALES'),'N7 GC: instrument description parity missing');
  assert(!/correct|elige el analizador|forward|r6c6|ruta exacta/i.test(help),'N7 GC: help leaks answer/route');
  await shot('n7_gc_help');await page.locator('#n7-help-close').click();await page.locator('#n7-help').click();assert(await page.locator('#n7-help-panel:not([hidden])').isVisible(),'N7 GC: help not repeatable');

  assert(await page.locator('canvas:visible').count()===0,'N7 GC: visible canvas at end');
  assert(await visibleTextCount('EXPLORAR',true)===0,'N7 GC: EXPLORAR participant-visible at end');
  assert(await page.locator('[class*="confetti"]:visible').count()===0,'N7 GC: confetti visible');
  assert(await page.locator('[class*="glow"]:visible').count()===0,'N7 GC: game glow visible');

  assert(errors.length===0,`runtime errors detected:\n${errors.join('\n')}`);
  await writeFile(resolve(OUT,'n7-telemetry-raw.json'),JSON.stringify(await telemetry(),null,2),'utf8');
  await writeFile(resolve(OUT,'n7-state.json'),JSON.stringify(await state(),null,2),'utf8');
  await browser.close();
  console.log('[e2e] CONTROL N7 OK · exact science data · materials-first · strategy change · repeat optional · persistence A-J · privacy · idempotency · no N8');
})().catch(async e=>{
  console.error(e);
  await mkdir(OUT,{recursive:true});
  await writeFile(resolve(OUT,'runtime.log'),`${String(e?.stack||e)}\n\n${errors.join('\n')}\n`,'utf8');
  try{if(page)await page.screenshot({path:resolve(OUT,'failure.png'),fullPage:true})}catch{}
  try{await browser?.close()}catch{}
  process.exitCode=1;
});
