# WAIT STATE — orchestrator gates

Оновлено: 2026-09-25 ~12:22 UTC

Канон: **[RULES.md](./RULES.md)**. Product-код оркестратором — стоп.

## Gates
- ~~#11~~ · ~~#7/#9~~ · ~~#12 INT-1~~ · ~~#8 ops~~ → `main`
- **#13** privacy/copyright — DRAFT, owner RUNNING (rebase before merge)
- **#10** CI — DRAFT, no RUNNING owner
- **GOAL PAUSED** (людина: `pause goal`)

## Wake
| Подія | Дія |
|-------|-----|
| User нова задача / `resume` | BACKLOG → OWNERS → theme owner; re-subscribe daily 08:00 |
| `merge #13` | лише після rebase onto `main` + явного OK |
| Goal continue без delta | тиша (0 commits) |
