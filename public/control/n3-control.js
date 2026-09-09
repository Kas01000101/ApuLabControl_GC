(async () => {
  // APULAB_CONTROL_N3_V1
  if (document.getElementById('apulab-control-n3')) return;

  const STORAGE_KEY = 'apulab.control.n3.state.v1';
  const MESSAGE_TYPE = 'apulab-control-n3-telemetry';
  const CONFIG_URL = '/control/study-config.json';
  const VALID_COMMANDS = new Set(['forward', 'left', 'right']);
  const ORIENTATIONS = ['NORTH', 'EAST', 'SOUTH', 'WEST'];
  const DELTAS = [
    { dr: -1, dc: 0 },
    { dr: 0, dc: 1 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
  ];

  const response = await fetch(CONFIG_URL, { cache: 'no-store' });
  if (!response.ok) throw new Error('control_n3_config_fetch_failed');
  const studyConfig = await response.json();
  const CONFIG = studyConfig?.level3;
  const configValid =
    CONFIG?.grid?.rows === 8 &&
    CONFIG?.grid?.columns === 8 &&
    CONFIG?.start?.row === 6 &&
    CONFIG?.start?.column === 1 &&
    CONFIG?.start?.orientation === 'NORTH' &&
    CONFIG?.goal?.row === 3 &&
    CONFIG?.goal?.column === 3 &&
    CONFIG?.blockLimit === 8 &&
    CONFIG?.commands?.forward === 'AVANZAR' &&
    CONFIG?.commands?.left === 'GIRAR IZQ.' &&
    CONFIG?.commands?.right === 'GIRAR DER.';
  if (!configValid) throw new Error('control_n3_config_parity_invalid');

  const nowMs = () => Date.now();
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const safeParse = (value) => { try { return JSON.parse(value); } catch (_) { return null; } };
  const cleanProgram = (value) => Array.isArray(value)
    ? value.filter((command) => VALID_COMMANDS.has(command)).slice(0, CONFIG.blockLimit)
    : [];
  const sameProgram = (a, b) =>
    Array.isArray(a) && Array.isArray(b) &&
    a.length === b.length && a.every((command, index) => command === b[index]);

  const freshState = () => ({
    version: 1,
    program: [],
    attemptCount: 0,
    firstSubmittedProgram: null,
    finalSubmittedProgram: null,
    firstAttemptSuccess: null,
    finalSuccess: false,
    responseChangeCount: 0,
    helpCount: 0,
    completed: false,
    startedAt: nowMs(),
    firstActionAt: null,
    completedAt: null,
    terminalEventEmitted: false,
    emitted: {},
    lastTrajectory: [],
    lastFinalState: null,
    hadFailedAttempt: false,
    feedback: '',
  });

  const loaded = safeParse(localStorage.getItem(STORAGE_KEY));
  const state = loaded && loaded.version === 1
    ? {
        ...freshState(),
        ...loaded,
        program: cleanProgram(loaded.program),
        firstSubmittedProgram: loaded.firstSubmittedProgram === null ? null : cleanProgram(loaded.firstSubmittedProgram),
        finalSubmittedProgram: loaded.finalSubmittedProgram === null ? null : cleanProgram(loaded.finalSubmittedProgram),
        lastTrajectory: Array.isArray(loaded.lastTrajectory) ? loaded.lastTrajectory : [],
        emitted: { ...(loaded.emitted || {}) },
      }
    : freshState();

  const save = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
  };

  const postTelemetry = (event, payload = {}) => {
    try {
      window.parent.postMessage({ type: MESSAGE_TYPE, event, payload }, window.location.origin);
    } catch (_) {}
  };

  const markFirstAction = () => {
    if (state.firstActionAt !== null) return;
    state.firstActionAt = nowMs();
    save();
  };

  const emit = (event, payload = {}, onceKey = null) => {
    if (onceKey && state.emitted[onceKey]) return;
    if (onceKey) state.emitted[onceKey] = true;
    save();
    postTelemetry(event, payload);
  };

  const emitTerminal = (payload) => {
    if (state.terminalEventEmitted) return;
    state.terminalEventEmitted = true;
    save();
    postTelemetry('level_completed', payload);
  };

  const originalSfx = (() => {
    try { return localStorage.getItem('apulab.settings.sfx'); } catch (_) { return null; }
  })();
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
      window.parent.dispatchEvent(new ParentEvent('apulab-settings-changed', {
        detail: { musicVolume: volume },
      }));
    } catch (_) {}
  };
  setParentMusic(0);
  document.querySelectorAll('audio,video').forEach((media) => {
    try { media.pause(); media.muted = true; } catch (_) {}
  });

  document.title = 'ApuLab Control · Actividad 3 · Secuenciar';
  document.body.classList.add('apulab-control-n3-active');

  const legacyElements = [...document.body.children].filter((element) => element.tagName !== 'SCRIPT');
  const hideLegacy = (element) => {
    if (!(element instanceof HTMLElement) || element.id === 'apulab-control-n3') return;
    element.dataset.apulabN3LegacyHidden = 'true';
    element.setAttribute('aria-hidden', 'true');
    element.style.setProperty('display', 'none', 'important');
  };
  legacyElements.forEach(hideLegacy);

  const layer = document.createElement('section');
  layer.id = 'apulab-control-n3';
  layer.setAttribute('aria-label', 'Actividad 3 de 7: secuenciar comandos');
  layer.innerHTML = `
    <header class="control-n3-header">
      <div>
        <span class="control-n3-kicker">ACTIVIDAD 3 DE 7 · SECUENCIAR</span>
        <h1>Construye una secuencia para llegar a la meta</h1>
        <p>Observa la posición inicial, añade comandos y comprueba el recorrido.</p>
      </div>
      <button id="control-n3-help" class="control-n3-button secondary" type="button">AYUDA</button>
    </header>

    <main class="control-n3-main">
      <section class="control-n3-board-panel" aria-labelledby="control-n3-board-title">
        <div class="control-n3-section-heading">
          <div>
            <span class="control-n3-step">TABLERO 8 × 8</span>
            <h2 id="control-n3-board-title">Recorrido</h2>
          </div>
          <div class="control-n3-legend" aria-label="Leyenda">
            <span><i class="start-key"></i> INICIO ↑</span>
            <span><i class="goal-key"></i> META</span>
          </div>
        </div>
        <div id="control-n3-board" class="control-n3-board" role="grid" aria-label="Tablero de 8 por 8"></div>
        <p id="control-n3-board-note" class="control-n3-board-note">La flecha indica la orientación inicial: NORTH.</p>
      </section>

      <aside class="control-n3-sequence-panel" aria-labelledby="control-n3-sequence-title">
        <div class="control-n3-section-heading">
          <div>
            <span class="control-n3-step">SECUENCIA</span>
            <h2 id="control-n3-sequence-title">Programa</h2>
          </div>
          <span id="control-n3-count" class="control-n3-count">0 / 8</span>
        </div>
        <ol id="control-n3-program" class="control-n3-program" aria-live="polite"></ol>
        <button id="control-n3-clear" class="control-n3-button secondary full" type="button" disabled>BORRAR TODO</button>
      </aside>
    </main>

    <section class="control-n3-controls" aria-label="Controles de secuencia">
      <div class="control-n3-command-group" role="group" aria-label="Comandos disponibles">
        <button class="control-n3-command" type="button" data-command="forward">AVANZAR</button>
        <button class="control-n3-command" type="button" data-command="left">GIRAR IZQ.</button>
        <button class="control-n3-command" type="button" data-command="right">GIRAR DER.</button>
      </div>
      <button id="control-n3-submit" class="control-n3-button primary" type="button" disabled>COMPROBAR</button>
    </section>

    <div id="control-n3-feedback" class="control-n3-feedback" role="status" aria-live="polite"></div>

    <aside id="control-n3-help-panel" class="control-n3-help-panel" hidden>
      <div>
        <h2>AYUDA</h2>
        <ol>
          <li>Observa la posición inicial y la meta.</li>
          <li>Construye una secuencia con los comandos disponibles.</li>
          <li>Comprueba el recorrido.</li>
          <li>Si no llega a la meta, modifica la secuencia e inténtalo nuevamente.</li>
        </ol>
      </div>
      <button id="control-n3-help-close" class="control-n3-button secondary" type="button">CERRAR</button>
    </aside>

    <div id="control-n3-completion" class="control-n3-completion" hidden>
      <section class="control-n3-completion-card" role="dialog" aria-modal="true" aria-labelledby="control-n3-completion-title">
        <h2 id="control-n3-completion-title">SECUENCIA COMPLETADA</h2>
        <p>La trayectoria alcanza la meta.</p>
        <button id="control-n3-continue" class="control-n3-button primary" type="button">CONTINUAR</button>
      </section>
    </div>
  `;
  document.body.appendChild(layer);

  const legacyObserver = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node instanceof HTMLElement && node !== layer && node.parentElement === document.body) hideLegacy(node);
      }
    }
  });
  legacyObserver.observe(document.body, { childList: true });

  const $ = (id) => document.getElementById(id);
  const commandButtons = [...layer.querySelectorAll('.control-n3-command')];
  const programList = $('control-n3-program');
  const board = $('control-n3-board');
  const feedback = $('control-n3-feedback');
  const submitButton = $('control-n3-submit');
  const clearButton = $('control-n3-clear');
  const helpPanel = $('control-n3-help-panel');
  const completion = $('control-n3-completion');

  const orientationIndex = (name) => Math.max(0, ORIENTATIONS.indexOf(name));

  const simulate = (program) => {
    const current = {
      row: CONFIG.start.row,
      column: CONFIG.start.column,
      direction: orientationIndex(CONFIG.start.orientation),
    };
    const trajectory = [{
      step: 0,
      command: null,
      row: current.row,
      column: current.column,
      orientation: ORIENTATIONS[current.direction],
      valid: true,
    }];

    let valid = true;
    for (let index = 0; index < program.length; index += 1) {
      const command = program[index];
      if (command === 'left') current.direction = (current.direction + 3) % 4;
      else if (command === 'right') current.direction = (current.direction + 1) % 4;
      else if (command === 'forward') {
        const delta = DELTAS[current.direction];
        const nextRow = current.row + delta.dr;
        const nextColumn = current.column + delta.dc;
        if (
          nextRow < 0 || nextRow >= CONFIG.grid.rows ||
          nextColumn < 0 || nextColumn >= CONFIG.grid.columns
        ) {
          valid = false;
          trajectory.push({
            step: index + 1,
            command,
            row: current.row,
            column: current.column,
            orientation: ORIENTATIONS[current.direction],
            valid: false,
          });
          break;
        }
        current.row = nextRow;
        current.column = nextColumn;
      }
      trajectory.push({
        step: index + 1,
        command,
        row: current.row,
        column: current.column,
        orientation: ORIENTATIONS[current.direction],
        valid: true,
      });
    }

    return {
      valid,
      row: current.row,
      column: current.column,
      orientation: ORIENTATIONS[current.direction],
      trajectory,
    };
  };

  const reachesGoal = (final) =>
    final.valid &&
    final.row === CONFIG.goal.row &&
    final.column === CONFIG.goal.column;

  const labelFor = (command) => CONFIG.commands[command] || command;

  const renderBoard = () => {
    const byCell = new Map();
    for (const point of state.lastTrajectory || []) {
      if (!point || !Number.isInteger(point.row) || !Number.isInteger(point.column)) continue;
      const key = `${point.row}:${point.column}`;
      if (!byCell.has(key)) byCell.set(key, []);
      byCell.get(key).push(point.step);
    }

    board.replaceChildren();
    for (let row = 0; row < CONFIG.grid.rows; row += 1) {
      for (let column = 0; column < CONFIG.grid.columns; column += 1) {
        const cell = document.createElement('div');
        cell.className = 'control-n3-cell';
        cell.setAttribute('role', 'gridcell');
        cell.dataset.row = String(row);
        cell.dataset.column = String(column);

        const isStart = row === CONFIG.start.row && column === CONFIG.start.column;
        const isGoal = row === CONFIG.goal.row && column === CONFIG.goal.column;
        const steps = byCell.get(`${row}:${column}`) || [];
        if (steps.length) {
          cell.classList.add('is-path');
          const route = document.createElement('small');
          route.className = 'control-n3-route-index';
          route.textContent = steps.join('·');
          cell.appendChild(route);
        }
        if (isStart) {
          cell.classList.add('is-start');
          const marker = document.createElement('span');
          marker.className = 'control-n3-start-marker';
          marker.innerHTML = '<strong>INICIO</strong><b aria-label="Orientación NORTH">↑</b>';
          cell.appendChild(marker);
        }
        if (isGoal) {
          cell.classList.add('is-goal');
          const marker = document.createElement('span');
          marker.className = 'control-n3-goal-marker';
          marker.textContent = 'META';
          cell.appendChild(marker);
        }
        board.appendChild(cell);
      }
    }
  };

  const renderProgram = () => {
    programList.replaceChildren();
    for (let index = 0; index < CONFIG.blockLimit; index += 1) {
      const item = document.createElement('li');
      item.className = 'control-n3-program-item';
      const command = state.program[index];
      if (command) {
        item.classList.add('is-filled');
        const text = document.createElement('span');
        text.textContent = labelFor(command);
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'control-n3-remove';
        remove.dataset.index = String(index);
        remove.setAttribute('aria-label', `Eliminar comando ${index + 1}`);
        remove.textContent = '×';
        remove.disabled = state.completed;
        item.append(text, remove);
      } else {
        const placeholder = document.createElement('span');
        placeholder.className = 'control-n3-placeholder';
        placeholder.textContent = '—';
        item.appendChild(placeholder);
      }
      programList.appendChild(item);
    }
  };

  const render = () => {
    renderBoard();
    renderProgram();
    $('control-n3-count').textContent = `${state.program.length} / ${CONFIG.blockLimit}`;

    const atLimit = state.program.length >= CONFIG.blockLimit;
    for (const button of commandButtons) button.disabled = atLimit || state.completed;
    clearButton.disabled = state.program.length === 0 || state.completed;
    submitButton.disabled = state.program.length === 0 || state.completed;

    if (state.completed) {
      feedback.textContent = 'La trayectoria alcanza la meta.';
    } else if (state.feedback) {
      feedback.textContent = state.feedback;
    } else if (state.lastTrajectory?.length) {
      feedback.textContent = 'Revisa el recorrido y modifica la secuencia si es necesario.';
    } else {
      feedback.textContent = 'Añade al menos un comando para comprobar la secuencia.';
    }
    completion.hidden = !state.completed;
    save();
  };

  const markEditedAfterSubmit = () => {
    if (state.finalSubmittedProgram && !sameProgram(state.program, state.finalSubmittedProgram)) {
      state.feedback = 'Secuencia modificada. Puedes comprobarla nuevamente.';
    } else {
      state.feedback = '';
    }
    state.lastTrajectory = [];
    state.lastFinalState = null;
  };

  const addCommand = (command) => {
    if (!VALID_COMMANDS.has(command) || state.completed || state.program.length >= CONFIG.blockLimit) return;
    markFirstAction();
    state.program.push(command);
    markEditedAfterSubmit();
    emit('command_added', {
      command,
      index: state.program.length - 1,
      program_length: state.program.length,
    });
    render();
  };

  const removeCommand = (index) => {
    if (state.completed || !Number.isInteger(index) || index < 0 || index >= state.program.length) return;
    markFirstAction();
    const [command] = state.program.splice(index, 1);
    markEditedAfterSubmit();
    emit('command_removed', {
      command,
      index,
      program_length: state.program.length,
    });
    render();
  };

  const clearProgram = () => {
    if (state.completed || state.program.length === 0) return;
    markFirstAction();
    const removed = [...state.program];
    state.program = [];
    markEditedAfterSubmit();
    emit('command_removed', {
      command: null,
      index: null,
      cleared: true,
      removed_commands: removed,
      program_length: 0,
    });
    render();
  };

  const submitProgram = () => {
    if (state.completed || state.program.length < 1) return;
    markFirstAction();

    const submitted = [...state.program];
    const previous = state.finalSubmittedProgram ? [...state.finalSubmittedProgram] : null;
    if (previous && !sameProgram(previous, submitted)) state.responseChangeCount += 1;

    state.attemptCount += 1;
    if (state.firstSubmittedProgram === null) state.firstSubmittedProgram = [...submitted];
    state.finalSubmittedProgram = [...submitted];

    const final = simulate(submitted);
    const success = reachesGoal(final);
    if (state.firstAttemptSuccess === null) state.firstAttemptSuccess = success;
    state.finalSuccess = success;
    state.lastTrajectory = final.trajectory;
    state.lastFinalState = {
      row: final.row,
      column: final.column,
      orientation: final.orientation,
      valid: final.valid,
    };

    emit('sequence_submitted', {
      attempt_number: state.attemptCount,
      program: [...submitted],
      program_length: submitted.length,
      response_change_count: state.responseChangeCount,
    });

    if (!success) {
      state.hadFailedAttempt = true;
      state.feedback = 'La secuencia no llega a la meta. Revisa el recorrido y modifica los comandos antes de comprobar nuevamente.';
      emit('sequence_failed', {
        attempt_number: state.attemptCount,
        program_length: submitted.length,
        final_row: final.row,
        final_column: final.column,
        final_orientation: final.orientation,
        path_valid: final.valid,
      });
      render();
      return;
    }

    if (state.hadFailedAttempt) {
      emit('sequence_corrected', {
        attempt_number: state.attemptCount,
        response_change_count: state.responseChangeCount,
      });
    }

    state.completed = true;
    state.completedAt = nowMs();
    state.feedback = 'La trayectoria alcanza la meta.';
    save();

    emitTerminal({
      first_submitted_program: state.firstSubmittedProgram ? [...state.firstSubmittedProgram] : null,
      final_submitted_program: [...submitted],
      attempt_count: state.attemptCount,
      first_attempt_success: state.firstAttemptSuccess === true,
      final_success: true,
      response_change_count: state.responseChangeCount,
      first_program_length: state.firstSubmittedProgram?.length ?? null,
      final_program_length: submitted.length,
      help_used: state.helpCount > 0,
      help_count: state.helpCount,
      time_to_first_action_ms: state.firstActionAt === null ? null : Math.max(0, state.firstActionAt - state.startedAt),
      completion_time_ms: Math.max(0, state.completedAt - state.startedAt),
    });
    render();
  };

  for (const button of commandButtons) {
    button.addEventListener('click', () => addCommand(button.dataset.command));
  }
  programList.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const button = target.closest('.control-n3-remove');
    if (!(button instanceof HTMLButtonElement)) return;
    removeCommand(Number(button.dataset.index));
  });
  clearButton.addEventListener('click', clearProgram);
  submitButton.addEventListener('click', submitProgram);

  $('control-n3-help').addEventListener('click', () => {
    markFirstAction();
    state.helpCount += 1;
    emit('help_requested', { help_count: state.helpCount });
    helpPanel.hidden = false;
    render();
  });
  $('control-n3-help-close').addEventListener('click', () => { helpPanel.hidden = true; });

  $('control-n3-continue').addEventListener('click', () => {
    if (!state.completed) return;
    try {
      if (typeof window.parent.apulabCompleteLevel === 'function') {
        window.parent.apulabCompleteLevel(3, 4);
      } else {
        window.parent.postMessage({ type: 'apulab-level-complete', level: 3, nextLevel: 4 }, window.location.origin);
      }
    } catch (_) {
      window.parent.postMessage({ type: 'apulab-level-complete', level: 3, nextLevel: 4 }, window.location.origin);
    }
  });

  window.__apulabControlN3State = () => clone(state);
  window.__apulabControlN3Config = () => clone(CONFIG);
  window.__apulabControlN3Simulate = (program) => clone(simulate(cleanProgram(program)));

  window.addEventListener('pagehide', () => {
    legacyObserver.disconnect();
    setParentMusic(originalMusicVolume);
    try {
      if (originalSfx === null) localStorage.removeItem('apulab.settings.sfx');
      else localStorage.setItem('apulab.settings.sfx', originalSfx);
    } catch (_) {}
  }, { once: true });

  emit('level_started', {
    source_commit: studyConfig.sourceCommit,
    grid_rows: CONFIG.grid.rows,
    grid_columns: CONFIG.grid.columns,
    start_row: CONFIG.start.row,
    start_column: CONFIG.start.column,
    start_orientation: CONFIG.start.orientation,
    goal_row: CONFIG.goal.row,
    goal_column: CONFIG.goal.column,
    block_limit: CONFIG.blockLimit,
  }, 'level_started');

  render();
})();
