(async () => {
  // APULAB_CONTROL_N4_V1
  if (document.getElementById('apulab-control-n4')) return;

  const STORAGE_KEY = 'apulab.control.n4.state.v1';
  const MESSAGE_TYPE = 'apulab-control-n4-telemetry';
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
  if (!response.ok) throw new Error('control_n4_config_fetch_failed');
  const studyConfig = await response.json();
  const CONFIG = studyConfig?.level4;
  const obstacleSet = new Set((CONFIG?.obstacles || []).map(({ row, column }) => `${row}:${column}`));
  const configValid =
    CONFIG?.grid?.rows === 8 &&
    CONFIG?.grid?.columns === 8 &&
    CONFIG?.start?.row === 6 &&
    CONFIG?.start?.column === 1 &&
    CONFIG?.start?.orientation === 'NORTH' &&
    CONFIG?.goal?.row === 2 &&
    CONFIG?.goal?.column === 3 &&
    CONFIG?.blockLimit === 30 &&
    obstacleSet.size === 2 &&
    obstacleSet.has('4:1') &&
    obstacleSet.has('4:2') &&
    CONFIG?.commands?.forward === 'AVANZAR' &&
    CONFIG?.commands?.left === 'GIRAR IZQ.' &&
    CONFIG?.commands?.right === 'GIRAR DER.';
  if (!configValid) throw new Error('control_n4_config_parity_invalid');

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
    collisionCount: 0,
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
    failure: null,
    needsAdjustment: false,
    correctionActive: false,
    modifiedAfterFailure: false,
    lastFailedProgram: null,
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
        lastFailedProgram: loaded.lastFailedProgram === null ? null : cleanProgram(loaded.lastFailedProgram),
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

  window.addEventListener('pagehide', () => {
    setParentMusic(originalMusicVolume);
    try {
      if (originalSfx === null) localStorage.removeItem('apulab.settings.sfx');
      else localStorage.setItem('apulab.settings.sfx', originalSfx);
    } catch (_) {}
  }, { once: true });

  document.title = 'ApuLab Control · Actividad 4 · Planificar y corregir';
  document.body.classList.add('apulab-control-n4-active');

  const legacyElements = [...document.body.children].filter((element) => element.tagName !== 'SCRIPT');
  const hideLegacy = (element) => {
    if (!(element instanceof HTMLElement) || element.id === 'apulab-control-n4') return;
    element.dataset.apulabN4LegacyHidden = 'true';
    element.setAttribute('aria-hidden', 'true');
    element.style.setProperty('display', 'none', 'important');
  };
  legacyElements.forEach(hideLegacy);

  const layer = document.createElement('section');
  layer.id = 'apulab-control-n4';
  layer.setAttribute('aria-label', 'Actividad 4 de 7: planificar y corregir una ruta');
  layer.innerHTML = `
    <header class="control-n4-header">
      <div>
        <span class="control-n4-kicker">ACTIVIDAD 4 DE 7 · PLANIFICAR Y CORREGIR</span>
        <h1>Construye una ruta y corrígela si encuentra un obstáculo</h1>
        <p>Programa una secuencia, comprueba el recorrido y ajusta solamente lo necesario.</p>
      </div>
      <button id="control-n4-help" class="control-n4-button secondary" type="button">AYUDA</button>
    </header>

    <main class="control-n4-main">
      <section class="control-n4-board-panel" aria-labelledby="control-n4-board-title">
        <div class="control-n4-section-heading">
          <div>
            <span class="control-n4-step">TABLERO 8 × 8</span>
            <h2 id="control-n4-board-title">Ruta</h2>
          </div>
          <div class="control-n4-legend" aria-label="Leyenda">
            <span><i class="start-key"></i> INICIO ↑</span>
            <span><i class="obstacle-key"></i> OBSTÁCULO</span>
            <span><i class="goal-key"></i> META</span>
          </div>
        </div>
        <div id="control-n4-board" class="control-n4-board" role="grid" aria-label="Tablero de 8 por 8"></div>
        <p id="control-n4-board-note" class="control-n4-board-note">La flecha indica la orientación inicial: NORTH.</p>
      </section>

      <aside class="control-n4-sequence-panel" aria-labelledby="control-n4-sequence-title">
        <div class="control-n4-section-heading">
          <div>
            <span class="control-n4-step">SECUENCIA</span>
            <h2 id="control-n4-sequence-title">Programa</h2>
          </div>
          <span id="control-n4-count" class="control-n4-count">0 / 30</span>
        </div>
        <ol id="control-n4-program" class="control-n4-program" aria-live="polite"></ol>
        <button id="control-n4-clear" class="control-n4-button secondary full" type="button" disabled>BORRAR TODO</button>
      </aside>
    </main>

    <section class="control-n4-controls" aria-label="Controles de secuencia">
      <div class="control-n4-command-group" role="group" aria-label="Comandos disponibles">
        <button class="control-n4-command" type="button" data-command="forward">AVANZAR</button>
        <button class="control-n4-command" type="button" data-command="left">GIRAR IZQ.</button>
        <button class="control-n4-command" type="button" data-command="right">GIRAR DER.</button>
      </div>
      <button id="control-n4-submit" class="control-n4-button primary" type="button" disabled>COMPROBAR</button>
    </section>

    <div id="control-n4-feedback" class="control-n4-feedback" role="status" aria-live="polite"></div>

    <aside id="control-n4-help-panel" class="control-n4-help-panel" hidden>
      <div>
        <h2>AYUDA</h2>
        <ol>
          <li>Observa el inicio, la orientación, los obstáculos y la meta.</li>
          <li>Construye una secuencia con AVANZAR, GIRAR IZQ. y GIRAR DER.</li>
          <li>Comprueba la ruta. Si una instrucción intenta entrar en un obstáculo, identifica ese paso.</li>
          <li>Selecciona AJUSTAR PROGRAMA, modifica la secuencia y vuelve a comprobar.</li>
        </ol>
      </div>
      <button id="control-n4-help-close" class="control-n4-button secondary" type="button">CERRAR</button>
    </aside>

    <div id="control-n4-completion" class="control-n4-completion" hidden>
      <section class="control-n4-completion-card" role="dialog" aria-modal="true" aria-labelledby="control-n4-completion-title">
        <h2 id="control-n4-completion-title">RUTA COMPLETADA</h2>
        <p>La secuencia final alcanza la meta.</p>
        <button id="control-n4-continue" class="control-n4-button primary" type="button">CONTINUAR</button>
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
  const commandButtons = [...layer.querySelectorAll('.control-n4-command')];
  const programList = $('control-n4-program');
  const board = $('control-n4-board');
  const feedback = $('control-n4-feedback');
  const submitButton = $('control-n4-submit');
  const clearButton = $('control-n4-clear');
  const helpPanel = $('control-n4-help-panel');
  const completion = $('control-n4-completion');

  const orientationIndex = (name) => Math.max(0, ORIENTATIONS.indexOf(name));
  const isObstacle = (row, column) => obstacleSet.has(`${row}:${column}`);
  const atGoal = (row, column) => row === CONFIG.goal.row && column === CONFIG.goal.column;

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
    let failure = null;
    let reachedGoal = atGoal(current.row, current.column);

    for (let index = 0; index < program.length && !reachedGoal; index += 1) {
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
          failure = {
            kind: 'EDGE',
            stepIndex: index + 1,
            attemptedRow: nextRow,
            attemptedColumn: nextColumn,
          };
          trajectory.push({
            step: index + 1,
            command,
            row: current.row,
            column: current.column,
            orientation: ORIENTATIONS[current.direction],
            valid: false,
            failure: 'EDGE',
          });
          break;
        }
        if (isObstacle(nextRow, nextColumn)) {
          failure = {
            kind: 'BLOCKED',
            stepIndex: index + 1,
            attemptedRow: nextRow,
            attemptedColumn: nextColumn,
          };
          trajectory.push({
            step: index + 1,
            command,
            row: current.row,
            column: current.column,
            orientation: ORIENTATIONS[current.direction],
            valid: false,
            failure: 'BLOCKED',
            attemptedRow: nextRow,
            attemptedColumn: nextColumn,
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
      reachedGoal = atGoal(current.row, current.column);
    }

    return {
      valid: failure === null,
      reachedGoal,
      row: current.row,
      column: current.column,
      orientation: ORIENTATIONS[current.direction],
      failure,
      trajectory,
    };
  };

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
        cell.className = 'control-n4-cell';
        cell.setAttribute('role', 'gridcell');
        cell.dataset.row = String(row);
        cell.dataset.column = String(column);

        const isStart = row === CONFIG.start.row && column === CONFIG.start.column;
        const isGoal = row === CONFIG.goal.row && column === CONFIG.goal.column;
        const blocked = isObstacle(row, column);
        const steps = byCell.get(`${row}:${column}`) || [];

        if (steps.length) {
          cell.classList.add('is-path');
          const route = document.createElement('small');
          route.className = 'control-n4-route-index';
          route.textContent = steps.join('·');
          cell.appendChild(route);
        }
        if (blocked) {
          cell.classList.add('is-obstacle');
          const marker = document.createElement('span');
          marker.className = 'control-n4-obstacle-marker';
          marker.textContent = 'BLOQUEADO';
          cell.appendChild(marker);
        }
        if (isStart) {
          cell.classList.add('is-start');
          const marker = document.createElement('span');
          marker.className = 'control-n4-start-marker';
          marker.innerHTML = '<strong>INICIO</strong><b aria-label="Orientación NORTH">↑</b>';
          cell.appendChild(marker);
        }
        if (isGoal) {
          cell.classList.add('is-goal');
          const marker = document.createElement('span');
          marker.className = 'control-n4-goal-marker';
          marker.textContent = 'META';
          cell.appendChild(marker);
        }
        if (
          state.failure?.kind === 'BLOCKED' &&
          row === state.failure.attemptedRow &&
          column === state.failure.attemptedColumn
        ) cell.classList.add('is-collision');

        board.appendChild(cell);
      }
    }
  };

  const editingLocked = () => state.completed || state.needsAdjustment;

  const renderProgram = () => {
    programList.replaceChildren();
    if (state.program.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'control-n4-program-empty';
      empty.textContent = 'Añade comandos para construir la ruta.';
      programList.appendChild(empty);
    } else {
      state.program.forEach((command, index) => {
        const item = document.createElement('li');
        item.className = 'control-n4-program-item';
        item.dataset.index = String(index);
        if (state.failure && state.failure.stepIndex === index + 1) item.classList.add('is-error');

        const number = document.createElement('span');
        number.className = 'control-n4-program-number';
        number.textContent = String(index + 1);

        const text = document.createElement('span');
        text.className = 'control-n4-program-label';
        text.textContent = labelFor(command);

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'control-n4-program-remove';
        remove.dataset.removeIndex = String(index);
        remove.textContent = 'Quitar';
        remove.disabled = editingLocked();
        remove.setAttribute('aria-label', `Quitar paso ${index + 1}: ${labelFor(command)}`);

        item.append(number, text, remove);
        programList.appendChild(item);
      });
    }

    $('control-n4-count').textContent = `${state.program.length} / ${CONFIG.blockLimit}`;
    const full = state.program.length >= CONFIG.blockLimit;
    commandButtons.forEach((button) => { button.disabled = editingLocked() || full; });
    clearButton.disabled = editingLocked() || state.program.length === 0;

    if (state.needsAdjustment) {
      submitButton.disabled = false;
      submitButton.textContent = 'AJUSTAR PROGRAMA';
    } else {
      submitButton.disabled = state.completed || state.program.length === 0;
      submitButton.textContent = 'COMPROBAR';
    }
  };

  const renderFeedback = () => {
    feedback.className = 'control-n4-feedback';
    if (state.failure?.kind === 'BLOCKED') {
      feedback.classList.add('is-error');
      feedback.textContent =
        `El paso ${state.failure.stepIndex} intenta entrar en un obstáculo ` +
        `(fila ${state.failure.attemptedRow}, columna ${state.failure.attemptedColumn}). ` +
        'Selecciona AJUSTAR PROGRAMA para corregir la secuencia.';
      return;
    }
    if (state.failure?.kind === 'EDGE') {
      feedback.classList.add('is-error');
      feedback.textContent =
        `El paso ${state.failure.stepIndex} intenta salir del tablero. Modifica la secuencia y vuelve a comprobar.`;
      return;
    }
    if (state.feedback) {
      feedback.textContent = state.feedback;
      if (state.finalSuccess) feedback.classList.add('is-success');
    } else {
      feedback.textContent = 'Puedes usar hasta 30 comandos. No es necesario utilizar los 30.';
    }
  };

  const render = () => {
    renderBoard();
    renderProgram();
    renderFeedback();
    completion.hidden = !state.completed;
  };

  const noteEditAfterFailure = () => {
    if (!state.correctionActive || state.modifiedAfterFailure) return;
    state.modifiedAfterFailure = true;
  };

  const mutateProgram = (next, event, payload = {}) => {
    if (editingLocked()) return;
    const cleaned = cleanProgram(next);
    if (sameProgram(cleaned, state.program)) return;
    markFirstAction();
    noteEditAfterFailure();
    state.program = cleaned;
    state.feedback = '';
    if (state.correctionActive && state.failure) state.failure = null;
    save();
    emit(event, payload);
    render();
  };

  commandButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const command = button.dataset.command;
      if (!VALID_COMMANDS.has(command) || state.program.length >= CONFIG.blockLimit) return;
      mutateProgram([...state.program, command], 'command_added', {
        command,
        position: state.program.length + 1,
        sequence_length: state.program.length + 1,
      });
    });
  });

  programList.addEventListener('click', (event) => {
    const button = event.target instanceof Element
      ? event.target.closest('[data-remove-index]')
      : null;
    if (!(button instanceof HTMLButtonElement) || button.disabled) return;
    const index = Number(button.dataset.removeIndex);
    if (!Number.isInteger(index) || index < 0 || index >= state.program.length) return;
    const removed = state.program[index];
    const next = state.program.filter((_, itemIndex) => itemIndex !== index);
    mutateProgram(next, 'command_removed', {
      command: removed,
      position: index + 1,
      sequence_length: next.length,
    });
  });

  clearButton.addEventListener('click', () => {
    if (editingLocked() || state.program.length === 0) return;
    mutateProgram([], 'program_cleared', { previous_length: state.program.length });
  });

  $('control-n4-help').addEventListener('click', () => {
    markFirstAction();
    state.helpCount += 1;
    save();
    emit('help_requested', { help_count: state.helpCount });
    helpPanel.hidden = false;
  });
  $('control-n4-help-close').addEventListener('click', () => { helpPanel.hidden = true; });

  const beginAdjustment = () => {
    if (!state.needsAdjustment || state.completed) return;
    markFirstAction();
    state.needsAdjustment = false;
    state.correctionActive = true;
    state.modifiedAfterFailure = false;
    state.feedback = 'Modifica la instrucción necesaria y vuelve a comprobar.';
    save();
    emit('correction_started', {
      failure_kind: state.failure?.kind || null,
      failure_command_index: state.failure?.stepIndex || null,
      sequence_length: state.program.length,
    });
    render();
  };

  const complete = (result) => {
    state.finalSuccess = true;
    state.completed = true;
    state.completedAt = nowMs();
    state.finalSubmittedProgram = [...state.program];
    state.lastFinalState = {
      row: result.row,
      column: result.column,
      orientation: result.orientation,
    };
    state.failure = null;
    state.needsAdjustment = false;
    state.correctionActive = false;
    state.feedback = 'La trayectoria alcanza la meta.';
    save();
    const payload = {
      attempt_count: state.attemptCount,
      first_attempt_success: state.firstAttemptSuccess === true,
      final_success: true,
      response_change_count: state.responseChangeCount,
      collision_count: state.collisionCount,
      failure_command_index: null,
      help_used: state.helpCount > 0,
      help_count: state.helpCount,
      time_to_first_action_ms: Math.max(0, (state.firstActionAt ?? state.startedAt) - state.startedAt),
      completion_time_ms: Math.max(0, state.completedAt - state.startedAt),
      final_sequence: [...state.program],
      final_row: result.row,
      final_column: result.column,
    };
    emitTerminal(payload);
    render();
  };

  const submitProgram = () => {
    if (state.needsAdjustment) {
      beginAdjustment();
      return;
    }
    if (state.completed || state.program.length === 0) return;

    markFirstAction();
    if (state.correctionActive && state.modifiedAfterFailure) {
      state.responseChangeCount += 1;
      emit('sequence_corrected', {
        response_change_count: state.responseChangeCount,
        sequence_length: state.program.length,
      });
    }

    state.attemptCount += 1;
    const submitted = [...state.program];
    if (state.firstSubmittedProgram === null) state.firstSubmittedProgram = submitted;
    state.finalSubmittedProgram = submitted;
    emit('sequence_submitted', {
      attempt_count: state.attemptCount,
      sequence_length: submitted.length,
    });

    const result = simulate(submitted);
    state.lastTrajectory = result.trajectory;
    state.lastFinalState = {
      row: result.row,
      column: result.column,
      orientation: result.orientation,
    };

    const success = result.valid && result.reachedGoal;
    if (state.firstAttemptSuccess === null) state.firstAttemptSuccess = success;

    if (success) {
      save();
      complete(result);
      return;
    }

    state.finalSuccess = false;
    state.failure = result.failure;
    state.lastFailedProgram = submitted;
    state.correctionActive = false;
    state.modifiedAfterFailure = false;

    if (result.failure?.kind === 'BLOCKED') {
      state.collisionCount += 1;
      state.needsAdjustment = true;
      state.feedback = '';
      save();
      emit('collision_detected', {
        attempt_count: state.attemptCount,
        collision_count: state.collisionCount,
        failure_command_index: result.failure.stepIndex,
        obstacle_row: result.failure.attemptedRow,
        obstacle_column: result.failure.attemptedColumn,
      });
      emit('feedback_shown', {
        kind: 'BLOCKED',
        failure_command_index: result.failure.stepIndex,
      });
    } else {
      state.needsAdjustment = false;
      state.correctionActive = true;
      state.feedback = result.failure?.kind === 'EDGE'
        ? ''
        : 'La secuencia termina sin alcanzar la meta. Modifica el programa y vuelve a comprobar.';
      save();
    }

    emit('sequence_failed', {
      attempt_count: state.attemptCount,
      failure_kind: result.failure?.kind || 'GOAL_NOT_REACHED',
      failure_command_index: result.failure?.stepIndex || null,
      final_row: result.row,
      final_column: result.column,
    });
    render();
  };

  submitButton.addEventListener('click', submitProgram);

  $('control-n4-continue').addEventListener('click', () => {
    try {
      window.parent.postMessage(
        { type: 'apulab-level-complete', level: 4, nextLevel: 5 },
        window.location.origin,
      );
    } catch (_) {}
  });

  window.__apulabControlN4State = () => clone(state);

  save();
  render();
  emit('level_started', {
    grid_rows: CONFIG.grid.rows,
    grid_columns: CONFIG.grid.columns,
    block_limit: CONFIG.blockLimit,
    obstacle_count: CONFIG.obstacles.length,
  }, 'level_started');
})();