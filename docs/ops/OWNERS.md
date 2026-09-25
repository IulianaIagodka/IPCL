# IPCL Owners registry (anti-dup)

Оновлено: 2026-09-25 ~13:50 UTC / ~16:50 Europe/Kyiv  
Правило: **одна тема = один owner-агент**. Інші агенти по тій темі = конфлікт → не стартувати / зупинити / лише review.

| Тема | Owner agent | Branch | PR | Статус |
|------|-------------|--------|-----|--------|
| ADR-002 store (library) | — | `main` | merged | **Done** |
| Context Vault MVP | — | merged via #1 | [#1](https://github.com/IulianaIagodka/IPCL/pull/1) MERGED | **Done on main** |
| ADR-003 + ADR-004 on main | this ops + rebase branch | `cursor/rebase-adr-003-004-onto-main-70c7` | [#11](https://github.com/IulianaIagodka/IPCL/pull/11) DRAFT | **Ready to merge** (17/17) |
| ADR-003 security (legacy) | 004 stack / `…c745` | `cursor/implement-adr-003-security-c745` | [#6](https://github.com/IulianaIagodka/IPCL/pull/6) | Obsolete → close after #11 |
| ADR-004 control plane (legacy) | 004 `bc-01a0d800-…063d` | `cursor/implement-adr-004-…` | [#7](https://github.com/IulianaIagodka/IPCL/pull/7) DRAFT | Obsolete → close after #11 |
| ADR-005 product UX | — | in main history | [#5](https://github.com/IulianaIagodka/IPCL/pull/5) CLOSED | **On main** |
| Brand / naming | Context across AI `bc-01a0d7f6-…b722` | `cursor/brand-slogans-b722` | [#3](https://github.com/IulianaIagodka/IPCL/pull/3) **CLOSED** | Eidothea on main; no new brand work |
| Daily plan / backlog | Щоденне планування `bc-01a0d80c-…70c7` | `cursor/ops-backlog-process-70c7` | [#8](https://github.com/IulianaIagodka/IPCL/pull/8) DRAFT | RUNNING (ops) |
| main stability | Стабільність гілки main `bc-01a0d822-…3e8b` | `cursor/ci-main-green-3e8b` | — | IDLE — watch; не дублювати INT-1/merge |

## Overlapping (не owners — зупинити або не давати нових задач)

| Агент | Чому конфлікт | Дія |
|-------|---------------|-----|
| Алр 003 / 004 IDLE originals | Робота вже в #11 | Pause / close after #11 merge |
| Open landing / Retest / Open control plane | Дубль MVP / #11 | Pause |
| Map/Extract/Summarize* (IDLE) | Research only | Не імплементувати окремо |

## Перевірка перед стартом нової роботи
1. Відкрити цю таблицю.
2. `list-cloud-agents` — чи є RUNNING/IDLE по тій темі.
3. Якщо тема вже має owner → нова задача лише в BACKLOG, не новий агент.
