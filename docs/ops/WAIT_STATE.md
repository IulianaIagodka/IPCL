# WAIT STATE — orchestrator gates

Оновлено: 2026-09-25 ~11:00 UTC

## Режим: ОРКЕСТРАТОР
Goal ACTIVE для daily plan + backlog. Product-код з цього агента — **стоп**, крім `docs/ops/`.

## Wake → дія
| Подія | Дія |
|-------|-----|
| 08:00 timer | План користувачу; sync docs лише при delta |
| PR merge/close/sync (чужий) | Оновити BACKLOG/OWNERS; коротко якщо пріоритет змінився |
| Власний sync #8/#11 | Ігнор |
| Goal continue, tips ті самі | Тиша, 0 commits |
| User `merge #11` | Тоді можна координувати merge path (не імплементувати нове) |
| User нова задача | P0–P3 → BACKLOG → призначити/знайти owner |

## Зовнішні gates
- **P0:** human merge [#11](https://github.com/IulianaIagodka/IPCL/pull/11)
- Після #11: close #7/#9 → призначити owner на INT-1
- Не стартувати INT-1 / brand / ADR-003 заново
