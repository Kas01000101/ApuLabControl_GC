import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const LEVEL1 = resolve(process.cwd(), 'public/missions/mission01/level1.html');
const html = await readFile(LEVEL1, 'utf8');

function requireMarker(marker, code) {
  if (!html.includes(marker)) throw new Error(`control_n1_audit:${code}`);
}
function forbid(marker, code) {
  if (html.includes(marker)) throw new Error(`control_n1_audit:${code}`);
}

requireMarker('APULAB_CONTROL_N1_V1', 'adapter_marker_missing');
requireMarker('const PRACTICE_BATTERY_VOLTAGE = 15.0;', 'practice_voltage_not_15');
forbid('const PRACTICE_BATTERY_VOLTAGE = 28.0;', 'stale_practice_voltage_28');

// Canonical scientific engine must remain present.
for (const marker of [
  'function measurementKind()',
  'function getVoltageReading()',
  'function placeProbe(color, terminal)',
  'const blackLeadConnected = true;',
  'const redLeadConnected = true;',
]) requireMarker(marker, `task_core_missing:${marker}`);

// Participant-facing control adapter: active, flat, and no extra jack/reading task.
for (const marker of [
  'id="apulab-control-n1-style"',
  'id="apulab-control-n1-runtime"',
  'ACTIVIDAD 1 DE 7 · MEDIR',
  'Modo preparado',
  'COM',
  'VΩ',
  'Cable negro conectado',
  'Cable rojo conectado',
  'control-red-probe',
  'control-black-probe',
  'control-terminal-positive',
  'control-terminal-negative',
  'MEDICIÓN COMPLETADA',
  'Valor registrado:',
]) requireMarker(marker, `control_ui_missing:${marker}`);

for (const forbidden of [
  'reading_attempt_count',
  'reading_first_attempt_correct',
  'reading_response_submitted',
  'reading_response_changed',
]) forbid(forbidden, `forbidden_research_variable:${forbidden}`);

// The original game presentation may remain in the cloned source for regression
// safety, but it must be hidden and its completion path must not expose rewards.
requireMarker('#kawsay-success-overlay,#kawsay-journal-overlay,#kawsay-confetti,', 'original_reward_layer_not_hidden');
requireMarker('#apulab-celebration-layer{display:none!important', 'shared_confetti_not_hidden');
requireMarker('journalUnlocked = false;', 'journal_reward_not_neutralized');
requireMarker('successOverlay?.classList.remove("is-visible")', 'celebratory_overlay_can_open');
requireMarker('Medición completada. Valor registrado:', 'neutral_completion_missing');

// N1-local research + persistence contract.
for (const eventName of [
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
]) requireMarker(`'${eventName}'`, `telemetry_event_missing:${eventName}`);

for (const marker of [
  'apulab.control.n1.state.v1',
  'batteryPowered',
  'multimeterPowered',
  'probeRedConnection',
  'probeBlackConnection',
  'negativePolarityObserved',
  'polarityCorrected',
  'completionState',
  'completionTimestamp',
  'state.emitted[onceKey]',
]) requireMarker(marker, `persistence_contract_missing:${marker}`);

console.info('[control-n1] STATIC CONTRACT PASS · task core preserved · flat control adapter · neutral completion · telemetry/persistence guards');
