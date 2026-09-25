# IPCL Owners registry (anti-dup)

Оновлено: 2026-09-25 ~13:25 Europe/Kyiv  
Правило: **одна тема = один owner-агент**. Інші агенти по тій темі = конфлікт → не стартувати / зупинити / лише review.

| Тема | Owner agent | Branch | PR | Статус |
|------|-------------|--------|-----|--------|
| ADR-002 store (library) | — | `main` | merged | **Done** (`b463a07`) |
| Context Vault MVP | Independent context layer `bc-01a0d7e9-…cc40` | `cursor/context-vault-mvp-cc40` | [#1](https://github.com/IulianaIagodka/IPCL/pull/1) DRAFT | RUNNING |
| ADR-003 security | Алр 003 `bc-01a0d7fa-…c745` | `cursor/implement-adr-003-security-c745` | [#6](https://github.com/IulianaIagodka/IPCL/pull/6) DRAFT | RUNNING |
| ADR-004 control plane | 004 `bc-01a0d800-…063d` | `cursor/implement-adr-004-control-plane-063d` | [#7](https://github.com/IulianaIagodka/IPCL/pull/7) DRAFT | RUNNING |
| ADR-005 product UX | Адр 005 `bc-01a0d7fc-…8895` | `cursor/implement-adr-005-8895` | [#5](https://github.com/IulianaIagodka/IPCL/pull/5) DRAFT | RUNNING |
| Brand / naming | Context across AI `bc-01a0d7f6-…b722` | `cursor/brand-slogans-b722` | [#3](https://github.com/IulianaIagodka/IPCL/pull/3) DRAFT | P3 hold |
| Daily plan / backlog | Щоденне планування `bc-01a0d80c-…70c7` | — | — | RUNNING (ops) |

## Overlapping (не owners — зупинити або не давати нових задач)

| Агент | Чому конфлікт | Дія |
|-------|---------------|-----|
| Demo ADR-003 security UI | Дубль ADR-003 UI | Pause; review після #6 |
| Open landing and vault UI | Дубль MVP #1 | Pause |
| Retest vault pages correctly | Дубль MVP #1 | Pause до merge/stable #1 |
| Open control plane UI | Дубль ADR-004 #7 | Pause |
| Independent context layer (IDLE duplicate `…1103`) | Дубль назви MVP | Ignore / archive |
| Map/Extract/Summarize* (IDLE) | Research only | Не імплементувати окремо |

## Перевірка перед стартом нової роботи
1. Відкрити цю таблицю.
2. `list-cloud-agents` — чи є RUNNING/IDLE по тій темі.
3. Якщо тема вже має owner → нова задача лише в BACKLOG, не новий агент.
