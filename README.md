# towerdefense / Daily Hold

Greenfield web-first tower defense workspace.

## Locked product

See [`docs/product-target.md`](docs/product-target.md):

- **Daily Dare TD** (shared UTC seed, ~2–5 min classic sessions)
- **Near-miss** leak juice + spoiler-free share card
- **Editorial Soft Defense** aesthetic (ritual shell + soft stylized battlefield)
- Ads/IAP around Practice — never paywall today’s dare; never interrupt mid-wave

Background research: [`docs/viral-game-plan.md`](docs/viral-game-plan.md).

## Testing & delivery metrics (build against these)

[`docs/testing-and-metrics.md`](docs/testing-and-metrics.md) is the interactive build playbook:

1. North-star goals
2. Metric catalog (P / T / B) with targets and kill signals
3. Delivery gates **G0→G6** (do not skip)
4. Exhaustive functional / device / regression matrix
5. Playtest script + scoreboard
6. Analytics event contract
7. Change-log protocol for before/after comparison

Track iterations in [`docs/change-log.md`](docs/change-log.md). Store playtest runs in [`docs/playtests/`](docs/playtests/).

## Build order

1. G0 docs aligned (this commit)
2. G1 core loop
3. G2 daily seed + attempts + share card
4. G3 near-miss juice
5. G4 Practice + test ads
6. G5 playtest scoreboard
7. G6 soft-launch readiness
