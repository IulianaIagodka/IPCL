# IPCL Backlog — 2026-09-25

Оновлено: 2026-09-25 ~14:20 Europe/Kyiv  
Див. також: `OWNERS.md`, `ACTION_REQUIRED.md`, `WAIT_STATE.md`

## Merge queue

1. **PORT-1** Cherry-pick `#1` unique commits (`247218a`, `253e56d`) into `#7` (або rebase #7 onto #1 tip)
2. Merge **#7** (tests were green @ `02b7035`; re-test after port)
3. Close **#6** і **#1**
4. Rebase **#5** → brand **#3** (Eidothea) → **INT-1**

**Merge readiness #7 @ `02b7035`:** was 10/10 tests — invalid until PORT-1 done.

## P0 — координація

- [x] **COORD-1** Demo ADR-003 UI stopped
- [ ] **COORD-2** MVP agent (#1) знову пушить — pause; Retest якщо ще живий
- [x] **COORD-3** Open control plane stopped
- [ ] **COORD-4** Hold brand #3 (Eidothea + Fly.io `64dd15c`)
- [ ] **COORD-5** ~~superseded~~ → **відкрито знову**: #1 має unique commits поза #7
- [ ] **PORT-1** Перенести unique #1 → #7 перед merge

## P1 — в роботі (owners only)

## P1 — в роботі (owners only)

- [x] **ADR-003** PR [#6](https://github.com/IulianaIagodka/IPCL/pull/6) — superseded by #7 (не мерджити окремо)
- [ ] **ADR-004** PR [#7](https://github.com/IulianaIagodka/IPCL/pull/7) @ `02b7035` — **канонічний merge target** (tests green)
- [ ] **ADR-005** PR [#5](https://github.com/IulianaIagodka/IPCL/pull/5) @ `be422cf` — tests 4/4 local; **rebase після #7** (див. `MERGE_READINESS_PR5.md`)
- [ ] **MVP** PR [#1](https://github.com/IulianaIagodka/IPCL/pull/1) @ `253e56d` — **unique commits**; port into #7 then close

## P2 — після merge

- [ ] **INT-1** Зв’язати ADR-002 library з vault/control-plane — brief готовий: [`INT1_BRIEF.md`](./INT1_BRIEF.md) (підвищити до P1 після merge #7)
- [ ] **TEST-1** Vault retest після одного канонічного UI
- [ ] **REBASE-5** ADR-005 на main після #7

## P3

- [ ] **BRAND-1** PR [#3](https://github.com/IulianaIagodka/IPCL/pull/3) @ `64dd15c` — **Eidothea** / `eidothea.app` (зафіксувати після #5+#7, не під час rename churn)
- [ ] **DOCS-1** Дублі ADR filename (`001-` vs `ADR-001-`)
- [ ] **OPS-1** Daily 08:00 Kyiv (timer до 2026-10-02) + OWNERS anti-dup

## Done

- [x] ADR-002 на `main`
- [x] PROCESS + BACKLOG + OWNERS + daily/renew timers
- [x] Persist ops docs → PR [#8](https://github.com/IulianaIagodka/IPCL/pull/8)

## Inbox
Нова задача → P0–P3 тут → сверить `OWNERS.md` → TodoWrite → робота.
