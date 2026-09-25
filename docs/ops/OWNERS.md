# IPCL Owners registry (anti-dup)

Оновлено: 2026-09-25 ~10:55 UTC  
Правило: **одна тема = один owner-агент**.

| Тема | Owner agent | Branch | PR | Статус |
|------|-------------|--------|-----|--------|
| ADR-002 store | — | `main` | merged | **Done** |
| Context Vault MVP | — | via #1 | [#1](https://github.com/IulianaIagodka/IPCL/pull/1) MERGED | **Done** |
| ADR-003 security | Алр 003 `…c745` | merged | [#6](https://github.com/IulianaIagodka/IPCL/pull/6) **MERGED** | **Done on main** |
| ADR-004 control plane | rebase branch / 004 IDLE | `cursor/rebase-adr-003-004-onto-main-70c7` | [#11](https://github.com/IulianaIagodka/IPCL/pull/11) DRAFT | **Ready to merge** (17/17) |
| ADR-004 legacy stack | 004 `…063d` | `cursor/implement-adr-004-…` | [#7](https://github.com/IulianaIagodka/IPCL/pull/7) DRAFT | Obsolete → close after #11 |
| ADR-005 product UX | — | main history | [#5](https://github.com/IulianaIagodka/IPCL/pull/5) CLOSED | **On main** |
| Brand / naming | Context across AI | — | [#3](https://github.com/IulianaIagodka/IPCL/pull/3) CLOSED | Eidothea on main |
| Daily plan / backlog | Щоденне планування `…70c7` | `cursor/ops-backlog-process-70c7` | [#8](https://github.com/IulianaIagodka/IPCL/pull/8) DRAFT | RUNNING (ops) |
| main stability | Стабільність гілки main | `cursor/ci-main-green-3e8b` | — | IDLE — watch |

## Overlapping
| Агент | Чому | Дія |
|-------|------|-----|
| 004 IDLE original | Робота в #11 | Pause / close #7 after #11 |
| Map/Extract/Summarize* | Research only | Не імплементувати |

## Перед новою роботою
1. Ця таблиця → 2. `list-cloud-agents` → 3. якщо owner є → лише BACKLOG.
