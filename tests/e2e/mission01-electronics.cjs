const { chromium } = require('playwright');
const { mkdir, writeFile } = require('node:fs/promises');
const { resolve } = require('node:path');

const BASE_URL = process.env.APULAB_BASE_URL || 'http://127.0.0.1:4173';
const EVIDENCE_DIR = resolve(process.cwd(), 'test-results/electronics');
const LOGICAL_WIDTH = 1672;
const LOGICAL_HEIGHT = 941;

let browser;
let context;
let page;
const runtimeErrors = [];

const assert = (condition, message) => { if (!condition) throw new Error(message); };

async function persistEvidence(error) {
  await mkdir(EVIDENCE_DIR, { recursive: true });
  const log = [`error: ${String(error?.stack || error)}`, '', ...runtimeErrors].join('\n');
  await writeFile(resolve(EVIDENCE_DIR, 'runtime.log'), `${log}\n`, 'utf8');
  if (page) {
    try { await page.screenshot({ path: resolve(EVIDENCE_DIR, 'failure.png'), fullPage: true }); } catch (_) {}
    try { await writeFile(resolve(EVIDENCE_DIR, 'page.html'), await page.content(), 'utf8'); } catch (_) {}
  }
  if (context) {
    try { await context.tracing.stop({ path: resolve(EVIDENCE_DIR, 'trace.zip') }); } catch (_) {}
  }
}

function watchRuntime(p, label) {
  p.on('pageerror', (error) => runtimeErrors.push(`${label} pageerror: ${String(error.stack || error)}`));
  p.on('console', (msg) => { if (msg.type() === 'error') runtimeErrors.push(`${label} console.error: ${msg.text()}`); });
}

async function logicalPoint(canvas, x, y) {
  const box = await canvas.boundingBox();
  assert(box, 'Mission canvas has no bounding box');
  return { x: box.x + (x / LOGICAL_WIDTH) * box.width, y: box.y + (y / LOGICAL_HEIGHT) * box.height };
}
async function dragLogical(canvas, from, to) {
  const a = await logicalPoint(canvas, from.x, from.y);
  const b = await logicalPoint(canvas, to.x, to.y);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(b.x, b.y, { steps: 18 });
  await page.mouse.up();
}

const POINTS = {
  redProbe: { x: 913, y: 681 },
  blackProbe: { x: 1098, y: 708 },
  positiveTerminal: { x: 964, y: 369 },
  negativeTerminal: { x: 1266, y: 369 },
};

async function openLevel(level) {
  page = await context.newPage();
  watchRuntime(page, `L${level}`);
  await page.goto(`${BASE_URL}/missions/mission01/level${level}.html`, { waitUntil: 'networkidle' });
  const canvas = page.locator('#kawsay-canvas, canvas').first();
  await canvas.waitFor({ state: 'visible', timeout: 15_000 });
  return canvas;
}
async function closeLevel() { await page?.close(); page = null; }

async function waitControlReady() {
  const control = page.locator('#apulab-control-n1');
  await control.waitFor({ state: 'visible', timeout: 15_000 });
  await page.locator('#control-battery-power').waitFor({ state: 'visible' });
  await page.waitForFunction(() => !document.querySelector('#control-battery-power')?.disabled, null, { timeout: 15_000 });
}

async function selectProbeToTerminal(probe, terminal) {
  await page.locator(`#control-${probe}-probe`).click();
  await page.locator(`#control-terminal-${terminal}`).click();
  await page.waitForTimeout(180);
}

async function screenshot(name) {
  await mkdir(EVIDENCE_DIR, { recursive: true });
  await page.screenshot({ path: resolve(EVIDENCE_DIR, name), fullPage: true });
}

async function level1() {
  await openLevel(1);
  await waitControlReady();

  const sourceContract = await page.evaluate(() => ({
    has15: document.documentElement.innerHTML.includes('PRACTICE_BATTERY_VOLTAGE = 15.0'),
    leaks28Practice: /PRACTICE_BATTERY_VOLTAGE\s*=\s*28\.0/.test(document.documentElement.innerHTML),
    hasAdapter: !!document.querySelector('script[data-apulab-control="n1"]'),
    hasReadingQuiz: /reading_attempt_count|reading_response_submitted|¿Qué valor mediste\?/i.test(document.documentElement.innerHTML),
    originalRewardVisible: !!document.querySelector('#kawsay-success-overlay.is-visible'),
  }));
  assert(sourceContract.has15, 'L1: practice battery contract is not 15.0 V');
  assert(!sourceContract.leaks28Practice, 'L1: stale 28.0 V practice value remains');
  assert(sourceContract.hasAdapter, 'L1: control adapter missing');
  assert(!sourceContract.hasReadingQuiz, 'L1: forbidden independent reading assessment was added');
  assert(!sourceContract.originalRewardVisible, 'L1: original reward overlay is visible');

  await page.evaluate(() => {
    const link = document.querySelector('link[data-apulab-control="n1"]');
    if (link) link.disabled = true;
    const control = document.getElementById('apulab-control-n1');
    if (control) control.style.display = 'none';
  });
  await page.waitForTimeout(180);
  await screenshot('n1_baseline_reference.png');
  await page.evaluate(() => {
    const link = document.querySelector('link[data-apulab-control="n1"]');
    if (link) link.disabled = false;
    const control = document.getElementById('apulab-control-n1');
    if (control) control.style.display = '';
  });
  await page.waitForTimeout(100);
  await screenshot('n1_gc_initial.png');

  assert(await page.locator('#control-reading').innerText() === '—', 'L1: meter should be off initially');
  assert(await page.locator('#control-battery-power').getAttribute('aria-pressed') === 'false', 'L1: battery should be off initially');
  assert(await page.locator('#control-meter-power').getAttribute('aria-pressed') === 'false', 'L1: meter should be off initially');
  assert(await page.locator('.control-jack').count() === 2, 'L1: COM/VΩ should be displayed as two preconfigured connections');
  assert(await page.locator('.control-jack button, .control-jack input').count() === 0, 'L1: COM/VΩ must not become an evaluated interaction');

  await page.locator('#control-battery-power').click();
  await page.locator('#control-meter-power').click();
  await page.waitForTimeout(220);
  assert(await page.locator('#control-reading').innerText() === '0.0 V', 'L1: powered incomplete measurement should read 0.0 V');

  await page.reload({ waitUntil: 'networkidle' });
  await waitControlReady();
  assert(await page.locator('#control-battery-power').getAttribute('aria-pressed') === 'true', 'L1 refresh: battery power was lost');
  assert(await page.locator('#control-meter-power').getAttribute('aria-pressed') === 'true', 'L1 refresh: meter power was lost');
  assert(await page.locator('#control-reading').innerText() === '0.0 V', 'L1 refresh: powered reading state was lost');

  await selectProbeToTerminal('red', 'positive');
  assert(!(await page.locator('#control-completion').isVisible()), 'L1: one probe must not complete the activity');
  assert((await page.locator('#control-feedback').innerText()).includes('Falta conectar el segundo punto'), 'L1: one-probe feedback missing');
  await screenshot('n1_gc_one_probe.png');

  await page.reload({ waitUntil: 'networkidle' });
  await waitControlReady();
  assert((await page.locator('#control-red-status').innerText()).includes('+'), 'L1 refresh: red probe connection was lost');
  assert(!(await page.locator('#control-completion').isVisible()), 'L1 refresh: one probe incorrectly completed');

  await selectProbeToTerminal('red', 'negative');
  await selectProbeToTerminal('black', 'positive');
  assert(await page.locator('#control-reading').innerText() === '-15.0 V', 'L1: reversed polarity must read -15.0 V');
  assert(!(await page.locator('#control-completion').isVisible()), 'L1: reversed polarity must not complete');
  assert((await page.locator('#control-feedback').innerText()).includes('signo negativo'), 'L1: neutral negative-polarity feedback missing');
  await screenshot('n1_gc_negative_polarity.png');

  await page.reload({ waitUntil: 'networkidle' });
  await waitControlReady();
  assert(await page.locator('#control-reading').innerText() === '-15.0 V', 'L1 refresh: reversed polarity state was lost');

  await selectProbeToTerminal('red', 'positive');
  assert(await page.locator('#control-red-status').innerText() === 'Sin conectar', 'L1: occupied target should leave the moved red probe free');
  await selectProbeToTerminal('black', 'negative');
  await selectProbeToTerminal('red', 'positive');
  await page.locator('#control-completion').waitFor({ state: 'visible', timeout: 10_000 });
  assert(await page.locator('#control-reading').innerText() === '15.0 V', 'L1: corrected polarity must read +15.0 V');
  assert((await page.locator('#control-completion').innerText()).includes('MEDICIÓN COMPLETADA'), 'L1: neutral completion heading missing');
  assert((await page.locator('#control-completion').innerText()).includes('15.0 V'), 'L1: neutral completion value missing');
  assert(!(await page.locator('#kawsay-success-overlay').isVisible()), 'L1: original celebratory success overlay must stay hidden');

  await page.locator('#control-completion').evaluate((node) => { node.hidden = true; });
  await screenshot('n1_gc_correct_measurement.png');
  await page.locator('#control-completion').evaluate((node) => { node.hidden = false; });
  await screenshot('n1_gc_completed.png');

  const beforeRefresh = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('apulab.control.n1.state.v1'));
    return { state, terminalMessages: Number(sessionStorage.getItem('apulab.control.n1.terminalMessages') || 0) };
  });
  assert(beforeRefresh.state.emitted.measurement_completed === true, 'L1: measurement_completed idempotency guard missing');
  assert(beforeRefresh.state.emitted.level_completed === true, 'L1: level_completed idempotency guard missing');
  assert(beforeRefresh.state.polarityCorrected === true, 'L1: polarity correction was not persisted');

  await page.reload({ waitUntil: 'networkidle' });
  await waitControlReady();
  await page.locator('#control-completion').waitFor({ state: 'visible', timeout: 10_000 });
  const afterRefresh = await page.evaluate(() => ({
    state: JSON.parse(localStorage.getItem('apulab.control.n1.state.v1')),
    terminalMessages: Number(sessionStorage.getItem('apulab.control.n1.terminalMessages') || 0),
  }));
  assert(afterRefresh.state.completionState === 'completed', 'L1 refresh: completion state was lost');
  assert(afterRefresh.terminalMessages === beforeRefresh.terminalMessages, 'L1 refresh: terminal completion events were duplicated');

  await page.locator('#control-continue').click();
  await page.waitForURL(/\/missions\/mission01\/level2\.html$/, { timeout: 10_000 });
  await page.locator('#kawsay-canvas, canvas').first().waitFor({ state: 'visible', timeout: 15_000 });
  await closeLevel();
}

async function connectConventional(canvas) {
  await dragLogical(canvas, POINTS.redProbe, POINTS.positiveTerminal);
  await page.waitForTimeout(180);
  await dragLogical(canvas, POINTS.blackProbe, POINTS.negativeTerminal);
}
async function measureCurrentBattery(canvas, expectedSelector, expectedValue) {
  await connectConventional(canvas);
  await page.waitForFunction(({ selector, expected }) => document.querySelector(selector)?.textContent?.includes(expected), { selector: expectedSelector, expected: expectedValue }, { timeout: 12_000 });
  const text = await page.locator(expectedSelector).innerText();
  assert(text.includes(expectedValue), `${expectedSelector}: expected ${expectedValue}, got ${text}`);
}
async function nextBattery() {
  const next = page.locator('#battery-next');
  await next.click();
  await page.waitForTimeout(650);
  await page.waitForFunction(() => { const button = document.querySelector('#battery-next'); return button && !button.disabled; }, null, { timeout: 5_000 }).catch(() => {});
}
async function level2() {
  const canvas = await openLevel(2);
  await measureCurrentBattery(canvas, '#measure-pink', '24.0 V');
  await nextBattery();
  await measureCurrentBattery(canvas, '#measure-green', '28.0 V');
  await nextBattery();
  await measureCurrentBattery(canvas, '#measure-coral', '32.0 V');
  const compare = page.locator('#kawsay-compare-overlay');
  await compare.waitFor({ state: 'visible', timeout: 10_000 });
  await page.locator('[data-compare-id="green"]').click();
  await page.locator('#kawsay-success-overlay.is-visible').waitFor({ timeout: 10_000 });
  const successText = await page.locator('#kawsay-success-overlay').innerText();
  assert(/28\.0 V|verde|correct/i.test(successText), 'L2: correct 28.0 V battery was not accepted');
  await closeLevel();
}

(async () => {
  browser = await chromium.launch({ headless: true });
  context = await browser.newContext({ viewport: { width: LOGICAL_WIDTH, height: LOGICAL_HEIGHT } });
  await context.addInitScript(() => {
    try { localStorage.setItem('apulab.settings.sfx', 'off'); } catch (_) {}
    window.addEventListener('message', (event) => {
      if (event?.data?.type !== 'apulab-control-n1-telemetry') return;
      if (event.data.event !== 'measurement_completed' && event.data.event !== 'level_completed') return;
      const key = 'apulab.control.n1.terminalMessages';
      sessionStorage.setItem(key, String(Number(sessionStorage.getItem(key) || 0) + 1));
    });
  });
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });

  await level1();
  await level2();

  assert(runtimeErrors.length === 0, `runtime errors detected:\n${runtimeErrors.join('\n')}`);
  await context.tracing.stop();
  await browser.close();
  console.log('[e2e] Mission 01 electronics OK · N1 control 15.0 V + polarity/refresh/idempotency · N2 baseline 24/28/32 unchanged');
})().catch(async (error) => {
  console.error(error);
  await persistEvidence(error);
  try { await browser?.close(); } catch (_) {}
  process.exitCode = 1;
});
