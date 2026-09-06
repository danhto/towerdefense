import Phaser from "phaser";
import {
  modeForNextAttempt,
  remainingOfficialAttempts,
} from "../daily/attempts";
import { dailySeed } from "../daily/seed";
import { loadAttempts, startNextAttempt } from "../meta/attemptStore";
import {
  getAdsConsent,
  getRemoveAds,
  setAdsConsent,
  setRemoveAds,
} from "../meta/settings";
import { tryShowBanner } from "../systems/adService";
import { PALETTE } from "../theme/palette";

export class HomeScene extends Phaser.Scene {
  constructor() {
    super("home");
  }

  create(): void {
    const { width, height } = this.scale;
    const { dateKey, seed } = dailySeed();
    const attempts = loadAttempts(dateKey);
    const left = remainingOfficialAttempts(attempts);
    const nextMode = modeForNextAttempt(attempts);
    const practiceOnly = nextMode === "practice";

    this.cameras.main.setBackgroundColor(PALETTE.seaTealDeep);

    // Soft harbor wash — atmosphere without card clutter.
    const wash = this.add.graphics();
    wash.fillStyle(PALETTE.seaTeal, 0.28);
    wash.fillRect(0, 0, width, height);
    wash.lineStyle(2, PALETTE.sage, 0.4);
    wash.strokeRect(10, 10, width - 20, height - 20);

    // Brand is the hero signal — not a secondary eyebrow.
    const brand = this.add
      .text(width / 2, height * 0.16, "Daily Hold", {
        fontFamily: "Fraunces, Georgia, serif",
        fontSize: "52px",
        color: "#f8faf9",
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setName("homeBrand");

    this.add
      .text(
        width / 2,
        height * 0.26,
        practiceOnly ? "Practice Waters" : "Today’s Dare",
        {
          fontFamily: "Manrope, sans-serif",
          fontSize: "22px",
          color: "#e8dcc8",
        },
      )
      .setOrigin(0.5)
      .setName("homeTitle");

    this.tweens.add({
      targets: brand,
      alpha: 1,
      y: height * 0.18,
      duration: 480,
      ease: "Sine.easeOut",
    });

    this.add
      .text(width / 2, height * 0.30, dateKey, {
        fontFamily: "Manrope, sans-serif",
        fontSize: "22px",
        color: "#e8dcc8",
      })
      .setOrigin(0.5)
      .setName("dateLabel");

    this.add
      .text(width / 2, height * 0.35, `Seed ${seed.toString(16)}`, {
        fontFamily: "Manrope, sans-serif",
        fontSize: "14px",
        color: "#a8b5a0",
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        height * 0.42,
        practiceOnly
          ? "Official attempts used — Practice is free & unlimited"
          : `Official attempts left: ${left}`,
        {
          fontFamily: "Manrope, sans-serif",
          fontSize: "18px",
          color: "#f8faf9",
        },
      )
      .setOrigin(0.5)
      .setName("attemptStatus");

    this.add
      .text(
        width / 2,
        height * 0.48,
        practiceOnly
          ? "Same seed as Today’s Dare — never paywalled."
          : "Same harbor. Same waves. Hold the gate.",
        {
          fontFamily: "Manrope, sans-serif",
          fontSize: "16px",
          color: "#e8dcc8",
        },
      )
      .setOrigin(0.5);

    const ctaLabel = practiceOnly ? "Enter Practice" : "Start attempt";
    const cta = this.add
      .text(width / 2, height * 0.58, ctaLabel, {
        fontFamily: "Manrope, sans-serif",
        fontSize: "24px",
        color: "#0b3d3a",
        backgroundColor: "#e8dcc8",
        padding: { x: 28, y: 16 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setName("startCta")
      .setAlpha(0);

    this.tweens.add({
      targets: cta,
      alpha: 1,
      delay: 180,
      duration: 360,
      ease: "Sine.easeOut",
    });

    cta.on("pointerdown", () => {
      const started = startNextAttempt(dateKey);
      this.scene.start("play", {
        seed,
        dateKey,
        mode: started.mode,
        attemptNumber: started.attemptNumber,
      });
    });

    // Privacy / ads consent stub (G6) + remove-ads (G4).
    this.toggleRow(
      width / 2,
      height * 0.70,
      `Ads consent: ${getAdsConsent() ? "ON" : "OFF"}`,
      "adsConsentToggle",
      () => {
        setAdsConsent(!getAdsConsent());
        this.scene.restart();
      },
    );

    this.toggleRow(
      width / 2,
      height * 0.78,
      `Remove ads: ${getRemoveAds() ? "ON" : "OFF"}`,
      "removeAdsToggle",
      () => {
        setRemoveAds(!getRemoveAds());
        this.scene.restart();
      },
    );

    this.add
      .text(
        width / 2,
        height * 0.88,
        "Today’s Dare is never locked. Ads only between runs.",
        {
          fontFamily: "Manrope, sans-serif",
          fontSize: "12px",
          color: "#a8b5a0",
        },
      )
      .setOrigin(0.5);

    tryShowBanner("home", false);

    const dare = document.getElementById("dare-label");
    if (dare) {
      dare.textContent = practiceOnly
        ? `Practice — ${dateKey}`
        : `Today’s Dare — ${dateKey}`;
    }
    const build = document.getElementById("build-status");
    if (build) {
      build.textContent = "Home scene ready";
      build.setAttribute("data-ready", "true");
    }
  }

  private toggleRow(
    x: number,
    y: number,
    label: string,
    name: string,
    onClick: () => void,
  ): void {
    const btn = this.add
      .text(x, y, label, {
        fontFamily: "Manrope, sans-serif",
        fontSize: "14px",
        color: "#e8dcc8",
        backgroundColor: "#0b3d3a",
        padding: { x: 16, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setName(name);
    btn.on("pointerdown", onClick);
  }
}
