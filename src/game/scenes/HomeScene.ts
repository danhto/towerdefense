import Phaser from "phaser";
import {
  beginAttempt,
  createAttemptState,
  remainingOfficialAttempts,
  syncAttemptDate,
} from "../daily/attempts";
import { dailySeed } from "../daily/seed";

export class HomeScene extends Phaser.Scene {
  constructor() {
    super("home");
  }

  create(): void {
    const { width, height } = this.scale;
    const { dateKey, seed } = dailySeed();
    let attempts = syncAttemptDate(createAttemptState(dateKey), dateKey);

    this.add
      .rectangle(width / 2, height / 2, width, height, 0x0f766e, 0.35)
      .setStrokeStyle(2, 0xa8b5a0);

    this.add
      .text(width / 2, height * 0.22, "Today’s Dare", {
        fontFamily: "Fraunces, Georgia, serif",
        fontSize: "42px",
        color: "#f8faf9",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.3, dateKey, {
        fontFamily: "Manrope, sans-serif",
        fontSize: "22px",
        color: "#e8dcc8",
      })
      .setOrigin(0.5)
      .setName("dateLabel");

    this.add
      .text(width / 2, height * 0.38, `Seed ${seed.toString(16)}`, {
        fontFamily: "Manrope, sans-serif",
        fontSize: "14px",
        color: "#a8b5a0",
      })
      .setOrigin(0.5);

    const status = this.add
      .text(
        width / 2,
        height * 0.55,
        `Official attempts remaining: ${remainingOfficialAttempts(attempts)}`,
        {
          fontFamily: "Manrope, sans-serif",
          fontSize: "18px",
          color: "#f8faf9",
        },
      )
      .setOrigin(0.5)
      .setName("attemptStatus");

    const cta = this.add
      .text(width / 2, height * 0.68, "Start attempt", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "24px",
        color: "#0b3d3a",
        backgroundColor: "#e8dcc8",
        padding: { x: 24, y: 14 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setName("startCta");

    cta.on("pointerdown", () => {
      const started = beginAttempt(attempts);
      attempts = started.state;
      status.setText(
        started.mode === "official"
          ? `Official attempt ${started.attemptNumber}/3`
          : "Practice mode",
      );
      this.game.registry.set("lastMode", started.mode);
      this.game.registry.set("dateKey", dateKey);
    });

    const dare = document.getElementById("dare-label");
    if (dare) {
      dare.textContent = `Today’s Dare — ${dateKey}`;
    }
    const build = document.getElementById("build-status");
    if (build) {
      build.textContent = "Home scene ready";
      build.setAttribute("data-ready", "true");
    }
  }
}
