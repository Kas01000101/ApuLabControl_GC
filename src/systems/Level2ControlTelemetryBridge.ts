import { GameState } from './GameState';
import { TelemetryService } from './TelemetryService';

const LEVEL2_CONTROL_EVENT_TYPES = new Set([
  'level_started',
  'battery_viewed',
  'measurement_registered',
  'measurement_error',
  'negative_polarity_observed',
  'measurement_corrected',
  'all_three_measured',
  'choice_submitted',
  'choice_changed',
  'help_requested',
  'level_completed',
]);

type Level2ControlTelemetryMessage = {
  type?: unknown;
  event?: unknown;
  payload?: unknown;
};

let installed = false;

export function installLevel2ControlTelemetryBridge(): void {
  if (installed) return;
  installed = true;

  window.addEventListener('message', (message: MessageEvent<Level2ControlTelemetryMessage>) => {
    if (message.origin !== window.location.origin) return;
    const data = message.data;
    if (!data || data.type !== 'apulab-control-n2-telemetry') return;

    const fromMissionFrame = [...document.querySelectorAll<HTMLIFrameElement>('.mission01-frame')]
      .some((frame) => frame.contentWindow === message.source);
    if (!fromMissionFrame) return;

    const eventType = typeof data.event === 'string' ? data.event : '';
    if (!LEVEL2_CONTROL_EVENT_TYPES.has(eventType)) return;

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
      email: _ignoredEmail,
      school: _ignoredSchool,
      ...safePayload
    } = rawPayload;

    TelemetryService.getInstance().recordEvent(eventType, {
      ...safePayload,
      participant_id: state.participantId,
      session_id: state.sessionId,
      condition: 'control',
      level: 2,
    });
  });
}
