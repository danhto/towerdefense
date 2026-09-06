# Product target — Daily Hold

Locked direction for this repo (from planning chats). Build and test against [testing-and-metrics.md](./testing-and-metrics.md).

## Concept

| Pillar | Choice |
|--------|--------|
| Genre | Short classic tower defense (~2–5 min attempts) |
| Viral spine | Shared **daily seed** (Wordle DNA) |
| Emotion | **Near-miss** leak drama |
| Share | Spoiler-free **typographic** result card |
| Aesthetic | **Editorial Soft Defense** — calm ritual shell + soft stylized 2D battlefield; coastal town / harbor stake |
| Monetization | Ads + soft IAP around Practice/cosmetics; **Today’s Dare stays free**; no mid-wave ads |

Working title: **Daily Hold**.

## Platform

| Concern | Choice |
|---------|--------|
| Primary | **Web PWA** — TypeScript + Vite + Phaser 3 |
| Local | `npm run dev` / `npm run test` / `npm run test:e2e` |
| Production | **GitHub Pages** from `main` (see [engineering.md](./engineering.md)) |
| Android / iOS | **Capacitor** wrap post-MVP (same web bundle) |

## MVP scope

- Daily-seeded harbor path (shape + waves both vary by UTC day)
- 3 color-coded towers, 2 upgrade tiers
- 8–12 seeded waves
- 3 official attempts/day → further runs are Practice
- Near-miss metrics on result
- Share card image (typographic PNG)
- Test ad placements

## Out of MVP

Accounts, realtime multiplayer, campaign tree, GIF replay, seasons, Kingdom Rush–level illustration.
