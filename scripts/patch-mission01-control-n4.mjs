import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const OUT = resolve(ROOT, 'public/missions/mission01');
const LEVEL4 = resolve(OUT, 'level4.html');
const MANIFEST = resolve(OUT, 'manifest.json');
const EXPECTED_BASELINE_SHA256 = '195821ccd3d0b67870b0ba1977b09dc1e3c36b8d11ec66f76a5b816782dd3104';
const hash = (text) => createHash('sha256').update(Buffer.from(text, 'utf8')).digest('hex');
const fail = (code) => { throw new Error(`mission01_control_n4:${code}`); };

let html = await readFile(LEVEL4, 'utf8');
if (html.includes('APULAB_CONTROL_N4_V1')) fail('already_applied');
if (hash(html) !== EXPECTED_BASELINE_SHA256) fail(`baseline_sha_mismatch:${hash(html)}`);

const requiredBaselineTokens = [
  'for(let r=0;r<8;r++){tiles[r]=[];for(let c=0;c<8;c++){',
  'const scenarios=[{start:{c:1,r:6,dir:0},goal:{c:3,r:2},obstacles:[[1,4],[2,4]]}]',
  "forward:{label:'AVANZAR'",
  "left:{label:'GIRAR IZQ.'",
  "right:{label:'GIRAR DER.'",
  'const MAX_PROGRAM_STEPS=30;',
  'if(roverState.c===goal.c&&roverState.r===goal.r){',
];
for (const token of requiredBaselineTokens) if (!html.includes(token)) fail(`baseline_contract_missing:${token}`);
if (!html.includes('</head>') || !html.includes('</body>')) fail('invalid_html');

html = html.replace('</head>', '<!-- APULAB_CONTROL_N4_V1 -->\n<link rel="stylesheet" href="/control/n4-control.css" data-apulab-control="n4">\n</head>');
html = html.replace('</body>', '<script src="/control/n4-control.js" data-apulab-control="n4"></script>\n</body>');
await writeFile(LEVEL4, html, 'utf8');

const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));
const entry = (manifest.levels || []).find((item) => Number(item.level) === 4);
if (!entry) fail('manifest_level4_missing');
entry.bytes = Buffer.byteLength(html, 'utf8');
entry.sha256 = hash(html);
await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.info('[mission01] CONTROL N4 V1 · flat 2D active-control adapter injected after verified baseline');