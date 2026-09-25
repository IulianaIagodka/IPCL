# IPCL Backlog — 2026-09-25

Оновлено: 2026-09-25 ~14:40 Europe/Kyiv

## Snapshot main (`709b9a2`)
- ✅ MVP vault merged (#1)
- ✅ ADR-005 UX commit in history (`be422cf`); PR #5 **closed without merge** (зміст уже в main іншим шляхом)
- ✅ ADR-002 library → `packages/context-store/` (unify layout)
- ❌ ADR-003 security impl (немає `api/auth`, тощо) — лишається в **#7**
- ❌ ADR-004 Context Service — лишається в **#7**
- ⚠️ INT-1: пакет є, але vault **ще не імпортує** context-store

## Merge queue (оновлено)
1. **Rebase/merge #7 onto main** — єдиний шлях для ADR-003+004 (роз’їхались з main)
2. **#9** (PORT-1) — майже obsolete для main (фікси вже в main); корисний лише якщо #7 мержать без rebase на main
3. Закрити застарілі чернетки після #7
4. **INT-1** — підключити `packages/context-store` до vault/Context Service
5. Brand #3 (Eidothea) — після стабільного #7 на main

## P0
- [ ] **REBASE-7** Перенести ADR-003/004 з #7 на актуальний `main` (owner `004` або новий агент після anti-dup)
- [x] **MVP #1** merged
- [x] **COORD-5/PORT-1** для main — фікси вже в main; #9 опційний

## P1
- [ ] **ADR-003+004** via rebased #7
- [ ] **INT-1** wire `packages/context-store` → vault APIs (brief: `INT1_BRIEF.md`, оновити шляхи)

## P2
- [ ] **TEST-1** Full vault+security+adr002 tests on unified main
- [ ] Close/cleanup #5/#6/#9 as appropriate

## P3
- [ ] **BRAND-1** #3 Eidothea + Fly.io
- [ ] **DOCS-1** дубль `001-` vs `ADR-001-`
- [ ] **OPS-1** daily 08:00

## Inbox
Нова задача → P0–P3 → OWNERS anti-dup → виконання.
