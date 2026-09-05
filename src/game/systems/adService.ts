import { track } from "../meta/analytics";
import { getAdsConsent, getRemoveAds } from "../meta/settings";
import {
  canShowAd,
  type AdContext,
  type AdFormat,
} from "./ads";

const INTERSTITIAL_COOLDOWN_MS = 90_000;
let lastInterstitialAt = 0;

export type ResolvedAdsMode = "test" | "off";

export function resolveAdsMode(): ResolvedAdsMode {
  if (getRemoveAds()) return "off";
  if (!getAdsConsent()) return "off";
  return "test";
}

export function buildAdContext(
  partial: Omit<AdContext, "adsMode">,
): AdContext {
  return { ...partial, adsMode: resolveAdsMode() };
}

/** Rate-capped interstitial after an attempt. */
export function tryShowInterstitial(placement: string, now = Date.now()): boolean {
  const ctx = buildAdContext({ waveActive: false, screen: "result" });
  if (!canShowAd("interstitial", ctx)) {
    track({ name: "ad_blocked_by_policy", reason: ctx.adsMode === "off" ? "ads_off" : "policy" });
    return false;
  }
  if (now - lastInterstitialAt < INTERSTITIAL_COOLDOWN_MS) {
    track({ name: "ad_blocked_by_policy", reason: "rate_cap" });
    return false;
  }
  lastInterstitialAt = now;
  track({ name: "ad_impression", format: "interstitial", placement });
  return true;
}

export function tryShowRewarded(placement: string): boolean {
  const ctx = buildAdContext({ waveActive: false, screen: "practice" });
  if (!canShowAd("rewarded", ctx)) {
    track({ name: "ad_blocked_by_policy", reason: "policy" });
    return false;
  }
  track({ name: "ad_impression", format: "rewarded", placement });
  return true;
}

export function tryShowBanner(screen: AdContext["screen"], waveActive: boolean): boolean {
  const ctx = buildAdContext({ waveActive, screen });
  if (!canShowAd("banner", ctx)) {
    if (waveActive) {
      track({ name: "ad_blocked_by_policy", reason: "mid_wave" });
    }
    return false;
  }
  track({ name: "ad_impression", format: "banner", placement: screen });
  return true;
}

/** Test helper — reset cooldown between unit tests. */
export function resetAdRateLimit(): void {
  lastInterstitialAt = 0;
}

export type { AdFormat };
