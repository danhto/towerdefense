# Playtest scoreboard template (G5)

Copy this file to `YYYY-MM-DD.md` when running a session. Protocol: [testing-and-metrics.md](../testing-and-metrics.md) §5.

## Session meta

| Field | Value |
|-------|-------|
| Date | |
| Build / deploy URL | |
| Balance version | |
| Facilitator | |
| Device mix | |

## Scoreboard

| Tester | P1s | P2s | P3 | Att2+ | SessMin | Fair? | NearMiss? | Share | RolesOK | D1intent | Notes |
|--------|-----|-----|----|-------|---------|-------|-----------|-------|---------|----------|-------|
| 1 | | | | | | | | | | | |
| 2 | | | | | | | | | | | |
| 3 | | | | | | | | | | | |
| 4 | | | | | | | | | | | |
| 5 | | | | | | | | | | | |

**Scoring keys**

- P3 / Fair / NearMiss / RolesOK / D1intent: Y/N
- Att2+: Y if started attempt 2 or 3 same day
- Share: U (unprompted) / P (prompted) / N

## Aggregate vs targets

| Metric | Target | Session result | Pass? |
|--------|--------|----------------|-------|
| P3 | ≥ 80% | | |
| P4 | ≥ 60% | | |
| P5 median | 2–5 min | | |
| P6 | ≥ 80% | | |
| P8 or P9 | real share | | |
| P11 | ≥ 80% | | |
| T4 crashes | 0 | | |

## Iterate list (failed metrics only)

1.
2.

## Automated self-check (pre-playtest)

Run before inviting humans:

```bash
npm run lint && npm run typecheck && npm run test && npm run build && npm run test:e2e
```

Regression pack (§4.4): place → wave → result → share fields → burn 3 → Practice → no mid-wave ads.
