# IPCL Owners registry (anti-dup)

Оновлено: 2026-09-25 ~11:00 UTC  
Правило: **одна тема = один owner**. Оркестратор (`…70c7`) не займає product-теми.

| Тема | Owner | Branch / PR | Статус | Оркестратор-дія |
|------|-------|-------------|--------|-----------------|
| **Orchestration / backlog** | **Щоденне планування `bc-01a0d80c-…70c7`** | [#8](https://github.com/IulianaIagodka/IPCL/pull/8) | RUNNING | Це ми |
| ADR-002 store | — | main | Done | — |
| Vault MVP | — | [#1](https://github.com/IulianaIagodka/IPCL/pull/1) MERGED | Done | — |
| ADR-003 security | Алр 003 `…c745` | [#6](https://github.com/IulianaIagodka/IPCL/pull/6) **MERGED** | Done | Archive/pause агент |
| ADR-004 control plane | гілка rebase (готово) | [#11](https://github.com/IulianaIagodka/IPCL/pull/11) DRAFT | **Await human merge** | Не чіпати код; чекати OK |
| ADR-004 legacy | 004 `…063d` IDLE | [#7](https://github.com/IulianaIagodka/IPCL/pull/7) | Obsolete | Рекомендація: close після #11 |
| PORT / MVP into 004 | — | [#9](https://github.com/IulianaIagodka/IPCL/pull/9) | Superseded | Close після #11 |
| ADR-005 UX | — | [#5](https://github.com/IulianaIagodka/IPCL/pull/5) CLOSED | On main | — |
| Brand | Context across AI IDLE | [#3](https://github.com/IulianaIagodka/IPCL/pull/3) CLOSED | On main | Не стартувати |
| main CI stability | Стабільність main IDLE | `ci-main-green-3e8b` | Watch | Не дублювати |
| INT-1 wire store | **unassigned** | — | Blocked on #11 | Не стартувати до merge |

## Overlap / pause (не давати задач)
Map*/Extract*/Summarize* (IDLE research), дубль Independent context layer, Адр 005 IDLE, brand IDLE, Алр 003 IDLE (done).

## Перед стартом нової теми
1. Ця таблиця → 2. `list-cloud-agents` → 3. якщо owner є → лише BACKLOG.
