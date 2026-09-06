import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  hasCompletedTutorial,
  markTutorialComplete,
  resetTutorialProgress,
  TUTORIAL_STEPS,
} from "../../src/game/meta/tutorial";

function installMemoryStorage(): void {
  const store = new Map<string, string>();
  const memory = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, String(v));
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  };
  Object.defineProperty(globalThis, "localStorage", {
    value: memory,
    configurable: true,
  });
}

describe("first-run tutorial", () => {
  beforeEach(() => {
    installMemoryStorage();
    localStorage.clear();
  });

  afterEach(() => {
    resetTutorialProgress();
  });

  it("starts incomplete and has a short step list", () => {
    expect(hasCompletedTutorial()).toBe(false);
    expect(TUTORIAL_STEPS.length).toBeGreaterThanOrEqual(3);
    expect(TUTORIAL_STEPS.length).toBeLessThanOrEqual(5);
  });

  it("persists completion", () => {
    markTutorialComplete();
    expect(hasCompletedTutorial()).toBe(true);
  });
});
