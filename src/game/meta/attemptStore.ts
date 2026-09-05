import {
  beginAttempt,
  createAttemptState,
  syncAttemptDate,
  type AttemptState,
} from "../daily/attempts";

export const ATTEMPT_STORAGE_KEY = "daily-hold-attempts-v1";

export function loadAttempts(dateKey: string): AttemptState {
  try {
    const raw = localStorage.getItem(ATTEMPT_STORAGE_KEY);
    if (!raw) return createAttemptState(dateKey);
    return syncAttemptDate(JSON.parse(raw) as AttemptState, dateKey);
  } catch {
    return createAttemptState(dateKey);
  }
}

export function saveAttempts(state: AttemptState): void {
  localStorage.setItem(ATTEMPT_STORAGE_KEY, JSON.stringify(state));
}

export function startNextAttempt(dateKey: string): ReturnType<typeof beginAttempt> {
  const state = loadAttempts(dateKey);
  const started = beginAttempt(state);
  saveAttempts(started.state);
  return started;
}
