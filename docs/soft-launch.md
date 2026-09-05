# Soft-launch checklist (G6)

Use before any public soft-launch. Related: [gate-status.md](./gate-status.md), [testing-and-metrics.md](./testing-and-metrics.md).

## Must complete

- [x] Analytics event bus wired (`session_start`, place, wave, near-miss, life lost, attempt_end, share, ads)
- [x] Error reporting stub + global handlers (`src/game/meta/errors.ts`)
- [x] Balance version stamped on result (`BALANCE_VERSION`)
- [x] Privacy / ads consent toggle on home
- [x] Remove-ads flag disables ad calls
- [ ] Human playtest scoreboard filled (`docs/playtests/YYYY-MM-DD.md`) — **G5, requires people**
- [ ] GitHub Pages enabled (Settings → Pages → GitHub Actions)
- [ ] Real ad SDK / analytics sink (post soft-launch; currently test stubs)
- [ ] Privacy policy URL linked from consent UI

## Ship criteria

| Item | Status |
|------|--------|
| CI green on PR | Required |
| G0–G4 automated must-pass | Done in code |
| G5 P-metrics | Pending human run |
| No mid-wave ads (T7) | Automated |
| Today’s Dare never paywalled | Product + UI copy |

## Decision

Soft-launch **code-ready** for internal / friends & family once Pages is on. Hold public UA until G5 scoreboard meets targets.
