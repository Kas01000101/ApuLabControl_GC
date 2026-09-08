const { chromium } = require('playwright');
const BASE=process.env.APULAB_BASE_URL||'http://127.0.0.1:4173';
const ok=(x,m)=>{if(!x)throw new Error(m)};
async function add(p,program){for(const c of program)await p.locator(`.control-n3-command[data-command="${c}"]`).click();}
(async()=>{
 const b=await chromium.launch({headless:true}),c=await b.newContext({viewport:{width:1672,height:941}}),p=await c.newPage();
 try{
  await p.goto(`${BASE}/missions/mission01/level3.html`,{waitUntil:'domcontentloaded'}); await p.evaluate(()=>localStorage.removeItem('apulab.control.n3.state.v1')); await p.reload({waitUntil:'domcontentloaded'}); await p.locator('#apulab-control-n3').waitFor({state:'visible',timeout:15000});
  ok(await p.locator('.control-n3-cell').count()===64,'direct: 64 cells'); ok(await p.getByText('EXPLORAR',{exact:true}).count()===0,'direct: EXPLORAR'); ok(await p.getByText('AYNI',{exact:true}).count()===0,'direct: AYNI');
  await add(p,['forward','forward']); await p.reload({waitUntil:'domcontentloaded'}); await p.locator('#apulab-control-n3').waitFor({state:'visible'}); let s=await p.evaluate(()=>window.__apulabControlN3State()); ok(s.program.join(',')==='forward,forward','direct: partial persistence');
  await p.locator('#control-n3-submit').click(); s=await p.evaluate(()=>window.__apulabControlN3State()); ok(s.attemptCount===1&&!s.finalSuccess,'direct: invalid attempt');
  await p.locator('#control-n3-clear').click(); await add(p,['forward','forward','forward','right','forward','forward']); await p.locator('#control-n3-submit').click(); await p.locator('#control-n3-completion').waitFor({state:'visible'}); s=await p.evaluate(()=>window.__apulabControlN3State()); ok(s.finalSuccess&&s.responseChangeCount===1,'direct: correction');
  await p.evaluate(()=>localStorage.removeItem('apulab.control.n3.state.v1')); await p.reload({waitUntil:'domcontentloaded'}); await p.locator('#apulab-control-n3').waitFor({state:'visible'}); const alt=['left','right','forward','forward','forward','right','forward','forward']; await add(p,alt); await p.locator('#control-n3-submit').click(); await p.locator('#control-n3-completion').waitFor({state:'visible'}); s=await p.evaluate(()=>window.__apulabControlN3State()); ok(s.finalSuccess,'direct: alternate valid');
  console.log('[e2e] N3 direct core PASS');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1)});
