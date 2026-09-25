# Ретроспектива: паралельні ADR без вирівнювання

Дата: 2026-09-25  
Роль автора: оркестратор (`docs/ops`, PR #8)

## Короткий висновок

Кілька агентів паралельно імплементували ADR-002…005 (+ MVP, brand, demos) **без спільної merge-черги і без одного owner на overlapping файли**. Результат: розбіжні tips, повторні rebase, obsolete PR (#7/#9), конфлікти на кожному русі `main`, шум від research/demo субагентів.

---

## Що відбулось (факти)

### Паралельні product-стрічки (майже одночасно)

| Стрічка | Агент / гілка | PR | Підсумок |
|---------|---------------|-----|----------|
| MVP vault | Independent context layer `…cc40` | #1 | Merged → база |
| ADR-002 store | Адр 002 | (у main) | Done, package на main |
| ADR-003 security | Алр 003 `…c745` | **#6** | **Merged** пізно, окремо від 004 |
| ADR-004 control plane | 004 `…063d` | #7 | Застряг на старому tip; **не в main** |
| ADR-005 UX | Адр 005 / design `…e7fa` | #5 | Частково в main, PR closed |
| Brand → Eidothea + Fly | Context across AI | #3 | Закритий; бренд зайшов іншим шляхом у main |
| Rebase 003+004 | ops/rebase `…70c7` | **#11** | Синтетичний шлях; зараз **чекає merge** (переважно 004) |
| Port MVP→004 | port `…70c7` | #9 | Superseded #11 |
| Ops / backlog | Щоденне планування | #8 | Оркестрація (пізно відносно хаосу) |

На піку в середовищі було **~20–27** агентів (багато IDLE Map/Summarize/Demo/ERROR), при цьому **не було єдиного merge gate**.

### Як роз’їхались tips

1. **004 (#7)** будувався поверх старого MVP tip і містив власну копію ADR-003 (`16c26c4`), поки **003 (#6)** окремо rebase-ився на Eidothea main і мерджився сам.
2. **main** тим часом рухався: MVP → ADR-005 layout → **Eidothea/Fly** → **ADR-003 (#6)**. Кожен рух ламав відкриті PR.
3. З’явились **паралельні “рятівні” PR**: #9 (port), #11 (rebase 003+004) — замість одного лінійного owner на 003→004.
4. Типові симптоми: `activity_events` vs audit API, `IPCL_*` vs `EIDOTHEA_*`, vault home = control-plane vs MemoryCard dashboard, security page vs integrations split, MCP server name/token copy.

### Вартість невирівнювання

- Повторні merge-конфлікти на одних і тих же файлах (`mcp/*`, `vault/page`, `test-vault`, `integrations`, `crypto`).
- Тести/activity API “латали” після merge (#11 restore activity, потім знову audit з #6).
- Obsolete гілки лишились живими (#7, #9) → ризик що агент знову щось пушне.
- Оркестратор частину часу **сам rebase-ив #11** замість лише координації (роль змішалась).

---

## Root causes

1. **Немає merge queue до старту** — ADR стартували паралельно, хоча 004 залежить від 003/auth, 005 чіпає ті самі UI-поверхні.
2. **Немає OWNERS до старту** — кілька агентів на overlapping paths; research/demo субагенти плодились без gate.
3. **“Один ADR = один агент” без інтеграційного owner** — ніхто спочатку не володів *зведенням на main*.
4. **Brand/deploy (Eidothea) зайшов у mid-flight** — зламав env/naming під час відкритих security/control-plane PR.
5. **Оркестрація з’явилась після факту** — backlog/anti-dup підключили коли розбіжність уже була.

---

## Що спрацювало пізно, але допомогло

- `docs/ops/` + OWNERS + BACKLOG P0–P3 + daily 08:00.
- Явний merge gate: спочатку #6 (003), потім #11 (004).
- Anti-dup правило: одна тема = один owner; research ≠ імплементація.
- Режим **оркестратор ≠ implementer** (зафіксовано в PROCESS).

---

## Рішення на далі (working agreements)

**Зафіксовано як канон:** [RULES.md](./RULES.md)

| # | Правило |
|---|---------|
| 1 | **Серійний merge gate для залежних ADR:** 002 → MVP stable → **003 → 004 → INT-1**; 005/brand лише якщо не перетинає open P0 paths, або після gate. |
| 2 | **Перед новим агентом:** запис у BACKLOG (P0–P3) + рядок у OWNERS + `list-cloud-agents`. Немає рядка → агент не стартує. |
| 3 | **Один integration owner** на “звести на main” (rebase/PR), окремо від feature-агента якщо треба. |
| 4 | **Заборона паралельних PR на ту саму тему** (#6+#7+#9+#11 на 003/004 — антиприклад). |
| 5 | **Brand/env rename** = окремий P0 вікно або freeze інших PR. |
| 6 | **Оркестратор не пише product-код**; лише backlog, owners, плани, briefs. |
| 7 | Після merge теми — **close obsolete PR + pause агента** того ж дня. |
| 8 | IDLE Map/Summarize/Demo не отримують імплементаційних задач. |

---

## Поточний стан після ретро (snapshot)

- **main:** MVP + store + ADR-005 bits + Eidothea/Fly + **ADR-003 (#6)**.
- **Відкритий P0:** human merge **#11** (ADR-004).
- **Прибрати після #11:** close #7, #9; pause 004/003 IDLE.
- **Далі:** призначити **одного** owner на INT-1 (не паралелити з новим UI/brand).

## Do-not-repeat checklist

- [ ] Не стартувати ADR-N+1 поки ADR-N не в main (якщо є залежність)
- [ ] Не тримати 2+ open PR з тим самим ADR у diff
- [ ] Не rebase “тихо” трьома агентами одночасно
- [ ] Не міняти brand/env mid-flight без freeze
