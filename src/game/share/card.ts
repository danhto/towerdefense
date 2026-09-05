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
  closestLeakPct: number | null;
  mode: "official" | "practice";
}

export function buildShareCardPayload(input: {
  dateKey: string;
  result: "cleared" | "failed";
  officialAttempt: number;
  officialLimit: number;
  score: number;
  closestLeakPct: number | null;
  mode: "official" | "practice";
}): ShareCardPayload {
  const {
    dateKey,
    result,
    officialAttempt,
    officialLimit,
    score,
    closestLeakPct,
    mode,
  } = input;

  if (!dateKey) throw new Error("dateKey required");
  if (officialLimit < 1) throw new Error("officialLimit invalid");
  if (score < 0) throw new Error("score must be >= 0");
  if (
    closestLeakPct !== null &&
    (closestLeakPct < 0 || closestLeakPct > 100)
  ) {
    throw new Error("closestLeakPct out of range");
  }

  return {
    title: "Daily Hold",
    dateKey,
    result,
    officialAttempt,
    officialLimit,
    score,
    closestLeakPct,
    mode,
  };
}

export function formatShareText(card: ShareCardPayload): string {
  const status = card.result === "cleared" ? "CLEARED" : "HELD";
  const attempt = `${card.officialAttempt}/${card.officialLimit}`;
  const near =
    card.closestLeakPct === null
      ? "no leak"
      : `closest leak ${card.closestLeakPct.toFixed(0)}%`;
  const modeTag = card.mode === "practice" ? " (practice)" : "";
  return [
    `${card.title} — ${card.dateKey}${modeTag}`,
    `${status}  ${attempt}`,
    `${card.score}  ·  ${near}`,
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
