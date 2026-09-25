# IPCL Backlog — 2026-09-25

Оновлено: 2026-09-25 ~13:55 Europe/Kyiv  
Див. також: `OWNERS.md`, `PROCESS.md`, `MERGE_READINESS.md`, `ACTION_REQUIRED.md`

## Merge queue (за git ancestry) — verified 2026-09-25

Фактично (доведено `merge-base --is-ancestor`):
- `#6` ADR-003 **повністю входить у** `#7` ADR-004 → можна мерджити **лише #7** (або #6 потім #7)
- MVP є предком #6/#7
- **`main` (ADR-002) НЕ є предком #6/#7** → стек Next/vault і library на main роз’їхались (INT-1 критичний після merge)
- `#5` / `#3` — форки від MVP без 003/004 → rebase обов’язковий

**Merge readiness #7 (executed check):** `npm test` 10/10 pass · `tsc --noEmit` clean · DRAFT · див. `MERGE_READINESS.md`

Рекомендований порядок:
1. Змерджити **#7 ADR-004** (тягне MVP+003+004) — або #6 потім #7
2. Закрити **#6** і ймовірно **#1** як superseded (COORD-5)
3. Rebase **#5 ADR-005** на новий main
4. **#3 Brand** — після #5; узгодити Memora→Slid
5. **INT-1** — інтеграція ADR-002 `main/src` у vault (окремий PR, P2→P1 після кроку 1)

## P0 — координація

- [ ] **COORD-1** Pause Demo ADR-003 UI; owner = PR #6 (superseded by #7 after merge)
- [ ] **COORD-2** Pause Open landing + Retest vault; MVP owner superseded by #7
- [ ] **COORD-3** Pause Open control plane UI; owner = PR #7
- [ ] **COORD-4** Hold brand PR #3 до після #5/#7 — tip зараз **Eidothea** + `eidothea.app` (після churn Memora→Slid→Eidothea); не мерджити в нестабільний UI-стек
- [x] **COORD-5** `#1` і `#6` **повністю superseded `#7`** (0 unique commits/files у MVP поза #7; 0 commits #6 поза #7) → після merge #7 закрити #1 і #6

## P1 — в роботі (owners only)

- [x] **ADR-003** PR [#6](https://github.com/IulianaIagodka/IPCL/pull/6) — superseded by #7 (не мерджити окремо)
- [ ] **ADR-004** PR [#7](https://github.com/IulianaIagodka/IPCL/pull/7) @ `02b7035` — **канонічний merge target** (tests green)
- [ ] **ADR-005** PR [#5](https://github.com/IulianaIagodka/IPCL/pull/5) — 2 unique commits vs #7; rebase після merge #7
- [x] **MVP** PR [#1](https://github.com/IulianaIagodka/IPCL/pull/1) — superseded by #7 (закрити після merge)

## P2 — після merge

- [ ] **INT-1** Зв’язати ADR-002 library з vault/control-plane — brief готовий: [`INT1_BRIEF.md`](./INT1_BRIEF.md) (підвищити до P1 після merge #7)
- [ ] **TEST-1** Vault retest після одного канонічного UI
- [ ] **REBASE-5** ADR-005 на main після #7

## P3

- [ ] **BRAND-1** PR [#3](https://github.com/IulianaIagodka/IPCL/pull/3) @ `d754066` — **Eidothea** / `eidothea.app` (зафіксувати після #5+#7, не під час rename churn)
- [ ] **DOCS-1** Дублі ADR filename (`001-` vs `ADR-001-`)
- [ ] **OPS-1** Daily 08:00 Kyiv (timer до 2026-10-02) + OWNERS anti-dup

## Done

- [x] ADR-002 на `main`
- [x] PROCESS + BACKLOG + OWNERS + daily/renew timers
- [x] Persist ops docs → PR [#8](https://github.com/IulianaIagodka/IPCL/pull/8)

## Inbox
Нова задача → P0–P3 тут → сверить `OWNERS.md` → TodoWrite → робота.
