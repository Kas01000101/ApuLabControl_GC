import { GameState } from './GameState';
import { TelemetryService } from './TelemetryService';

const LEGACY_EVENT_TYPES = new Set([
  'level_started','level_completed','help_requested','program_started','program_modified','science_action',
  'science_zone_reached','communication_point_reached','explore_opened','bitacora_opened','data_sent',
  'premature_action','scan_started','scan_completed','analyze_started','analyze_completed',
]);

const CONTROL_EVENT_TYPES = new Set([
  'level_started','first_action','program_started','program_modified','program_cleared','science_zone_reached',
  'scan_started','scan_completed','analyze_started','analyze_completed','communication_point_reached',
  'data_sent','premature_action','science_action','sequence_failed','feedback_shown','sequence_corrected',
  'help_requested','level_completed',
]);

type Level6TelemetryMessage = {
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
    return frame.contentDocument?.documentElement?.dataset?.apulabControl === 'n6'
      || frame.contentDocument?.body?.classList?.contains('apulab-control-n6-active') === true;
  } catch {
    return false;
  }
}

export function installLevel6TelemetryBridge(): void {
  if (installed) return;
  installed = true;

  window.addEventListener('message', (message: MessageEvent<Level6TelemetryMessage>) => {
    if (message.origin !== window.location.origin) return;
    const data = message.data;
    if (!data) return;

    const frame = findSourceFrame(message.source);
    if (!frame) return;

    const controlMode = isControlFrame(frame);
    const isControlMessage = data.type === 'apulab-control-n6-telemetry';
    const isLegacyMessage = data.type === 'apulab-level6-telemetry';

    // The late N6 control adapter owns N6 research telemetry. Once it is active,
    // legacy game-derived messages are ignored to prevent duplicate start/terminal events.
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
      full_name: _ignoredFullName,
      first_name: _ignoredFirstName,
      last_name: _ignoredLastName,
      email: _ignoredEmail,
      school: _ignoredSchool,
      school_name: _ignoredSchoolName,
      classroom: _ignoredClassroom,
      teacher: _ignoredTeacher,
      phone: _ignoredPhone,
      free_text: _ignoredFreeText,
      identity: _ignoredIdentity,
      browser: _ignoredBrowser,
      device: _ignoredDevice,
      fingerprint: _ignoredFingerprint,
      ...safePayload
    } = rawPayload;

    const state = GameState.getInstance();
    TelemetryService.getInstance().recordEvent(eventType, {
      ...safePayload,
      participant_id: state.participantId,
      session_id: state.sessionId,
      condition: isControlMessage ? 'GC' : safePayload.condition,
      level: 6,
    });
  });
}
