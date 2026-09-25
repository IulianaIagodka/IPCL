# WAIT STATE — orchestrator gates

Оновлено: 2026-09-25 ~12:03 UTC

Канон: **[RULES.md](./RULES.md)**. Product-код оркестратором — стоп.

## Gates
- ~~#11~~ · ~~#7/#9~~ · ~~#12 INT-1~~ · ~~#8 ops~~ → `main`
- **GOAL PAUSED** (людина: `pause goal`)

## Wake
| Подія | Дія |
|-------|-----|
| User нова задача / `resume` | BACKLOG → OWNERS → theme owner; re-subscribe daily 08:00 |
| Goal continue | (goal paused — тиша) |
