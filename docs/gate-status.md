# Gate status — Daily Hold

Living checklist against [testing-and-metrics.md](./testing-and-metrics.md). Update when a gate’s must-pass items go green.

| Gate | Status | Notes |
|------|--------|-------|
| **G0** Docs aligned | **DONE** | Product target, metrics, engineering, CI docs |
| **G1** Core loop | **DONE** | Pure `MatchSim` + Play/Result scenes; path/place/wave/leak/win-lose covered by unit + e2e |
| **G2** Daily + share UI | **MOSTLY DONE** | UTC seed, 3-attempt gate (localStorage), typographic share card on result; Practice after 3 |
| **G3** Near-miss juice | **PARTIAL** | `closestLeakPct` tracked + shown; motion juice still light |
| **G4** Practice + ads | **PARTIAL** | Practice mode via attempt gate; test interstitial slot on result only (`canShowAd`) |
| **G5** Playtest board | PENDING | Needs 5–10 human testers |
| **G6** Soft-launch | PENDING | Analytics / error reporting not wired |

## Major decisions (locked)

Change only with a change-log entry.

1. **Web-first PWA** (Vite + Phaser 3 + TS) → GitHub Pages; Capacitor later for stores.
2. **Simulation is pure TypeScript** (`src/game/sim/*`). Phaser scenes only render/input — keeps Vitest honest.
3. **Editorial Soft Defense palette** in CSS + `src/game/theme/palette.ts` (teal / coral / amber / sage / sand). Geometric placeholders until art pass.
4. **Three towers:** Amber Bolt (single), Teal Brine (slow), Coral Burst (AoE) — color = role (P11).
5. **One winding harbor path** map; buildable tiles off-path.
6. **Official daily:** UTC seed, 3 attempts (persisted in `localStorage`), then Practice; share card typographic only.
7. **Ads:** never mid-wave; Today’s Dare never paywalled; result may show a labeled test interstitial slot.
8. **MVP wave count:** 8 seeded waves per attempt (balance can tune without API changes).
9. **Autonomy rule:** Prefer metrics/gates over asking; document decisions here + change-log.
