/**
 * Ad placement policy (metric T7) — never show ads while a wave is active.
 */

export type AdFormat = "banner" | "interstitial" | "rewarded";

export interface AdContext {
  waveActive: boolean;
  screen: "home" | "combat" | "result" | "practice";
  adsMode: "test" | "off";
}

export function canShowAd(format: AdFormat, ctx: AdContext): boolean {
  if (ctx.adsMode === "off") return false;
  if (ctx.waveActive) return false;

  switch (format) {
    case "banner":
      return ctx.screen === "home" || ctx.screen === "result";
    case "interstitial":
      return ctx.screen === "result";
    case "rewarded":
      return ctx.screen === "practice" || ctx.screen === "result";
    default:
      return false;
  }
}
