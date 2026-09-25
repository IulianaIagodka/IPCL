# IPCL Backlog — 2026-09-25

Оновлено: 2026-09-25 ~13:25 Europe/Kyiv  
Див. також: `OWNERS.md`, `PROCESS.md`, `LAST_PLAN.md`

## Merge queue (за git ancestry) — verified 2026-09-25

Фактично (доведено `merge-base --is-ancestor`):
- `#6` ADR-003 **повністю входить у** `#7` ADR-004 → можна мерджити **лише #7** (або #6 потім #7)
- MVP є предком #6/#7
- **`main` (ADR-002) НЕ є предком #6/#7** → стек Next/vault і library на main роз’їхались (INT-1 критичний після merge)
- `#5` / `#3` — форки від MVP без 003/004 → rebase обов’язковий

Рекомендований порядок:
1. Змерджити **#7 ADR-004** (тягне MVP+003+004) — або #6 потім #7
2. Закрити **#6** і ймовірно **#1** як superseded (COORD-5)
3. Rebase **#5 ADR-005** на новий main
4. **#3 Brand** — після #5; узгодити Memora→Slid
5. **INT-1** — інтеграція ADR-002 `main/src` у vault (окремий PR, P2→P1 після кроку 1)

## P0 — координація

- [ ] **COORD-1** Pause Demo ADR-003 UI; owner = PR #6
- [ ] **COORD-2** Pause Open landing + Retest vault; owner = PR #1 (або #6 якщо MVP superseded)
- [ ] **COORD-3** Pause Open control plane UI; owner = PR #7
- [ ] **COORD-4** Hold brand PR #3 (Memora/Slid churn) до після #5
- [ ] **COORD-5** Вирішити: чи #1 ще потрібен окремо, чи закрити на користь стеку #6/#7

## P1 — в роботі (owners only)

- [ ] **ADR-003** PR [#6](https://github.com/IulianaIagodka/IPCL/pull/6) @ `16c26c4`
- [ ] **ADR-004** PR [#7](https://github.com/IulianaIagodka/IPCL/pull/7) @ `02b7035` (includes 003)
- [ ] **ADR-005** PR [#5](https://github.com/IulianaIagodka/IPCL/pull/5) @ `be422cf` — rebase після 003/004
- [ ] **MVP** PR [#1](https://github.com/IulianaIagodka/IPCL/pull/1) @ `83124ac` — під питанням (COORD-5)

## P2 — після merge

- [ ] **INT-1** Зв’язати ADR-002 library (`main`/`src`) з Next vault/control-plane (зараз два світи)
- [ ] **TEST-1** Vault retest після одного канонічного UI
- [ ] **REBASE-5** ADR-005 на main після #6/#7

## P3

- [ ] **BRAND-1** PR [#3](https://github.com/IulianaIagodka/IPCL/pull/3) — фінальна назва (зараз tip = Slid)
- [ ] **DOCS-1** Дублі ADR filename (`001-` vs `ADR-001-`)
- [ ] **OPS-1** Daily 08:00 Kyiv (timer до 2026-10-02) + OWNERS anti-dup

## Done

- [x] ADR-002 на `main`
- [x] PROCESS + BACKLOG + OWNERS + daily/renew timers
- [x] Persist ops docs → PR [#8](https://github.com/IulianaIagodka/IPCL/pull/8)

## Inbox
Нова задача → P0–P3 тут → сверить `OWNERS.md` → TodoWrite → робота.
