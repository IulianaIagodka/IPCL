# IPCL Owners registry (anti-dup)

Оновлено: 2026-09-25 ~11:05 UTC — після merge #11  
Канон: **[RULES.md](./RULES.md)**. Оркестратор не займає product-теми.

| Тема | Owner | Branch / PR | Статус | Оркестратор-дія |
|------|-------|-------------|--------|-----------------|
| **Orchestration** | ops `…70c7` | [#8](https://github.com/IulianaIagodka/IPCL/pull/8) | RUNNING | Це ми |
| ADR-002 store | — | main | Done | — |
| Vault MVP | — | #1 MERGED | Done | — |
| ADR-003 security | — | #6 MERGED | Done | pause Алр 003 |
| ADR-004 control plane | — | **#11 MERGED** `bbd3eba` | **Done on main** | pause 004 IDLE |
| ADR-004 legacy | 004 IDLE | [#7](https://github.com/IulianaIagodka/IPCL/pull/7) | Obsolete | чекаємо `close #7` |
| PORT | — | [#9](https://github.com/IulianaIagodka/IPCL/pull/9) | Obsolete | чекаємо `close #9` |
| ADR-005 UX | — | #5 CLOSED | On main | — |
| Brand | IDLE | #3 CLOSED | On main | не стартувати |
| INT-1 wire store | **unassigned** | — | **Ready to assign** | BACKLOG+OWNERS перед агентом |

## Overlap / pause
Map*/Summarize*/Demo*, дубль MVP, Алр 003 IDLE, 004 IDLE, brand IDLE — не давати задач.

## Перед стартом INT-1
1. BACKLOG P1 → 2. OWNERS рядок → 3. list-cloud-agents → 4. один агент.
