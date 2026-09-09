const { chromium } = require('playwright');
const { mkdir, writeFile } = require('node:fs/promises');
const { resolve } = require('node:path');

const BASE = process.env.APULAB_BASE_URL || 'http://127.0.0.1:4173';
const OUT = resolve(process.cwd(), 'test-results/control-compact-viewport');
const assert = (value, message) => { if (!value) throw new Error(message); };
let browser, context, page;
const evidence = [];

const frame = () => page.frameLocator('iframe.mission01-frame');

async function openMissionShell() {
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.getByRole('button', { name: 'INICIAR MISIÓN' }).click();
  await page.getByRole('button', { name: 'MODO DEMO' }).click();
  const skip = page.getByRole('button', { name: 'OMITIR INTRO' });
  await skip.waitFor({ state: 'visible', timeout: 20000 });
  await skip.click();
  await page.locator('iframe.mission01-frame').waitFor({ state: 'visible', timeout: 15000 });
}

async function loadLevel(level) {
  const root = `#apulab-control-n${level}`;
  await page.locator('iframe.mission01-frame').evaluate((iframe, src) => {
    iframe.setAttribute('src', src);
  }, `/missions/mission01/level${level}.html`);
  await frame().locator(root).waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForFunction(() => {
    const iframe = document.querySelector('iframe.mission01-frame');
    const doc = iframe?.contentDocument;
    return doc?.documentElement?.dataset?.apulabCompact === 'true'
      && !!doc.getElementById('apulab-control-compact-style');
  }, null, { timeout: 10000 });
  await page.waitForTimeout(80);
}

async function assertCore(level, selectors) {
  const metrics = await frame().locator('body').evaluate((_, requested) => {
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const scroll = {
      x: window.scrollX,
      y: window.scrollY,
      documentHeight: document.documentElement.scrollHeight,
      bodyHeight: document.body.scrollHeight,
    };
    const items = requested.map((selector) => {
      const el = document.querySelector(selector);
      if (!el) return { selector, exists: false };
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        selector,
        exists: true,
        display: style.display,
        visibility: style.visibility,
        opacity: Number(style.opacity || 1),
        rect: { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left, width: rect.width, height: rect.height },
      };
    });
    return { viewport, scroll, items };
  }, selectors);

  assert(metrics.viewport.width === 1672 && metrics.viewport.height === 941, `N${level}: unexpected iframe viewport ${metrics.viewport.width}x${metrics.viewport.height}`);
  assert(metrics.scroll.y === 0, `N${level}: initial vertical scroll is not zero`);
  for (const item of metrics.items) {
    assert(item.exists, `N${level}: missing core selector ${item.selector}`);
    assert(item.display !== 'none' && item.visibility !== 'hidden' && item.opacity > 0, `N${level}: core selector hidden ${item.selector}`);
    assert(item.rect.width > 0 && item.rect.height > 0, `N${level}: zero-size core selector ${item.selector}`);
    assert(item.rect.top >= -1, `N${level}: core selector clipped above viewport ${item.selector}`);
    assert(item.rect.bottom <= metrics.viewport.height + 1, `N${level}: core selector below viewport ${item.selector} bottom=${item.rect.bottom}`);
    assert(item.rect.left >= -1, `N${level}: core selector clipped left ${item.selector}`);
    assert(item.rect.right <= metrics.viewport.width + 1, `N${level}: core selector clipped right ${item.selector}`);
  }
  evidence.push({ level, ...metrics });
}

async function shot(name) {
  await page.locator('iframe.mission01-frame').screenshot({ path: resolve(OUT, name) });
}

(async () => {
  await mkdir(OUT, { recursive: true });
  browser = await chromium.launch({ headless: true });
  context = await browser.newContext({ viewport: { width: 1672, height: 941 }, reducedMotion: 'reduce' });
  page = await context.newPage();
  await openMissionShell();

  await loadLevel(2);
  await assertCore(2, ['#apulab-control-n2', '.control-n2-tabs', '.control-n2-measurement-card', '.control-n2-analysis', '#control-n2-submit']);
  await shot('compact_n2_initial.png');

  await loadLevel(3);
  await assertCore(3, ['#apulab-control-n3', '.control-n3-board', '.control-n3-sequence-panel', '.control-n3-controls', '.control-n3-feedback']);
  await shot('compact_n3_initial.png');

  await loadLevel(4);
  await assertCore(4, ['#apulab-control-n4', '.control-n4-board', '.control-n4-sequence-panel', '.control-n4-controls', '.control-n4-feedback']);
  await shot('compact_n4_initial.png');

  await loadLevel(5);
  await assertCore(5, ['#apulab-control-n5', '#apulab-control-n5 .n5-main', '#apulab-control-n5 .board-panel', '#apulab-control-n5 .editor-panel', '#apulab-control-n5 .controls', '#apulab-control-n5 #n5-feedback']);
  await shot('compact_n5_initial.png');

  await loadLevel(6);
  await assertCore(6, ['#apulab-control-n6', '.n6-board', '.n6-program', '.n6-controls', '.n6-feedback']);
  await shot('compact_n6_initial.png');

  await loadLevel(7);
  await assertCore(7, ['#apulab-control-n7', '.n7-board', '.n7-program', '.n7-controls', '.n7-feedback']);
  await shot('compact_n7_initial.png');

  const n7Sequence = ['forward','forward','forward','forward','right','forward','forward','forward','forward','analyzeSample','forward','right','forward','forward','forward'];
  for (const command of n7Sequence) await frame().locator(`.n7-cmd[data-cmd="${command}"]`).click();
  await frame().locator('#n7-submit').click();
  await frame().locator('#n7-instruments:not([hidden])').waitFor({ state: 'visible', timeout: 10000 });
  await assertCore('7-instruments', ['#n7-instruments .instrument-card', '#n7-instruments .instrument-grid']);
  await shot('compact_n7_instruments.png');

  await frame().locator('#n7-instruments [data-instrument="materials"]').click();
  await frame().locator('#n7-result:not([hidden])').waitFor({ state: 'visible', timeout: 5000 });
  const result = await frame().locator('#n7-result-reading').innerText();
  assert(result.includes('HIERRO') && result.includes('SILICATOS'), 'N7 materials result changed during compact QA');
  await assertCore('7-result', ['#n7-result .result-card', '#n7-result-reading', '#n7-result .result-actions']);
  await shot('compact_n7_materials_result.png');

  await writeFile(resolve(OUT, 'summary.json'), JSON.stringify({
    status: 'PASS',
    viewport: '1672x941',
    rule: 'NO INITIAL VERTICAL SCROLL FOR CORE TASK AREA',
    levels: [2, 3, 4, 5, 6, 7],
    n7_materials: 'HIERRO / SILICATOS',
    evidence,
  }, null, 2), 'utf8');

  await browser.close();
  console.log('[e2e] GC COMPACT VIEWPORT PASS · N2–N7 core task areas fit 1672×941 · N7 instrument/result fit');
})().catch(async (error) => {
  console.error(error);
  try {
    await mkdir(OUT, { recursive: true });
    if (page) await page.screenshot({ path: resolve(OUT, 'failure.png'), fullPage: true });
    await writeFile(resolve(OUT, 'failure.txt'), String(error?.stack || error), 'utf8');
  } catch {}
  try { await browser?.close(); } catch {}
  process.exitCode = 1;
});
