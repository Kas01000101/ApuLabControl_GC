import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const OUT = resolve(ROOT, 'public/missions/mission01');
const LEVEL2 = resolve(OUT, 'level2.html');
const MANIFEST = resolve(OUT, 'manifest.json');
const hash = (text) => createHash('sha256').update(Buffer.from(text, 'utf8')).digest('hex');
const fail = (code) => { throw new Error(`mission01_control_n2:${code}`); };

let html = await readFile(LEVEL2, 'utf8');
if (html.includes('APULAB_CONTROL_N2_V1')) fail('already_applied');
if (!html.includes('measuredValues')) fail('measured_values_contract_missing');
if (!html.includes('battery-next')) fail('battery_next_contract_missing');
if (!html.includes('</head>') || !html.includes('</body>')) fail('invalid_html');

html = html.replace(
  '</head>',
  '<!-- APULAB_CONTROL_N2_V1 -->\n<link rel="stylesheet" href="/control/n2-control.css" data-apulab-control="n2">\n</head>',
);
html = html.replace(
  '</body>',
  '<script src="/control/n2-control.js" data-apulab-control="n2"></script>\n</body>',
);

await writeFile(LEVEL2, html, 'utf8');

const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));
const entry = (manifest.levels || []).find((item) => Number(item.level) === 2);
if (!entry) fail('manifest_level2_missing');
entry.bytes = Buffer.byteLength(html, 'utf8');
entry.sha256 = hash(html);
await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

console.info('[mission01] CONTROL N2 V1 · neutral active-control adapter injected over cloned N2');
