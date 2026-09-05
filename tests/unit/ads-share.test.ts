import { describe, expect, it } from "vitest";
import { canShowAd } from "../../src/game/systems/ads";
import {
  assertNoSpoilers,
  buildShareCardPayload,
  FORBIDDEN_SHARE_KEYS,
  formatShareText,
} from "../../src/game/share/card";

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
      closestLeakPct: 6,
      mode: "official",
    });
    assertNoSpoilers(card);
    for (const key of FORBIDDEN_SHARE_KEYS) {
      expect(card).not.toHaveProperty(key);
    }
    const text = formatShareText(card);
    expect(text).toContain("2026-03-05");
    expect(text).toContain("CLEARED");
    expect(text).toContain("closest leak 6%");
    expect(text).not.toMatch(/tower|layout|placement/i);
  });
});
