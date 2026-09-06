import { GAME_VERSION } from "./version";

export type AnalyticsEvent =
  | { name: "session_start"; client_ts: number; app_version: string }
  | {
      name: "tower_placed";
      tower_type: string;
      tile: string;
      elapsed_ms: number;
    }
  | {
      name: "tower_upgraded";
      tower_type: string;
      tier: number;
      tile: string;
      elapsed_ms: number;
    }
  | {
      name: "wave_started";
      wave_index: number;
      seed: number;
      mode: "official" | "practice";
    }
  | {
      name: "enemy_near_miss";
      path_pct_remaining: number;
      enemy_type: string;
    }
  | {
      name: "life_lost";
      enemy_type: string;
      path_pct: number;
      lives_left: number;
    }
  | {
      name: "attempt_end";
      result: "won" | "lost";
      score: number;
      closest_leak_pct: number | null;
      leaks: number;
      duration_ms: number;
      attempt_n: number;
      balance_version: string;
      mode: "official" | "practice";
    }
  | { name: "share_click"; surface: "result"; method: "native" | "copy" }
  | { name: "ad_impression"; format: string; placement: string }
  | { name: "ad_blocked_by_policy"; reason: string };

type Listener = (event: AnalyticsEvent) => void;

const listeners: Listener[] = [];
const buffer: AnalyticsEvent[] = [];

export function onAnalytics(listener: Listener): () => void {
  listeners.push(listener);
  return () => {
    const i = listeners.indexOf(listener);
    if (i >= 0) listeners.splice(i, 1);
  };
}

export function track(event: AnalyticsEvent): void {
  buffer.push(event);
  if (buffer.length > 200) buffer.shift();
  for (const listener of listeners) listener(event);
  if (import.meta.env.DEV) {
    console.debug("[analytics]", event.name, event);
  }
}

export function trackSessionStart(): void {
  track({
    name: "session_start",
    client_ts: Date.now(),
    app_version: GAME_VERSION,
  });
}

export function getAnalyticsBuffer(): readonly AnalyticsEvent[] {
  return buffer;
}

export function clearAnalyticsBuffer(): void {
  buffer.length = 0;
}
