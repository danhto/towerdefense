const REMOVE_ADS_KEY = "daily-hold-remove-ads";
const CONSENT_KEY = "daily-hold-ads-consent";

export function getRemoveAds(): boolean {
  try {
    return localStorage.getItem(REMOVE_ADS_KEY) === "1";
  } catch {
    return false;
  }
}

export function setRemoveAds(on: boolean): void {
  try {
    localStorage.setItem(REMOVE_ADS_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function getAdsConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === "1";
  } catch {
    return false;
  }
}

export function setAdsConsent(on: boolean): void {
  try {
    localStorage.setItem(CONSENT_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
}
