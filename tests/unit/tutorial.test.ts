import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  bootstrapTutorialFromUrl,
  hasCompletedTutorial,
  isTutorialForced,
  markTutorialComplete,
  resetTutorialProgress,
  setTutorialForced,
  shouldShowTutorial,
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
    setTutorialForced(false);
  });

  it("starts incomplete and has a short step list", () => {
    expect(hasCompletedTutorial()).toBe(false);
    expect(shouldShowTutorial()).toBe(true);
    expect(TUTORIAL_STEPS.length).toBeGreaterThanOrEqual(3);
    expect(TUTORIAL_STEPS.length).toBeLessThanOrEqual(5);
  });

  it("persists completion", () => {
    markTutorialComplete();
    expect(hasCompletedTutorial()).toBe(true);
    expect(shouldShowTutorial()).toBe(false);
  });

  it("replay force clears completion and keeps the tour armed", () => {
    markTutorialComplete();
    setTutorialForced(true);
    expect(hasCompletedTutorial()).toBe(false);
    expect(isTutorialForced()).toBe(true);
    expect(shouldShowTutorial()).toBe(true);
  });

  it("honors ?tutorial=1 for PR playtests", () => {
    markTutorialComplete();
    expect(bootstrapTutorialFromUrl("?tutorial=1")).toBe(true);
    expect(isTutorialForced()).toBe(true);
    expect(shouldShowTutorial()).toBe(true);
  });

  it("clears the force flag when the tour is completed", () => {
    setTutorialForced(true);
    markTutorialComplete();
    expect(isTutorialForced()).toBe(false);
    expect(hasCompletedTutorial()).toBe(true);
  });

  it("treats #tutorial as a force signal", () => {
    markTutorialComplete();
    const href = "https://danhto.github.io/towerdefense/#tutorial=1";
    Object.defineProperty(globalThis, "window", {
      value: {
        location: { search: "", hash: "#tutorial=1", href },
      },
      configurable: true,
    });
    expect(bootstrapTutorialFromUrl("")).toBe(true);
    expect(isTutorialForced()).toBe(true);
  });
});
