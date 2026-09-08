import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const PATHS = {
  html: resolve(process.cwd(), 'public/missions/mission01/level1.html'),
  runtime: resolve(process.cwd(), 'public/control/n1-control.js'),
  css: resolve(process.cwd(), 'public/control/n1-control.css'),
  bridge: resolve(process.cwd(), 'src/systems/Level1ControlTelemetryBridge.ts'),
  main: resolve(process.cwd(), 'src/main.ts'),
};

const [html, runtime, css, bridge, main] = await Promise.all([
  readFile(PATHS.html, 'utf8'),
  readFile(PATHS.runtime, 'utf8'),
  readFile(PATHS.css, 'utf8'),
  readFile(PATHS.bridge, 'utf8'),
  readFile(PATHS.main, 'utf8'),
]);

function requireIn(source, marker, code) {
  if (!source.includes(marker)) throw new Error(`control_n1_audit:${code}`);
}

function forbidIn(source, marker, code) {
  if (source.includes(marker)) throw new Error(`control_n1_audit:${code}`);
}

// A. GENERATED HTML ---------------------------------------------------------
// The generated artifact owns the canonical scientific engine and only mounts
// the GC adapter. Participant-facing GC UI/telemetry live in external files.
requireIn(html, 'href="/control/n1-control.css"', 'html:control_css_link_missing');
requireIn(html, 'src="/control/n1-control.js"', 'html:control_runtime_script_missing');
requireIn(html, 'data-apulab-control="n1"', 'html:control_mount_marker_missing');
requireIn(html, 'const PRACTICE_BATTERY_VOLTAGE = 15.0;', 'html:practice_voltage_not_15');
forbidIn(html, 'const PRACTICE_BATTERY_VOLTAGE = 28.0;', 'html:stale_practice_voltage_28');

for (const marker of [
  'function measurementKind()',
  'function getVoltageReading()',
  'function placeProbe(color, terminal)',
  'const blackLeadConnected = true;',
  'const redLeadConnected = true;',
]) requireIn(html, marker, `html:task_core_missing:${marker}`);

// GC must not introduce an independent reading assessment.
for (const forbidden of [
  '¿Qué valor mediste?',
  'reading_attempt_count',
  'reading_first_attempt_correct',
  'reading_response_submitted',
  'reading_response_changed',
]) forbidIn(html, forbidden, `html:forbidden_reading_task:${forbidden}`);

// The original completion engine is neutralized locally. Dormant baseline DOM
// may still exist for regression safety, but it cannot open or unlock rewards.
requireIn(html, 'APULAB_CONTROL_N1_V1 · preserve scientific completion; remove reward presentation.', 'html:neutral_completion_patch_missing');
requireIn(html, 'journalUnlocked = false;', 'html:journal_reward_not_neutralized');
requireIn(html, 'successOverlay?.classList.remove("is-visible")', 'html:celebratory_overlay_can_open');
requireIn(html, 'Medición completada. Valor registrado:', 'html:neutral_completion_status_missing');

// B. EXTERNAL CONTROL RUNTIME ----------------------------------------------
requireIn(runtime, 'APULAB_CONTROL_N1_V1', 'runtime:adapter_marker_missing');
requireIn(runtime, "const STORAGE_KEY = 'apulab.control.n1.state.v1';", 'runtime:persistence_key_missing');
requireIn(runtime, "const VOLTAGE = 15.0;", 'runtime:voltage_contract_missing');
requireIn(runtime, "layer.id = 'apulab-control-n1';", 'runtime:control_root_missing');
requireIn(runtime, 'ACTIVIDAD 1 DE 7 · MEDIR', 'runtime:neutral_activity_heading_missing');
requireIn(runtime, 'Modo preparado', 'runtime:preconfigured_mode_copy_missing');
requireIn(runtime, '<strong>COM</strong><span>Cable negro conectado</span>', 'runtime:com_preconfigured_missing');
requireIn(runtime, '<strong>VΩ</strong><span>Cable rojo conectado</span>', 'runtime:vohm_preconfigured_missing');
requireIn(runtime, 'control-red-probe', 'runtime:red_probe_missing');
requireIn(runtime, 'control-black-probe', 'runtime:black_probe_missing');
requireIn(runtime, 'control-terminal-positive', 'runtime:positive_terminal_missing');
requireIn(runtime, 'control-terminal-negative', 'runtime:negative_terminal_missing');
requireIn(runtime, 'MEDICIÓN COMPLETADA', 'runtime:neutral_completion_heading_missing');
requireIn(runtime, 'Valor registrado: <strong>15.0 V</strong>', 'runtime:neutral_completion_value_missing');
requireIn(runtime, "if (kind === 'reversed') return -VOLTAGE;", 'runtime:negative_polarity_reading_missing');
requireIn(runtime, "if (kind === 'conventional') return VOLTAGE;", 'runtime:positive_reading_missing');
requireIn(runtime, "if (kind === 'one') return 'Falta conectar el segundo punto.';", 'runtime:one_probe_feedback_missing');
requireIn(runtime, 'La lectura tiene signo negativo. Revisa la posición de las puntas.', 'runtime:negative_feedback_missing');
requireIn(runtime, "if (state.batteryPowered && state.multimeterPowered && measureKind() === 'conventional' && reading() === VOLTAGE)", 'runtime:completion_guard_missing');
requireIn(runtime, "emit('measurement_completed'", 'runtime:measurement_completed_missing');
requireIn(runtime, "emit('level_completed'", 'runtime:level_completed_missing');
requireIn(runtime, 'state.emitted[onceKey]', 'runtime:idempotency_guard_missing');
requireIn(runtime, 'replayStateIntoOriginalEngine', 'runtime:refresh_replay_missing');

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
]) requireIn(runtime, `'${eventName}'`, `runtime:telemetry_event_missing:${eventName}`);

for (const marker of [
  'batteryPowered',
  'multimeterPowered',
  'probeRedConnection',
  'probeBlackConnection',
  'currentReading',
  'negativePolarityObserved',
  'polarityCorrected',
  'helpCount',
  'completionState',
  'levelStartedAt',
  'completionTimestamp',
  'emitted',
]) requireIn(runtime, marker, `runtime:persistence_contract_missing:${marker}`);

for (const forbidden of [
  'reading_attempt_count',
  'reading_first_attempt_correct',
  'reading_response_submitted',
  'reading_response_changed',
  '¿Qué valor mediste?',
]) forbidIn(runtime, forbidden, `runtime:forbidden_reading_task:${forbidden}`);

// C. EXTERNAL CONTROL CSS --------------------------------------------------
requireIn(css, 'APULAB_CONTROL_N1_V1', 'css:adapter_marker_missing');
requireIn(css, '#apulab-control-n1{', 'css:control_layout_missing');
requireIn(css, '#kawsay-canvas{opacity:0!important;pointer-events:none!important}', 'css:3d_surface_not_flattened');
requireIn(css, '#kawsay-success-overlay,#kawsay-journal-overlay,#kawsay-confetti,', 'css:original_reward_layer_not_hidden');
requireIn(css, '#apulab-celebration-layer{display:none!important', 'css:shared_confetti_not_hidden');
requireIn(css, '.control-completion-card', 'css:neutral_completion_layout_missing');
requireIn(css, ':focus-visible', 'css:focus_contract_missing');
forbidIn(css, '@keyframes', 'css:decorative_animation_present');

// D. TELEMETRY BRIDGE ------------------------------------------------------
requireIn(bridge, 'installLevel1ControlTelemetryBridge', 'bridge:export_missing');
requireIn(bridge, "data.type !== 'apulab-control-n1-telemetry'", 'bridge:message_type_guard_missing');
requireIn(bridge, "condition: 'control'", 'bridge:condition_missing');
requireIn(bridge, 'level: 1', 'bridge:level_missing');
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
]) requireIn(bridge, `'${eventName}'`, `bridge:event_not_allowed:${eventName}`);
for (const piiGuard of [
  'participant_id: _ignoredParticipant',
  'session_id: _ignoredSession',
  'participant_code: _ignoredCode',
  'credential: _ignoredCredential',
  'password: _ignoredPassword',
]) requireIn(bridge, piiGuard, `bridge:pii_guard_missing:${piiGuard}`);

// E. APP INTEGRATION -------------------------------------------------------
requireIn(main, "import { installLevel1ControlTelemetryBridge } from './systems/Level1ControlTelemetryBridge';", 'main:bridge_import_missing');
requireIn(main, 'installLevel1ControlTelemetryBridge();', 'main:bridge_install_missing');

console.info('[control-n1] CONTROL_N1_AUDIT = PASS · external GC adapter mounted · task core preserved · neutral completion · telemetry/persistence guards');
