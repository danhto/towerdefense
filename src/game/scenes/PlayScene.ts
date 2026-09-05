import Phaser from "phaser";
import { track } from "../meta/analytics";
import { BALANCE_VERSION } from "../meta/version";
import { MatchSim, type MatchSnapshot } from "../sim/match";
import {
  MAP_COLS,
  MAP_ROWS,
  TILE,
  harborPathWorld,
  isBuildable,
  isPathTile,
} from "../sim/map";
import { ENEMY_STATS } from "../sim/enemies";
import {
  TOWER_DEFS,
  towerStats,
  upgradeCost,
  type TowerKind,
} from "../sim/towers";
import { tryShowBanner } from "../systems/adService";
import { PALETTE } from "../theme/palette";

export interface PlaySceneData {
  seed: number;
  dateKey: string;
  mode: "official" | "practice";
  attemptNumber: number;
}

export class PlayScene extends Phaser.Scene {
  private sim!: MatchSim;
  private gfx!: Phaser.GameObjects.Graphics;
  private hud!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private nearMissBanner!: Phaser.GameObjects.Text;
  private waveBtn!: Phaser.GameObjects.Text;
  private selectedKind: TowerKind = "bolt";
  private sellMode = false;
  private selectedCol: number | null = null;
  private selectedRow: number | null = null;
  private upgradeBtn!: Phaser.GameObjects.Text;
  private ended = false;
  private nearMissPulse = 0;
  private lastNearMissActive = false;
  private bannerShownForWave = false;

  constructor() {
    super("play");
  }

  init(data: PlaySceneData): void {
    this.ended = false;
    this.sellMode = false;
    this.selectedCol = null;
    this.selectedRow = null;
    this.selectedKind = "bolt";
    this.nearMissPulse = 0;
    this.lastNearMissActive = false;
    this.bannerShownForWave = false;
    this.sim = new MatchSim({
      seed: data.seed,
      dateKey: data.dateKey,
      mode: data.mode,
      attemptNumber: data.attemptNumber,
      waveCount: 8,
      startingGold: 110,
      startingLives: 3,
    });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PALETTE.seaTealDeep);
    this.gfx = this.add.graphics();
    this.drawBoard();

    const mapBottom = MAP_ROWS * TILE;
    const chromePad = 16;

    this.hud = this.add
      .text(chromePad, 12, "", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "16px",
        color: "#f8faf9",
        lineSpacing: 4,
      })
      .setDepth(20);

    this.nearMissBanner = this.add
      .text(360, MAP_ROWS * TILE * 0.42, "NEAR MISS", {
        fontFamily: "Fraunces, Georgia, serif",
        fontSize: "36px",
        color: "#fda4af",
        stroke: "#0b3d3a",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(30)
      .setAlpha(0)
      .setName("nearMissBanner");

    this.waveBtn = this.add
      .text(720 - chromePad, mapBottom + 14, "Start wave", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "17px",
        color: "#0b3d3a",
        backgroundColor: "#e8dcc8",
        padding: { x: 16, y: 10 },
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(20)
      .setName("startWaveBtn");

    this.buildTowerBar();

    // Hint sits under the action row so it never fights Start wave / tower chips.
    this.hint = this.add
      .text(chromePad, mapBottom + 112, "", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "13px",
        color: "#e8dcc8",
        wordWrap: { width: 688 },
      })
      .setDepth(20);

    this.waveBtn.on("pointerdown", () => {
      this.sim.startWave();
      this.refreshHud(this.sim.snapshot());
      this.emitSimEvents();
    });

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.y >= MAP_ROWS * TILE) return;
      const col = Math.floor(pointer.x / TILE);
      const row = Math.floor(pointer.y / TILE);
      if (this.sellMode) {
        this.sim.trySellAt(col, row);
        this.selectedCol = null;
        this.selectedRow = null;
      } else {
        const occupied = this.sim.snapshot().towers.some(
          (t) => t.col === col && t.row === row,
        );
        if (occupied) {
          this.selectedCol = col;
          this.selectedRow = row;
        } else {
          this.sim.selectTowerKind(this.selectedKind);
          if (this.sim.tryPlaceAtWorld(pointer.x, pointer.y)) {
            this.selectedCol = col;
            this.selectedRow = row;
          }
        }
      }
      this.refreshHud(this.sim.snapshot());
      this.emitSimEvents();
    });

    // Banners only between waves / build — never mid-wave (T7).
    tryShowBanner("combat", false);

    this.refreshHud(this.sim.snapshot());

    const status = document.getElementById("build-status");
    if (status) {
      status.textContent = "Play scene ready";
      status.setAttribute("data-ready", "true");
    }
  }

  update(_t: number, delta: number): void {
    if (this.ended) return;
    const snap = this.sim.tick(delta);
    this.emitSimEvents();
    this.applyNearMissJuice(snap, delta);
    this.drawDynamic(snap);
    this.refreshHud(snap);

    // Explicit mid-wave banner block (instrumentable for T7).
    if (snap.phase === "wave") {
      tryShowBanner("combat", true);
      this.bannerShownForWave = false;
    } else if (snap.phase === "build" && !this.bannerShownForWave) {
      tryShowBanner("combat", false);
      this.bannerShownForWave = true;
    }

    if (snap.phase === "won" || snap.phase === "lost") {
      this.ended = true;
      track({
        name: "attempt_end",
        result: snap.phase === "won" ? "won" : "lost",
        score: snap.score,
        closest_leak_pct: snap.closestLeakPct,
        duration_ms: snap.elapsedMs,
        attempt_n: this.sim.attemptNumber,
        balance_version: BALANCE_VERSION,
        mode: this.sim.mode,
      });
      this.scene.start("result", {
        snapshot: snap,
        dateKey: this.sim.dateKey,
        mode: this.sim.mode,
        attemptNumber: this.sim.attemptNumber,
        seed: this.sim.seed,
        balanceVersion: BALANCE_VERSION,
      });
    }
  }

  private emitSimEvents(): void {
    for (const ev of this.sim.drainEvents()) {
      if (ev.type === "near_miss") {
        track({
          name: "enemy_near_miss",
          path_pct_remaining: ev.pathPctRemaining,
          enemy_type: ev.enemyType,
        });
      } else if (ev.type === "life_lost") {
        track({
          name: "life_lost",
          enemy_type: ev.enemyType,
          path_pct: ev.pathPct,
          lives_left: ev.livesLeft,
        });
      } else if (ev.type === "tower_placed") {
        track({
          name: "tower_placed",
          tower_type: ev.towerType,
          tile: `${ev.col},${ev.row}`,
          elapsed_ms: ev.elapsedMs,
        });
      } else if (ev.type === "wave_started") {
        track({
          name: "wave_started",
          wave_index: ev.waveIndex,
          seed: this.sim.seed,
          mode: this.sim.mode,
        });
      } else if (ev.type === "tower_upgraded") {
        track({
          name: "tower_placed",
          tower_type: `${ev.towerType}_t${ev.tier}`,
          tile: `${ev.col},${ev.row}`,
          elapsed_ms: this.sim.snapshot().elapsedMs,
        });
      }
    }
  }

  private applyNearMissJuice(snap: MatchSnapshot, delta: number): void {
    if (snap.nearMissActive) {
      this.nearMissPulse = Math.min(1, this.nearMissPulse + delta / 280);
      if (!this.lastNearMissActive) {
        this.cameras.main.shake(220, 0.006);
        this.tweens.add({
          targets: this.nearMissBanner,
          alpha: { from: 0, to: 1 },
          scale: { from: 0.85, to: 1.05 },
          duration: 180,
          yoyo: true,
          hold: 420,
          ease: "Sine.easeOut",
        });
      }
    } else {
      this.nearMissPulse = Math.max(0, this.nearMissPulse - delta / 400);
      if (this.nearMissBanner.alpha > 0 && !this.tweens.isTweening(this.nearMissBanner)) {
        this.nearMissBanner.setAlpha(0);
      }
    }
    this.lastNearMissActive = snap.nearMissActive;
  }

  private buildTowerBar(): void {
    const mapBottom = MAP_ROWS * TILE;
    const rowY = mapBottom + 58;
    const labels: Record<TowerKind, string> = {
      bolt: "Bolt",
      brine: "Brine",
      burst: "Burst",
    };
    const gap = 12;
    let x = 16;

    (Object.keys(TOWER_DEFS) as TowerKind[]).forEach((kind) => {
      const def = TOWER_DEFS[kind];
      const hex = `#${def.color.toString(16).padStart(6, "0")}`;
      const btn = this.add
        .text(x, rowY, `${labels[kind]} $${def.cost}`, {
          fontFamily: "Manrope, sans-serif",
          fontSize: "14px",
          fontStyle: "700",
          color: "#0b3d3a",
          backgroundColor: hex,
          padding: { x: 12, y: 10 },
        })
        .setInteractive({ useHandCursor: true })
        .setDepth(20)
        .setName(`tower-${kind}`);
      btn.on("pointerdown", () => {
        this.selectedKind = kind;
        this.sellMode = false;
        this.selectedCol = null;
        this.selectedRow = null;
        this.sim.selectTowerKind(kind);
        this.refreshHud(this.sim.snapshot());
      });
      x += btn.width + gap;
    });

    // Push Sell / Upgrade to the right with clear separation from tower chips.
    const sell = this.add
      .text(448, rowY, "Sell", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "14px",
        fontStyle: "700",
        color: "#f8faf9",
        backgroundColor: "#57534e",
        padding: { x: 14, y: 10 },
      })
      .setInteractive({ useHandCursor: true })
      .setDepth(20)
      .setName("sellBtn");
    sell.on("pointerdown", () => {
      this.sellMode = true;
      this.selectedCol = null;
      this.selectedRow = null;
      this.refreshHud(this.sim.snapshot());
    });

    this.upgradeBtn = this.add
      .text(sell.x + sell.width + gap, rowY, "Upgrade", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "14px",
        fontStyle: "700",
        color: "#0b3d3a",
        backgroundColor: "#e8dcc8",
        padding: { x: 14, y: 10 },
      })
      .setInteractive({ useHandCursor: true })
      .setDepth(20)
      .setName("upgradeBtn")
      .setVisible(false);
    this.upgradeBtn.on("pointerdown", () => {
      if (this.selectedCol === null || this.selectedRow === null) return;
      if (this.sim.tryUpgradeAt(this.selectedCol, this.selectedRow)) {
        this.refreshHud(this.sim.snapshot());
        this.emitSimEvents();
      }
    });
  }

  private drawBoard(): void {
    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        const x = col * TILE;
        const y = row * TILE;
        if (isPathTile(col, row)) this.gfx.fillStyle(PALETTE.path, 1);
        else if (isBuildable(col, row)) this.gfx.fillStyle(PALETTE.buildable, 1);
        else this.gfx.fillStyle(PALETTE.blocked, 1);
        this.gfx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
      }
    }
    const path = harborPathWorld();
    this.gfx.lineStyle(6, PALETTE.sand, 0.9);
    this.gfx.beginPath();
    this.gfx.moveTo(path[0]!.x, path[0]!.y);
    for (let i = 1; i < path.length; i++) {
      this.gfx.lineTo(path[i]!.x, path[i]!.y);
    }
    this.gfx.strokePath();
  }

  private drawDynamic(snap: MatchSnapshot): void {
    this.gfx.clear();
    this.drawBoard();

    for (const tower of snap.towers) {
      const def = towerStats(tower.kind, tower.tier);
      const selected =
        this.selectedCol === tower.col && this.selectedRow === tower.row;
      const radius = tower.tier >= 2 ? 18 : 16;
      this.gfx.fillStyle(def.color, 1);
      this.gfx.fillCircle(tower.x, tower.y, radius);
      // Always stroke towers so mint/teal never vanish into grass.
      this.gfx.lineStyle(3, PALETTE.foam, 0.95);
      this.gfx.strokeCircle(tower.x, tower.y, radius + 1);
      if (tower.tier >= 2) {
        this.gfx.lineStyle(3, PALETTE.amber, 0.95);
        this.gfx.strokeCircle(tower.x, tower.y, radius + 5);
      }
      if (selected) {
        this.gfx.lineStyle(2, PALETTE.sand, 1);
        this.gfx.strokeCircle(tower.x, tower.y, radius + 9);
      }
      this.gfx.lineStyle(1, PALETTE.foam, 0.28);
      this.gfx.strokeCircle(tower.x, tower.y, def.range);
    }

    for (const enemy of snap.enemies) {
      const pos = this.sim.enemyWorldPos(enemy);
      const stats = ENEMY_STATS[enemy.kind];
      this.gfx.fillStyle(stats.color, 1);
      this.gfx.fillCircle(pos.x, pos.y, enemy.kind === "tank" ? 14 : 10);
      if (enemy.nearMiss) {
        const pulseR = 18 + this.nearMissPulse * 10;
        this.gfx.lineStyle(3, PALETTE.coral, 0.55 + this.nearMissPulse * 0.4);
        this.gfx.strokeCircle(pos.x, pos.y, pulseR);
      }
      const ratio = Math.max(0, enemy.hp / enemy.maxHp);
      this.gfx.fillStyle(PALETTE.coral, 1);
      this.gfx.fillRect(pos.x - 12, pos.y - 18, 24 * ratio, 3);
    }
  }

  private refreshHud(snap: MatchSnapshot): void {
    const waveLabel = Math.min(snap.waveIndex + 1, snap.waveCount);
    const modeTag = snap.mode === "practice" ? " · PRACTICE" : "";
    const selected =
      this.selectedCol !== null && this.selectedRow !== null
        ? snap.towers.find(
            (t) => t.col === this.selectedCol && t.row === this.selectedRow,
          )
        : undefined;
    let modeLine: string;
    if (this.sellMode) {
      modeLine = "SELL mode — tap a tower";
    } else if (selected) {
      const stats = towerStats(selected.kind, selected.tier);
      const next = upgradeCost(selected.kind, selected.tier);
      modeLine =
        next === null
          ? `Selected ${stats.name} (max tier)`
          : `Selected ${stats.name} — upgrade $${next}`;
    } else {
      modeLine = `Place: ${TOWER_DEFS[this.selectedKind].name}`;
    }
    this.hud.setText(
      [
        `${snap.phase.toUpperCase()}  Wave ${waveLabel}/${snap.waveCount}${modeTag}`,
        `Gold ${snap.gold}   Lives ${snap.lives}   Score ${snap.score}`,
        modeLine,
      ].join("\n"),
    );
    this.hint.setText(
      snap.nearMissActive
        ? "Near miss — stop them at the harbor gate!"
        : "Tap grass to place · select a tower to upgrade · Start wave when ready",
    );
    this.waveBtn.setVisible(snap.phase === "build");
    const canUpgrade =
      !!selected &&
      this.sim.canUpgradeAt(selected.col, selected.row) &&
      !this.sellMode;
    this.upgradeBtn.setVisible(canUpgrade);
    if (selected && upgradeCost(selected.kind, selected.tier) !== null) {
      const cost = upgradeCost(selected.kind, selected.tier)!;
      this.upgradeBtn.setText(`Upgrade $${cost}`);
    }
  }
}
