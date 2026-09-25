# ACTION REQUIRED (orchestrator board)

Оновлено: 2026-09-25 ~11:00 UTC

Повний канон правил: **[RULES.md](./RULES.md)**.

## Потрібно від людини (P0)
1. **Review + merge [#11](https://github.com/IulianaIagodka/IPCL/pull/11)** — ADR-004 control plane на main (після #6). Tests 17/17.
2. Після merge: **close #7 і #9** (obsolete).

## Призначити пізніше (не стартувати зараз)
- **INT-1** — wire `packages/context-store` → vault/Context Service · owner: TBD після #11
- Pause/archive IDLE product-агентів на закритих темах (003, brand, 005, MVP)

## Оркестратор зараз
- Anti-dup clear для нової product-роботи: **немає** (чекаємо merge #11)
- RUNNING product agents: **немає** (лише цей ops)
- Наступний публічний сигнал: daily 08:00 або подія по #11
