import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const OUT = resolve(process.cwd(), 'public/missions/mission01');
const LEVEL6 = resolve(OUT, 'level6.html');
const LEVEL7 = resolve(OUT, 'level7.html');
const MANIFEST = resolve(OUT, 'manifest.json');
const EXPECTED_N6 = '53cfd03663c5604a3878132f2e9313caa638bb413935fa4b730415c647ff9bca';
const EXPECTED_N7 = '03e125bf9bb41f960039343a652dad358060a271c1c1050b61347f59d4e02eca';
const hash = (text) => createHash('sha256').update(Buffer.from(text, 'utf8')).digest('hex');
const fail = (code) => { throw new Error(`mission01_control_n6:${code}`); };

let n6 = await readFile(LEVEL6, 'utf8');
const n7 = await readFile(LEVEL7, 'utf8');
if (n6.includes('APULAB_CONTROL_N6_V1')) fail('already_applied');
const n6Before = hash(n6);
const n7Before = hash(n7);
if (n6Before !== EXPECTED_N6) fail(`baseline_n6_sha_mismatch:${n6Before}`);
if (n7Before !== EXPECTED_N7) fail(`baseline_n7_sha_mismatch:${n7Before}`);

for (const token of [
  'data-apulab-level="6"',
  'INVESTIGAR',
  'DATOS CIENTÍFICOS',
  'ZONA DE INTERÉS',
  'PUNTO DE COMUNICACIÓN',
  'data-command="scan"',
  'data-command="analyze"',
  'data-command="send"',
]) if (!n6.includes(token)) fail(`baseline_contract_missing:${token}`);

n6 = n6.replace('</head>', '<!-- APULAB_CONTROL_N6_V1 -->\n<link rel="stylesheet" href="/control/n6-control.css" data-apulab-control="n6">\n</head>');
n6 = n6.replace('</body>', '<script src="/control/n6-control.js" data-apulab-control="n6"></script>\n</body>');
await writeFile(LEVEL6, n6, 'utf8');

if (hash(await readFile(LEVEL7, 'utf8')) !== EXPECTED_N7) fail('n7_changed_by_adapter');

const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));
const entry = (manifest.levels || []).find((x) => Number(x.level) === 6);
if (!entry) fail('manifest_level6_missing');
entry.bytes = Buffer.byteLength(n6, 'utf8');
entry.sha256 = hash(n6);
await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

console.info(`[mission01] CONTROL N6 V1 · baseline ${EXPECTED_N6} locked · N7 ${EXPECTED_N7} unchanged · late flat 2D active-control adapter`);
