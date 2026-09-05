import Phaser from "phaser";
import {
  beginAttempt,
  createAttemptState,
  modeForNextAttempt,
  remainingOfficialAttempts,
  syncAttemptDate,
  type AttemptState,
} from "../daily/attempts";
import { dailySeed } from "../daily/seed";
import {
  assertNoSpoilers,
  buildShareCardPayload,
  formatShareText,
} from "../share/card";
import type { MatchSnapshot } from "../sim/match";
import { canShowAd } from "../systems/ads";
import { PALETTE } from "../theme/palette";

export interface ResultSceneData {
  snapshot: MatchSnapshot;
  dateKey: string;
  mode: "official" | "practice";
  attemptNumber: number;
  seed: number;
}

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

export class ResultScene extends Phaser.Scene {
  constructor() {
    super("result");
  }

  create(data: ResultSceneData): void {
    const { width, height } = this.scale;
    const snap = data.snapshot;
    const cleared = snap.phase === "won";

    this.cameras.main.setBackgroundColor(PALETTE.seaTealDeep);

    this.add
      .text(width / 2, height * 0.14, cleared ? "Harbor Held" : "Gate Breached", {
        fontFamily: "Fraunces, Georgia, serif",
        fontSize: "40px",
        color: "#f8faf9",
      })
      .setOrigin(0.5);

    const card = buildShareCardPayload({
      dateKey: data.dateKey,
      result: cleared ? "cleared" : "failed",
      officialAttempt: data.attemptNumber,
      officialLimit: 3,
      score: snap.score,
      closestLeakPct:
        snap.closestLeakPct === null ? null : Math.round(snap.closestLeakPct),
      mode: data.mode,
    });
    assertNoSpoilers(card);
    const shareText = formatShareText(card);

    this.add
      .text(width / 2, height * 0.3, shareText, {
        fontFamily: "Manrope, sans-serif",
        fontSize: "20px",
        color: "#e8dcc8",
        align: "center",
      })
      .setOrigin(0.5)
      .setName("shareCardText");

    if (!cleared && snap.failReason) {
      this.add
        .text(width / 2, height * 0.44, snap.failReason, {
          fontFamily: "Manrope, sans-serif",
          fontSize: "16px",
          color: "#fda4af",
        })
        .setOrigin(0.5);
    }

    const near =
      snap.closestLeakPct === null
        ? "No near-miss this run"
        : `Closest leak pressure: ${snap.closestLeakPct.toFixed(0)}% path left`;
    this.add
      .text(width / 2, height * 0.5, near, {
        fontFamily: "Manrope, sans-serif",
        fontSize: "16px",
        color: "#a8b5a0",
      })
      .setOrigin(0.5);

    if (
      canShowAd("interstitial", {
        waveActive: false,
        screen: "result",
        adsMode: "test",
      })
    ) {
      this.add
        .text(width / 2, height * 0.56, "[test interstitial slot]", {
          fontFamily: "Manrope, sans-serif",
          fontSize: "12px",
          color: "#78716c",
        })
        .setOrigin(0.5)
        .setName("adSlot");
    }

    this.button(width / 2, height * 0.66, "Copy share card", async () => {
      try {
        await navigator.clipboard.writeText(shareText);
      } catch {
        /* ignore */
      }
    });

    this.button(width / 2, height * 0.76, "Play again", () => {
      const { dateKey, seed } = dailySeed();
      let attempts = loadAttempts(dateKey);
      const started = beginAttempt(attempts);
      attempts = started.state;
      saveAttempts(attempts);
      this.scene.start("play", {
        seed,
        dateKey,
        mode: started.mode,
        attemptNumber: started.attemptNumber,
      });
    });

    this.button(width / 2, height * 0.86, "Home", () => {
      this.scene.start("home");
    });

    const attempts = loadAttempts(data.dateKey);
    const left = remainingOfficialAttempts(attempts);
    const next = modeForNextAttempt(attempts);
    this.add
      .text(
        width / 2,
        height * 0.94,
        next === "practice"
          ? "Further runs today are Practice"
          : `Official attempts left today: ${left}`,
        {
          fontFamily: "Manrope, sans-serif",
          fontSize: "14px",
          color: "#a8b5a0",
        },
      )
      .setOrigin(0.5);

    const status = document.getElementById("build-status");
    if (status) {
      status.textContent = "Result scene ready";
      status.setAttribute("data-ready", "true");
    }
  }

  private button(x: number, y: number, label: string, onClick: () => void): void {
    const btn = this.add
      .text(x, y, label, {
        fontFamily: "Manrope, sans-serif",
        fontSize: "20px",
        color: "#0b3d3a",
        backgroundColor: "#e8dcc8",
        padding: { x: 18, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    btn.on("pointerdown", onClick);
  }
}
