import { describe, expect, it } from "vitest";
import {
  beginAttempt,
  createAttemptState,
  modeForNextAttempt,
  OFFICIAL_ATTEMPT_LIMIT,
  remainingOfficialAttempts,
  syncAttemptDate,
} from "../../src/game/daily/attempts";

describe("attempt gate (T6)", () => {
  it("starts with full official budget", () => {
    const state = createAttemptState("2026-03-05");
    expect(remainingOfficialAttempts(state)).toBe(OFFICIAL_ATTEMPT_LIMIT);
    expect(modeForNextAttempt(state)).toBe("official");
  });

  it("counts three official attempts then switches to practice", () => {
    let state = createAttemptState("2026-03-05");
    const modes: string[] = [];
    for (let i = 0; i < 5; i++) {
      const result = beginAttempt(state);
      state = result.state;
      modes.push(result.mode);
    }
    expect(modes).toEqual([
      "official",
      "official",
      "official",
      "practice",
      "practice",
    ]);
    expect(state.officialStarted).toBe(3);
  });

  it("resets when the UTC date rolls over", () => {
    let state = createAttemptState("2026-03-05");
    state = beginAttempt(state).state;
    state = beginAttempt(state).state;
    expect(state.officialStarted).toBe(2);

    state = syncAttemptDate(state, "2026-03-06");
    expect(state.dateKey).toBe("2026-03-06");
    expect(state.officialStarted).toBe(0);
    expect(modeForNextAttempt(state)).toBe("official");
  });
});
