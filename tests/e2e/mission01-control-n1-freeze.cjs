const { chromium } = require('playwright');

const BASE_URL = process.env.APULAB_BASE_URL || 'http://127.0.0.1:4173';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1672, height: 941 } });
  const page = await context.newPage();

  try {
    await page.goto(`${BASE_URL}/missions/mission01/level1.html`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    const control = page.locator('#apulab-control-n1');
    await control.waitFor({ state: 'visible', timeout: 15_000 });
    await page.waitForFunction(() => !document.querySelector('#control-battery-power')?.disabled, null, { timeout: 15_000 });

    const initialBatteryLabel = (await page.locator('.control-battery-label').innerText()).trim();
    const initialBatteryPanel = await page.locator('.control-battery-body').innerText();
    assert(initialBatteryLabel === 'Fuente de práctica', `N1 freeze: neutral source label changed: ${initialBatteryLabel}`);
    assert(!/15\.0\s*V/i.test(initialBatteryPanel), 'N1 freeze: initial battery panel reveals the 15.0 V answer before measurement');

    assert(await page.locator('#control-reading').innerText() === '—', 'N1 freeze: initial meter reading must be off');
    assert(await page.locator('#control-battery-power').getAttribute('aria-pressed') === 'false', 'N1 freeze: battery must start off');
    assert(await page.locator('#control-meter-power').getAttribute('aria-pressed') === 'false', 'N1 freeze: meter must start off');
    assert(await page.locator('.control-jack').count() === 2, 'N1 freeze: COM/VΩ preconfigured display changed');
    assert(await page.locator('.control-jack button, .control-jack input').count() === 0, 'N1 freeze: COM/VΩ became an evaluated interaction');

    const text = await control.innerText();
    assert(text.includes('V⎓'), 'N1 freeze: V⎓ mode marker missing');
    assert(text.includes('COM') && text.includes('VΩ'), 'N1 freeze: COM/VΩ labels missing');
    assert(text.includes('Punta roja') && text.includes('Punta negra'), 'N1 freeze: probe labels missing');

    const source = await page.locator('html').evaluate((node) => node.innerHTML);
    assert(source.includes('PRACTICE_BATTERY_VOLTAGE = 15.0'), 'N1 freeze: scientific 15.0 V source contract changed');
    assert(source.includes('data-apulab-control="n1-initial-answer-guard"'), 'N1 freeze: initial answer guard missing');

    console.log('[e2e] N1 FREEZE CONTRACT OK · neutral initial source · 15.0 V scientific core · V⎓ · COM/VΩ · probes preserved');
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
