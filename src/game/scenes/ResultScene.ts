import Phaser from "phaser";
import {
  modeForNextAttempt,
  remainingOfficialAttempts,
} from "../daily/attempts";
import { dailySeed } from "../daily/seed";
import { track } from "../meta/analytics";
import { loadAttempts, startNextAttempt } from "../meta/attemptStore";
import { BALANCE_VERSION } from "../meta/version";
import {
  assertNoSpoilers,
  buildShareCardPayload,
  formatClearTime,
  formatLoadoutHint,
  formatShareText,
} from "../share/card";
import {
  copyShareCardImage,
  downloadShareCardImage,
  shareCardToDataUrl,
} from "../share/image";
import type { MatchSnapshot } from "../sim/match";
import {
  tryShowInterstitial,
  tryShowRewarded,
} from "../systems/adService";
import { PALETTE } from "../theme/palette";

export interface ResultSceneData {
  snapshot: MatchSnapshot;
  dateKey: string;
  mode: "official" | "practice";
  attemptNumber: number;
  seed: number;
  balanceVersion?: string;
}

export class ResultScene extends Phaser.Scene {
  constructor() {
    super("result");
  }

  create(data: ResultSceneData): void {
    const { width, height } = this.scale;
    const snap = data.snapshot;
    const cleared = snap.phase === "won";
    const balance = data.balanceVersion ?? BALANCE_VERSION;

    this.cameras.main.setBackgroundColor(PALETTE.seaTealDeep);

    this.add
      .text(width / 2, height * 0.1, cleared ? "Harbor Held" : "Gate Breached", {
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
      clearTimeMs: cleared ? snap.elapsedMs : null,
      closestLeakPct:
        snap.closestLeakPct === null ? null : Math.round(snap.closestLeakPct),
      mode: data.mode,
      towerKinds: snap.towers.map((t) => t.kind),
    });
    assertNoSpoilers(card);
    const shareText = formatShareText(card);

    this.add
      .text(width / 2, height * 0.22, shareText, {
        fontFamily: "Manrope, sans-serif",
        fontSize: "18px",
        color: "#e8dcc8",
        align: "center",
      })
      .setOrigin(0.5)
      .setName("shareCardText");

    this.add
      .text(
        width / 2,
        height * 0.30,
        cleared
          ? `Clear time ${formatClearTime(snap.elapsedMs)} — faster clears score higher`
          : `Time ${formatClearTime(snap.elapsedMs)}`,
        {
          fontFamily: "Manrope, sans-serif",
          fontSize: "15px",
          color: "#e8dcc8",
        },
      )
      .setOrigin(0.5)
      .setName("clearTimeLine");

    const loadout = formatLoadoutHint(
      cleared ? "cleared" : "failed",
      snap.towers.map((t) => t.kind),
    );
    if (loadout) {
      this.add
        .text(width / 2, height * 0.335, loadout, {
          fontFamily: "Manrope, sans-serif",
          fontSize: "16px",
          color: "#a8b5a0",
        })
        .setOrigin(0.5)
        .setName("loadoutLine");
    }


    if (!cleared && snap.failReason) {
      this.add
        .text(width / 2, height * 0.34, snap.failReason, {
          fontFamily: "Manrope, sans-serif",
          fontSize: "15px",
          color: "#fda4af",
        })
        .setOrigin(0.5)
        .setName("failReason");
    }

    const near =
      snap.closestLeakPct === null
        ? "No near-miss this run"
        : `Closest leak pressure: ${snap.closestLeakPct.toFixed(0)}% path left`;
    this.add
      .text(width / 2, height * 0.39, near, {
        fontFamily: "Manrope, sans-serif",
        fontSize: "14px",
        color: "#a8b5a0",
      })
      .setOrigin(0.5)
      .setName("nearMissSummary");

    this.add
      .text(width / 2, height * 0.43, `Balance ${balance}`, {
        fontFamily: "Manrope, sans-serif",
        fontSize: "12px",
        color: "#78716c",
      })
      .setOrigin(0.5)
      .setName("balanceVersion");

    if (tryShowInterstitial("result_end")) {
      this.add
        .text(width / 2, height * 0.47, "[test interstitial slot]", {
          fontFamily: "Manrope, sans-serif",
          fontSize: "12px",
          color: "#78716c",
        })
        .setOrigin(0.5)
        .setName("adSlot");
    }

    if (data.mode === "practice") {
      const tip = this.add
        .text(width / 2, height * 0.51, "Watch tip ad (practice)", {
          fontFamily: "Manrope, sans-serif",
          fontSize: "13px",
          color: "#e8dcc8",
          backgroundColor: "#0b3d3a",
          padding: { x: 10, y: 6 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setName("rewardedTip");
      tip.on("pointerdown", () => {
        if (tryShowRewarded("practice_tip")) {
          tip.setText("Tip unlocked: focus the gate tile");
        } else {
          tip.setText("Tip unavailable (ads off / policy)");
        }
      });
    }

    try {
      const dataUrl = shareCardToDataUrl(card);
      const key = `share-card-${data.dateKey}-${data.attemptNumber}`;
      if (this.textures.exists(key)) this.textures.remove(key);
      this.textures.addBase64(key, dataUrl);
      this.time.delayedCall(80, () => {
        if (!this.textures.exists(key)) return;
        this.add
          .image(width / 2, height * 0.58, key)
          .setDisplaySize(280, 164)
          .setName("shareCardImage");
      });
    } catch {
      /* ignore */
    }

    this.button(width / 2 - 120, height * 0.72, "Copy text", async () => {
      track({ name: "share_click", surface: "result", method: "copy" });
      try {
        await navigator.clipboard.writeText(shareText);
      } catch {
        /* ignore */
      }
    });

    this.button(width / 2 + 120, height * 0.72, "Save image", () => {
      track({ name: "share_click", surface: "result", method: "native" });
      downloadShareCardImage(card);
    });

    this.button(width / 2, height * 0.80, "Copy image", async () => {
      track({ name: "share_click", surface: "result", method: "native" });
      const ok = await copyShareCardImage(card);
      if (!ok) {
        try {
          await navigator.clipboard.writeText(shareText);
        } catch {
          /* ignore */
        }
      }
    });

    this.button(width / 2 - 100, height * 0.88, "Play again", () => {
      const { dateKey, seed } = dailySeed();
      const started = startNextAttempt(dateKey);
      this.scene.start("play", {
        seed,
        dateKey,
        mode: started.mode,
        attemptNumber: started.attemptNumber,
      });
    });

    this.button(width / 2 + 100, height * 0.88, "Home", () => {
      this.scene.start("home");
    });

    const attempts = loadAttempts(data.dateKey);
    const left = remainingOfficialAttempts(attempts);
    const next = modeForNextAttempt(attempts);
    this.add
      .text(
        width / 2,
        height * 0.97,
        next === "practice"
          ? "Further runs today are Practice"
          : `Official attempts left today: ${left}`,
        {
          fontFamily: "Manrope, sans-serif",
          fontSize: "13px",
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
        fontSize: "18px",
        color: "#0b3d3a",
        backgroundColor: "#e8dcc8",
        padding: { x: 16, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    btn.on("pointerdown", onClick);
  }
}
