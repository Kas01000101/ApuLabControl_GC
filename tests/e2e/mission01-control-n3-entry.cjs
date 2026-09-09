const { chromium } = require('playwright');
const BASE = process.env.APULAB_BASE_URL || 'http://127.0.0.1:4173';
(async()=>{
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1672,height:941}});
  const page=await context.newPage();
  try{
    await page.goto(BASE,{waitUntil:'domcontentloaded'});
    await page.getByRole('button',{name:'INICIAR MISIÓN'}).click();
    await page.getByRole('button',{name:'MODO DEMO'}).click();
    const skip=page.getByRole('button',{name:'OMITIR INTRO'}); await skip.waitFor({state:'visible'}); await skip.click();
    const frame=page.frameLocator('iframe.mission01-frame');
    await frame.locator('#apulab-control-n1').waitFor({state:'visible',timeout:15000});
    await page.waitForFunction(()=>!document.querySelector('iframe.mission01-frame')?.contentDocument?.querySelector('#control-battery-power')?.disabled,null,{timeout:15000});
    for(const id of ['#control-battery-power','#control-meter-power','#control-red-probe','#control-terminal-positive','#control-black-probe','#control-terminal-negative']) await frame.locator(id).click();
    await frame.locator('#control-completion').waitFor({state:'visible'}); await frame.locator('#control-continue').click();
    await frame.locator('#apulab-control-n2').waitFor({state:'visible',timeout:15000});
    await frame.locator('#control-n2-register').click();
    for(const id of ['B','C']){await frame.locator(`#control-n2-tab-${id}`).click();await frame.locator('#control-n2-register').click();}
    await frame.locator('#control-n2-choice-B').click(); await frame.locator('#control-n2-submit').click();
    await frame.locator('#control-n2-completion').waitFor({state:'visible'}); await frame.locator('#control-n2-continue').click();
    await frame.locator('#apulab-control-n3').waitFor({state:'visible',timeout:15000});
    if(await frame.locator('.control-n3-cell').count()!==64) throw new Error('N3 entry: expected 64 cells');
    console.log('[e2e] N3 entry PASS');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
