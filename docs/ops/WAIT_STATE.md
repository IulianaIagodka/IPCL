# WAIT STATE — orchestrator gates

Оновлено: 2026-09-25 ~11:05 UTC

## Режим: ОРКЕСТРАТОР
Канон: **[RULES.md](./RULES.md)**. Product-код — стоп (крім docs/ops).

## Wake → дія
| Подія | Дія |
|-------|-----|
| 08:00 timer | План; sync docs лише при delta |
| PR delta | BACKLOG/OWNERS |
| Goal continue, tips ті самі | Тиша, 0 commits |
| User `close #7 #9` | Закрити obsolete (коли буде tool/OK) |
| User assign INT-1 / нова задача | P0–P3 → BACKLOG → OWNERS → owner |

## Gates
- ~~Merge #11~~ **DONE** (`bbd3eba`)
- P0: human `close #7 #9`
- P1: assign one INT-1 owner (не стартувати без OWNERS)
