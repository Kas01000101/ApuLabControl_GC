const { chromium } = require('playwright');
const { mkdir, writeFile } = require('node:fs/promises');
const { resolve } = require('node:path');

const BASE_URL = process.env.APULAB_BASE_URL || 'http://127.0.0.1:4173';
const OUT = resolve(process.cwd(), 'test-results/electronics');
const REQUIRED_EVENTS = [
  'level_started',
  'battery_power_changed',
  'multimeter_power_changed',
  'probe_connection_changed',
  'measurement_state_changed',
  'negative_polarity_observed',
  'polarity_corrected',
  'help_requested',
  'measurement_completed',
  'level_completed',
];
const FORBIDDEN_PII_KEYS = new Set([
  'name', 'full_name', 'first_name', 'last_name', 'email', 'school',
  'classroom', 'phone', 'credential', 'password', 'participant_code',
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

async function selectProbeToTerminal(frame, probe, terminal) {
  await frame.locator(`#control-${probe}-probe`).click();
  await frame.locator(`#control-terminal-${terminal}`).click();
  await frame.page().waitForTimeout(120);
}

(async () => {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1672, height: 941 } });
  const page = await context.newPage();
  const errors = [];

  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('Failed to load resource')) {
      errors.push(`console: ${message.text()}`);
    }
  });

  await context.addInitScript(() => {
    try {
      Object.defineProperty(Navigator.prototype, 'onLine', { configurable: true, get: () => false });
    } catch (_) {}
    window.__n1RawEvents = [];
    window.__n1SettingsEvents = [];
    window.addEventListener('message', (event) => {
      if (event?.data?.type === 'apulab-control-n1-telemetry') {
        window.__n1RawEvents.push(JSON.parse(JSON.stringify(event.data)));
      }
    });
    window.addEventListener('apulab-settings-changed', (event) => {
      window.__n1SettingsEvents.push(JSON.parse(JSON.stringify(event.detail || {})));
    });
  });

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    await page.getByRole('button', { name: 'INICIAR MISIÓN' }).click();
    await page.getByRole('button', { name: 'MODO DEMO' }).click();
    const skip = page.getByRole('button', { name: 'OMITIR INTRO' });
    await skip.waitFor({ state: 'visible', timeout: 20_000 });
    await skip.click();

    const iframe = page.locator('iframe.mission01-frame');
    await iframe.waitFor({ state: 'visible', timeout: 15_000 });
    const frame = page.frameLocator('iframe.mission01-frame');
    await frame.locator('#apulab-control-n1').waitFor({ state: 'visible', timeout: 15_000 });
    await page.waitForFunction(() => {
      const mission = document.querySelector('iframe.mission01-frame');
      if (!mission?.contentDocument) return false;
      const button = mission.contentDocument.querySelector('#control-battery-power');
      return Boolean(button && !button.disabled);
    }, null, { timeout: 15_000 });

    await frame.locator('#control-guide').click();
    await frame.locator('#control-help-close').click();

    await frame.locator('#control-battery-power').click();
    await frame.locator('#control-meter-power').click();

    await selectProbeToTerminal(frame, 'red', 'negative');
    await selectProbeToTerminal(frame, 'black', 'positive');
    assert(await frame.locator('#control-reading').innerText() === '-15.0 V', 'telemetry E2E: reversed reading missing');

    await selectProbeToTerminal(frame, 'red', 'positive');
    await selectProbeToTerminal(frame, 'black', 'negative');
    await selectProbeToTerminal(frame, 'red', 'positive');
    await frame.locator('#control-completion').waitFor({ state: 'visible', timeout: 10_000 });
    assert(await frame.locator('#control-reading').innerText() === '15.0 V', 'telemetry E2E: final reading missing');

    await page.waitForTimeout(500);

    const dump = await page.evaluate(() => ({
      raw: window.__n1RawEvents || [],
      settings: window.__n1SettingsEvents || [],
      queue: JSON.parse(localStorage.getItem('apulab_telemetry_events') || '[]'),
    }));

    await writeFile(resolve(OUT, 'n1-telemetry-raw.json'), JSON.stringify(dump.raw, null, 2), 'utf8');
    await writeFile(resolve(OUT, 'n1-telemetry-queue.json'), JSON.stringify(dump.queue, null, 2), 'utf8');
    await writeFile(resolve(OUT, 'n1-settings-events.json'), JSON.stringify(dump.settings, null, 2), 'utf8');

    const rawTypes = dump.raw.map((entry) => entry.event);
    for (const eventType of REQUIRED_EVENTS) {
      assert(rawTypes.includes(eventType), `telemetry E2E: raw event missing: ${eventType}`);
    }

    const terminalRaw = dump.raw.filter((entry) => entry.event === 'measurement_completed' || entry.event === 'level_completed');
    assert(terminalRaw.filter((entry) => entry.event === 'measurement_completed').length === 1,
      'telemetry E2E: measurement_completed raw event must occur exactly once');
    assert(terminalRaw.filter((entry) => entry.event === 'level_completed').length === 1,
      'telemetry E2E: level_completed raw event must occur exactly once');

    const n1Queue = dump.queue.filter((entry) => entry?.payload?.condition === 'control' && entry?.payload?.level === 1);
    const queueTypes = n1Queue.map((entry) => entry.event_type);
    for (const eventType of REQUIRED_EVENTS) {
      assert(queueTypes.includes(eventType), `telemetry bridge E2E: queued event missing: ${eventType}`);
    }
    assert(n1Queue.filter((entry) => entry.event_type === 'measurement_completed').length === 1,
      'telemetry bridge E2E: queued measurement_completed must occur exactly once');
    assert(n1Queue.filter((entry) => entry.event_type === 'level_completed').length === 1,
      'telemetry bridge E2E: queued level_completed must occur exactly once');

    const forbidden = findForbiddenKeys({ raw: dump.raw, queue: n1Queue });
    assert(forbidden.length === 0, `telemetry E2E: forbidden PII keys found: ${forbidden.join(', ')}`);

    const negative = dump.raw.find((entry) => entry.event === 'negative_polarity_observed');
    const corrected = dump.raw.find((entry) => entry.event === 'polarity_corrected');
    const completed = dump.raw.find((entry) => entry.event === 'level_completed');
    assert(negative?.payload?.reading === -15, 'telemetry E2E: -15 polarity payload missing');
    assert(corrected?.payload?.reading === 15, 'telemetry E2E: polarity correction payload missing');
    assert(completed?.payload?.final_measurement_value === 15, 'telemetry E2E: final_measurement_value missing');

    assert(dump.settings.some((entry) => entry?.musicVolume === 0),
      'audio gate: N1 did not request neutral music volume 0');
    const childSfx = await frame.locator('body').evaluate(() => localStorage.getItem('apulab.settings.sfx'));
    assert(childSfx === 'off', 'audio gate: N1 SFX was not disabled');

    assert(errors.length === 0, `telemetry E2E runtime errors:\n${errors.join('\n')}`);
    console.log('[e2e] N1 telemetry bridge OK · raw runtime events + parent queue + no PII + N1 audio neutralization');
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
