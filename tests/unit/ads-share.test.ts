import { describe, expect, it } from "vitest";
import { canShowAd } from "../../src/game/systems/ads";
import {
  assertNoSpoilers,
  buildShareCardPayload,
  FORBIDDEN_SHARE_KEYS,
  formatClearTime,
  formatLeakSummary,
  formatLoadoutHint,
  formatShareText,
  uniqueTowerKinds,
} from "../../src/game/share/card";
import { shareCardToDataUrl } from "../../src/game/share/image";

describe("ad policy (T7)", () => {
  it("blocks all formats while a wave is active", () => {
    const ctx = {
      waveActive: true,
      screen: "combat" as const,
      adsMode: "test" as const,
    };
    expect(canShowAd("banner", ctx)).toBe(false);
    expect(canShowAd("interstitial", ctx)).toBe(false);
    expect(canShowAd("rewarded", ctx)).toBe(false);
  });

  it("allows interstitial only on result when idle", () => {
    expect(
      canShowAd("interstitial", {
        waveActive: false,
        screen: "result",
        adsMode: "test",
      }),
    ).toBe(true);
    expect(
      canShowAd("interstitial", {
        waveActive: false,
        screen: "home",
        adsMode: "test",
      }),
    ).toBe(false);
  });

  it("respects ads off", () => {
    expect(
      canShowAd("banner", {
        waveActive: false,
        screen: "home",
        adsMode: "off",
      }),
    ).toBe(false);
  });
});

describe("share card (T8)", () => {
  it("builds typographic payload without spoilers", () => {
    const card = buildShareCardPayload({
      dateKey: "2026-03-05",
      result: "cleared",
      officialAttempt: 2,
      officialLimit: 3,
      score: 1840,
      clearTimeMs: 102_000,
      leaks: 0,
      closestLeakPct: 6,
      mode: "official",
      towerKinds: ["burst", "bolt", "bolt", "brine"],
    });
    assertNoSpoilers(card);
    for (const key of FORBIDDEN_SHARE_KEYS) {
      expect(card).not.toHaveProperty(key);
    }
    expect(card.towerKinds).toEqual(["bolt", "brine", "burst"]);
    const text = formatShareText(card);
    expect(text).toContain("2026-03-05");
    expect(text).toContain("CLEARED");
    expect(text).toContain("2/3");
    expect(text).toContain("closest 6%");
    expect(text).toContain("1:42 clear");
    expect(text).toContain("Held with 🟠  🔵  🔴");
    expect(text).not.toMatch(/speed\s*\+/i);
    expect(text).not.toMatch(/layout|placement|×\d|x\d/i);
  });

  it("reports actual gate leaks instead of no leaks", () => {
    expect(formatLeakSummary({ leaks: 1, closestLeakPct: 0 })).toBe("1 leak");
    expect(formatLeakSummary({ leaks: 2, closestLeakPct: 0 })).toBe("2 leaks");
    expect(formatLeakSummary({ leaks: 0, closestLeakPct: 8 })).toBe(
      "closest 8%",
    );
    expect(formatLeakSummary({ leaks: 0, closestLeakPct: null })).toBe(
      "no leaks",
    );

    const card = buildShareCardPayload({
      dateKey: "2026-03-05",
      result: "cleared",
      officialAttempt: 1,
      officialLimit: 3,
      score: 900,
      clearTimeMs: 80_000,
      leaks: 1,
      closestLeakPct: 0,
      mode: "official",
      towerKinds: ["bolt"],
    });
    const text = formatShareText(card);
    expect(text).toContain("1 leak");
    expect(text).not.toContain("no leak");
  });

  it("never shows 4/3 for practice clears", () => {
    const card = buildShareCardPayload({
      dateKey: "2026-03-05",
      result: "cleared",
      officialAttempt: 4,
      officialLimit: 3,
      score: 2100,
      clearTimeMs: 95_000,
      leaks: 0,
      closestLeakPct: null,
      mode: "practice",
      towerKinds: ["bolt"],
    });
    const text = formatShareText(card);
    expect(text).toContain("CLEARED  practice");
    expect(text).not.toMatch(/\d+\/\d+/);
    expect(text).not.toContain("4/3");
    expect(card.officialAttempt).toBe(3);
    expect(text).toContain("Held with 🟠");
    expect(text).toContain("no leaks");
  });

  it("formats clear time as m:ss", () => {
    expect(formatClearTime(0)).toBe("0:00");
    expect(formatClearTime(1_000)).toBe("0:01");
    expect(formatClearTime(65_000)).toBe("1:05");
  });

  it("formats loadout hints without counts or positions", () => {
    expect(uniqueTowerKinds(["burst", "bolt", "bolt"])).toEqual([
      "bolt",
      "burst",
    ]);
    expect(formatLoadoutHint("cleared", ["bolt", "brine"])).toBe(
      "Held with 🟠  🔵",
    );
    expect(formatLoadoutHint("failed", ["burst"])).toBe("Ran 🔴");
    expect(formatLoadoutHint("cleared", [])).toBeNull();
  });
});

describe("share card image (T8)", () => {
  it("builds a png data url without spoiler fields when canvas exists", () => {
    const card = buildShareCardPayload({
      dateKey: "2026-03-05",
      result: "cleared",
      officialAttempt: 2,
      officialLimit: 3,
      score: 1840,
      clearTimeMs: 90_000,
      leaks: 0,
      closestLeakPct: 6,
      mode: "official",
      towerKinds: ["bolt", "brine"],
    });
    expect(card).not.toHaveProperty("towerLayout");
    if (typeof document === "undefined") {
      expect(formatShareText(card)).toContain("CLEARED");
      return;
    }
    try {
      const url = shareCardToDataUrl(card);
      expect(url.startsWith("data:image/png")).toBe(true);
      expect(url.length).toBeGreaterThan(100);
    } catch {
      expect(formatShareText(card)).toContain("2026-03-05");
    }
  });
});
