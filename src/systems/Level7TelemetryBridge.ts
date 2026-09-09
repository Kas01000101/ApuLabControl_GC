import { GameState } from './GameState';
import { TelemetryService } from './TelemetryService';

const LEGACY_EVENT_TYPES = new Set([
  'level_started','program_started','program_modified','sample_reached','sample_analyze_requested',
  'instrument_modal_opened','instrument_selected','sample_analyzed','instrument_changed',
  'relevant_instrument_selected','final_point_reached','explore_opened','bitacora_opened',
  'level_completed','sample_checkpoint_reached','final_checkpoint_reached','mission_completed','help_requested',
]);

const CONTROL_EVENT_TYPES = new Set([
  'level_started','first_action','program_started','program_modified','program_cleared',
  'sample_reached','sample_analyze_requested','instrument_panel_opened','instrument_selected',
  'sample_analyzed','instrument_changed','relevant_instrument_selected','final_point_reached',
  'premature_action','sequence_failed','feedback_shown','sequence_corrected','help_requested','level_completed','mission_completed',
]);

type Level7TelemetryMessage = {
  type?: unknown;
  event?: unknown;
  payload?: unknown;
};

let installed = false;

function findSourceFrame(source: MessageEventSource | null): HTMLIFrameElement | undefined {
  return [...document.querySelectorAll<HTMLIFrameElement>('.mission01-frame')]
    .find((frame) => frame.contentWindow === source);
}

function isControlFrame(frame: HTMLIFrameElement): boolean {
  try {
    return frame.contentDocument?.documentElement?.dataset?.apulabControl === 'n7'
      || frame.contentDocument?.body?.classList?.contains('apulab-control-n7-active') === true;
  } catch {
    return false;
  }
}

export function installLevel7TelemetryBridge(): void {
  if (installed) return;
  installed = true;

  window.addEventListener('message', (message: MessageEvent<Level7TelemetryMessage>) => {
    if (message.origin !== window.location.origin) return;
    const data = message.data;
    if (!data) return;

    const frame = findSourceFrame(message.source);
    if (!frame) return;

    const controlMode = isControlFrame(frame);
    const isControlMessage = data.type === 'apulab-control-n7-telemetry';
    const isLegacyMessage = data.type === 'apulab-level7-telemetry';

    if (controlMode && isLegacyMessage) return;
    if (!isControlMessage && !isLegacyMessage) return;
    if (isControlMessage && !controlMode) return;

    const eventType = typeof data.event === 'string' ? data.event : '';
    const allowlist = isControlMessage ? CONTROL_EVENT_TYPES : LEGACY_EVENT_TYPES;
    if (!allowlist.has(eventType)) return;

    const rawPayload = data.payload && typeof data.payload === 'object' && !Array.isArray(data.payload)
      ? data.payload as Record<string, unknown>
      : {};

    const {
      participant_id: _ignoredParticipant,
      session_id: _ignoredSession,
      participant_code: _ignoredCode,
      credential: _ignoredCredential,
      password: _ignoredPassword,
      token: _ignoredToken,
      name: _ignoredName,
      nombre: _ignoredNombre,
      apellido: _ignoredApellido,
      full_name: _ignoredFullName,
      first_name: _ignoredFirstName,
      last_name: _ignoredLastName,
      email: _ignoredEmail,
      school: _ignoredSchool,
      school_name: _ignoredSchoolName,
      colegio: _ignoredColegio,
      classroom: _ignoredClassroom,
      teacher: _ignoredTeacher,
      profesor: _ignoredProfesor,
      phone: _ignoredPhone,
      free_text: _ignoredFreeText,
      identity: _ignoredIdentity,
      browser: _ignoredBrowser,
      device: _ignoredDevice,
      fingerprint: _ignoredFingerprint,
      ip: _ignoredIp,
      ...safePayload
    } = rawPayload;

    const state = GameState.getInstance();
    TelemetryService.getInstance().recordEvent(eventType, {
      ...safePayload,
      participant_id: state.participantId,
      session_id: state.sessionId,
      condition: isControlMessage ? 'GC' : safePayload.condition,
      level: 7,
    });
  });
}
