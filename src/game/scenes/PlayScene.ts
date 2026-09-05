import Phaser from "phaser";
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
import { TOWER_DEFS, type TowerKind } from "../sim/towers";
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
  private waveBtn!: Phaser.GameObjects.Text;
  private selectedKind: TowerKind = "bolt";
  private sellMode = false;
  private ended = false;

  constructor() {
    super("play");
  }

  init(data: PlaySceneData): void {
    this.ended = false;
    this.sellMode = false;
    this.selectedKind = "bolt";
    this.sim = new MatchSim({
      seed: data.seed,
      dateKey: data.dateKey,
      mode: data.mode,
      attemptNumber: data.attemptNumber,
      waveCount: 8,
      startingGold: 140,
      startingLives: 3,
    });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PALETTE.seaTealDeep);
    this.gfx = this.add.graphics();
    this.drawBoard();

    this.hud = this.add
      .text(12, 8, "", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "16px",
        color: "#f8faf9",
      })
      .setDepth(20);

    this.hint = this.add
      .text(12, MAP_ROWS * TILE + 8, "", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "14px",
        color: "#e8dcc8",
        wordWrap: { width: 520 },
      })
      .setDepth(20);

    this.buildTowerBar();

    this.waveBtn = this.add
      .text(560, MAP_ROWS * TILE + 8, "Start wave", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "18px",
        color: "#0b3d3a",
        backgroundColor: "#e8dcc8",
        padding: { x: 12, y: 8 },
      })
      .setInteractive({ useHandCursor: true })
      .setDepth(20)
      .setName("startWaveBtn");

    this.waveBtn.on("pointerdown", () => {
      this.sim.startWave();
      this.refreshHud(this.sim.snapshot());
    });

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.y >= MAP_ROWS * TILE) return;
      if (this.sellMode) {
        const col = Math.floor(pointer.x / TILE);
        const row = Math.floor(pointer.y / TILE);
        this.sim.trySellAt(col, row);
      } else {
        this.sim.selectTowerKind(this.selectedKind);
        this.sim.tryPlaceAtWorld(pointer.x, pointer.y);
      }
      this.refreshHud(this.sim.snapshot());
    });

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
    this.drawDynamic(snap);
    this.refreshHud(snap);

    if (snap.phase === "won" || snap.phase === "lost") {
      this.ended = true;
      this.scene.start("result", {
        snapshot: snap,
        dateKey: this.sim.dateKey,
        mode: this.sim.mode,
        attemptNumber: this.sim.attemptNumber,
        seed: this.sim.seed,
      });
    }
  }

  private buildTowerBar(): void {
    (Object.keys(TOWER_DEFS) as TowerKind[]).forEach((kind, i) => {
      const def = TOWER_DEFS[kind];
      const btn = this.add
        .text(12 + i * 155, MAP_ROWS * TILE + 40, `${def.name} $${def.cost}`, {
          fontFamily: "Manrope, sans-serif",
          fontSize: "13px",
          color: "#0b3d3a",
          backgroundColor: `#${def.color.toString(16).padStart(6, "0")}`,
          padding: { x: 8, y: 6 },
        })
        .setInteractive({ useHandCursor: true })
        .setDepth(20)
        .setName(`tower-${kind}`);
      btn.on("pointerdown", () => {
        this.selectedKind = kind;
        this.sellMode = false;
        this.sim.selectTowerKind(kind);
        this.refreshHud(this.sim.snapshot());
      });
    });

    const sell = this.add
      .text(480, MAP_ROWS * TILE + 40, "Sell", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "13px",
        color: "#f8faf9",
        backgroundColor: "#78716c",
        padding: { x: 8, y: 6 },
      })
      .setInteractive({ useHandCursor: true })
      .setDepth(20)
      .setName("sellBtn");
    sell.on("pointerdown", () => {
      this.sellMode = true;
      this.refreshHud(this.sim.snapshot());
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
      const def = TOWER_DEFS[tower.kind];
      this.gfx.fillStyle(def.color, 1);
      this.gfx.fillCircle(tower.x, tower.y, 16);
      this.gfx.lineStyle(1, PALETTE.foam, 0.3);
      this.gfx.strokeCircle(tower.x, tower.y, def.range);
    }

    for (const enemy of snap.enemies) {
      const pos = this.sim.enemyWorldPos(enemy);
      const stats = ENEMY_STATS[enemy.kind];
      this.gfx.fillStyle(stats.color, 1);
      this.gfx.fillCircle(pos.x, pos.y, enemy.kind === "tank" ? 14 : 10);
      const ratio = Math.max(0, enemy.hp / enemy.maxHp);
      this.gfx.fillStyle(PALETTE.coral, 1);
      this.gfx.fillRect(pos.x - 12, pos.y - 18, 24 * ratio, 3);
    }
  }

  private refreshHud(snap: MatchSnapshot): void {
    const waveLabel = Math.min(snap.waveIndex + 1, snap.waveCount);
    this.hud.setText(
      [
        `${snap.phase.toUpperCase()}  Wave ${waveLabel}/${snap.waveCount}`,
        `Gold ${snap.gold}   Lives ${snap.lives}   Score ${snap.score}`,
        this.sellMode
          ? "SELL mode — tap a tower"
          : `Place: ${TOWER_DEFS[this.selectedKind].name}`,
      ].join("\n"),
    );
    this.hint.setText(
      "Tap teal tiles to place · Start wave when ready · Same dare for everyone today",
    );
    this.waveBtn.setVisible(snap.phase === "build");
  }
}
