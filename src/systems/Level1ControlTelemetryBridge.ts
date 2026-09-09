import { GameState } from './GameState';
import { TelemetryService } from './TelemetryService';

const LEVEL1_CONTROL_EVENT_TYPES = new Set([
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
]);

type Level1ControlTelemetryMessage = {
  type?: unknown;
  event?: unknown;
  payload?: unknown;
};

let installed = false;

export function installLevel1ControlTelemetryBridge(): void {
  if (installed) return;
  installed = true;

  window.addEventListener('message', (message: MessageEvent<Level1ControlTelemetryMessage>) => {
    if (message.origin !== window.location.origin) return;
    const data = message.data;
    if (!data || data.type !== 'apulab-control-n1-telemetry') return;

    const fromMissionFrame = [...document.querySelectorAll<HTMLIFrameElement>('.mission01-frame')]
      .some((frame) => frame.contentWindow === message.source);
    if (!fromMissionFrame) return;

    const eventType = typeof data.event === 'string' ? data.event : '';
    if (!LEVEL1_CONTROL_EVENT_TYPES.has(eventType)) return;

    const rawPayload = data.payload && typeof data.payload === 'object' && !Array.isArray(data.payload)
      ? data.payload as Record<string, unknown>
      : {};
    const state = GameState.getInstance();

    // Identity is authoritative in the parent session. Never accept participant,
    // session, credential, or other identity fields from the N1 iframe.
    const {
      participant_id: _ignoredParticipant,
      session_id: _ignoredSession,
      participant_code: _ignoredCode,
      credential: _ignoredCredential,
      password: _ignoredPassword,
      ...safePayload
    } = rawPayload;

    TelemetryService.getInstance().recordEvent(eventType, {
      ...safePayload,
      participant_id: state.participantId,
      session_id: state.sessionId,
      condition: 'control',
      level: 1,
    });
  });
}
