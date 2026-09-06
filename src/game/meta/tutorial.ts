/**
 * First-run tutorial — short, obvious, skippable.
 * Persisted in localStorage so returning players are not blocked.
 */

const TUTORIAL_KEY = "daily-hold-tutorial-v1";

export type TutorialStepId = "welcome" | "path" | "place" | "wave";

export interface TutorialStep {
  id: TutorialStepId;
  title: string;
  body: string;
}

export const TUTORIAL_STEPS: readonly TutorialStep[] = [
  {
    id: "welcome",
    title: "Hold the harbor",
    body: "Invaders march along the sand path. Stop them before they reach the gate.",
  },
  {
    id: "path",
    title: "Follow the path",
    body: "Enemies spawn at IN and walk to GATE. Towers must sit on the grass beside the path — never on the sand.",
  },
  {
    id: "place",
    title: "Build a tower",
    body: "Tap a colored tower chip, then tap grass to place it. Gold is spent when you place.",
  },
  {
    id: "wave",
    title: "Start the wave",
    body: "When your defenses look ready, tap Start wave. You can still place between waves.",
  },
] as const;

export function hasCompletedTutorial(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_KEY) === "1";
  } catch {
    return false;
  }
}

export function markTutorialComplete(): void {
  try {
    localStorage.setItem(TUTORIAL_KEY, "1");
  } catch {
    /* ignore quota / private mode */
  }
}

/** Test helper — clear completion between unit tests. */
export function resetTutorialProgress(): void {
  try {
    localStorage.removeItem(TUTORIAL_KEY);
  } catch {
    /* ignore */
  }
}
