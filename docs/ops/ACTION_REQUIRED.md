# ACTION REQUIRED — P0 coordination

Щоб зняти блокери беклогу, потрібні рішення з твого боку (я не можу зупинити чужих агентів).

## 1) Pause overlapping agents (зараз)
| Зупинити | Чому | Залишити |
|----------|------|----------|
| [Demo ADR-003 security UI](https://cursor.com/agents/bc-11a6609f-fb3e-513d-a12b-370850246302) | дубль ADR-003 | [Алр 003](https://cursor.com/agents/bc-01a0d7fa-972a-7721-8209-21318da3c745) → PR #6 |
| [Open landing and vault UI](https://cursor.com/agents/bc-7f9dea4c-0bb8-5341-8b86-ebcbdbefbc99) | дубль MVP | [Independent context layer](https://cursor.com/agents/bc-01a0d7e9-c7bf-7e7b-9a0c-233c3fbbcc40) → PR #1 |
| [Retest vault pages correctly](https://cursor.com/agents/bc-0e2086b6-f72b-5405-be19-0c223e781672) | дубль MVP | той самий #1 |
| [Open control plane UI](https://cursor.com/agents/bc-9c1d5d6e-90c6-5e85-82f9-be0039cdccc2) | дубль ADR-004 | [004](https://cursor.com/agents/bc-01a0d800-d238-7134-b8a5-63a44147063d) → PR #7 |

## 2) Merge path
1. Review/merge **[PR #7](https://github.com/IulianaIagodka/IPCL/pull/7)** (містить MVP + ADR-003 + ADR-004)
   - **Готовність:** `npm test` 10/10 · `tsc` clean (див. `MERGE_READINESS.md`)
2. Закрити **#6** і ймовірно **#1** як superseded
3. Rebase **#5**, потім brand **#3**
4. Після merge #7 — стартувати **INT-1** (ADR-002 library відсутня у vault-стеку)

## 3) Ops
- Merge або залиш draft **[PR #8](https://github.com/IulianaIagodka/IPCL/pull/8)** (`docs/ops`) — канон беклогу

Напиши «pause ok» / «merge #7» — виконаю наступні кроки в беклогу відповідно.
