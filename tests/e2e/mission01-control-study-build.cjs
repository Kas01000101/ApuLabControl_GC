const { chromium } = require('playwright');
const { mkdir, writeFile } = require('node:fs/promises');
const { resolve } = require('node:path');

const BASE = process.env.APULAB_BASE_URL || 'http://127.0.0.1:4173';
const OUT = resolve(process.cwd(), 'test-results/control-study-build');
const assert = (value, message) => { if (!value) throw new Error(message); };
const LONG_N5 = ['forward','forward','forward','forward','forward','forward','left','forward','forward','forward'];
let browser, context, page;
const runtimeErrors = [];
const transitions = [];

const frame = () => page.frameLocator('iframe.mission01-frame');
async function waitControl(selector, timeout = 15000) {
  const control = frame().locator(selector);
  await control.waitFor({ state: 'visible', timeout });
  const box = await control.boundingBox();
  assert(box && box.width > 0 && box.height > 0, `${selector}: active-control participant layer is not usable`);
}
async function addBy(frameLocator, selector, values) {
  for (const value of values) await frameLocator.locator(`${selector}[data-command="${value}"]`).click();
}
async function addN5(values) {
  for (const value of values) await frame().locator(`[data-cmd="${value}"]`).click();
}
async function addN6(values) {
  for (const value of values) await frame().locator(`.n6-cmd[data-cmd="${value}"]`).click();
}
async function addN7(values) {
  for (const value of values) await frame().locator(`.n7-cmd[data-cmd="${value}"]`).click();
}
async function mark(from, to) {
  transitions.push(`${from}->${to}`);
}

(async () => {
  await mkdir(OUT, { recursive: true });
  browser = await chromium.launch({ headless: true });
  context = await browser.newContext({ viewport: { width: 1672, height: 941 }, reducedMotion: 'reduce' });
  page = await context.newPage();
  page.on('pageerror', e => runtimeErrors.push(`pageerror: ${e.stack || e}`));
  page.on('console', m => {
    if (m.type() === 'error' && !m.text().includes('Failed to load resource')) runtimeErrors.push(`console.error: ${m.text()}`);
  });

  // Enter study mission through participant-facing controls.
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.getByRole('button', { name: 'INICIAR MISIÓN' }).click();
  await page.getByRole('button', { name: 'MODO DEMO' }).click();
  const skip = page.getByRole('button', { name: 'OMITIR INTRO' });
  await skip.waitFor({ state: 'visible', timeout: 20000 });
  await skip.click();
  await page.locator('iframe.mission01-frame').waitFor({ state: 'visible', timeout: 15000 });

  // N1: physical measurement and transition.
  await waitControl('#apulab-control-n1');
  await page.waitForFunction(() => !document.querySelector('iframe.mission01-frame')?.contentDocument?.querySelector('#control-battery-power')?.disabled, null, { timeout: 15000 });
  for (const selector of ['#control-battery-power','#control-meter-power','#control-red-probe','#control-terminal-positive','#control-black-probe','#control-terminal-negative']) await frame().locator(selector).click();
  await frame().locator('#control-completion').waitFor({ state: 'visible', timeout: 10000 });
  assert((await frame().locator('#control-reading').innerText()).includes('15.0'), 'N1 final 15.0 V reading missing');
  await frame().locator('#control-continue').click();
  await waitControl('#apulab-control-n2');
  await mark('N1','N2');

  // N2: measure A/B/C, choose B, complete and transition.
  await frame().locator('#control-n2-register').click();
  for (const id of ['B','C']) {
    await frame().locator(`#control-n2-tab-${id}`).click();
    await frame().locator('#control-n2-register').click();
  }
  assert((await frame().locator('#control-n2-progress').innerText()).includes('3 / 3'), 'N2 measurements not fully registered');
  await frame().locator('#control-n2-choice-B').click();
  await frame().locator('#control-n2-submit').click();
  await frame().locator('#control-n2-completion').waitFor({ state: 'visible', timeout: 10000 });
  await frame().locator('#control-n2-continue').click();
  await waitControl('#apulab-control-n3');
  await mark('N2','N3');

  // N3: valid sequence and transition.
  await addBy(frame(), '.control-n3-command', ['forward','forward','forward','right','forward','forward']);
  await frame().locator('#control-n3-submit').click();
  await frame().locator('#control-n3-completion').waitFor({ state: 'visible', timeout: 10000 });
  await frame().locator('#control-n3-continue').click();
  await waitControl('#apulab-control-n4');
  await mark('N3','N4');

  // N4: required error/correction lifecycle, then success and transition.
  await addBy(frame(), '.control-n4-command', ['forward','forward']);
  await frame().locator('#control-n4-submit').click();
  await frame().getByRole('button', { name: 'AJUSTAR PROGRAMA' }).waitFor({ state: 'visible', timeout: 10000 });
  assert(await frame().locator('.control-n4-program-item.is-error').count() === 1, 'N4 failing instruction not identified');
  await frame().locator('#control-n4-submit').click();
  await frame().locator('#control-n4-clear').click();
  await addBy(frame(), '.control-n4-command', ['forward','right','forward','forward','left','forward','forward','forward']);
  await frame().locator('#control-n4-submit').click();
  await frame().locator('#control-n4-completion').waitFor({ state: 'visible', timeout: 10000 });
  await frame().locator('#control-n4-continue').click();
  await waitControl('#apulab-control-n5');
  await mark('N4','N5');

  // N5: phase 1 own baseline -> phase 2 simplification -> N6.
  let n5State = await frame().locator('body').evaluate(() => window.apulabControlN5QA.getState());
  assert(n5State.phase === 'phase1' && n5State.repeatUnlocked === false, 'N5 cross-level persistence contamination at entry');
  await addN5(LONG_N5);
  await frame().locator('#n5-submit').click();
  await frame().locator('#n5-pattern:not([hidden])').waitFor({ state: 'visible', timeout: 10000 });
  n5State = await frame().locator('body').evaluate(() => window.apulabControlN5QA.getState());
  assert(n5State.phase === 'phase2' && n5State.initialExecutableBlockCount === 10, 'N5 phase 1 baseline contract failed');
  await frame().locator('#n5-clear').click();
  await frame().locator('#n5-add-repeat').click();
  await frame().locator('[data-radd="0:forward"]').click();
  await frame().locator('[data-count="0"]').fill('6');
  await frame().locator('[data-count="0"]').press('Tab');
  await addN5(['left']);
  await frame().locator('#n5-add-repeat').click();
  await frame().locator('[data-radd="2:forward"]').click();
  await frame().locator('[data-count="2"]').fill('3');
  await frame().locator('[data-count="2"]').press('Tab');
  await frame().locator('#n5-submit').click();
  await frame().locator('#n5-complete:not([hidden])').waitFor({ state: 'visible', timeout: 10000 });
  n5State = await frame().locator('body').evaluate(() => window.apulabControlN5QA.getState());
  assert(n5State.completed && n5State.finalExecutableBlockCount < n5State.initialExecutableBlockCount, 'N5 own-before/after simplification failed');
  const n5Telemetry = await frame().locator('body').evaluate(() => window.apulabControlN5QA.telemetry());
  assert(n5Telemetry.filter(x => x.event === 'level_completed').length === 1, 'N5 duplicate completion event in final journey');
  await frame().locator('#n5-continue').click();
  await waitControl('#apulab-control-n6');
  await mark('N5','N6');

  // N6: science zone -> scan -> analyze -> communication -> send -> N7.
  let n6State = await frame().locator('body').evaluate(() => window.apulabControlN6QA.getState());
  assert(n6State.attemptCount === 0 && !n6State.completed, 'N6 cross-level persistence contamination at entry');
  await addN6(['forward','forward','forward','scan','analyze','left','forward','forward','forward','send']);
  await frame().locator('#n6-submit').click();
  await frame().locator('#n6-complete:not([hidden])').waitFor({ state: 'visible', timeout: 10000 });
  n6State = await frame().locator('body').evaluate(() => window.apulabControlN6QA.getState());
  assert(n6State.completed && n6State.scanCompleted && n6State.analysisCompleted && n6State.dataSent, 'N6 scientific flow failed');
  assert(n6State.position.row === 2 && n6State.position.column === 4, 'N6 communication final position changed');
  const n6Telemetry = await frame().locator('body').evaluate(() => window.apulabControlN6QA.telemetry());
  assert(n6Telemetry.filter(x => x.event === 'level_completed').length === 1, 'N6 duplicate completion event in final journey');
  await frame().locator('#n6-continue').click();
  await waitControl('#apulab-control-n7');
  await mark('N6','N7');

  // N7: sample adjacency + material evidence + final point + mission finalization.
  let n7State = await frame().locator('body').evaluate(() => window.apulabControlN7QA.getState());
  assert(n7State.attemptCount === 0 && !n7State.completed, 'N7 cross-level persistence contamination at entry');
  await addN7(['forward','forward','forward','forward','right','forward','forward','forward','forward','analyzeSample','forward','right','forward','forward','forward']);
  await frame().locator('#n7-submit').click();
  await frame().locator('#n7-instruments:not([hidden])').waitFor({ state: 'visible', timeout: 10000 });
  assert(await frame().locator('#n7-instruments [data-instrument]').count() === 3, 'N7 must expose exactly three instruments');
  await frame().locator('#n7-instruments [data-instrument="materials"]').click();
  await frame().locator('#n7-result:not([hidden])').waitFor({ state: 'visible', timeout: 5000 });
  const result = await frame().locator('#n7-result-reading').innerText();
  assert(result.includes('HIERRO') && result.includes('SILICATOS'), 'N7 material evidence changed');
  await frame().locator('#n7-result-continue').click();
  await frame().locator('#n7-complete:not([hidden])').waitFor({ state: 'visible', timeout: 10000 });
  n7State = await frame().locator('body').evaluate(() => window.apulabControlN7QA.getState());
  assert(n7State.completed && n7State.relevantInstrumentUsed, 'N7 relevant evidence success gate failed');
  assert(n7State.position.row === 6 && n7State.position.column === 6, 'N7 final point changed');
  let n7Telemetry = await frame().locator('body').evaluate(() => window.apulabControlN7QA.getTelemetry());
  assert(n7Telemetry.filter(x => x.event === 'level_completed').length === 1, 'N7 duplicate level_completed in final journey');
  await frame().locator('#n7-finalize').click();
  n7State = await frame().locator('body').evaluate(() => window.apulabControlN7QA.getState());
  assert(n7State.missionFinalized === true, 'N7 mission finalization state missing');
  assert((await frame().locator('#n7-finalize').innerText()).trim() === 'MISIÓN COMPLETADA', 'N7 terminal CTA state changed');
  n7Telemetry = await frame().locator('body').evaluate(() => window.apulabControlN7QA.getTelemetry());
  assert(n7Telemetry.filter(x => x.event === 'mission_completed').length === 1, 'N7 duplicate mission_completed in final journey');

  const iframeSrc = await page.locator('iframe.mission01-frame').getAttribute('src');
  assert(!/level8/i.test(iframeSrc || ''), 'N8 appeared in mission iframe');
  assert(!/level8/i.test(page.url()), 'N8 appeared in parent URL');
  assert(runtimeErrors.length === 0, `Unexpected runtime errors:\n${runtimeErrors.join('\n')}`);
  assert(transitions.join(',') === 'N1->N2,N2->N3,N3->N4,N4->N5,N5->N6,N6->N7', `Transition chain incomplete: ${transitions.join(',')}`);

  await page.screenshot({ path: resolve(OUT, 'control_study_build_terminal.png'), fullPage: true });
  await writeFile(resolve(OUT, 'summary.json'), JSON.stringify({
    status: 'PASS',
    transitions,
    terminal: 'FINALIZAR MISIÓN -> MISIÓN COMPLETADA',
    no_n8: true,
    runtime_errors: runtimeErrors,
    viewport: '1672x941'
  }, null, 2), 'utf8');

  await browser.close();
  console.log('[e2e] CONTROL STUDY BUILD PASS · N1→N7 physical journey · all transitions · N4 correction · N5 two-phase simplification · N6 science flow · N7 finalization · no N8');
})().catch(async error => {
  console.error(error);
  try {
    await mkdir(OUT, { recursive: true });
    if (page) await page.screenshot({ path: resolve(OUT, 'failure.png'), fullPage: true });
    await writeFile(resolve(OUT, 'failure.txt'), String(error?.stack || error), 'utf8');
  } catch {}
  try { await browser?.close(); } catch {}
  process.exitCode = 1;
});
