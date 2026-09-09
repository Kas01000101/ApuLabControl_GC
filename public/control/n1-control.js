(() => {
  // APULAB_CONTROL_N1_V1
  const root = document.querySelector('#kawsay-rover-battery .kawsay-stage');
  const canvas = document.getElementById('kawsay-canvas');
  if (!root || !canvas) return;

  document.title = 'ApuLab Control · Actividad 1 · Medir';
  canvas.setAttribute('aria-hidden', 'true');

  const STORAGE_KEY = 'apulab.control.n1.state.v1';
  const MESSAGE_TYPE = 'apulab-control-n1-telemetry';
  const VOLTAGE = 15.0;
  const LOGICAL = Object.freeze({
    width: 1672,
    height: 941,
    batteryPower: { x: 1302, y: 482 },
    meterPower: { x: 544, y: 406 },
    redHome: { x: 913, y: 681 },
    blackHome: { x: 1098, y: 708 },
    positive: { x: 964, y: 369 },
    negative: { x: 1266, y: 369 },
  });

  const nowIso = () => new Date().toISOString();
  const safeParse = (value) => { try { return JSON.parse(value); } catch (_) { return null; } };
  const freshState = () => ({
    version: 1,
    batteryPowered: false,
    multimeterPowered: false,
    probeRedConnection: null,
    probeBlackConnection: null,
    currentReading: null,
    negativePolarityObserved: false,
    polarityCorrected: false,
    helpCount: 0,
    completionState: 'in_progress',
    levelStartedAt: nowIso(),
    completionTimestamp: null,
    lastMeasurementState: 'none',
    emitted: {},
  });

  const loaded = safeParse(localStorage.getItem(STORAGE_KEY));
  const state = loaded && loaded.version === 1 ? { ...freshState(), ...loaded, emitted: { ...(loaded.emitted || {}) } } : freshState();
  let selectedProbe = null;
  let replaying = false;
  let coreReady = false;
  let firstActionRecorded = Boolean(state.emitted.first_action_local);

  const save = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
  };

  const emit = (event, payload = {}, onceKey = null) => {
    if (replaying) return;
    if (onceKey && state.emitted[onceKey]) return;
    if (onceKey) state.emitted[onceKey] = true;
    if (!firstActionRecorded && event !== 'level_started') {
      firstActionRecorded = true;
      state.emitted.first_action_local = true;
      payload = { ...payload, time_from_level_start_ms: Math.max(0, Date.now() - Date.parse(state.levelStartedAt)) };
    }
    save();
    try {
      window.parent.postMessage({ type: MESSAGE_TYPE, event, payload }, window.location.origin);
    } catch (_) {}
  };

  const originalSfx = (() => { try { return localStorage.getItem('apulab.settings.sfx'); } catch (_) { return null; } })();
  try { localStorage.setItem('apulab.settings.sfx', 'off'); } catch (_) {}
  const originalMusicVolume = (() => {
    try {
      const raw = window.parent.localStorage.getItem('apulab.settings.musicVolume');
      const parsed = raw === null ? 15 : Number(raw);
      return Number.isFinite(parsed) ? parsed : 15;
    } catch (_) { return 15; }
  })();
  const setParentMusic = (volume) => {
    if (window.parent === window) return;
    try {
      const ParentEvent = window.parent.CustomEvent;
      window.parent.dispatchEvent(new ParentEvent('apulab-settings-changed', { detail: { musicVolume: volume } }));
    } catch (_) {}
  };
  setParentMusic(0);

  const layer = document.createElement('section');
  layer.id = 'apulab-control-n1';
  layer.setAttribute('aria-label', 'Actividad 1 de 7: medición de voltaje');
  layer.innerHTML = "\n    <header class=\"control-n1-header\">\n      <div class=\"control-n1-heading\">\n        <span class=\"control-n1-kicker\">ACTIVIDAD 1 DE 7 · MEDIR</span>\n        <h1>Medición de voltaje en una batería de práctica</h1>\n      </div>\n      <div class=\"control-n1-actions\" aria-label=\"Ayuda de la actividad\">\n        <button id=\"control-explore\" class=\"control-n1-button\" type=\"button\" aria-pressed=\"false\">INFORMACIÓN</button>\n        <button id=\"control-guide\" class=\"control-n1-button\" type=\"button\" aria-pressed=\"false\">GUÍA</button>\n      </div>\n    </header>\n    <main class=\"control-n1-workspace\">\n      <section class=\"control-panel\" aria-labelledby=\"control-meter-title\">\n        <h2 id=\"control-meter-title\">Multímetro</h2>\n        <div class=\"control-meter-body\">\n          <div id=\"control-reading\" class=\"control-meter-display is-off\" aria-live=\"polite\">—</div>\n          <div class=\"control-meter-row\">\n            <button id=\"control-meter-power\" class=\"control-power\" type=\"button\" aria-pressed=\"false\">POWER</button>\n            <div class=\"control-mode\"><span>Modo preparado</span><strong>V⎓</strong></div>\n          </div>\n          <div class=\"control-jacks\" aria-label=\"Conexiones preconfiguradas del multímetro\">\n            <div class=\"control-jack\"><strong>COM</strong><span>Cable negro conectado</span></div>\n            <div class=\"control-jack\"><strong>VΩ</strong><span>Cable rojo conectado</span></div>\n          </div>\n        </div>\n      </section>\n      <section class=\"control-panel\" aria-labelledby=\"control-battery-title\">\n        <h2 id=\"control-battery-title\">Batería de práctica</h2>\n        <div class=\"control-battery-body\">\n          <div><div class=\"control-battery-label\">Fuente de 15.0 V</div><div class=\"control-battery-note\">Usa una punta en cada terminal para medir entre dos puntos.</div></div>\n          <div class=\"control-terminals\" aria-label=\"Terminales de la batería\">\n            <button id=\"control-terminal-positive\" class=\"control-terminal\" type=\"button\" data-terminal=\"positive\" aria-label=\"Terminal positivo\">+</button>\n            <button id=\"control-terminal-negative\" class=\"control-terminal\" type=\"button\" data-terminal=\"negative\" aria-label=\"Terminal negativo\">−</button>\n          </div>\n          <div class=\"control-meter-row\"><span>Alimentación</span><button id=\"control-battery-power\" class=\"control-power\" type=\"button\" aria-pressed=\"false\">POWER</button></div>\n        </div>\n      </section>\n      <section class=\"control-probes\" aria-labelledby=\"control-probes-title\">\n        <h2 id=\"control-probes-title\">Puntas de medición</h2>\n        <button id=\"control-red-probe\" class=\"control-probe\" type=\"button\" data-probe=\"red\" aria-pressed=\"false\">\n          <span class=\"probe-shaft\" aria-hidden=\"true\"></span><span class=\"probe-copy\"><strong>Punta roja</strong><span id=\"control-red-status\">Sin conectar</span></span>\n        </button>\n        <button id=\"control-black-probe\" class=\"control-probe\" type=\"button\" data-probe=\"black\" aria-pressed=\"false\">\n          <span class=\"probe-shaft\" aria-hidden=\"true\"></span><span class=\"probe-copy\"><strong>Punta negra</strong><span id=\"control-black-status\">Sin conectar</span></span>\n        </button>\n      </section>\n    </main>\n    <footer class=\"control-n1-footer\">\n      <div id=\"control-feedback\" class=\"control-feedback\" role=\"status\" aria-live=\"polite\"></div>\n      <div id=\"control-reading-summary\" class=\"control-reading-summary\">Lectura: —</div>\n    </footer>\n    <aside id=\"control-help-panel\" class=\"control-help-panel\" hidden aria-live=\"polite\"></aside>\n    <div id=\"control-completion\" class=\"control-completion\" hidden>\n      <section class=\"control-completion-card\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"control-completion-title\">\n        <h2 id=\"control-completion-title\">MEDICIÓN COMPLETADA</h2>\n        <p>Valor registrado: <strong>15.0 V</strong></p>\n        <button id=\"control-continue\" class=\"control-n1-button\" type=\"button\">CONTINUAR</button>\n      </section>\n    </div>";
  root.appendChild(layer);

  const $ = (id) => document.getElementById(id);
  const readingEl = $('control-reading');
  const feedbackEl = $('control-feedback');
  const summaryEl = $('control-reading-summary');
  const completionEl = $('control-completion');
  const helpPanel = $('control-help-panel');
  const batteryPowerButton = $('control-battery-power');
  const meterPowerButton = $('control-meter-power');
  const redProbeButton = $('control-red-probe');
  const blackProbeButton = $('control-black-probe');
  const positiveTerminal = $('control-terminal-positive');
  const negativeTerminal = $('control-terminal-negative');
  const scientificControls = [batteryPowerButton, meterPowerButton, redProbeButton, blackProbeButton, positiveTerminal, negativeTerminal];
  scientificControls.forEach((control) => { control.disabled = true; });

  const terminalLabel = (terminal) => terminal === 'positive' ? '+' : terminal === 'negative' ? '−' : null;
  const measureKind = () => {
    const red = state.probeRedConnection;
    const black = state.probeBlackConnection;
    if (!red && !black) return 'none';
    if (!red || !black) return 'one';
    if (red === 'positive' && black === 'negative') return 'conventional';
    if (red === 'negative' && black === 'positive') return 'reversed';
    return 'same-point';
  };
  const reading = () => {
    if (!state.multimeterPowered) return null;
    if (!state.batteryPowered) return 0.0;
    const kind = measureKind();
    if (kind === 'conventional') return VOLTAGE;
    if (kind === 'reversed') return -VOLTAGE;
    return 0.0;
  };

  const feedbackForState = () => {
    if (!state.batteryPowered) return 'Enciende la batería para comenzar la medición.';
    if (!state.multimeterPowered) return 'Enciende el multímetro. El modo V⎓ y las conexiones COM/VΩ ya están preparados.';
    const kind = measureKind();
    if (kind === 'none') return 'Conecta las dos puntas para medir entre dos puntos.';
    if (kind === 'one') return 'Falta conectar el segundo punto.';
    if (kind === 'reversed') return 'La lectura tiene signo negativo. Revisa la posición de las puntas.';
    if (kind === 'conventional') return 'Medición completada.';
    return 'Usa un terminal distinto para cada punta.';
  };

  const render = () => {
    state.currentReading = reading();
    batteryPowerButton.setAttribute('aria-pressed', String(state.batteryPowered));
    meterPowerButton.setAttribute('aria-pressed', String(state.multimeterPowered));
    redProbeButton.setAttribute('aria-pressed', String(selectedProbe === 'red'));
    blackProbeButton.setAttribute('aria-pressed', String(selectedProbe === 'black'));
    redProbeButton.classList.toggle('is-selected', selectedProbe === 'red');
    blackProbeButton.classList.toggle('is-selected', selectedProbe === 'black');
    positiveTerminal.classList.toggle('is-target', Boolean(selectedProbe));
    negativeTerminal.classList.toggle('is-target', Boolean(selectedProbe));
    $('control-red-status').textContent = state.probeRedConnection ? 'Conectada a ' + terminalLabel(state.probeRedConnection) : 'Sin conectar';
    $('control-black-status').textContent = state.probeBlackConnection ? 'Conectada a ' + terminalLabel(state.probeBlackConnection) : 'Sin conectar';
    const value = state.currentReading;
    readingEl.textContent = value === null ? '—' : value.toFixed(1) + ' V';
    readingEl.classList.toggle('is-off', value === null);
    summaryEl.textContent = 'Lectura: ' + (value === null ? '—' : value.toFixed(1) + ' V');
    feedbackEl.innerHTML = feedbackForState() + '<small>Selecciona una punta y luego el terminal al que deseas llevarla.</small>';
    completionEl.hidden = state.completionState !== 'completed';
    save();
  };

  const logicalToClient = (point) => {
    const rect = canvas.getBoundingClientRect();
    return { x: rect.left + (point.x / LOGICAL.width) * rect.width, y: rect.top + (point.y / LOGICAL.height) * rect.height };
  };
  let syntheticPointerId = 7100;
  const dispatchCanvasPointer = (type, point, pointerId) => {
    const p = logicalToClient(point);
    const event = new PointerEvent(type, { bubbles: true, cancelable: true, pointerId, pointerType: 'mouse', isPrimary: true, clientX: p.x, clientY: p.y, buttons: type === 'pointerup' ? 0 : 1, button: 0 });
    canvas.dispatchEvent(event);
  };
  const forwardPower = (point) => {
    const pointerId = ++syntheticPointerId;
    dispatchCanvasPointer('pointerdown', point, pointerId);
    dispatchCanvasPointer('pointerup', point, pointerId);
  };
  const homeFor = (probe) => probe === 'red' ? LOGICAL.redHome : LOGICAL.blackHome;
  const pointForTerminal = (terminal) => terminal === 'positive' ? LOGICAL.positive : LOGICAL.negative;
  const forwardProbe = (probe, fromTerminal, toTerminal) => {
    const pointerId = ++syntheticPointerId;
    const from = fromTerminal ? pointForTerminal(fromTerminal) : homeFor(probe);
    const to = pointForTerminal(toTerminal);
    dispatchCanvasPointer('pointerdown', from, pointerId);
    const middle = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
    dispatchCanvasPointer('pointermove', middle, pointerId);
    dispatchCanvasPointer('pointermove', to, pointerId);
    dispatchCanvasPointer('pointerup', to, pointerId);
  };

  const emitMeasurementState = () => {
    const kind = measureKind();
    if (kind === state.lastMeasurementState) return;
    state.lastMeasurementState = kind;
    emit('measurement_state_changed', { state: kind, reading: reading() });
    if (kind === 'reversed') {
      state.negativePolarityObserved = true;
      emit('negative_polarity_observed', { reading: -VOLTAGE }, 'negative_polarity_observed');
    }
    if (kind === 'conventional' && state.negativePolarityObserved && !state.polarityCorrected) {
      state.polarityCorrected = true;
      emit('polarity_corrected', { reading: VOLTAGE }, 'polarity_corrected');
    }
    save();
  };

  const completeIfNeeded = () => {
    if (state.batteryPowered && state.multimeterPowered && measureKind() === 'conventional' && reading() === VOLTAGE) {
      if (state.completionState !== 'completed') {
        state.completionState = 'completed';
        state.completionTimestamp = nowIso();
      }
      const completionTime = Math.max(0, Date.parse(state.completionTimestamp) - Date.parse(state.levelStartedAt));
      emit('measurement_completed', { reading: VOLTAGE, completion_time_ms: completionTime }, 'measurement_completed');
      emit('level_completed', { final_measurement_value: VOLTAGE, completion_time_ms: completionTime }, 'level_completed');
      save();
    }
  };

  const afterScientificAction = () => {
    state.currentReading = reading();
    emitMeasurementState();
    completeIfNeeded();
    render();
  };

  batteryPowerButton.addEventListener('click', () => {
    if (!coreReady) return;
    forwardPower(LOGICAL.batteryPower);
    state.batteryPowered = !state.batteryPowered;
    emit('battery_power_changed', { powered: state.batteryPowered });
    afterScientificAction();
  });
  meterPowerButton.addEventListener('click', () => {
    if (!coreReady) return;
    forwardPower(LOGICAL.meterPower);
    state.multimeterPowered = !state.multimeterPowered;
    emit('multimeter_power_changed', { powered: state.multimeterPowered });
    afterScientificAction();
  });

  const selectProbe = (probe) => {
    if (!coreReady) return;
    selectedProbe = selectedProbe === probe ? null : probe;
    render();
  };
  redProbeButton.addEventListener('click', () => selectProbe('red'));
  blackProbeButton.addEventListener('click', () => selectProbe('black'));

  const connectSelectedProbe = (terminal) => {
    if (!coreReady) return;
    if (!selectedProbe) {
      feedbackEl.textContent = 'Selecciona primero una punta de medición.';
      return;
    }
    const probe = selectedProbe;
    const oldConnection = probe === 'red' ? state.probeRedConnection : state.probeBlackConnection;
    const otherConnection = probe === 'red' ? state.probeBlackConnection : state.probeRedConnection;
    forwardProbe(probe, oldConnection, terminal);

    let nextConnection = terminal;
    if (otherConnection === terminal) nextConnection = null;
    if (probe === 'red') state.probeRedConnection = nextConnection;
    else state.probeBlackConnection = nextConnection;
    selectedProbe = null;

    if (nextConnection !== oldConnection) {
      emit('probe_connection_changed', { probe, terminal: nextConnection });
    }
    afterScientificAction();
  };
  positiveTerminal.addEventListener('click', () => connectSelectedProbe('positive'));
  negativeTerminal.addEventListener('click', () => connectSelectedProbe('negative'));

  const closeHelp = () => {
    helpPanel.hidden = true;
    $('control-explore').setAttribute('aria-pressed', 'false');
    $('control-guide').setAttribute('aria-pressed', 'false');
  };
  const openHelp = (kind) => {
    state.helpCount += 1;
    emit('help_requested', { kind, help_count: state.helpCount });
    if (kind === 'explore') {
      helpPanel.innerHTML = '<h2>Información de la medición</h2><p>El voltaje compara dos puntos. Esta batería tiene terminales + y −.</p><p>El multímetro está preparado en V⎓ y sus cables ya están conectados a COM y VΩ.</p><p>Usa una punta en cada terminal y observa tanto el valor como el signo.</p><button id="control-help-close" class="control-n1-button" type="button">CERRAR</button>';
    } else {
      helpPanel.innerHTML = '<h2>Guía</h2><ol><li>Enciende la batería.</li><li>Enciende el multímetro.</li><li>Coloca una punta en cada terminal y observa la lectura.</li></ol><button id="control-help-close" class="control-n1-button" type="button">CERRAR</button>';
    }
    helpPanel.hidden = false;
    $('control-explore').setAttribute('aria-pressed', String(kind === 'explore'));
    $('control-guide').setAttribute('aria-pressed', String(kind === 'guide'));
    $('control-help-close')?.addEventListener('click', closeHelp, { once: true });
    save();
  };
  $('control-explore').addEventListener('click', () => helpPanel.hidden ? openHelp('explore') : closeHelp());
  $('control-guide').addEventListener('click', () => helpPanel.hidden ? openHelp('guide') : closeHelp());

  $('control-continue').addEventListener('click', () => {
    if (state.completionState !== 'completed') return;
    if (window.parent === window) {
      window.location.href = '/missions/mission01/level2.html';
      return;
    }
    window.parent.postMessage({ type: 'apulab-level-complete', level: 1, nextLevel: 2 }, window.location.origin);
  });

  const replayStateIntoOriginalEngine = () => {
    replaying = true;
    try {
      if (state.batteryPowered) forwardPower(LOGICAL.batteryPower);
      if (state.multimeterPowered) forwardPower(LOGICAL.meterPower);
      if (state.probeRedConnection) forwardProbe('red', null, state.probeRedConnection);
      if (state.probeBlackConnection) forwardProbe('black', null, state.probeBlackConnection);
    } finally {
      replaying = false;
    }
  };

  window.addEventListener('apulab-control-n1-completed', () => {
    if (replaying) return;
    completeIfNeeded();
    render();
  });

  if (!state.emitted.level_started) emit('level_started', { condition: 'control' }, 'level_started');
  render();

  const liveStatus = document.getElementById('kawsay-live-status');
  const waitForOriginalCore = (attempt = 0) => {
    const ready = Boolean((liveStatus?.textContent || '').trim());
    if (!ready && attempt < 150) {
      window.setTimeout(() => waitForOriginalCore(attempt + 1), 40);
      return;
    }
    coreReady = ready;
    if (!coreReady) {
      feedbackEl.textContent = 'No se pudo preparar la actividad de medición.';
      return;
    }
    replayStateIntoOriginalEngine();
    scientificControls.forEach((control) => { control.disabled = false; });
    render();
  };
  waitForOriginalCore();

  const cleanup = () => {
    if (originalSfx === null) {
      try { localStorage.removeItem('apulab.settings.sfx'); } catch (_) {}
    } else {
      try { localStorage.setItem('apulab.settings.sfx', originalSfx); } catch (_) {}
    }
    setParentMusic(originalMusicVolume);
  };
  window.addEventListener('pagehide', cleanup, { once: true });
  window.addEventListener('beforeunload', cleanup, { once: true });
})();
