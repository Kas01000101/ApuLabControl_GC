const { chromium } = require('playwright');
const { mkdir, writeFile } = require('node:fs/promises');
const { resolve } = require('node:path');

const BASE_URL = process.env.APULAB_BASE_URL || 'http://127.0.0.1:4173';
const OUT = resolve(process.cwd(), 'test-results/n6-control');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
let browser, context, page;
const runtimeErrors = [];

async function shot(name) {
  await mkdir(OUT, { recursive: true });
  await page.screenshot({ path: resolve(OUT, name), animations: 'disabled' });
}
async function openFresh() {
  if (page) await page.close();
  page = await context.newPage();
  page.on('pageerror', (e) => runtimeErrors.push(`pageerror: ${e.stack || e}`));
  page.on('console', (m) => { if (m.type() === 'error') runtimeErrors.push(`console.error: ${m.text()}`); });
  await page.goto(`${BASE_URL}/missions/mission01/level6.html`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.apulabControlN6QA);
  return page;
}
async function resetStorageAndOpen() {
  await openFresh();
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.apulabControlN6QA);
}
async function add(cmd, times = 1) {
  for (let i = 0; i < times; i += 1) await page.locator(`.n6-cmd[data-cmd="${cmd}"]`).click();
}
async function addSeq(seq) { for (const cmd of seq) await add(cmd); }
async function run() { await page.locator('#n6-submit').click(); }
async function clear() {
  const button = page.locator('#n6-clear');
  if (await button.isEnabled()) await button.click();
}
async function state() { return page.evaluate(() => window.apulabControlN6QA.getState()); }
async function telemetry() { return page.evaluate(() => window.apulabControlN6QA.telemetry()); }
async function expectFailure(code) {
  const s = await state();
  assert(s.lastFailure?.code === code, `N6 expected failure ${code}, got ${JSON.stringify(s.lastFailure)}`);
  assert(s.completed === false, `N6 ${code}: must remain incomplete`);
  assert(await page.locator('.n6-row').count() > 0, `N6 ${code}: program was erased`);
}
async function buildReference(extra = []) {
  await addSeq(['forward','forward','forward','scan','analyze','left','forward','forward','forward','send', ...extra]);
}
async function buildRepeatReference() {
  await page.locator('#n6-add-repeat').click();
  await page.locator('[data-radd="0:forward"]').click();
  const firstCount = page.locator('[data-count="0"]');
  await firstCount.fill('3');
  await firstCount.press('Tab');
  await addSeq(['scan','analyze','left']);
  await page.locator('#n6-add-repeat').click();
  await page.locator('[data-radd="4:forward"]').click();
  const secondCount = page.locator('[data-count="4"]');
  await secondCount.fill('3');
  await secondCount.press('Tab');
  await add('send');
}

(async () => {
  browser = await chromium.launch({ headless: true });
  context = await browser.newContext({ viewport: { width: 1672, height: 941 }, reducedMotion: 'reduce' });
  await context.addInitScript(() => {
    window.__n6ControlMessages = [];
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'apulab-control-n6-telemetry') window.__n6ControlMessages.push(event.data);
    });
    try { localStorage.setItem('apulab.settings.sfx', 'off'); } catch {}
  });

  // Initial visual/static contract.
  await resetStorageAndOpen();
  let s = await state();
  assert(s.position.row === 5 && s.position.column === 1 && s.position.orientation === 'EAST', 'N6 start must be r5c1 EAST');
  assert(await page.locator('.n6-cell').count() === 64, 'N6 grid must contain 64 cells');
  assert(await page.locator('.n6-cell.science-zone[data-row="5"][data-column="4"]').count() === 1, 'N6 science zone must be r5c4');
  assert(await page.locator('.n6-cell.communication[data-row="2"][data-column="4"]').count() === 1, 'N6 communication point must be r2c4');
  for (const [r,c] of [[1,0],[2,2],[1,6],[5,7]]) assert(await page.locator(`.n6-cell.obstacle[data-row="${r}"][data-column="${c}"]`).count() === 1, `N6 obstacle missing r${r}c${c}`);
  assert(await page.locator('#n6-add-repeat').isVisible(), 'N6 REPETIR must be available from start');
  assert(await page.locator('canvas:visible').count() === 0, 'N6 participant-facing WebGL/canvas must be hidden');
  assert(await page.locator('#explore-btn:visible').count() === 0, 'N6 EXPLORAR must not be participant-facing');
  assert(await page.locator('#guide-btn:visible').count() === 0, 'N6 duplicate GUÍA must not be participant-facing');
  assert(await page.locator('#apulab-control-n6 audio').count() === 0, 'N6 control layer must not contain audio');
  const viewportFit = await page.evaluate(() => ({ h: document.documentElement.scrollHeight, w: document.documentElement.scrollWidth }));
  assert(viewportFit.w <= 1672, `N6 official viewport has horizontal overflow: ${viewportFit.w}`);
  await shot('n6_gc_initial.png');

  // AYUDA: neutral, optional, reopenable, no five-step direct answer/canonical program.
  await page.locator('#n6-help').click();
  const helpText = await page.locator('#n6-help-panel').innerText();
  assert(!/1\..*2\..*3\..*4\..*5\./s.test(helpText), 'N6 AYUDA leaks a full five-step answer path');
  assert(!/forward,\s*forward|AVANZAR\s*→\s*AVANZAR/i.test(helpText), 'N6 AYUDA leaks a canonical program');
  await shot('n6_gc_help.png');
  await page.locator('#n6-help-close').click();
  await page.locator('#n6-help').click();
  assert(await page.locator('#n6-help-panel').isVisible(), 'N6 AYUDA did not reopen');
  await page.locator('#n6-help-close').click();

  // Attempt semantics: empty program and empty repeat do not count.
  s = await state();
  assert(s.attemptCount === 0, 'N6 initial attempt count must be zero');
  assert(await page.locator('#n6-submit').isDisabled(), 'N6 empty program must not be runnable');
  await page.locator('#n6-add-repeat').click();
  const beforeEmptyRepeat = (await state()).attemptCount;
  await run();
  s = await state();
  assert(s.attemptCount === beforeEmptyRepeat, 'N6 empty REPETIR body must not count as attempt');
  assert((await page.locator('#n6-feedback').innerText()).includes('necesita al menos una instrucción'), 'N6 empty REPETIR must be structurally rejected');
  await clear();

  // Persistence A: partial program.
  await add('forward', 2);
  await shot('n6_gc_partial_program.png');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.apulabControlN6QA);
  assert((await state()).program.length === 2, 'N6 refresh A: partial program not restored');
  await clear();

  // Persistence B: scientific zone before scan.
  await add('forward', 3); await run();
  s = await state();
  assert(s.position.row === 5 && s.position.column === 4 && !s.scanCompleted, 'N6 zone arrival state wrong');
  await shot('n6_gc_science_zone.png');
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForFunction(() => !!window.apulabControlN6QA);
  s = await state(); assert(s.position.row === 5 && s.position.column === 4 && !s.scanCompleted, 'N6 refresh B failed');
  await clear();

  // Persistence C: scan completed.
  await addSeq(['forward','forward','forward','scan']); await run();
  s = await state(); assert(s.scanCompleted && !s.analysisCompleted, 'N6 scan state wrong');
  await shot('n6_gc_scan_completed.png');
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForFunction(() => !!window.apulabControlN6QA);
  s = await state(); assert(s.scanCompleted && !s.analysisCompleted, 'N6 refresh C failed');
  await clear();

  // Persistence D: analyze completed.
  await addSeq(['forward','forward','forward','scan','analyze']); await run();
  s = await state(); assert(s.scanCompleted && s.analysisCompleted && !s.dataSent, 'N6 analysis state wrong');
  await shot('n6_gc_analyze_completed.png');
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForFunction(() => !!window.apulabControlN6QA);
  s = await state(); assert(s.scanCompleted && s.analysisCompleted && !s.dataSent, 'N6 refresh D failed');
  await clear();

  // Persistence E: communication point without auto-send.
  await addSeq(['forward','forward','forward','scan','analyze','left','forward','forward','forward']); await run();
  s = await state();
  assert(s.position.row === 2 && s.position.column === 4 && !s.dataSent && !s.completed, 'N6 arrival at communication must not auto-send/complete');
  await shot('n6_gc_communication_point.png');
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForFunction(() => !!window.apulabControlN6QA);
  s = await state(); assert(s.position.row === 2 && s.position.column === 4 && !s.dataSent, 'N6 refresh E failed');
  await clear();

  // Negative: ANALYZE before SCAN + correction retains editable program.
  await add('analyze'); await run(); await expectFailure('ANALYZE_BEFORE_SCAN');
  await shot('n6_gc_invalid_order.png');
  assert((await state()).program.length === 1, 'N6 invalid order erased program');
  await page.locator('[data-del="0"]').click();
  await buildReference();
  await shot('n6_gc_corrected_program.png');
  assert((await state()).responseChangeCount === 0, 'N6 response change must count on next submission, not edit');
  await run();
  s = await state(); assert(s.completed, 'N6 corrected program did not complete');
  assert(s.responseChangeCount === 1, 'N6 corrected resubmission did not increment response change count');

  // Fresh lifecycle for negative matrix and remaining persistence.
  await resetStorageAndOpen();
  await page.locator('#n6-help').click();
  await page.locator('#n6-help-close').click();

  await add('scan'); await run(); await expectFailure('SCAN_OUTSIDE_SCIENCE_ZONE');
  await shot('n6_gc_invalid_zone.png');
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForFunction(() => !!window.apulabControlN6QA);
  await expectFailure('SCAN_OUTSIDE_SCIENCE_ZONE'); // refresh F
  await clear();

  await addSeq(['forward','forward','forward','scan','right','forward','analyze']); await run(); await expectFailure('ANALYZE_OUTSIDE_SCIENCE_ZONE'); await clear();
  await add('send'); await run(); await expectFailure('SEND_BEFORE_ANALYZE'); await clear();
  await addSeq(['forward','forward','forward','scan','analyze','send']); await run(); await expectFailure('SEND_OUTSIDE_COMMUNICATION_POINT'); await clear();

  // Send succeeds but moving away means NOT complete.
  await buildReference(['forward']); await run();
  s = await state();
  assert(s.dataSent && !s.completed && !(s.position.row === 2 && s.position.column === 4), 'N6 SEND-then-move-away must not complete');
  await shot('n6_gc_send_completed.png');
  await clear();

  // Correct no-repeat reference + completion persistence/idempotency G.
  await buildReference(); await run();
  s = await state();
  assert(s.completed && s.finalSuccess, 'N6 no-repeat reference must complete');
  assert(s.position.row === 2 && s.position.column === 4, 'N6 success final position must be communication point');
  assert(s.repeatInstances === 0, 'N6 no-repeat solution unexpectedly requires repeat');
  let tel = await telemetry();
  assert(tel.filter(x => x.event === 'level_completed').length === 1, 'N6 terminal event must emit once');
  await shot('n6_gc_completed.png');
  const terminalBefore = tel.filter(x => x.event === 'level_completed').length;
  const callbackResult = await page.evaluate(() => window.apulabControlN6QA.invokeTerminal());
  assert(callbackResult === false, 'N6 repeated completion callback must be guarded');
  tel = await telemetry();
  assert(tel.filter(x => x.event === 'level_completed').length === terminalBefore, 'N6 repeated callback duplicated terminal telemetry');
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForFunction(() => !!window.apulabControlN6QA);
  s = await state(); assert(s.completed && await page.locator('#n6-complete').isVisible(), 'N6 refresh G did not restore completed UI');
  tel = await telemetry(); assert(tel.filter(x => x.event === 'level_completed').length === 1, 'N6 refresh duplicated terminal telemetry');
  assert(tel.filter(x => x.event === 'level_started').length === 1, 'N6 refresh duplicated level_started');

  // Telemetry message privacy before navigation resets the page-level capture buffer.
  let posted = await page.evaluate(() => window.__n6ControlMessages || []);
  assert(posted.length > 0, 'N6 control telemetry postMessage stream missing');
  assert(!JSON.stringify(posted).toLowerCase().includes('credential'), 'N6 postMessage telemetry leaked credential field');

  // Re-enter same lifecycle must not duplicate initialization.
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await page.goto(`${BASE_URL}/missions/mission01/level6.html`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.apulabControlN6QA);
  tel = await telemetry(); assert(tel.filter(x => x.event === 'level_started').length === 1, 'N6 re-entry duplicated level_started');

  // Telemetry contract + privacy.
  const requiredEvents = ['level_started','program_started','program_modified','science_zone_reached','scan_started','scan_completed','analyze_started','analyze_completed','communication_point_reached','data_sent','premature_action','help_requested','level_completed'];
  const allEvents = new Set(tel.map(x => x.event));
  for (const event of requiredEvents) assert(allEvents.has(event), `N6 telemetry missing ${event}`);
  const terminal = tel.find(x => x.event === 'level_completed');
  for (const key of ['attempt_count','first_attempt_success','final_success','response_change_count','help_used','help_count','premature_action_count','time_to_first_action_ms','time_to_science_zone_ms','time_scan_to_analyze_ms','time_analysis_to_communication_ms','completion_time_ms','program_edit_count','repeat_used','repeat_instances','final_block_count']) assert(Object.prototype.hasOwnProperty.call(terminal, key), `N6 terminal telemetry missing ${key}`);
  const serialized = JSON.stringify(tel).toLowerCase();
  for (const banned of ['email','school','teacher','credential','password','full_name','phone','fingerprint','browser','device']) assert(!serialized.includes(banned), `N6 local telemetry contains banned identity field ${banned}`);
  // N6 -> N7 transition, no duplicate terminal event.
  await page.locator('#n6-continue').click();
  await page.waitForURL(/\/missions\/mission01\/level7\.html/);
  assert(await page.locator('html[data-apulab-level="7"]').count() === 1, 'N6 CONTINUAR did not reach N7 identity');

  // Alternate valid program using REPETIR proves no canonical-only solution.
  await resetStorageAndOpen();
  await buildRepeatReference();
  s = await state(); assert(s.repeatInstances === 2, 'N6 alternate program must contain two REPETIR blocks');
  await run();
  s = await state();
  assert(s.completed && s.repeatInstances === 2, 'N6 valid REPETIR program did not complete');
  tel = await telemetry();
  const repeatTerminal = tel.find(x => x.event === 'level_completed');
  assert(repeatTerminal?.repeat_used === true && repeatTerminal?.repeat_instances === 2, 'N6 repeat metrics wrong');

  assert(runtimeErrors.length === 0, `N6 runtime errors:\n${runtimeErrors.join('\n')}`);
  await mkdir(OUT, { recursive: true });
  await writeFile(resolve(OUT, 'runtime.log'), 'N6 CONTROL VALIDATION PASS\n', 'utf8');
  await browser.close();
  console.log('[e2e] CONTROL N6 PASS · flat 2D · causal science · correction · refresh A-G · telemetry/privacy/idempotency · optional REPETIR · N6→N7');
})().catch(async (error) => {
  console.error(error);
  try {
    await mkdir(OUT, { recursive: true });
    await writeFile(resolve(OUT, 'runtime.log'), `${String(error?.stack || error)}\n\n${runtimeErrors.join('\n')}\n`, 'utf8');
    if (page) await page.screenshot({ path: resolve(OUT, 'failure.png'), fullPage: true });
  } catch {}
  try { await browser?.close(); } catch {}
  process.exitCode = 1;
});
