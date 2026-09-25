# IPCL Backlog — 2026-09-25

Оновлено: 2026-09-25 ~13:25 Europe/Kyiv  
Див. також: `OWNERS.md`, `PROCESS.md`, `LAST_PLAN.md`

## Merge queue (за git ancestry)

Фактично:
- `#6` ADR-003 **вже містить** MVP (`83124ac`)
- `#7` ADR-004 **вже містить** ADR-003 (`16c26c4`) → стек MVP→003→004
- `#5` ADR-005 і `#3` brand — **форки від MVP без 003/004** → високий ризик конфліктів з #6/#7

Рекомендований порядок:
1. Дочекатись/змерджити **#6 ADR-003** (або одразу #7, якщо #6 повністю входить у #7 — перевірити перед merge)
2. **#7 ADR-004** (якщо не змерджено як частину кроку 1)
3. Rebase **#5 ADR-005** на новий main
4. Rebase **#1** лише якщо ще потрібен окремо (інакше закрити як superseded by #6/#7)
5. **#3 Brand** — лише після стабільного UX (#5), узгодити Memora→Slid

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

## Inbox
Нова задача → P0–P3 тут → сверить `OWNERS.md` → TodoWrite → робота.
