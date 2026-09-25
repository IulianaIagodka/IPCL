# ACTION REQUIRED — після merge #1

Оновлено: 2026-09-25 ~14:40 Europe/Kyiv

## Сталося
- **#1 merged** → main має vault MVP + ADR-005 history + `packages/context-store`
- **#5 closed** (без merge) — UX уже в main history
- **#7** розійшовся з main: потрібен rebase ADR-003/004 на новий main

## Зроби / підтвердь
1. Owner `004`: **rebase #7 onto main** (не мерджити #7 as-is)
2. Після цього — INT-1 (wire context-store)
3. Brand #3 тримати

Напиши `rebase #7` — підготую гілку від main з cherry-pick ADR-003/004.
