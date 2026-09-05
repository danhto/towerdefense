import Phaser from "phaser";
import {
  beginAttempt,
  createAttemptState,
  remainingOfficialAttempts,
  syncAttemptDate,
  type AttemptState,
} from "../daily/attempts";
import { dailySeed } from "../daily/seed";
import { PALETTE } from "../theme/palette";

const ATTEMPT_KEY = "daily-hold-attempts-v1";

function loadAttempts(dateKey: string): AttemptState {
  try {
    const raw = localStorage.getItem(ATTEMPT_KEY);
    if (!raw) return createAttemptState(dateKey);
    return syncAttemptDate(JSON.parse(raw) as AttemptState, dateKey);
  } catch {
    return createAttemptState(dateKey);
  }
}

function saveAttempts(state: AttemptState): void {
  localStorage.setItem(ATTEMPT_KEY, JSON.stringify(state));
}

export class HomeScene extends Phaser.Scene {
  constructor() {
    super("home");
  }

  create(): void {
    const { width, height } = this.scale;
    const { dateKey, seed } = dailySeed();
    const attempts = loadAttempts(dateKey);

    this.cameras.main.setBackgroundColor(PALETTE.seaTealDeep);

    this.add
      .rectangle(width / 2, height / 2, width, height, PALETTE.seaTeal, 0.35)
      .setStrokeStyle(2, PALETTE.sage);

    this.add
      .text(width / 2, height * 0.2, "Today’s Dare", {
        fontFamily: "Fraunces, Georgia, serif",
        fontSize: "42px",
        color: "#f8faf9",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.28, dateKey, {
        fontFamily: "Manrope, sans-serif",
        fontSize: "22px",
        color: "#e8dcc8",
      })
      .setOrigin(0.5)
      .setName("dateLabel");

    this.add
      .text(width / 2, height * 0.34, `Seed ${seed.toString(16)}`, {
        fontFamily: "Manrope, sans-serif",
        fontSize: "14px",
        color: "#a8b5a0",
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        height * 0.44,
        `Official attempts left: ${remainingOfficialAttempts(attempts)}`,
        {
          fontFamily: "Manrope, sans-serif",
          fontSize: "18px",
          color: "#f8faf9",
        },
      )
      .setOrigin(0.5)
      .setName("attemptStatus");

    this.add
      .text(width / 2, height * 0.52, "Same harbor. Same waves. Hold the gate.", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "16px",
        color: "#e8dcc8",
      })
      .setOrigin(0.5);

    const cta = this.add
      .text(width / 2, height * 0.66, "Start attempt", {
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
      let state = loadAttempts(dateKey);
      const started = beginAttempt(state);
      state = started.state;
      saveAttempts(state);
      this.scene.start("play", {
        seed,
        dateKey,
        mode: started.mode,
        attemptNumber: started.attemptNumber,
      });
    });

    const dare = document.getElementById("dare-label");
    if (dare) dare.textContent = `Today’s Dare — ${dateKey}`;
    const build = document.getElementById("build-status");
    if (build) {
      build.textContent = "Home scene ready";
      build.setAttribute("data-ready", "true");
    }
  }
}
