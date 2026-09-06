/**
 * Spoiler-free share card (metric T8) — typographic only, no layout.
 */

export interface ShareCardPayload {
  title: string;
  dateKey: string;
  result: "cleared" | "failed";
  officialAttempt: number;
  officialLimit: number;
  score: number;
  /** Wall-clock clear time in ms when result is cleared; null on breach. */
  clearTimeMs: number | null;
  closestLeakPct: number | null;
  mode: "official" | "practice";
}

/** Format ms as m:ss for share / HUD clocks. */
export function formatClearTime(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function buildShareCardPayload(input: {
  dateKey: string;
  result: "cleared" | "failed";
  officialAttempt: number;
  officialLimit: number;
  score: number;
  clearTimeMs?: number | null;
  closestLeakPct: number | null;
  mode: "official" | "practice";
}): ShareCardPayload {
  const {
    dateKey,
    result,
    officialAttempt,
    officialLimit,
    score,
    clearTimeMs = null,
    closestLeakPct,
    mode,
  } = input;

  if (!dateKey) throw new Error("dateKey required");
  if (officialLimit < 1) throw new Error("officialLimit invalid");
  if (score < 0) throw new Error("score must be >= 0");
  if (clearTimeMs !== null && clearTimeMs < 0) {
    throw new Error("clearTimeMs must be >= 0");
  }
  if (
    closestLeakPct !== null &&
    (closestLeakPct < 0 || closestLeakPct > 100)
  ) {
    throw new Error("closestLeakPct out of range");
  }

  // Never display past the official limit (practice used to show 4/3).
  const clampedAttempt =
    mode === "practice"
      ? officialLimit
      : Math.min(Math.max(1, officialAttempt), officialLimit);

  return {
    title: "Daily Hold",
    dateKey,
    result,
    officialAttempt: clampedAttempt,
    officialLimit,
    score,
    clearTimeMs: result === "cleared" ? clearTimeMs : null,
    closestLeakPct,
    mode,
  };
}

export function formatShareText(card: ShareCardPayload): string {
  const status = card.result === "cleared" ? "CLEARED" : "BREACHED";
  // Practice is not a 4th official slot — don't print "4/3".
  const attempt =
    card.mode === "practice"
      ? "practice"
      : `${card.officialAttempt}/${card.officialLimit}`;
  const near =
    card.closestLeakPct === null
      ? "no leak"
      : `closest leak ${card.closestLeakPct.toFixed(0)}%`;
  const scoreLine =
    card.clearTimeMs !== null
      ? `${card.score}  ·  ${formatClearTime(card.clearTimeMs)} clear  ·  ${near}`
      : `${card.score}  ·  ${near}`;
  return [
    `${card.title} — ${card.dateKey}`,
    `${status}  ${attempt}`,
    scoreLine,
  ].join("\n");
}

export const FORBIDDEN_SHARE_KEYS = [
  "towerLayout",
  "placements",
  "mapScreenshot",
  "replayFrames",
] as const;

export function assertNoSpoilers(card: ShareCardPayload): void {
  const keys = Object.keys(card);
  for (const bad of FORBIDDEN_SHARE_KEYS) {
    if (keys.includes(bad)) {
      throw new Error(`share card must not include ${bad}`);
    }
  }
}
