# IPCL Owners registry (anti-dup)

Оновлено: 2026-09-25 ~12:22 UTC — delta: privacy **#13**  
Канон: **[RULES.md](./RULES.md)** (на `main`).

| Тема | Owner | PR / branch | Статус |
|------|-------|-------------|--------|
| Orchestration | ops `bc-01a0d80c-…70c7` | [#8](https://github.com/IulianaIagodka/IPCL/pull/8) CLOSED · main `@7162041` | **MERGED — agent RUNNING (goal paused)** |
| Privacy / copyright | `bc-01a0d881-…1547` | [#13](https://github.com/IulianaIagodka/IPCL/pull/13) DRAFT · `cursor/privacy-copyright-pages-1547` | **RUNNING — needs rebase onto main** |
| CI | — | [#10](https://github.com/IulianaIagodka/IPCL/pull/10) DRAFT · `cursor/ci-main-green-3e8b` | Open (no RUNNING owner) |
| ADR-002 | — | main | Done |
| MVP | — | #1 MERGED | Done |
| ADR-003 | — | #6 MERGED | Done |
| ADR-004 | — | #11 MERGED | Done |
| #7 / #9 | — | CLOSED | Cleared |
| ADR-005 / brand | — | CLOSED | On main |
| INT-1 | Context store wiring `bc-01a0d840-…4e11` | [#12](https://github.com/IulianaIagodka/IPCL/pull/12) CLOSED · main | **MERGED — archive owner** |

## Post-merge
- #12 INT-1 → `main@7da1b79`
- #8 ops (RULES, TEAM_SETUP, templates) → `main@7162041`
- tip `main@28431b6` (import fix for Fly)

## Notes
- #13 diverged from `main` (base `bbd3eba`); theme owner rebases before merge OK.
- Anti-dup: другий privacy/legal агент — **не стартувати**.
- Рекомендація: archive INT-1 owner; оркестратор goal **paused**.
