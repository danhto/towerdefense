/**
 * Official attempt gate (metric T6 / gate G2).
 * 3 official attempts per UTC day; further runs are Practice.
 */

export const OFFICIAL_ATTEMPT_LIMIT = 3;

export type PlayMode = "official" | "practice";

export interface AttemptState {
  dateKey: string;
  officialStarted: number;
}

export function createAttemptState(dateKey: string): AttemptState {
  return { dateKey, officialStarted: 0 };
}

export function modeForNextAttempt(state: AttemptState): PlayMode {
  return state.officialStarted < OFFICIAL_ATTEMPT_LIMIT ? "official" : "practice";
}

export function remainingOfficialAttempts(state: AttemptState): number {
  return Math.max(0, OFFICIAL_ATTEMPT_LIMIT - state.officialStarted);
}

export function beginAttempt(state: AttemptState): {
  state: AttemptState;
  mode: PlayMode;
  attemptNumber: number;
} {
  const mode = modeForNextAttempt(state);
  if (mode === "official") {
    const next = {
      ...state,
      officialStarted: state.officialStarted + 1,
    };
    return { state: next, mode, attemptNumber: next.officialStarted };
  }
  return {
    state,
    mode: "practice",
    attemptNumber: state.officialStarted + 1,
  };
}

export function syncAttemptDate(state: AttemptState, dateKey: string): AttemptState {
  if (state.dateKey === dateKey) return state;
  return createAttemptState(dateKey);
}
