/**
 * Lives / leak helpers for G1 — leak decrements; 0 → fail.
 */

export interface LivesState {
  lives: number;
}

export type LeakResult =
  | { state: LivesState; outcome: "continue"; livesLeft: number }
  | { state: LivesState; outcome: "fail"; livesLeft: 0 };

export function createLives(lives: number): LivesState {
  if (lives < 1) throw new Error("lives must be >= 1");
  return { lives };
}

export function applyLeak(state: LivesState, count = 1): LeakResult {
  if (count < 1) throw new Error("leak count must be >= 1");
  const lives = Math.max(0, state.lives - count);
  if (lives === 0) {
    return { state: { lives: 0 }, outcome: "fail", livesLeft: 0 };
  }
  return { state: { lives }, outcome: "continue", livesLeft: lives };
}
