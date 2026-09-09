const { chromium } = require('playwright');
const { mkdir, writeFile } = require('node:fs/promises');
const { resolve } = require('node:path');

const BASE_URL = process.env.APULAB_BASE_URL || 'http://127.0.0.1:4173';
const OUT = resolve(process.cwd(), 'test-results/n2-control');
const REQUIRED_EVENTS = [
  'level_started',
  'battery_viewed',
  'measurement_registered',
  'all_three_measured',
  'choice_submitted',
  'choice_changed',
  'help_requested',
  'level_completed',
];
const FORBIDDEN_PII_KEYS = new Set([
  'name', 'full_name', 'first_name', 'last_name', 'email', 'school', 'classroom',
  'phone', 'credential', 'password', 'participant_code',
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function findForbiddenKeys(value, path = '$', found = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => findForbiddenKeys(item, `${path}[${index}]`, found));
    return found;
  }
  if (!value || typeof value !== 'object') return found;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_PII_KEYS.has(key.toLowerCase())) found.push(`${path}.${key}`);
    findForbiddenKeys(child, `${path}.${key}`, found);
  }
  return found;
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

  await context.addInitScript(() => {
    try {
      Object.defineProperty(Navigator.prototype, 'onLine', { configurable: true, get: () => false });
    } catch (_) {}
    window.__n2RawEvents = [];
    window.__n2SettingsEvents = [];
    window.addEventListener('message', (event) => {
      if (event?.data?.type === 'apulab-control-n2-telemetry') {
        window.__n2RawEvents.push(JSON.parse(JSON.stringify(event.data)));
      }
    });
    window.addEventListener('apulab-settings-changed', (event) => {
      window.__n2SettingsEvents.push(JSON.parse(JSON.stringify(event.detail || {})));
    });
  });

  try {
    await enterMission(page);
    await completeN1(page);
    let frame = page.frameLocator('iframe.mission01-frame');
    await frame.locator('#apulab-control-n2').waitFor({ state: 'visible', timeout: 15_000 });

    await frame.locator('#control-n2-help').click();
    await frame.locator('#control-n2-help-close').click();

    await frame.locator('#control-n2-register').click();
    await frame.locator('#control-n2-tab-B').click();
    await frame.locator('#control-n2-register').click();
    await frame.locator('#control-n2-tab-C').click();
    await frame.locator('#control-n2-register').click();

    await frame.locator('#control-n2-choice-A').click();
    await frame.locator('#control-n2-submit').click();
    await frame.locator('#control-n2-choice-B').click();
    await frame.locator('#control-n2-submit').click();
    await frame.locator('#control-n2-completion').waitFor({ state: 'visible', timeout: 10_000 });
    await page.waitForTimeout(500);

    let dump = await page.evaluate(() => ({
      raw: window.__n2RawEvents || [],
      settings: window.__n2SettingsEvents || [],
      queue: JSON.parse(localStorage.getItem('apulab_telemetry_events') || '[]'),
    }));

    await writeFile(resolve(OUT, 'n2-telemetry-raw.json'), JSON.stringify(dump.raw, null, 2), 'utf8');
    await writeFile(resolve(OUT, 'n2-telemetry-queue.json'), JSON.stringify(dump.queue, null, 2), 'utf8');
    await writeFile(resolve(OUT, 'n2-settings-events.json'), JSON.stringify(dump.settings, null, 2), 'utf8');

    const rawTypes = dump.raw.map((entry) => entry.event);
    for (const eventType of REQUIRED_EVENTS) {
      assert(rawTypes.includes(eventType), `N2 telemetry raw event missing: ${eventType}`);
    }
    assert(dump.raw.filter((entry) => entry.event === 'measurement_registered').length === 3,
      'N2 telemetry: measurement_registered must occur exactly three times');
    assert(dump.raw.filter((entry) => entry.event === 'choice_submitted').length === 2,
      'N2 telemetry: choice_submitted must occur exactly twice');
    assert(dump.raw.filter((entry) => entry.event === 'level_completed').length === 1,
      'N2 telemetry: level_completed must occur exactly once');

    const n2Queue = dump.queue.filter((entry) => entry?.payload?.condition === 'control' && entry?.payload?.level === 2);
    const queueTypes = n2Queue.map((entry) => entry.event_type);
    for (const eventType of REQUIRED_EVENTS) {
      assert(queueTypes.includes(eventType), `N2 telemetry bridge queued event missing: ${eventType}`);
    }
    assert(n2Queue.filter((entry) => entry.event_type === 'level_completed').length === 1,
      'N2 telemetry bridge: queued level_completed must occur once');

    const completed = dump.raw.find((entry) => entry.event === 'level_completed');
    assert(completed?.payload?.measurement_order?.join(',') === 'A,B,C', 'N2 telemetry: measurement_order mismatch');
    assert(completed?.payload?.all_three_measured === true, 'N2 telemetry: all_three_measured false');
    assert(completed?.payload?.first_choice === 'A', 'N2 telemetry: first_choice must be A');
    assert(completed?.payload?.final_choice === 'B', 'N2 telemetry: final_choice must be B');
    assert(completed?.payload?.attempt_count === 2, 'N2 telemetry: attempt_count must be 2');
    assert(completed?.payload?.first_attempt_success === false, 'N2 telemetry: first_attempt_success must be false');
    assert(completed?.payload?.final_success === true, 'N2 telemetry: final_success must be true');
    assert(completed?.payload?.response_change_count === 1, 'N2 telemetry: response_change_count must be 1');
    assert(completed?.payload?.help_used === true && completed?.payload?.help_count === 1,
      'N2 telemetry: help metrics mismatch');
    assert(Number.isFinite(completed?.payload?.completion_time_ms), 'N2 telemetry: completion_time_ms missing');

    const forbidden = findForbiddenKeys({ raw: dump.raw, queue: n2Queue });
    assert(forbidden.length === 0, `N2 telemetry: forbidden PII keys found: ${forbidden.join(', ')}`);
    assert(dump.settings.some((entry) => entry?.musicVolume === 0), 'N2 audio gate: music volume 0 not requested');
    const childSfx = await frame.locator('body').evaluate(() => localStorage.getItem('apulab.settings.sfx'));
    assert(childSfx === 'off', 'N2 audio gate: child SFX was not disabled');

    await frame.locator('body').evaluate(() => window.location.reload());
    frame = page.frameLocator('iframe.mission01-frame');
    await frame.locator('#control-n2-completion').waitFor({ state: 'visible', timeout: 15_000 });
    await page.waitForTimeout(350);
    dump = await page.evaluate(() => ({
      raw: window.__n2RawEvents || [],
      queue: JSON.parse(localStorage.getItem('apulab_telemetry_events') || '[]'),
    }));
    assert(dump.raw.filter((entry) => entry.event === 'level_completed').length === 1,
      'N2 telemetry refresh: raw level_completed duplicated');
    const n2QueueAfter = dump.queue.filter((entry) => entry?.payload?.condition === 'control' && entry?.payload?.level === 2);
    assert(n2QueueAfter.filter((entry) => entry.event_type === 'level_completed').length === 1,
      'N2 telemetry refresh: queued level_completed duplicated');

    assert(errors.length === 0, `N2 telemetry runtime errors:\n${errors.join('\n')}`);
    console.log('[e2e] N2 telemetry OK · raw + parent queue · no PII · one-shot completion · audio neutral');
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
