/**
 * Spoiler-free share card (metric T8) — typographic only, no layout.
 *
 * Tower *kinds* used are allowed as a loadout hint (no counts, no positions).
 */

import type { TowerKind } from "../sim/towers";

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
  /** Unique tower kinds used this run (ordered); never counts or positions. */
  towerKinds: TowerKind[];
}

const KIND_ORDER: TowerKind[] = ["bolt", "brine", "burst"];

/** Colored tower dots for share text (clipboard / plain text). */
export const TOWER_KIND_DOT: Record<TowerKind, string> = {
  bolt: "🟠", // Amber Bolt
  brine: "🔵", // Mint Brine
  burst: "🔴", // Coral Burst
};

/** Hex fills for share-card canvas dots (match in-game tower colors). */
export const TOWER_KIND_COLOR: Record<TowerKind, string> = {
  bolt: "#d97706",
  brine: "#7dd3fc",
  burst: "#e11d48",
};

/** Stable unique kinds from a run — no counts, no placement data. */
export function uniqueTowerKinds(kinds: readonly TowerKind[]): TowerKind[] {
  const seen = new Set(kinds);
  return KIND_ORDER.filter((k) => seen.has(k));
}

/** Spoiler-free loadout line using tower color-dots (no names/counts/positions). */
export function formatLoadoutHint(
  result: "cleared" | "failed",
  kinds: readonly TowerKind[],
): string | null {
  const unique = uniqueTowerKinds(kinds);
  if (unique.length === 0) return null;
  const dots = unique.map((k) => TOWER_KIND_DOT[k]).join("  ");
  return result === "cleared" ? `Held with ${dots}` : `Ran ${dots}`;
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
  towerKinds?: readonly TowerKind[];
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
    towerKinds = [],
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
    towerKinds: uniqueTowerKinds(towerKinds),
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
  const lines = [
    `${card.title} — ${card.dateKey}`,
    `${status}  ${attempt}`,
    scoreLine,
  ];
  const loadout = formatLoadoutHint(card.result, card.towerKinds);
  if (loadout) lines.push(loadout);
  return lines.join("\n");
}

export const FORBIDDEN_SHARE_KEYS = [
  "towerLayout",
  "placements",
  "mapScreenshot",
  "replayFrames",
  "towerCounts",
  "towerPositions",
] as const;

export function assertNoSpoilers(card: ShareCardPayload): void {
  const keys = Object.keys(card);
  for (const bad of FORBIDDEN_SHARE_KEYS) {
    if (keys.includes(bad)) {
      throw new Error(`share card must not include ${bad}`);
    }
  }
  // Guard: kinds list must never smuggle counts/coords.
  for (const kind of card.towerKinds) {
    if (kind !== "bolt" && kind !== "brine" && kind !== "burst") {
      throw new Error(`invalid tower kind on share card: ${String(kind)}`);
    }
  }
}
