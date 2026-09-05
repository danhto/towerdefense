import {
  buildSpawnSchedule,
  type EnemyKind,
  type SpawnEvent,
} from "../daily/seed";
import {
  canAfford,
  createEconomy,
  earn,
  spend,
  type EconomyState,
} from "../systems/economy";
import {
  applyLeak,
  createLives,
  type LivesState,
} from "../systems/lives";
import { ENEMY_STATS } from "./enemies";
import {
  harborPathWorld,
  isBuildable,
  TILE,
  worldToTile,
} from "./map";
import {
  pathLength,
  pointAtDistance,
  progressAlongPath,
  type Point,
} from "./path";
import {
  sellRefund,
  TOWER_DEFS,
  type TowerKind,
} from "./towers";

export type MatchPhase = "build" | "wave" | "won" | "lost";

export interface PlacedTower {
  id: number;
  kind: TowerKind;
  col: number;
  row: number;
  x: number;
  y: number;
  cooldownMs: number;
}

export interface SimEnemy {
  id: number;
  kind: EnemyKind;
  hp: number;
  maxHp: number;
  distance: number;
  slowUntilMs: number;
  alive: boolean;
}

export interface MatchConfig {
  seed: number;
  dateKey: string;
  mode: "official" | "practice";
  attemptNumber: number;
  startingGold?: number;
  startingLives?: number;
  waveCount?: number;
}

export interface MatchSnapshot {
  phase: MatchPhase;
  gold: number;
  lives: number;
  waveIndex: number;
  waveCount: number;
  score: number;
  kills: number;
  /** Remaining path % at closest approach to exit (lower = closer). */
  closestLeakPct: number | null;
  failReason: string | null;
  elapsedMs: number;
  towers: PlacedTower[];
  enemies: SimEnemy[];
  selectedTowerKind: TowerKind;
}

export class MatchSim {
  readonly path: Point[];
  readonly pathLen: number;
  readonly schedule: SpawnEvent[];
  readonly waveCount: number;
  readonly dateKey: string;
  readonly mode: "official" | "practice";
  readonly attemptNumber: number;
  readonly seed: number;

  private economy: EconomyState;
  private lives: LivesState;
  private phase: MatchPhase = "build";
  private waveIndex = 0;
  private waveTimeMs = 0;
  private elapsedMs = 0;
  private nextTowerId = 1;
  private nextEnemyId = 1;
  private towers: PlacedTower[] = [];
  private enemies: SimEnemy[] = [];
  private spawnCursor = 0;
  private score = 0;
  private kills = 0;
  private closestLeakPct: number | null = null;
  private failReason: string | null = null;
  private selectedTowerKind: TowerKind = "bolt";
  private wavesCleared = 0;

  constructor(config: MatchConfig) {
    this.seed = config.seed;
    this.dateKey = config.dateKey;
    this.mode = config.mode;
    this.attemptNumber = config.attemptNumber;
    this.waveCount = config.waveCount ?? 8;
    this.path = harborPathWorld();
    this.pathLen = pathLength(this.path);
    this.schedule = buildSpawnSchedule(config.seed, this.waveCount);
    this.economy = createEconomy(config.startingGold ?? 140);
    this.lives = createLives(config.startingLives ?? 3);
  }

  snapshot(): MatchSnapshot {
    return {
      phase: this.phase,
      gold: this.economy.gold,
      lives: this.lives.lives,
      waveIndex: this.waveIndex,
      waveCount: this.waveCount,
      score: this.score,
      kills: this.kills,
      closestLeakPct: this.closestLeakPct,
      failReason: this.failReason,
      elapsedMs: this.elapsedMs,
      towers: this.towers.map((t) => ({ ...t })),
      enemies: this.enemies.filter((e) => e.alive).map((e) => ({ ...e })),
      selectedTowerKind: this.selectedTowerKind,
    };
  }

  selectTowerKind(kind: TowerKind): void {
    this.selectedTowerKind = kind;
  }

  canPlaceAt(col: number, row: number): boolean {
    if (this.phase === "won" || this.phase === "lost") return false;
    if (!isBuildable(col, row)) return false;
    if (this.towers.some((t) => t.col === col && t.row === row)) return false;
    return canAfford(this.economy, TOWER_DEFS[this.selectedTowerKind].cost);
  }

  tryPlaceAtWorld(x: number, y: number): boolean {
    const tile = worldToTile(x, y);
    return this.tryPlaceAt(tile.x, tile.y);
  }

  tryPlaceAt(col: number, row: number): boolean {
    if (!this.canPlaceAt(col, row)) return false;
    const def = TOWER_DEFS[this.selectedTowerKind];
    this.economy = spend(this.economy, def.cost);
    this.towers.push({
      id: this.nextTowerId++,
      kind: def.kind,
      col,
      row,
      x: col * TILE + TILE / 2,
      y: row * TILE + TILE / 2,
      cooldownMs: 0,
    });
    return true;
  }

  trySellAt(col: number, row: number): boolean {
    if (this.phase === "won" || this.phase === "lost") return false;
    const idx = this.towers.findIndex((t) => t.col === col && t.row === row);
    if (idx < 0) return false;
    const tower = this.towers[idx]!;
    this.economy = earn(this.economy, sellRefund(TOWER_DEFS[tower.kind].cost));
    this.towers.splice(idx, 1);
    return true;
  }

  startWave(): boolean {
    if (this.phase !== "build") return false;
    if (this.waveIndex >= this.waveCount) return false;
    this.phase = "wave";
    this.waveTimeMs = 0;
    this.spawnCursor = this.schedule.findIndex((e) => e.waveIndex === this.waveIndex);
    if (this.spawnCursor < 0) this.spawnCursor = this.schedule.length;
    return true;
  }

  tick(dtMs: number): MatchSnapshot {
    if (this.phase === "won" || this.phase === "lost") return this.snapshot();

    const dt = Math.max(0, dtMs);
    this.elapsedMs += dt;

    if (this.phase === "wave") {
      this.waveTimeMs += dt;
      this.spawnDue();
      const lost = this.moveEnemies(dt);
      if (lost) return this.snapshot();
      this.fireTowers(dt);
      this.cleanupDead();
      this.checkWaveEnd();
    }

    return this.snapshot();
  }

  enemyWorldPos(enemy: SimEnemy): Point {
    return pointAtDistance(this.path, enemy.distance);
  }

  private spawnDue(): void {
    while (this.spawnCursor < this.schedule.length) {
      const ev = this.schedule[this.spawnCursor]!;
      if (ev.waveIndex !== this.waveIndex) break;
      if (ev.timeMs > this.waveTimeMs) break;
      const stats = ENEMY_STATS[ev.kind];
      this.enemies.push({
        id: this.nextEnemyId++,
        kind: ev.kind,
        hp: stats.hp,
        maxHp: stats.hp,
        distance: 0,
        slowUntilMs: 0,
        alive: true,
      });
      this.spawnCursor += 1;
    }
  }

  /** @returns true if the match was lost during movement */
  private moveEnemies(dtMs: number): boolean {
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const stats = ENEMY_STATS[enemy.kind];
      const slowed = this.elapsedMs < enemy.slowUntilMs;
      const speed = stats.speed * (slowed ? 0.55 : 1);
      enemy.distance += (speed * dtMs) / 1000;

      const progress = progressAlongPath(this.path, enemy.distance);
      const remainingPct = (1 - progress) * 100;
      if (remainingPct <= 15) {
        if (this.closestLeakPct === null || remainingPct < this.closestLeakPct) {
          this.closestLeakPct = Math.max(0, remainingPct);
        }
      }

      if (enemy.distance >= this.pathLen) {
        enemy.alive = false;
        this.onLeak(enemy);
        if (this.phase === "lost") return true;
      }
    }
    return false;
  }

  private onLeak(enemy: SimEnemy): void {
    const result = applyLeak(this.lives, 1);
    this.lives = result.state;
    this.failReason = `${enemy.kind} reached the harbor gate`;
    if (result.outcome === "fail") {
      this.phase = "lost";
    }
  }

  private fireTowers(dtMs: number): void {
    for (const tower of this.towers) {
      tower.cooldownMs = Math.max(0, tower.cooldownMs - dtMs);
      if (tower.cooldownMs > 0) continue;
      const def = TOWER_DEFS[tower.kind];
      const target = this.findTarget(tower.x, tower.y, def.range);
      if (!target) continue;
      tower.cooldownMs = def.fireIntervalMs;
      this.dealDamage(target, def.damage, def.splashRadius, def.slowFactor);
    }
  }

  private findTarget(x: number, y: number, range: number): SimEnemy | null {
    let best: SimEnemy | null = null;
    let bestAlong = -1;
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const pos = pointAtDistance(this.path, enemy.distance);
      const d = Math.hypot(pos.x - x, pos.y - y);
      if (d <= range && enemy.distance > bestAlong) {
        best = enemy;
        bestAlong = enemy.distance;
      }
    }
    return best;
  }

  private dealDamage(
    primary: SimEnemy,
    damage: number,
    splash: number,
    slowFactor: number,
  ): void {
    const applyHit = (enemy: SimEnemy) => {
      if (!enemy.alive) return;
      enemy.hp -= damage;
      if (slowFactor < 1) {
        enemy.slowUntilMs = this.elapsedMs + 900;
      }
      if (enemy.hp <= 0) {
        enemy.alive = false;
        this.onKill(enemy);
      }
    };

    applyHit(primary);
    if (splash <= 0) return;
    const origin = pointAtDistance(this.path, primary.distance);
    for (const enemy of this.enemies) {
      if (!enemy.alive || enemy.id === primary.id) continue;
      const pos = pointAtDistance(this.path, enemy.distance);
      if (Math.hypot(pos.x - origin.x, pos.y - origin.y) <= splash) {
        applyHit(enemy);
      }
    }
  }

  private onKill(enemy: SimEnemy): void {
    const bounty = ENEMY_STATS[enemy.kind].bounty;
    this.economy = earn(this.economy, bounty);
    this.kills += 1;
    this.score += bounty * 10 + Math.floor(enemy.maxHp);
  }

  private cleanupDead(): void {
    this.enemies = this.enemies.filter((e) => e.alive);
  }

  private checkWaveEnd(): void {
    if (this.phase !== "wave") return;
    const pending = this.schedule.some(
      (e, i) => i >= this.spawnCursor && e.waveIndex === this.waveIndex,
    );
    if (pending) return;
    if (this.enemies.some((e) => e.alive)) return;

    this.wavesCleared += 1;
    this.waveIndex += 1;
    this.score += 100 * this.wavesCleared;
    if (this.waveIndex >= this.waveCount) {
      this.phase = "won";
      this.failReason = null;
      return;
    }
    this.phase = "build";
    this.economy = earn(this.economy, 25);
  }
}
