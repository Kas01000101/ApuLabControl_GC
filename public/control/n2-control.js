(async () => {
  // APULAB_CONTROL_N2_V1
  if (document.getElementById('apulab-control-n2')) return;

  const STORAGE_KEY = 'apulab.control.n2.state.v1';
  const MESSAGE_TYPE = 'apulab-control-n2-telemetry';
  const CONFIG_URL = '/control/study-config.json';

  const configResponse = await fetch(CONFIG_URL, { cache: 'no-store' });
  if (!configResponse.ok) throw new Error('control_n2_config_fetch_failed');
  const studyConfig = await configResponse.json();
  const CONFIG = studyConfig?.level2;
  if (!CONFIG || !Array.isArray(CONFIG.batteries) || CONFIG.batteries.length !== 3) {
    throw new Error('control_n2_config_invalid');
  }

  const batteryById = new Map(CONFIG.batteries.map((battery) => [battery.id, battery]));
  const compatible = CONFIG.batteries.filter((battery) =>
    battery.voltage > CONFIG.requiredVoltage.minExclusive &&
    battery.voltage < CONFIG.requiredVoltage.maxExclusive
  );
  if (compatible.length !== 1 || compatible[0].id !== CONFIG.correctBatteryId) {
    throw new Error('control_n2_config_parity_invalid');
  }

  const nowMs = () => Date.now();
  const safeParse = (value) => { try { return JSON.parse(value); } catch (_) { return null; } };
  const freshState = () => ({
    version: 1,
    activeBatteryId: 'A',
    viewed: { A: false, B: false, C: false },
    registered: {},
    measurementOrder: [],
    selectedBatteryId: null,
    submittedChoices: [],
    selectionAttemptCount: 0,
    responseChangeCount: 0,
    firstChoiceCorrect: null,
    finalSuccess: false,
    helpCount: 0,
    startedAt: nowMs(),
    completedAt: null,
    emitted: {},
    lastChoiceChangeCountedForAttempt: 0,
    feedback: '',
  });

  const loaded = safeParse(localStorage.getItem(STORAGE_KEY));
  const state = loaded && loaded.version === 1
    ? {
        ...freshState(),
        ...loaded,
        viewed: { A: false, B: false, C: false, ...(loaded.viewed || {}) },
        registered: { ...(loaded.registered || {}) },
        measurementOrder: Array.isArray(loaded.measurementOrder) ? [...loaded.measurementOrder] : [],
        submittedChoices: Array.isArray(loaded.submittedChoices) ? [...loaded.submittedChoices] : [],
        emitted: { ...(loaded.emitted || {}) },
      }
    : freshState();

  if (!batteryById.has(state.activeBatteryId)) state.activeBatteryId = 'A';
  if (state.selectedBatteryId && !batteryById.has(state.selectedBatteryId)) state.selectedBatteryId = null;

  let firstActionRecorded = Boolean(state.emitted.first_action_local);
  const save = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
  };
  const emit = (event, payload = {}, onceKey = null) => {
    if (onceKey && state.emitted[onceKey]) return;
    if (onceKey) state.emitted[onceKey] = true;
    if (!firstActionRecorded && event !== 'level_started') {
      firstActionRecorded = true;
      state.emitted.first_action_local = true;
      payload = { ...payload, time_to_first_action_ms: Math.max(0, nowMs() - state.startedAt) };
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
  document.querySelectorAll('audio,video').forEach((media) => {
    try { media.pause(); media.muted = true; } catch (_) {}
  });

  document.title = 'ApuLab Control · Actividad 2 · Comparar';
  document.body.classList.add('apulab-control-n2-active');

  const layer = document.createElement('section');
  layer.id = 'apulab-control-n2';
  layer.setAttribute('aria-label', 'Actividad 2 de 7: comparar mediciones');
  layer.innerHTML = `
    <header class="control-n2-header">
      <div>
        <span class="control-n2-kicker">ACTIVIDAD 2 DE 7 · COMPARAR</span>
        <h1>Compara tres mediciones y elige la batería compatible</h1>
        <p>Registra las tres mediciones antes de tomar la decisión final.</p>
      </div>
      <button id="control-n2-help" class="control-n2-button secondary" type="button">AYUDA</button>
    </header>

    <main class="control-n2-main">
      <section class="control-n2-observation" aria-labelledby="control-n2-observation-title">
        <div class="control-n2-section-heading">
          <div>
            <span class="control-n2-step">1 · OBSERVAR Y REGISTRAR</span>
            <h2 id="control-n2-observation-title">Mediciones</h2>
          </div>
          <div id="control-n2-progress" class="control-n2-progress">0 / 3 registradas</div>
        </div>

        <div class="control-n2-tabs" role="tablist" aria-label="Alternativas de batería">
          <button id="control-n2-tab-A" class="control-n2-tab" type="button" role="tab" data-battery="A">BATERÍA A</button>
          <button id="control-n2-tab-B" class="control-n2-tab" type="button" role="tab" data-battery="B">BATERÍA B</button>
          <button id="control-n2-tab-C" class="control-n2-tab" type="button" role="tab" data-battery="C">BATERÍA C</button>
        </div>

        <div class="control-n2-measurement-card">
          <div class="control-n2-battery-visual" aria-hidden="true">
            <span class="control-n2-terminal">−</span>
            <strong id="control-n2-battery-letter">A</strong>
            <span class="control-n2-terminal">+</span>
          </div>
          <div class="control-n2-reading-block">
            <span>MEDICIÓN OBSERVADA</span>
            <strong id="control-n2-reading">—</strong>
            <small>Lectura del Study Build para esta alternativa.</small>
          </div>
          <button id="control-n2-register" class="control-n2-button primary" type="button">REGISTRAR MEDICIÓN</button>
        </div>
      </section>

      <aside class="control-n2-analysis" aria-label="Registro y requisito">
        <section class="control-n2-panel">
          <span class="control-n2-step">REGISTRO DE MEDICIONES</span>
          <div class="control-n2-record"><span>A</span><strong id="control-n2-record-A">—</strong></div>
          <div class="control-n2-record"><span>B</span><strong id="control-n2-record-B">—</strong></div>
          <div class="control-n2-record"><span>C</span><strong id="control-n2-record-C">—</strong></div>
        </section>
        <section class="control-n2-panel requirement">
          <span class="control-n2-step">REQUISITO</span>
          <strong id="control-n2-range">—</strong>
          <p>La batería compatible debe cumplir ambos límites.</p>
        </section>
      </aside>
    </main>

    <section class="control-n2-decision" aria-labelledby="control-n2-decision-title">
      <div class="control-n2-section-heading">
        <div>
          <span class="control-n2-step">2 · COMPARAR Y DECIDIR</span>
          <h2 id="control-n2-decision-title">¿Qué batería cumple el requisito?</h2>
        </div>
        <span id="control-n2-decision-lock" class="control-n2-lock">BLOQUEADA HASTA 3 / 3</span>
      </div>
      <div class="control-n2-choices" role="radiogroup" aria-label="Selección final de batería">
        <button id="control-n2-choice-A" class="control-n2-choice" type="button" role="radio" aria-checked="false" data-choice="A">A</button>
        <button id="control-n2-choice-B" class="control-n2-choice" type="button" role="radio" aria-checked="false" data-choice="B">B</button>
        <button id="control-n2-choice-C" class="control-n2-choice" type="button" role="radio" aria-checked="false" data-choice="C">C</button>
      </div>
      <button id="control-n2-submit" class="control-n2-button primary" type="button" disabled>COMPROBAR</button>
      <div id="control-n2-feedback" class="control-n2-feedback" role="status" aria-live="polite"></div>
    </section>

    <aside id="control-n2-help-panel" class="control-n2-help-panel" hidden>
      <div>
        <h2>AYUDA</h2>
        <p>Observa las tres mediciones, regístralas y compáralas con el requisito antes de seleccionar.</p>
      </div>
      <button id="control-n2-help-close" class="control-n2-button secondary" type="button">CERRAR</button>
    </aside>

    <div id="control-n2-completion" class="control-n2-completion" hidden>
      <section class="control-n2-completion-card" role="dialog" aria-modal="true" aria-labelledby="control-n2-completion-title">
        <h2 id="control-n2-completion-title">COMPARACIÓN COMPLETADA</h2>
        <p>La batería seleccionada cumple el requisito de la actividad.</p>
        <button id="control-n2-continue" class="control-n2-button primary" type="button">CONTINUAR</button>
      </section>
    </div>
  `;
  document.body.appendChild(layer);

  const $ = (id) => document.getElementById(id);
  const tabs = [...layer.querySelectorAll('.control-n2-tab')];
  const choices = [...layer.querySelectorAll('.control-n2-choice')];
  const registerButton = $('control-n2-register');
  const submitButton = $('control-n2-submit');
  const feedback = $('control-n2-feedback');
  const completion = $('control-n2-completion');
  const helpPanel = $('control-n2-help-panel');

  const registeredCount = () => Object.keys(state.registered).filter((id) => batteryById.has(id)).length;
  const measurementMap = () => Object.fromEntries(CONFIG.batteries.map((battery) => [battery.id, state.registered[battery.id] ?? null]));
  const activeBattery = () => batteryById.get(state.activeBatteryId) || CONFIG.batteries[0];
  const lastSubmittedChoice = () => state.submittedChoices[state.submittedChoices.length - 1] || null;

  const markViewed = (id) => {
    if (state.viewed[id]) return;
    state.viewed[id] = true;
    const battery = batteryById.get(id);
    emit('battery_viewed', { battery_id: id, voltage: battery?.voltage ?? null }, `battery_viewed_${id}`);
  };

  const render = () => {
    const active = activeBattery();
    const count = registeredCount();
    $('control-n2-battery-letter').textContent = active.id;
    $('control-n2-reading').textContent = `${Number(active.voltage).toFixed(1)} V`;
    $('control-n2-range').textContent = `> ${Number(CONFIG.requiredVoltage.minExclusive).toFixed(1)} V y < ${Number(CONFIG.requiredVoltage.maxExclusive).toFixed(1)} V`;
    $('control-n2-progress').textContent = `${count} / 3 registradas`;

    for (const battery of CONFIG.batteries) {
      const tab = $(`control-n2-tab-${battery.id}`);
      const selected = battery.id === active.id;
      tab.setAttribute('aria-selected', String(selected));
      tab.classList.toggle('is-active', selected);
      tab.classList.toggle('is-registered', Object.prototype.hasOwnProperty.call(state.registered, battery.id));
      const record = $(`control-n2-record-${battery.id}`);
      record.textContent = Object.prototype.hasOwnProperty.call(state.registered, battery.id)
        ? `${Number(state.registered[battery.id]).toFixed(1)} V`
        : '—';
    }

    const alreadyRegistered = Object.prototype.hasOwnProperty.call(state.registered, active.id);
    registerButton.disabled = alreadyRegistered || state.finalSuccess;
    registerButton.textContent = alreadyRegistered ? 'MEDICIÓN REGISTRADA' : 'REGISTRAR MEDICIÓN';

    const unlocked = count === 3;
    $('control-n2-decision-lock').textContent = unlocked ? '3 / 3 REGISTRADAS' : 'BLOQUEADA HASTA 3 / 3';
    $('control-n2-decision-lock').classList.toggle('is-unlocked', unlocked);
    for (const choice of choices) {
      const id = choice.dataset.choice;
      choice.disabled = !unlocked || state.finalSuccess;
      choice.setAttribute('aria-checked', String(state.selectedBatteryId === id));
      choice.classList.toggle('is-selected', state.selectedBatteryId === id);
    }
    submitButton.disabled = !unlocked || !state.selectedBatteryId || state.finalSuccess;
    feedback.textContent = state.feedback || (unlocked
      ? 'Compara el registro con el requisito y selecciona una alternativa.'
      : 'Registra las tres mediciones para habilitar la selección final.');
    completion.hidden = !state.finalSuccess;
    save();
  };

  const registerActiveMeasurement = () => {
    const active = activeBattery();
    markViewed(active.id);
    if (Object.prototype.hasOwnProperty.call(state.registered, active.id)) {
      emit('measurement_error', { battery_id: active.id, reason: 'already_registered' });
      return;
    }
    state.registered[active.id] = Number(active.voltage);
    state.measurementOrder.push(active.id);
    state.feedback = `Medición ${active.id} registrada.`;
    emit('measurement_registered', {
      battery_id: active.id,
      voltage: Number(active.voltage),
      registered_count: registeredCount(),
      measurement_order: [...state.measurementOrder],
    });
    if (registeredCount() === 3) {
      emit('all_three_measured', {
        measurements: measurementMap(),
        measurement_order: [...state.measurementOrder],
      }, 'all_three_measured');
      state.feedback = 'Las tres mediciones están registradas. Compara los valores con el requisito.';
    }
    render();
  };

  const selectChoice = (id) => {
    if (registeredCount() !== 3 || state.finalSuccess || !batteryById.has(id)) return;
    const submitted = lastSubmittedChoice();
    state.selectedBatteryId = id;
    if (submitted && id !== submitted && state.lastChoiceChangeCountedForAttempt !== state.selectionAttemptCount) {
      state.responseChangeCount += 1;
      state.lastChoiceChangeCountedForAttempt = state.selectionAttemptCount;
      emit('choice_changed', {
        from_battery_id: submitted,
        to_battery_id: id,
        response_change_count: state.responseChangeCount,
      });
    }
    state.feedback = 'Selección preparada. Pulsa COMPROBAR para enviar tu decisión.';
    render();
  };

  const submitChoice = () => {
    if (registeredCount() !== 3 || !state.selectedBatteryId || state.finalSuccess) return;
    const selected = state.selectedBatteryId;
    const isCorrect = selected === CONFIG.correctBatteryId;
    state.selectionAttemptCount += 1;
    state.submittedChoices.push(selected);
    if (state.firstChoiceCorrect === null) state.firstChoiceCorrect = isCorrect;
    emit('choice_submitted', {
      battery_id: selected,
      attempt_number: state.selectionAttemptCount,
      correct: isCorrect,
    });

    if (!isCorrect) {
      state.feedback = 'Compara nuevamente tus mediciones con el requisito.';
      render();
      return;
    }

    state.finalSuccess = true;
    state.completedAt = nowMs();
    state.feedback = 'La selección cumple el requisito.';
    emit('level_completed', {
      measurement_order: [...state.measurementOrder],
      all_three_measured: registeredCount() === 3,
      first_choice: state.submittedChoices[0] || null,
      final_choice: selected,
      attempt_count: state.selectionAttemptCount,
      first_attempt_success: state.firstChoiceCorrect === true,
      final_success: true,
      response_change_count: state.responseChangeCount,
      help_used: state.helpCount > 0,
      help_count: state.helpCount,
      completion_time_ms: Math.max(0, state.completedAt - state.startedAt),
    }, 'level_completed');
    render();
  };

  for (const tab of tabs) {
    tab.addEventListener('click', () => {
      const id = tab.dataset.battery;
      if (!id || !batteryById.has(id) || state.finalSuccess) return;
      state.activeBatteryId = id;
      markViewed(id);
      state.feedback = '';
      render();
    });
  }
  registerButton.addEventListener('click', registerActiveMeasurement);
  for (const choice of choices) choice.addEventListener('click', () => selectChoice(choice.dataset.choice));
  submitButton.addEventListener('click', submitChoice);

  $('control-n2-help').addEventListener('click', () => {
    state.helpCount += 1;
    emit('help_requested', { help_count: state.helpCount });
    helpPanel.hidden = false;
    render();
  });
  $('control-n2-help-close').addEventListener('click', () => { helpPanel.hidden = true; });
  $('control-n2-continue').addEventListener('click', () => {
    if (!state.finalSuccess) return;
    try {
      if (typeof window.parent.apulabCompleteLevel === 'function') {
        window.parent.apulabCompleteLevel(2, 3);
      } else {
        window.parent.postMessage({ type: 'apulab-level-complete', level: 2, nextLevel: 3 }, window.location.origin);
      }
    } catch (_) {
      window.parent.postMessage({ type: 'apulab-level-complete', level: 2, nextLevel: 3 }, window.location.origin);
    }
  });

  window.__apulabControlN2State = () => JSON.parse(JSON.stringify(state));
  window.__apulabControlN2Config = () => JSON.parse(JSON.stringify(CONFIG));

  window.addEventListener('pagehide', () => {
    setParentMusic(originalMusicVolume);
    try {
      if (originalSfx === null) localStorage.removeItem('apulab.settings.sfx');
      else localStorage.setItem('apulab.settings.sfx', originalSfx);
    } catch (_) {}
  }, { once: true });

  markViewed(state.activeBatteryId);
  emit('level_started', {
    source_commit: studyConfig.sourceCommit,
    battery_ids: CONFIG.batteries.map((battery) => battery.id),
  }, 'level_started');
  render();
})();
