import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clearAnalyticsBuffer,
  getAnalyticsBuffer,
  track,
  trackSessionStart,
} from "../../src/game/meta/analytics";
import {
  clearErrorReports,
  getErrorReports,
  reportError,
} from "../../src/game/meta/errors";
import { setAdsConsent, setRemoveAds } from "../../src/game/meta/settings";
import {
  resetAdRateLimit,
  resolveAdsMode,
  tryShowBanner,
  tryShowInterstitial,
  tryShowRewarded,
} from "../../src/game/systems/adService";

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

describe("adService (G4)", () => {
  beforeEach(() => {
    installMemoryStorage();
    localStorage.clear();
    resetAdRateLimit();
    clearAnalyticsBuffer();
    setAdsConsent(true);
    setRemoveAds(false);
  });

  afterEach(() => {
    localStorage.clear();
    resetAdRateLimit();
  });

  it("resolves ads off when remove-ads is set", () => {
    setRemoveAds(true);
    expect(resolveAdsMode()).toBe("off");
    expect(tryShowInterstitial("result_end")).toBe(false);
  });

  it("resolves ads off without consent", () => {
    setAdsConsent(false);
    expect(resolveAdsMode()).toBe("off");
  });

  it("rate-caps interstitials", () => {
    const t0 = 1_000_000;
    expect(tryShowInterstitial("result_end", t0)).toBe(true);
    expect(tryShowInterstitial("result_end", t0 + 1_000)).toBe(false);
    expect(tryShowInterstitial("result_end", t0 + 91_000)).toBe(true);
    const blocked = getAnalyticsBuffer().filter(
      (e) => e.name === "ad_blocked_by_policy",
    );
    expect(
      blocked.some(
        (e) => e.name === "ad_blocked_by_policy" && e.reason === "rate_cap",
      ),
    ).toBe(true);
  });

  it("blocks banners mid-wave", () => {
    expect(tryShowBanner("combat", true)).toBe(false);
    const blocked = getAnalyticsBuffer().find(
      (e) => e.name === "ad_blocked_by_policy" && e.reason === "mid_wave",
    );
    expect(blocked).toBeTruthy();
  });

  it("allows rewarded only when ads are on", () => {
    expect(tryShowRewarded("practice_tip")).toBe(true);
    setRemoveAds(true);
    expect(tryShowRewarded("practice_tip")).toBe(false);
  });
});

describe("analytics + errors (G6)", () => {
  beforeEach(() => {
    clearAnalyticsBuffer();
    clearErrorReports();
  });

  it("buffers session_start and custom events", () => {
    trackSessionStart();
    track({ name: "share_click", surface: "result", method: "copy" });
    const buf = getAnalyticsBuffer();
    expect(buf[0]?.name).toBe("session_start");
    expect(buf.some((e) => e.name === "share_click")).toBe(true);
  });

  it("buffers error reports", () => {
    reportError(new Error("boom"), "test");
    expect(getErrorReports()[0]?.message).toBe("boom");
  });
});
