const { chromium } = require('playwright');
const { mkdir } = require('node:fs/promises');
const { resolve } = require('node:path');

const BASE_URL = process.env.APULAB_BASE_URL || 'http://127.0.0.1:4173';
const OUT = resolve(process.cwd(), 'test-results/n2-control');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function enterMission(page) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 20_000 });
  await page.getByRole('button', { name: 'INICIAR MISIÓN' }).click();
  await page.getByRole('button', { name: 'MODO DEMO' }).click();
  const skip = page.getByRole('button', { name: 'OMITIR INTRO' });
  await skip.waitFor({ state: 'visible', timeout: 20_000 });
  await skip.click();
  await page.locator('iframe.mission01-frame').waitFor({ state: 'visible', timeout: 15_000 });
}

async function completeN1(page) {
  const frame = page.frameLocator('iframe.mission01-frame');
  await frame.locator('#apulab-control-n1').waitFor({ state: 'visible', timeout: 15_000 });
  await page.waitForFunction(() => {
    const mission = document.querySelector('iframe.mission01-frame');
    return Boolean(mission?.contentDocument?.querySelector('#control-battery-power:not(:disabled)'));
  }, null, { timeout: 15_000 });
  await frame.locator('#control-battery-power').click();
  await frame.locator('#control-meter-power').click();
  await frame.locator('#control-red-probe').click();
  await frame.locator('#control-terminal-positive').click();
  await frame.locator('#control-black-probe').click();
  await frame.locator('#control-terminal-negative').click();
  await frame.locator('#control-completion').waitFor({ state: 'visible', timeout: 10_000 });
  await frame.locator('#control-continue').click();
}

async function waitN2(page) {
  const frame = page.frameLocator('iframe.mission01-frame');
  await frame.locator('#apulab-control-n2').waitFor({ state: 'visible', timeout: 15_000 });
  await frame.locator('#control-n2-reading').waitFor({ state: 'visible', timeout: 10_000 });
  return frame;
}

async function waitMissionFrameVisualStable(page) {
  await page.waitForFunction(() => {
    const mission = document.querySelector('iframe.mission01-frame');
    return Boolean(
      mission
      && mission.classList.contains('is-active')
      && !mission.classList.contains('is-entering')
      && !mission.classList.contains('is-loading')
      && mission.getAttribute('aria-hidden') === 'false'
    );
  }, null, { timeout: 10_000 });
}

(async () => {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1672, height: 941 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('Failed to load resource')) errors.push(`console: ${message.text()}`);
  });

  try {
    await enterMission(page);
    await completeN1(page);
    let frame = await waitN2(page);
    await waitMissionFrameVisualStable(page);

    assert((await frame.locator('#control-n2-range').innerText()).includes('> 24.0 V'), 'N2: lower exclusive limit missing');
    assert((await frame.locator('#control-n2-range').innerText()).includes('< 32.0 V'), 'N2: upper exclusive limit missing');
    assert(await frame.locator('#control-n2-reading').innerText() === '24.0 V', 'N2: A must be 24.0 V');
    assert(await frame.locator('#control-n2-submit').isDisabled(), 'N2: final decision must start blocked');
    await page.screenshot({ path: resolve(OUT, 'n2_gc_initial.png'), fullPage: true });

    await frame.locator('#control-n2-register').click();
    assert(await frame.locator('#control-n2-record-A').innerText() === '24.0 V', 'N2: A registration missing');
    await page.screenshot({ path: resolve(OUT, 'n2_gc_battery_a.png'), fullPage: true });

    await frame.locator('#control-n2-tab-B').click();
    assert(await frame.locator('#control-n2-reading').innerText() === '28.0 V', 'N2: B must be 28.0 V');
    await frame.locator('#control-n2-register').click();
    assert(await frame.locator('#control-n2-record-B').innerText() === '28.0 V', 'N2: B registration missing');
    await page.screenshot({ path: resolve(OUT, 'n2_gc_battery_b.png'), fullPage: true });

    await frame.locator('#control-n2-tab-C').click();
    assert(await frame.locator('#control-n2-reading').innerText() === '32.0 V', 'N2: C must be 32.0 V');
    await frame.locator('#control-n2-register').click();
    assert(await frame.locator('#control-n2-record-C').innerText() === '32.0 V', 'N2: C registration missing');
    await page.screenshot({ path: resolve(OUT, 'n2_gc_battery_c.png'), fullPage: true });

    assert(!(await frame.locator('#control-n2-choice-A').isDisabled()), 'N2: choices must unlock at 3/3');
    assert(await frame.locator('#control-n2-progress').innerText() === '3 / 3 registradas', 'N2: 3/3 progress missing');
    await page.screenshot({ path: resolve(OUT, 'n2_gc_all_measurements_registered.png'), fullPage: true });

    await frame.locator('#control-n2-choice-A').click();
    await frame.locator('#control-n2-submit').click();
    assert((await frame.locator('#control-n2-feedback').innerText()).includes('Compara nuevamente'), 'N2: neutral wrong-choice feedback missing');
    let state = await frame.locator('body').evaluate(() => window.__apulabControlN2State());
    assert(state.selectionAttemptCount === 1, 'N2: wrong submitted choice must count exactly one attempt');
    assert(state.firstChoiceCorrect === false, 'N2: first choice correctness must be false');
    assert(state.finalSuccess === false, 'N2: wrong A must not complete');
    await page.screenshot({ path: resolve(OUT, 'n2_gc_incorrect_choice.png'), fullPage: true });

    await frame.locator('body').evaluate(() => window.location.reload());
    frame = await waitN2(page);
    assert(await frame.locator('#control-n2-progress').innerText() === '3 / 3 registradas', 'N2 refresh: 3/3 state not restored');
    state = await frame.locator('body').evaluate(() => window.__apulabControlN2State());
    assert(state.selectionAttemptCount === 1, 'N2 refresh: wrong-choice attempt not restored');
    assert(state.registered.A === 24 && state.registered.B === 28 && state.registered.C === 32, 'N2 refresh: measurements not restored');

    await frame.locator('#control-n2-choice-B').click();
    state = await frame.locator('body').evaluate(() => window.__apulabControlN2State());
    assert(state.selectedBatteryId === 'B', 'N2 visual QA: corrected B choice must be selected before submit');
    assert(state.finalSuccess === false, 'N2 visual QA: pre-submit B choice must not already complete');
    await page.screenshot({ path: resolve(OUT, 'n2_gc_correct_choice.png'), fullPage: true });

    await frame.locator('#control-n2-submit').click();
    await frame.locator('#control-n2-completion').waitFor({ state: 'visible', timeout: 10_000 });
    state = await frame.locator('body').evaluate(() => window.__apulabControlN2State());
    assert(state.selectionAttemptCount === 2, 'N2: corrected B submission must be second attempt');
    assert(state.responseChangeCount === 1, 'N2: response change count must be one');
    assert(state.finalSuccess === true, 'N2: B must complete');
    assert(state.measurementOrder.join(',') === 'A,B,C', 'N2: measurement order must be preserved');
    await page.screenshot({ path: resolve(OUT, 'n2_gc_completed.png'), fullPage: true });

    await frame.locator('body').evaluate(() => window.location.reload());
    frame = await waitN2(page);
    await frame.locator('#control-n2-completion').waitFor({ state: 'visible', timeout: 10_000 });
    state = await frame.locator('body').evaluate(() => window.__apulabControlN2State());
    assert(state.selectionAttemptCount === 2, 'N2 completion refresh: attempts changed');
    assert(state.finalSuccess === true, 'N2 completion refresh: completion not restored');

    await frame.locator('#control-n2-continue').click();
    await page.waitForFunction(() => {
      const mission = document.querySelector('iframe.mission01-frame');
      return Boolean(mission?.contentDocument?.body?.innerText?.includes('3 / 7'));
    }, null, { timeout: 15_000 });

    assert(errors.length === 0, `N2 runtime errors:\n${errors.join('\n')}`);
    console.log('[e2e] N2 control OK · 24/28/32 · 3/3 · wrong A → correct B · refresh · continue N3 · visual evidence stable');
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
