# Gate status — Daily Hold

Living checklist against [testing-and-metrics.md](./testing-and-metrics.md). Update when a gate’s must-pass items go green.

| Gate | Status | Notes |
|------|--------|-------|
| **G0** Docs aligned | **DONE** | Product target, metrics, engineering, CI docs |
| **G1** Core loop | **DONE** | Pure `MatchSim` + Play/Result scenes; path/place/wave/leak/win-lose covered by unit + e2e |
| **G2** Daily + share UI | **DONE** | UTC seed, 3-attempt gate (localStorage), typographic share card + PNG image on result; Practice after 3 |
| **G3** Near-miss juice | **DONE** | Closest-leak %, `nearMiss` zone + banner/shake/pulse, fail reason with enemy type, `enemy_near_miss` events |
| **G4** Practice + ads | **DONE** | Practice home labeling; rate-capped interstitial; rewarded tip in Practice; remove-ads + consent; mid-wave banner blocked |
| **G5** Playtest board | **HARNESS READY** | Template + e2e Practice gate; **needs 5–10 human testers** for P-metrics |
| **G6** Soft-launch | **CODE READY** | Analytics bus, error stub, balance stamp, consent UI; see [soft-launch.md](./soft-launch.md) |

## Major decisions (locked)

Change only with a change-log entry.

1. **Web-first PWA** (Vite + Phaser 3 + TS) → GitHub Pages; Capacitor later for stores.
2. **Simulation is pure TypeScript** (`src/game/sim/*`). Phaser scenes only render/input — keeps Vitest honest.
3. **Editorial Soft Defense palette** in CSS + `src/game/theme/palette.ts` (teal / coral / amber / sage / sand). Geometric placeholders until art pass.
4. **Three towers:** Amber Bolt (single), Mint/Cyan Brine (slow), Coral Burst (AoE) — color = role (P11); brine stays cyan so it reads on teal grass.
5. **One winding harbor path** map; buildable tiles off-path.
6. **Official daily:** UTC seed, 3 attempts (persisted in `localStorage`), then Practice; share card typographic text + PNG image (no layout spoilers).
7. **Ads:** never mid-wave; Today’s Dare never paywalled; result interstitial rate-capped; requires consent; remove-ads disables calls.
8. **MVP wave count:** 8 seeded waves per attempt (balance can tune without API changes).
9. **Autonomy rule:** Prefer metrics/gates over asking; document decisions here + change-log.
10. **Ads default off** until consent toggle — protects privacy stub (G6) even in test mode.
11. **Two tower tiers** (base + one upgrade); sell refunds invested gold.
12. **Share card image** is typographic canvas PNG (no layout spoilers).

