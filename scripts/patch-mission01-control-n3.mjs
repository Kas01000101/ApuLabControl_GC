import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const OUT = resolve(ROOT, 'public/missions/mission01');
const LEVEL3 = resolve(OUT, 'level3.html');
const MANIFEST = resolve(OUT, 'manifest.json');
const hash = (text) => createHash('sha256').update(Buffer.from(text, 'utf8')).digest('hex');
const fail = (code) => { throw new Error(`mission01_control_n3:${code}`); };

let html = await readFile(LEVEL3, 'utf8');
if (html.includes('APULAB_CONTROL_N3_V1')) fail('already_applied');

const requiredBaselineTokens = [
  'for(let r=0;r<8;r++){tiles[r]=[];for(let c=0;c<8;c++){',
  'const start={c:1,r:6,dir:0};',
  'const goal={c:3,r:3};',
  "forward:{label:'AVANZAR'",
  "left:{label:'GIRAR IZQ.'",
  "right:{label:'GIRAR DER.'",
  'program=program.slice(0,8)',
  'if(roverState.c===goal.c&&roverState.r===goal.r){',
];
for (const token of requiredBaselineTokens) {
  if (!html.includes(token)) fail(`baseline_contract_missing:${token}`);
}
if (!html.includes('</head>') || !html.includes('</body>')) fail('invalid_html');

html = html.replace(
  '</head>',
  '<!-- APULAB_CONTROL_N3_V1 -->\n<link rel="stylesheet" href="/control/n3-control.css" data-apulab-control="n3">\n</head>',
);
html = html.replace(
  '</body>',
  '<script src="/control/n3-control.js" data-apulab-control="n3"></script>\n<script src="/control/n3-navigation-bridge.js" data-apulab-control="n3-nav"></script>\n</body>',
);

await writeFile(LEVEL3, html, 'utf8');

const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));
const entry = (manifest.levels || []).find((item) => Number(item.level) === 3);
if (!entry) fail('manifest_level3_missing');
entry.bytes = Buffer.byteLength(html, 'utf8');
entry.sha256 = hash(html);
await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

console.info('[mission01] CONTROL N3 V1 · flat 2D active-control adapter injected after legacy stabilization');
