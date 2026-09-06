# towerdefense / Daily Hold

**Play (GitHub Pages):** https://danhto.github.io/towerdefense/  
**Replay first-run tour:** https://danhto.github.io/towerdefense/?tutorial=1


Web-first daily-dare tower defense.

## Locked product

See [`docs/product-target.md`](docs/product-target.md):

- **Daily Dare TD** (shared UTC seed, ~2–5 min classic sessions)
- **Near-miss** leak juice + spoiler-free share card
- **Editorial Soft Defense** aesthetic
- Ads/IAP around Practice — never paywall today’s dare; never interrupt mid-wave
- **Platform:** TypeScript + Vite + Phaser 3 → GitHub Pages; Capacitor later for stores

Background: [`docs/viral-game-plan.md`](docs/viral-game-plan.md) · Engineering: [`docs/engineering.md`](docs/engineering.md)

## Development

```bash
npm install
npm run dev          # http://localhost:5173/towerdefense/
npm run test         # unit (Vitest)
npm run test:e2e     # Playwright smoke
npm run lint && npm run typecheck
npm run build && npm run preview
```

## CI / CD

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| [`ci.yml`](.github/workflows/ci.yml) | PR / push to `main` | lint, typecheck, unit, build, e2e |
| [`deploy.yml`](.github/workflows/deploy.yml) | push to `main` | CI gate → GitHub Pages |

Enable **Settings → Pages → GitHub Actions** once. Details in [`docs/engineering.md`](docs/engineering.md).

## Testing & delivery metrics

[`docs/testing-and-metrics.md`](docs/testing-and-metrics.md) — north-stars, P/T/B metrics, gates **G0→G6**, regression pack.

Track iterations in [`docs/change-log.md`](docs/change-log.md).

## Build order / gate status

See [`docs/gate-status.md`](docs/gate-status.md) for the live checklist. Soft-launch: [`docs/soft-launch.md`](docs/soft-launch.md).

1. G0 docs + CI scaffold — **done**
2. G1 core loop — **done**
3. G2 daily seed + attempts + share card — **done**
4. G3 near-miss juice — **done**
5. G4 Practice + test ads — **done**
6. MVP extras (2-tier upgrades + share PNG) — **done**
7. G5 playtest scoreboard — harness ready (**needs humans**)
8. G6 soft-launch readiness — **code ready**
