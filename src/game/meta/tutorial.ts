/**
 * First-run tutorial — short, obvious, skippable.
 * Persisted in localStorage so returning players are not blocked.
 *
 * Playtest helpers:
 * - `?tutorial=1` (or `?tour=1`) clears completion and forces the tour
 * - Home “Replay tour” toggle for the same without a query string
 */

const TUTORIAL_KEY = "daily-hold-tutorial-v1";
const FORCE_KEY = "daily-hold-tutorial-force-v1";

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
    body: "Tap a colored tower chip, then tap grass to place it. Bolt shreds runners, Burst clears swarms, Brine softens tanks — mix them as waves escalate.",
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
    localStorage.removeItem(FORCE_KEY);
  } catch {
    /* ignore quota / private mode */
  }
}

/** Clear completion between unit tests or when forcing a replay. */
export function resetTutorialProgress(): void {
  try {
    localStorage.removeItem(TUTORIAL_KEY);
  } catch {
    /* ignore */
  }
}

export function isTutorialForced(): boolean {
  try {
    return localStorage.getItem(FORCE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setTutorialForced(on: boolean): void {
  try {
    if (on) {
      localStorage.setItem(FORCE_KEY, "1");
      localStorage.removeItem(TUTORIAL_KEY);
    } else {
      localStorage.removeItem(FORCE_KEY);
    }
  } catch {
    /* ignore */
  }
}

/** True when the play scene should show the coach overlay. */
export function shouldShowTutorial(): boolean {
  return isTutorialForced() || !hasCompletedTutorial();
}

/**
 * Honor `?tutorial=1` / `?tour=1` so PR playtesters can re-open the tour
 * without digging through storage.
 */
export function bootstrapTutorialFromUrl(
  search: string = typeof window !== "undefined" ? window.location.search : "",
): boolean {
  try {
    const params = new URLSearchParams(search);
    let flag = params.get("tutorial") ?? params.get("tour");

    // Hash fallback: /towerdefense/#tutorial=1 (survives some redirects).
    if (!flag && typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash.replace(/^#/, "");
      const hashParams = new URLSearchParams(
        hash.includes("=") || hash.includes("&") ? hash : "",
      );
      flag = hashParams.get("tutorial") ?? hashParams.get("tour");
      if (!flag && (hash === "tutorial" || hash === "tour")) flag = "1";
    }

    // Last resort: bare query accidentally stuck after the path.
    if (
      !flag &&
      typeof window !== "undefined" &&
      /[?&#](?:tutorial|tour)=(?:1|true)\b/.test(window.location.href)
    ) {
      flag = "1";
    }

    if (flag === "1" || flag === "true") {
      setTutorialForced(true);
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}
