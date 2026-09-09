import { GameState } from './GameState';
import { TelemetryService } from './TelemetryService';

const LEVEL3_CONTROL_EVENT_TYPES = new Set([
  'level_started',
  'command_added',
  'command_removed',
  'command_reordered',
  'sequence_submitted',
  'sequence_failed',
  'sequence_corrected',
  'help_requested',
  'level_completed',
]);

type Level3ControlTelemetryMessage = {
  type?: unknown;
  event?: unknown;
  payload?: unknown;
};

let installed = false;

export function installLevel3ControlTelemetryBridge(): void {
  if (installed) return;
  installed = true;

  window.addEventListener('message', (message: MessageEvent<Level3ControlTelemetryMessage>) => {
    if (message.origin !== window.location.origin) return;
    const data = message.data;
    if (!data || data.type !== 'apulab-control-n3-telemetry') return;

    const fromMissionFrame = [...document.querySelectorAll<HTMLIFrameElement>('.mission01-frame')]
      .some((frame) => frame.contentWindow === message.source);
    if (!fromMissionFrame) return;

    const eventType = typeof data.event === 'string' ? data.event : '';
    if (!LEVEL3_CONTROL_EVENT_TYPES.has(eventType)) return;

    const rawPayload = data.payload && typeof data.payload === 'object' && !Array.isArray(data.payload)
      ? data.payload as Record<string, unknown>
      : {};
    const state = GameState.getInstance();

    const {
      participant_id: _ignoredParticipant,
      session_id: _ignoredSession,
      participant_code: _ignoredCode,
      credential: _ignoredCredential,
      password: _ignoredPassword,
      name: _ignoredName,
      full_name: _ignoredFullName,
      first_name: _ignoredFirstName,
      last_name: _ignoredLastName,
      email: _ignoredEmail,
      school: _ignoredSchool,
      school_name: _ignoredSchoolName,
      classroom: _ignoredClassroom,
      phone: _ignoredPhone,
      free_text: _ignoredFreeText,
      identity: _ignoredIdentity,
      ...safePayload
    } = rawPayload;

    TelemetryService.getInstance().recordEvent(eventType, {
      ...safePayload,
      participant_id: state.participantId,
      session_id: state.sessionId,
      condition: 'control',
      level: 3,
    });
  });
}
