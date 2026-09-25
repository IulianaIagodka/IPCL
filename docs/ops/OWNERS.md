# IPCL Owners registry (anti-dup)

Оновлено: 2026-09-25 ~13:25 Europe/Kyiv  
Правило: **одна тема = один owner-агент**. Інші агенти по тій темі = конфлікт → не стартувати / зупинити / лише review.

| Тема | Owner agent | Branch | PR | Статус |
|------|-------------|--------|-----|--------|
| ADR-002 store (library) | — | `main` | merged | **Done** (`b463a07`) |
| Context Vault MVP | — | merged via #1 | [#1](https://github.com/IulianaIagodka/IPCL/pull/1) MERGED | **Done on main** |
| ADR-003 security | 004 stack / `…c745` | in #7 only | [#6](https://github.com/IulianaIagodka/IPCL/pull/6) + [#7](https://github.com/IulianaIagodka/IPCL/pull/7) | **Rebase onto main** |
| ADR-004 control plane | 004 `bc-01a0d800-…063d` | `cursor/implement-adr-004-…` | [#7](https://github.com/IulianaIagodka/IPCL/pull/7) DRAFT | **Rebase onto main** (diverged) |
| ADR-005 product UX | — | in main history | [#5](https://github.com/IulianaIagodka/IPCL/pull/5) CLOSED | **Mostly on main**; PR closed |
| Brand / naming | Context across AI `bc-01a0d7f6-…b722` | `cursor/brand-slogans-b722` | [#3](https://github.com/IulianaIagodka/IPCL/pull/3) DRAFT | P3 hold — tip **Eidothea** / eidothea.app + Fly.io (`64dd15c`) |
| Daily plan / backlog | Щоденне планування `bc-01a0d80c-…70c7` | `cursor/ops-backlog-process-70c7` | [#8](https://github.com/IulianaIagodka/IPCL/pull/8) DRAFT | RUNNING (ops) |
| main stability | Стабільність гілки main `bc-01a0d822-…3e8b` | — | — | RUNNING — watch; не дублювати INT-1/merge без OWNERS |

## Overlapping (не owners — зупинити або не давати нових задач)

| Агент | Чому конфлікт | Дія |
|-------|---------------|-----|
| ADR-003 security | 004 stack / `…c745` | in #7 only | [#6](https://github.com/IulianaIagodka/IPCL/pull/6) + [#7](https://github.com/IulianaIagodka/IPCL/pull/7) | **Rebase onto main** |
| Open landing and vault UI | Дубль MVP #1 | Pause |
| Retest vault pages correctly | Дубль MVP #1 | Pause до merge/stable #1 |
| Open control plane UI | Дубль ADR-004 #7 | Pause |
| Independent context layer (IDLE duplicate `…1103`) | Дубль назви MVP | Ignore / archive |
| Map/Extract/Summarize* (IDLE) | Research only | Не імплементувати окремо |

## Перевірка перед стартом нової роботи
1. Відкрити цю таблицю.
2. `list-cloud-agents` — чи є RUNNING/IDLE по тій темі.
3. Якщо тема вже має owner → нова задача лише в BACKLOG, не новий агент.
