import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const OUT=resolve(process.cwd(),'public/missions/mission01');
const LEVEL7=resolve(OUT,'level7.html');
const MANIFEST=resolve(OUT,'manifest.json');
const EXPECTED='03e125bf9bb41f960039343a652dad358060a271c1c1050b61347f59d4e02eca';
const hash=text=>createHash('sha256').update(Buffer.from(text,'utf8')).digest('hex');
const fail=code=>{throw new Error(`mission01_control_n7:${code}`)};

let html=await readFile(LEVEL7,'utf8');
if(html.includes('APULAB_CONTROL_N7_V1'))fail('already_applied');
const before=hash(html);
if(before!==EXPECTED)fail(`baseline_n7_sha_mismatch:${before}`);

for(const token of [
  'data-apulab-level="7"',
  'LA MUESTRA DESCONOCIDA',
  'ELIGE EL INSTRUMENTO SEGÚN EL DATO QUE NECESITAS.',
  'ANALIZAR MUESTRA',
  'TEMPERATURA','PROXIMIDAD','ANALIZADOR DE MATERIALES',
  '−58 °C','0.4 m','HIERRO','SILICATOS',
  'PUNTO FINAL'
])if(!html.includes(token))fail(`baseline_contract_missing:${token}`);

html=html.replace('</head>','<!-- APULAB_CONTROL_N7_V1 -->\n<link rel="stylesheet" href="/control/n7-control.css" data-apulab-control="n7">\n</head>');
html=html.replace('</body>','<script src="/control/n7-control.js" data-apulab-control="n7"></script>\n</body>');
await writeFile(LEVEL7,html,'utf8');

const manifest=JSON.parse(await readFile(MANIFEST,'utf8'));
const entry=(manifest.levels||[]).find(x=>Number(x.level)===7);
if(!entry)fail('manifest_level7_missing');
entry.bytes=Buffer.byteLength(html,'utf8');
entry.sha256=hash(html);
await writeFile(MANIFEST,`${JSON.stringify(manifest,null,2)}\n`,'utf8');

console.info(`[mission01] CONTROL N7 V1 · baseline ${EXPECTED} locked · late flat 2D active-control adapter`);
