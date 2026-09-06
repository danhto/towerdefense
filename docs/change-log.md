# Change log (metrics & alignment)

Use the protocol in [testing-and-metrics.md](./testing-and-metrics.md) §7. Newest entries on top.

## Template

```markdown
### YYYY-MM-DD — short title
- Goal touched: (P/T/B ids)
- Change:
- Regression pack: PASS/FAIL (notes)
- Metrics before → after:
- Alignment audit: PASS / DEVIATION (why)
- Next action:
```

---

### 2026-09-06 — First-run tour + daily-seeded path

- Goal touched: Instant comprehension (P); daily variability for pathing + enemies
- Change: Skippable 4-step first-run tutorial (persisted); IN/GATE labels + path chevrons; harbor path now generated from the daily seed (north→south) so each UTC day has a distinct route as well as spawn schedule. Classic path kept as fixture only.
- Regression pack: PASS — typecheck, 56 unit, lint, build, e2e
- Metrics before → after: path shape differs day-to-day; new players get a short coach instead of a TD manual
- Alignment audit: PASS — Wordle DNA stays on shared seed; TD needs both path + waves to vary
- Next action: Merge + Pages confirm

### 2026-09-06 — Fix tower-bar selection overlap

- Goal touched: UX chrome readability; regression guard
- Change: Selection highlight no longer grows chips (no ▸ / scale / padding bump) — alpha + thin sand stroke only; Sell label stays `Sell`. Added pure layout overlap tests so grow-on-select cannot regress.
- Regression pack: PASS — typecheck, unit, lint, build, e2e
- Metrics before → after: Burst no longer covers Sell; Sell text readable in sell mode
- Alignment audit: PASS — chrome-only; no balance change
- Next action: Merge + Pages confirm on phone

### 2026-09-06 — Selected tower chrome + share loadout hint

- Goal touched: UX place feedback; T8 share interest without spoilers
- Change: Tower bar shows clear **selected** state (▸, scale, sand stroke, dim others); share/result add loadout line like `Held with Bolt · Brine` (kinds only — no counts/placements)
- Regression pack: PASS — typecheck, 44 unit, lint, build, e2e
- Metrics before → after: players can see what they are about to place; share stays spoiler-free but more interesting
- Alignment audit: PASS — kinds ≠ layout; forbidden keys still block placements/screenshots
- Next action: Merge after CI; Pages playtest

### 2026-09-06 — Fix 4/3 practice label + clear-time share

- Goal touched: T6 attempt display; T8 share clarity
- Change: Practice share/result no longer prints **4/3** (shows `practice`); drop separate speed-bonus label — show **clear time** instead (faster still feeds score quietly)
- Regression pack: PASS — typecheck, 43 unit, lint, build, e2e
- Metrics before → after: post-game attempt math readable; share stakes stay time-based not “bonus jargon”
- Alignment audit: PASS — still spoiler-free; official limit remains 3
- Next action: Deploy + human confirm practice clear card

### 2026-09-06 — Speed score + readable HUD box

- Goal touched: P (shareable score stakes); UX readability over the field
- Change: Per-wave **speed bonus** (under-par clears after last spawn) feeds total score + share card (`speed +N`); Play HUD stats in a sand-framed teal panel with labeled GOLD/LIVES/SCORE/WAVE
- Regression pack: PASS — typecheck, 40 unit, lint, build, e2e
- Metrics before → after: front-line risk can raise share score via faster clears; HUD no longer lost on grass
- Alignment audit: PASS — share stays spoiler-free (no layout); speed is a number only
- Next action: Human playtest whether front setups feel rewarding

### 2026-09-05 — Play polish: difficulty, brine contrast, chrome spacing

- Goal touched: P11 (tower readability); balance feel; UX chrome
- Change: Harder economy/enemies/spawns (gold 110, denser packs, leaner bounties); brine → ice-sky `#bae6fd` + ink/foam double stroke; Play chrome one action row; Home/Result spacing
- Regression pack: PASS — lint, typecheck, 39 unit, build, e2e
- Metrics before → after: daily should feel tighter; brine no longer camouflaged on grass
- Alignment audit: PASS — same 8-wave daily ritual; color still maps to role
- Next action: Human playtest scoreboard (G5)

### 2026-09-05 — MVP gaps: tower upgrades + share card image

- Goal touched: MVP scope (2 upgrade tiers; share image); T8; P8/P9
- Change: Tier 1→2 upgrades with invested-gold sell refunds; PlayScene select/upgrade UX; canvas PNG share card (save/copy) on result; unit coverage
- Regression pack: PASS — lint, typecheck, 39 unit, build, 3 e2e
- Metrics before → after: MVP code gaps closed; human G5 still pending
- Alignment audit: PASS — share image remains spoiler-free (no layout)
- Next action: Enable Pages; human playtest scoreboard; real ad/analytics sinks

### 2026-09-05 — G3–G6 code completion (near-miss, ads, analytics)

- Goal touched: G3 P6/P7; G4 T7; G5 harness; G6 analytics/consent/errors; T6 e2e
- Change: Near-miss pulse/shake/banner; sim event drain → analytics; Practice home UX; `adService` rate cap + remove-ads/consent; rewarded practice tip; balance stamp; error handlers; playtest template + soft-launch checklist; e2e Practice after 3 attempts
- Regression pack: PASS — lint, typecheck, 36 unit tests, build, 3 e2e
- Metrics before → after: juice/ads/analytics stubs online; human P-metrics still pending G5
- Alignment audit: PASS — Today’s Dare never paywalled; ads default off without consent
- Next action: Enable Pages; run human playtest scoreboard; wire real ad/analytics sinks if soft-launching publicly

### 2026-09-05 — G1 core loop + G2 ritual wiring

- Goal touched: G1 must-pass; T5/T6/T7/T8; P1–P2 smoke; near-miss field for G3
- Change: Pure `MatchSim` (path, place/sell, waves, combat, lives/gold, win/lose); Play + Result scenes; home starts seeded attempts; share card copy; test ad slot post-run only; gate-status doc; unit tests for path/map/match; e2e start-attempt → play
- Regression pack: PASS — lint, typecheck, 27 unit tests, build, 2 e2e
- Metrics before → after: scaffold-only → playable harbor hold with daily attempt gate
- Alignment audit: PASS — decisions recorded in `docs/gate-status.md` (sim-first, 3 towers, 8 waves, Pages stack)
- Next action: G3 near-miss motion juice; balance pass; then G5 human playtest

### 2026-09-05 — Local DX + GitHub Actions automation

- Goal touched: T4–T8 foundations; G0→G1 scaffold; deploy path
- Change: Vite + Phaser 3 + TypeScript app; daily seed / attempts / economy / lives / ads / share modules with Vitest; Playwright smoke; `ci.yml` + `deploy.yml` (Pages); `docs/engineering.md` + platform lock
- Regression pack: PASS — lint, typecheck, 16 unit tests, build, e2e smoke
- Metrics before → after: N/A → automated T5/T6/T7/T8 unit coverage online
- Alignment audit: PASS — web-first PWA + Pages matches easy local/prod goal; Capacitor deferred
- Next action: G1 playable core loop (place towers, waves) against gate checklist

### 2026-09-05 — Testing & metrics guidelines authored

- Goal touched: G0 docs alignment (enables all P/T gates)
- Change: Added `docs/testing-and-metrics.md` with north-stars, metric catalog, delivery gates G0–G6, test matrix, playtest script, analytics contract, change-log protocol
- Regression pack: N/A (docs only)
- Metrics before → after: N/A
- Alignment audit: PASS — guidelines map to Daily Dare TD + near-miss + Editorial Soft Defense + ad safety
- Next action: Lock product target in README/GDD; start G1 core loop when build begins
