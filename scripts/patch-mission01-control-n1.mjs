import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const LEVEL1_PATH = resolve(process.cwd(), 'public/missions/mission01/level1.html');
let html = await readFile(LEVEL1_PATH, 'utf8');

if (html.includes('APULAB_CONTROL_N1_V1')) throw new Error('mission01_control_n1_already_applied');
if (!html.includes('PRACTICE_BATTERY_VOLTAGE')) throw new Error('mission01_control_n1_voltage_contract_missing');
if (!html.includes('function celebrateCompletion()')) throw new Error('mission01_control_n1_completion_function_missing');

function balancedFunctionRange(source, signature) {
  const start = source.indexOf(signature);
  if (start < 0) throw new Error(`mission01_control_n1_function_missing:${signature}`);
  const brace = source.indexOf('{', start + signature.length);
  if (brace < 0) throw new Error(`mission01_control_n1_function_brace_missing:${signature}`);
  let depth = 0, quote = null, escaped = false, templateDepth = 0;
  for (let i = brace; i < source.length; i += 1) {
    const ch = source[i], next = source[i + 1];
    if (quote) {
      if (escaped) { escaped = false; continue; }
      if (ch === '\\') { escaped = true; continue; }
      if (quote === '`' && ch === '$' && next === '{') { templateDepth += 1; i += 1; continue; }
      if (quote === '`' && ch === '}' && templateDepth > 0) { templateDepth -= 1; continue; }
      if (ch === quote && templateDepth === 0) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '/' && next === '/') { const nl = source.indexOf('\n', i + 2); if (nl < 0) break; i = nl; continue; }
    if (ch === '/' && next === '*') { const close = source.indexOf('*/', i + 2); if (close < 0) throw new Error('mission01_control_n1_unclosed_comment'); i = close + 1; continue; }
    if (ch === '{') depth += 1;
    else if (ch === '}' && --depth === 0) return [start, i + 1];
  }
  throw new Error(`mission01_control_n1_unbalanced_function:${signature}`);
}

const [start, end] = balancedFunctionRange(html, '  function celebrateCompletion()');
const neutralCompletion = `  function celebrateCompletion() {
    if (completionCelebrated) return;
    completionCelebrated = true;
    // APULAB_CONTROL_N1_V1 · preserve scientific completion; remove reward presentation.
    journalUnlocked = false;
    journalButton.hidden = true;
    confettiLayer?.replaceChildren();
    successOverlay?.classList.remove("is-visible");
    successOverlay?.setAttribute("aria-hidden", "true");
    liveStatus.textContent = "Medición completada. Valor registrado: " + PRACTICE_BATTERY_VOLTAGE.toFixed(1) + " V.";
    window.dispatchEvent(new CustomEvent("apulab-control-n1-completed", { detail: { reading: PRACTICE_BATTERY_VOLTAGE } }));
  }`;
html = html.slice(0, start) + neutralCompletion + html.slice(end);

html = html.replace(
  '    canvas.setPointerCapture?.(event.pointerId);',
  '    try { canvas.setPointerCapture?.(event.pointerId); } catch (_) {} // APULAB_CONTROL_N1_V1',
);
html = html.replace(
  '      canvas.releasePointerCapture?.(event.pointerId);',
  '      try { canvas.releasePointerCapture?.(event.pointerId); } catch (_) {} // APULAB_CONTROL_N1_V1',
);

if (!html.includes('</head>') || !html.includes('</body>')) throw new Error('mission01_control_n1_invalid_html');
html = html.replace('</head>', '<link rel="stylesheet" href="/control/n1-control.css" data-apulab-control="n1">\n</head>');
html = html.replace(
  '</body>',
  '<script src="/control/n1-control.js" data-apulab-control="n1"></script>\n<script data-apulab-control="n1-initial-answer-guard">document.querySelector(".control-battery-label")?.replaceChildren("Fuente de práctica");</script>\n</body>',
);

await writeFile(LEVEL1_PATH, html, 'utf8');
console.info('[mission01] CONTROL N1 V1 · N1-local flat active-control adapter injected · initial answer hidden until measurement');
