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
