# ACTION REQUIRED (orchestrator board)

Оновлено: 2026-09-25 ~11:05 UTC

Повний канон правил: **[RULES.md](./RULES.md)**.

## DONE
- **#11 MERGED** into `main` @ `bbd3eba` (human OK «Мердж 11»; tests 17/17 before push)
- ADR-003 (#6) + ADR-004 (#11) both on main

## Потрібно від людини (P0)
1. **`close #7 #9`** — obsolete ADR-004 / port PRs (оркестратор не закриває без команди)
2. Pause/archive IDLE agents на 003/004/brand/MVP

## Далі (P1)
- Призначити **одного** owner на **INT-1** (BACKLOG + OWNERS перед стартом)
- Не стартувати brand/UI паралельно з INT-1

## Оркестратор зараз
- Anti-dup: RUNNING product agents — немає
- Gate відкритий для INT-1 assignment
- Наступний публічний сигнал: daily 08:00 або `close #7 #9` / assign INT-1
