const { chromium } = require('playwright');
const { mkdir, writeFile } = require('node:fs/promises');
const { resolve } = require('node:path');

const BASE_URL = process.env.APULAB_BASE_URL || 'http://127.0.0.1:4173';
const EVIDENCE_DIR = resolve(process.cwd(), 'test-results/n3-baseline');
const runtimeErrors = [];
let browser;
let context;
let currentPage;

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

async function openN3() {
  currentPage = await context.newPage();
  currentPage.on('pageerror', (error) => runtimeErrors.push(`pageerror: ${error.stack || error}`));
  currentPage.on('console', (msg) => {
    if (msg.type() === 'error') runtimeErrors.push(`console.error: ${msg.text()}`);
  });
  await currentPage.goto(`${BASE_URL}/missions/mission01/level3.html`, { waitUntil: 'networkidle' });
  await currentPage.locator('canvas').first().waitFor({ state: 'visible', timeout: 10_000 });
  return currentPage;
}

async function finishExplore(page) {
  const button = page.locator('#explore-btn');
  for (let i = 0; i < 5; i += 1) await button.click();
}

async function addCommands(page, sequence) {
  for (const command of sequence) {
    const block = page.locator(`.command-block[data-command="${command}"]`);
    await block.focus();
    await block.press('Enter');
  }
}

async function verifyStaticParticipantBaseline(page) {
  const snapshot = await page.evaluate(() => ({
    html: document.documentElement.innerHTML,
    commandLabels: [...document.querySelectorAll('.command-block[data-command]')].map((el) => ({
      command: el.getAttribute('data-command'),
      text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
    })),
    rows: document.querySelectorAll('.program-row').length,
  }));

  assert(snapshot.html.includes('const start={c:1,r:6,dir:0};'), 'N3 baseline: exact start not present in generated runtime');
  assert(snapshot.html.includes('const goal={c:3,r:3};'), 'N3 baseline: exact goal not present in generated runtime');
  assert(snapshot.html.includes('for(let r=0;r<8;r++){tiles[r]=[];for(let c=0;c<8;c++){'), 'N3 baseline: 8x8 grid loop missing');
  assert(snapshot.html.includes("const dc=[0,1,0,-1][roverState.dir],dr=[-1,0,1,0][roverState.dir]"), 'N3 baseline: direction mapping changed');
  assert(snapshot.html.includes("if(roverState.c===goal.c&&roverState.r===goal.r){"), 'N3 baseline: position-only success gate missing');
  assert(snapshot.html.includes('program=program.slice(0,8)'), 'N3 baseline: 8-command cap missing');
  assert(snapshot.rows === 8, `N3 baseline: expected 8 program slots, got ${snapshot.rows}`);

  const commandSet = snapshot.commandLabels.map((x) => x.command).sort().join(',');
  assert(commandSet === 'forward,left,right', `N3 baseline: command set changed: ${commandSet}`);
  assert(snapshot.commandLabels.some((x) => x.command === 'forward' && x.text.includes('AVANZAR')), 'N3 baseline: AVANZAR label missing');
  assert(snapshot.commandLabels.some((x) => x.command === 'left' && x.text.includes('GIRAR IZQ.')), 'N3 baseline: GIRAR IZQ. label missing');
  assert(snapshot.commandLabels.some((x) => x.command === 'right' && x.text.includes('GIRAR DER.')), 'N3 baseline: GIRAR DER. label missing');
}

async function runSuccessfulProgram(sequence, { capture = false } = {}) {
  const page = await openN3();
  await verifyStaticParticipantBaseline(page);
  if (capture) {
    await mkdir(EVIDENCE_DIR, { recursive: true });
    await page.screenshot({ path: resolve(EVIDENCE_DIR, 'n3_baseline_initial.png'), fullPage: true });
  }

  await finishExplore(page);
  await addCommands(page, sequence);
  assert(await page.locator('.program-block').count() === sequence.length, `N3 baseline: expected ${sequence.length} program blocks`);

  if (capture) await page.screenshot({ path: resolve(EVIDENCE_DIR, 'n3_baseline_program.png'), fullPage: true });

  await page.locator('#run-btn').click();
  await page.locator('#success-overlay.visible').waitFor({ timeout: 25_000 });
  assert((await page.locator('#feedback').textContent() || '').includes('llegó a la meta'), 'N3 baseline: success feedback missing');

  if (capture) await page.screenshot({ path: resolve(EVIDENCE_DIR, 'n3_baseline_completed.png'), fullPage: true });
  await page.close();
  currentPage = null;
}

(async () => {
  browser = await chromium.launch({ headless: true });
  context = await browser.newContext({ viewport: { width: 1672, height: 941 }, reducedMotion: 'reduce' });
  await context.addInitScript(() => {
    try { localStorage.setItem('apulab.settings.sfx', 'off'); } catch (_) {}
  });

  const canonical = ['forward','forward','forward','right','forward','forward'];
  await runSuccessfulProgram(canonical, { capture: true });

  // Distinct 8-command solution proves canonical E2E program is not unique.
  const alternate = ['left','right','forward','forward','forward','right','forward','forward'];
  await runSuccessfulProgram(alternate);

  assert(runtimeErrors.length === 0, `N3 baseline runtime errors:\n${runtimeErrors.join('\n')}`);
  await browser.close();
  console.log('[e2e] N3 BASELINE OK · 8x8 · start r6 c1 NORTH · goal r3 c3 · canonical 6 blocks · alternate 8 blocks · position-only success');
})().catch(async (error) => {
  console.error(error);
  await mkdir(EVIDENCE_DIR, { recursive: true });
  await writeFile(resolve(EVIDENCE_DIR, 'runtime.log'), `${String(error?.stack || error)}\n\n${runtimeErrors.join('\n')}\n`, 'utf8');
  try { if (currentPage) await currentPage.screenshot({ path: resolve(EVIDENCE_DIR, 'failure.png'), fullPage: true }); } catch (_) {}
  try { await browser?.close(); } catch (_) {}
  process.exitCode = 1;
});
