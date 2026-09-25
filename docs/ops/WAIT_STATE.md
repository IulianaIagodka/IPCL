# WAIT STATE — orchestrator gates

Оновлено: 2026-09-25 ~11:10 UTC

Канон: **[RULES.md](./RULES.md)**. Product-код оркестратором — стоп.

## Gates
- ~~#11~~ · ~~#7/#9~~ · **INT-1 owner ASSIGNED** (Context store wiring)

## Wake
| Подія | Дія |
|-------|-----|
| 08:00 | план |
| PR від INT-1 | оновити BACKLOG/OWNERS (номер PR) |
| Другий агент на INT-1 | **конфлікт P0** — stop / не дублювати |
| Goal continue без delta | тиша |
| User merge INT-1 PR | лише після явного OK |
