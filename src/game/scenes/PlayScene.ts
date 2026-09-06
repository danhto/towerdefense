import Phaser from "phaser";
import { track } from "../meta/analytics";
import { BALANCE_VERSION } from "../meta/version";
import { MatchSim, type MatchPhase, type MatchSnapshot } from "../sim/match";
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
import { formatClearTime } from "../share/card";
import {
  layoutActionBarRow,
  SELL_CHIP_TEXT,
  SELECTION_LAYOUT_INVARIANTS,
  towerChipText,
  type ChipSpec,
} from "../ui/actionBarLayout";
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
  private hudPanel!: Phaser.GameObjects.Graphics;
  private hint!: Phaser.GameObjects.Text;
  private nearMissBanner!: Phaser.GameObjects.Text;
  private waveBtn!: Phaser.GameObjects.Text;
  private selectedKind: TowerKind = "bolt";
  private readonly towerButtons = new Map<TowerKind, Phaser.GameObjects.Text>();
  private sellBtn!: Phaser.GameObjects.Text;
  private sellMode = false;
  private selectedCol: number | null = null;
  private selectedRow: number | null = null;
  private upgradeBtn!: Phaser.GameObjects.Text;
  private ended = false;
  private nearMissPulse = 0;
  private lastNearMissActive = false;
  /** Last phase handled for banner policy (transition-gated — never per-frame). */
  private lastBannerPhase: MatchPhase | null = null;
  private barSelectGfx!: Phaser.GameObjects.Graphics;
  private fxGfx!: Phaser.GameObjects.Graphics;
  private waveBanner!: Phaser.GameObjects.Text;
  private readonly shots: Array<{
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    color: number;
    lifeMs: number;
  }> = [];
  private placeHintUntil = 0;
  private placeHintText = "";

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
    this.lastBannerPhase = null;
    this.shots.length = 0;
    this.placeHintUntil = 0;
    this.placeHintText = "";
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
    this.fxGfx = this.add.graphics().setDepth(15);
    this.barSelectGfx = this.add.graphics().setDepth(19);
    this.drawBoard();

    const mapBottom = MAP_ROWS * TILE;
    const chromePad = 16;

    this.hudPanel = this.add.graphics().setDepth(19).setName("hudPanel");

    this.hud = this.add
      .text(chromePad + 12, 18, "", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "15px",
        color: "#f8faf9",
        lineSpacing: 10,
      })
      .setDepth(20)
      .setName("hudStats");

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

    this.waveBanner = this.add
      .text(360, MAP_ROWS * TILE * 0.36, "", {
        fontFamily: "Fraunces, Georgia, serif",
        fontSize: "42px",
        color: "#e8dcc8",
        stroke: "#0b3d3a",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(28)
      .setAlpha(0)
      .setName("waveBanner");

    this.buildTowerBar();

    // Hint under the single action row — keeps chrome one band, not stacked fights.
    this.hint = this.add
      .text(chromePad, mapBottom + 108, "", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "13px",
        color: "#e8dcc8",
        wordWrap: { width: 688 },
      })
      .setDepth(20);
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
            this.flashPlacement(col, row, true);
          } else {
            this.flashPlacement(col, row, false);
            this.placeHintText = isBuildable(col, row)
              ? "Need more gold — or tile already held"
              : "Path and walls are off-limits";
            this.placeHintUntil = this.time.now + 900;
            this.cameras.main.shake(90, 0.0025);
          }
        }
      }
      this.refreshHud(this.sim.snapshot());
      this.emitSimEvents();
    });

    // Initial build-phase banner once. Mid-wave blocks are transition-gated in update.
    tryShowBanner("combat", false);
    this.lastBannerPhase = "build";

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
    this.tickShots(delta);
    this.drawDynamic(snap);
    this.refreshHud(snap);
    this.gateCombatBanner(snap.phase);

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
        this.showWaveStart(ev.waveIndex + 1);
      } else if (ev.type === "tower_upgraded") {
        track({
          name: "tower_upgraded",
          tower_type: ev.towerType,
          tier: ev.tier,
          tile: `${ev.col},${ev.row}`,
          elapsed_ms: this.sim.snapshot().elapsedMs,
        });
        this.flashPlacement(ev.col, ev.row, true);
      } else if (ev.type === "tower_fired") {
        this.shots.push({
          fromX: ev.fromX,
          fromY: ev.fromY,
          toX: ev.toX,
          toY: ev.toY,
          color: ev.color,
          lifeMs: 140,
        });
      }
    }
  }

  /**
   * Banner policy only on phase transitions — never per-frame mid-wave
   * (avoids flooding analytics with mid_wave blocks).
   */
  private gateCombatBanner(phase: MatchPhase): void {
    if (phase === this.lastBannerPhase) return;
    this.lastBannerPhase = phase;
    if (phase === "wave") {
      tryShowBanner("combat", true);
    } else if (phase === "build") {
      tryShowBanner("combat", false);
    }
  }

  private showWaveStart(waveNumber: number): void {
    this.waveBanner.setText(`Wave ${waveNumber}`);
    this.waveBanner.setAlpha(0).setScale(0.92);
    this.tweens.killTweensOf(this.waveBanner);
    this.tweens.add({
      targets: this.waveBanner,
      alpha: { from: 0, to: 1 },
      scale: { from: 0.92, to: 1.04 },
      duration: 220,
      yoyo: true,
      hold: 380,
      ease: "Sine.easeOut",
    });
  }

  private flashPlacement(col: number, row: number, ok: boolean): void {
    const cx = col * TILE + TILE / 2;
    const cy = row * TILE + TILE / 2;
    const ring = this.add.graphics().setDepth(16);
    const color = ok ? PALETTE.sand : PALETTE.coral;
    ring.lineStyle(3, color, 0.95);
    ring.strokeCircle(cx, cy, TILE * 0.35);
    this.tweens.add({
      targets: ring,
      alpha: 0,
      duration: ok ? 280 : 360,
      onUpdate: () => {
        ring.clear();
        const t = 1 - ring.alpha;
        ring.lineStyle(3, color, 0.95 * ring.alpha);
        ring.strokeCircle(cx, cy, TILE * (0.35 + t * 0.45));
      },
      onComplete: () => ring.destroy(),
    });
  }

  private tickShots(delta: number): void {
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const shot = this.shots[i]!;
      shot.lifeMs -= delta;
      if (shot.lifeMs <= 0) this.shots.splice(i, 1);
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
    const rowY = mapBottom + 52;
    const { fontSizePx, paddingX, paddingY, minGapPx } =
      SELECTION_LAYOUT_INVARIANTS;
    const gap = Math.max(14, minGapPx);

    this.towerButtons.clear();
    const chipSpecs: ChipSpec[] = [];

    (Object.keys(TOWER_DEFS) as TowerKind[]).forEach((kind) => {
      const def = TOWER_DEFS[kind];
      const hex = `#${def.color.toString(16).padStart(6, "0")}`;
      // Label is fixed forever — selection must not append markers or grow type.
      const btn = this.add
        .text(0, rowY, towerChipText(kind, def.cost), {
          fontFamily: "Manrope, sans-serif",
          fontSize: `${fontSizePx}px`,
          fontStyle: "700",
          color: "#0b3d3a",
          backgroundColor: hex,
          padding: { x: paddingX, y: paddingY },
        })
        .setInteractive({ useHandCursor: true })
        .setDepth(20)
        .setName(`tower-${kind}`)
        .setOrigin(0, 0);
      btn.on("pointerdown", () => {
        this.selectedKind = kind;
        this.sellMode = false;
        this.selectedCol = null;
        this.selectedRow = null;
        this.sim.selectTowerKind(kind);
        this.refreshTowerBarSelection();
        this.refreshHud(this.sim.snapshot());
      });
      this.towerButtons.set(kind, btn);
      chipSpecs.push({ id: `tower-${kind}`, width: btn.width, height: btn.height });
    });

    this.sellBtn = this.add
      .text(0, rowY, SELL_CHIP_TEXT, {
        fontFamily: "Manrope, sans-serif",
        fontSize: `${fontSizePx}px`,
        fontStyle: "700",
        color: "#f8faf9",
        backgroundColor: "#57534e",
        padding: { x: paddingX, y: paddingY },
      })
      .setInteractive({ useHandCursor: true })
      .setDepth(20)
      .setName("sellBtn")
      .setOrigin(0, 0);
    this.sellBtn.on("pointerdown", () => {
      this.sellMode = true;
      this.selectedCol = null;
      this.selectedRow = null;
      this.refreshTowerBarSelection();
      this.refreshHud(this.sim.snapshot());
    });
    chipSpecs.push({
      id: "sell",
      width: this.sellBtn.width,
      height: this.sellBtn.height,
    });

    // Upgrade sits after Sell; visibility toggles — slot reserved so layout stays stable.
    this.upgradeBtn = this.add
      .text(0, rowY, "Upgrade $00", {
        fontFamily: "Manrope, sans-serif",
        fontSize: `${fontSizePx}px`,
        fontStyle: "700",
        color: "#0b3d3a",
        backgroundColor: "#e8dcc8",
        padding: { x: paddingX, y: paddingY },
      })
      .setInteractive({ useHandCursor: true })
      .setDepth(20)
      .setName("upgradeBtn")
      .setOrigin(0, 0)
      .setVisible(false);
    this.upgradeBtn.on("pointerdown", () => {
      if (this.selectedCol === null || this.selectedRow === null) return;
      if (this.sim.tryUpgradeAt(this.selectedCol, this.selectedRow)) {
        this.refreshHud(this.sim.snapshot());
        this.emitSimEvents();
      }
    });
    chipSpecs.push({
      id: "upgrade",
      width: this.upgradeBtn.width,
      height: this.upgradeBtn.height,
    });

    this.waveBtn = this.add
      .text(0, rowY, "Start wave", {
        fontFamily: "Manrope, sans-serif",
        fontSize: `${fontSizePx}px`,
        fontStyle: "700",
        color: "#0b3d3a",
        backgroundColor: "#e8dcc8",
        padding: { x: paddingX, y: paddingY },
      })
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(20)
      .setName("startWaveBtn");
    this.waveBtn.on("pointerdown", () => {
      this.sim.startWave();
      this.refreshHud(this.sim.snapshot());
      this.emitSimEvents();
    });

    const rects = layoutActionBarRow({
      chips: chipSpecs,
      startX: 16,
      rowY,
      gap,
      canvasWidth: 720,
      rightChip: {
        id: "start-wave",
        width: this.waveBtn.width,
        height: this.waveBtn.height,
      },
    });

    for (const kind of Object.keys(TOWER_DEFS) as TowerKind[]) {
      const btn = this.towerButtons.get(kind)!;
      const rect = rects.find((r) => r.id === `tower-${kind}`)!;
      btn.setPosition(rect.x, rect.y);
    }
    const sellRect = rects.find((r) => r.id === "sell")!;
    this.sellBtn.setPosition(sellRect.x, sellRect.y);
    const upRect = rects.find((r) => r.id === "upgrade")!;
    this.upgradeBtn.setPosition(upRect.x, upRect.y);
    const waveRect = rects.find((r) => r.id === "start-wave")!;
    this.waveBtn.setPosition(waveRect.x, waveRect.y);

    this.refreshTowerBarSelection();
  }

  /**
   * Highlight active place/sell chip without resizing.
   * Selection is alpha + Graphics frame — never text/scale/padding/fontSize
   * (those caused Burst to overlap Sell and ▸ to cover Sell's label).
   */
  private refreshTowerBarSelection(): void {
    const { fontSizePx, paddingX, paddingY, scale } = SELECTION_LAYOUT_INVARIANTS;
    this.barSelectGfx.clear();

    for (const kind of Object.keys(TOWER_DEFS) as TowerKind[]) {
      const btn = this.towerButtons.get(kind);
      if (!btn) continue;
      const def = TOWER_DEFS[kind];
      const hex = `#${def.color.toString(16).padStart(6, "0")}`;
      const selected = !this.sellMode && this.selectedKind === kind;
      // Keep label identical in every state so layout width never shifts.
      btn.setText(towerChipText(kind, def.cost));
      btn.setStyle({
        fontFamily: "Manrope, sans-serif",
        fontSize: `${fontSizePx}px`,
        fontStyle: "700",
        color: "#0b3d3a",
        backgroundColor: hex,
        padding: { x: paddingX, y: paddingY },
      });
      btn.setAlpha(this.sellMode ? 0.4 : selected ? 1 : 0.55);
      btn.setScale(scale);
      btn.setStroke("#000000", 0);
      if (selected) this.drawChipFrame(btn);
    }
    if (this.sellBtn) {
      const selling = this.sellMode;
      this.sellBtn.setText(SELL_CHIP_TEXT);
      this.sellBtn.setStyle({
        fontFamily: "Manrope, sans-serif",
        fontSize: `${fontSizePx}px`,
        fontStyle: "700",
        color: "#f8faf9",
        backgroundColor: selling ? "#78716c" : "#57534e",
        padding: { x: paddingX, y: paddingY },
      });
      this.sellBtn.setAlpha(selling ? 1 : 0.65);
      this.sellBtn.setScale(scale);
      this.sellBtn.setStroke("#000000", 0);
      if (selling) this.drawChipFrame(this.sellBtn);
    }
  }

  /** Sand frame drawn outside the chip — does not change chip width. */
  private drawChipFrame(btn: Phaser.GameObjects.Text): void {
    const pad = 3;
    this.barSelectGfx.lineStyle(2, PALETTE.sand, 1);
    this.barSelectGfx.strokeRoundedRect(
      btn.x - pad,
      btn.y - pad,
      btn.width + pad * 2,
      btn.height + pad * 2,
      6,
    );
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
      // Dark outer + foam inner so ice/cyan brine never vanishes into grass.
      this.gfx.lineStyle(4, PALETTE.ink, 0.95);
      this.gfx.strokeCircle(tower.x, tower.y, radius + 1);
      this.gfx.lineStyle(2, PALETTE.foam, 1);
      this.gfx.strokeCircle(tower.x, tower.y, radius - 1);
      if (tower.tier >= 2) {
        this.gfx.lineStyle(3, PALETTE.amber, 0.95);
        this.gfx.strokeCircle(tower.x, tower.y, radius + 6);
      }
      if (selected) {
        this.gfx.lineStyle(2, PALETTE.sand, 1);
        this.gfx.strokeCircle(tower.x, tower.y, radius + 10);
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

    this.fxGfx.clear();
    for (const shot of this.shots) {
      const a = Math.max(0, Math.min(1, shot.lifeMs / 140));
      this.fxGfx.lineStyle(2.5, shot.color, 0.35 + a * 0.55);
      this.fxGfx.beginPath();
      this.fxGfx.moveTo(shot.fromX, shot.fromY);
      this.fxGfx.lineTo(shot.toX, shot.toY);
      this.fxGfx.strokePath();
      this.fxGfx.fillStyle(shot.color, 0.5 + a * 0.4);
      this.fxGfx.fillCircle(shot.fromX, shot.fromY, 4 + (1 - a) * 3);
      this.fxGfx.fillStyle(PALETTE.foam, 0.55 * a);
      this.fxGfx.fillCircle(shot.toX, shot.toY, 3);
    }
  }


  private layoutHudPanel(): void {
    const bounds = this.hud.getBounds();
    const padX = 14;
    const padY = 10;
    const x = bounds.x - padX;
    const y = bounds.y - padY;
    const w = Math.max(bounds.width + padX * 2, 280);
    const h = bounds.height + padY * 2;
    this.hudPanel.clear();
    this.hudPanel.fillStyle(PALETTE.seaTealDeep, 0.92);
    this.hudPanel.fillRoundedRect(x, y, w, h, 10);
    this.hudPanel.lineStyle(2, PALETTE.sand, 0.9);
    this.hudPanel.strokeRoundedRect(x, y, w, h, 10);
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
    // Selection chrome lives on the action-bar chips — no mirror text in the HUD.
    this.hud.setText(
      [
        `${snap.phase.toUpperCase()}   WAVE  ${waveLabel}/${snap.waveCount}${modeTag}`,
        `GOLD  ${snap.gold}     LIVES  ${snap.lives}     SCORE  ${snap.score}`,
        formatClearTime(snap.elapsedMs),
      ].join("\n"),
    );
    this.layoutHudPanel();
    const hintActive = this.time.now < this.placeHintUntil;
    this.hint.setText(
      hintActive
        ? this.placeHintText
        : snap.nearMissActive
          ? "Near miss — stop them at the harbor gate!"
          : "Tap grass to place · select a tower to upgrade · Start wave when ready",
    );
    this.hint.setColor(hintActive ? "#fda4af" : "#e8dcc8");
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
