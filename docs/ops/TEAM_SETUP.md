# Team setup — оркестратор + theme owners

**Bootstrap playbook для нового проєкту.** Скопіюй цей сетап → кидай задачі оркестратору → product-агенти по одному на тему.

Канон правил (деталі для працюючого репо): [RULES.md](./RULES.md).  
Порожні шаблони для копіювання: [`templates/`](./templates/).

---

## 1. Ідея за 30 секунд

```
Ти (людина) ──кидаєш задачі──► Оркестратор-агент
                                      │
                                      ├─ BACKLOG P0–P3
                                      ├─ OWNERS (1 тема = 1 агент)
                                      ├─ anti-dup (list-cloud-agents)
                                      └─ призначає Theme owner
                                              │
                                              ▼
                                         1 PR → твій merge OK
```

| Роль | Робить | Не робить |
|------|--------|-----------|
| **Ти** | `start` / `merge #N` / `close #N` / пріоритети | ганяєш 5 агентів паралельно на одну тему |
| **Оркестратор** | BACKLOG, OWNERS, anti-dup, daily 08:00, briefs | product-код, merge без твого OK |
| **Theme owner** | один PR на свою тему | чужі теми, другий PR «про всяк випадок» |

---

## 2. День 0 — файли в репо

Створи каталог `docs/ops/` (або скопіюй `templates/` → `docs/ops/` і перейменуй `*.TEMPLATE.md`).

| Файл | Навіщо |
|------|--------|
| `RULES.md` | канон ролей, merge gate, do/don’t |
| `PROCESS.md` | цикл оркестратора (daily, wakes) |
| `OWNERS.md` | таблиця тема → агент → PR |
| `BACKLOG.md` | P0–P3 + черга merge |
| `ACTION_REQUIRED.md` | що треба від тебе зараз |
| `WAIT_STATE.md` | gates / коли агент мовчить |
| `LAST_PLAN.md` | останній daily план |
| `TEAM_SETUP.md` | цей playbook (можна лишити як є) |
| `README.md` | індекс файлів |
| `briefs/…` | за потреби, бриф на велику тему |

Гілка оркестратора: `cursor/ops-backlog-<suffix>` → draft PR «ops: backlog & orchestration».

**З IPCL:** скопіюй `docs/ops/` і вичисти IPCL-специфіку (номери PR, ADR-00N, bcId). Або візьми чисті файли з [`templates/`](./templates/).

---

## 3. День 0 — запуск оркестратора (Cloud Agent)

1. **New Cloud Agent** на репо, гілка від `main`.
2. Назва: `Orchestrator` / `Щоденне планування`.
3. Перший промпт (підстав шляхи / назву репо):

```text
Ти ОРКЕСТРАТОР цього репо, не product-інженер.

Канон: docs/ops/RULES.md і docs/ops/TEAM_SETUP.md.
Ведіть BACKLOG (P0–P3), OWNERS, anti-dup через list-cloud-agents.
Щодня о 08:00 Europe/Kyiv — короткий план (фокус / owners / конфлікти / next / do-not-start).
На PR/agent delta — оновлюй docs/ops; без delta на goal-continue = тиша, 0 commits.
Не імплементуй product-код. Не merge в main без явного OK людини («merge #N»).
Нові задачі від людини: пріоритет → BACKLOG → OWNERS → theme owner (не ти).
CreateGoal з цим objective і тримай активним, поки людина не скаже pause goal.
```

4. Підписки:
   - timer `0 5 * * *` UTC (= 08:00 Kyiv EEST) — daily plan
   - PR watch на ops-PR + активні product PR
5. Запиши агента в `OWNERS.md` як Orchestration owner.

---

## 4. Як ти кидаєш задачі

Пишеш **оркестратору** (один чат), не одразу кільком product-агентам.

| Команда | Що станеться |
|---------|----------------|
| довільний опис фічі / бага | → P0–P3 у BACKLOG, пропозиція owner / «створи агента X» |
| `start <тема> <ім’я агента>` | → рядок у OWNERS, sole owner |
| `merge #N` | → оркестратор мерджить (або каже як), оновлює backlog |
| `close #N` | → закрити obsolete PR |
| `pause goal` | → менше шуму від continuous goal |

**Не** стартуй 2 Cloud Agents на одну тему «про всяк випадок».

---

## 5. Як стартує theme owner

Після того як оркестратор сказав «створи агента»:

1. New Cloud Agent від **актуального `main`**.
2. Назва = тема (`Auth`, `Billing API`, `INT-1 wire store`, …).
3. Перший промпт:

```text
Ти єдиний theme owner теми: <ТЕМА>.
Прочитай docs/ops/OWNERS.md і docs/ops/RULES.md.
Brief (якщо є): docs/ops/briefs/<BRIEF>.md
Один PR. Спочатку list-cloud-agents — якщо вже є owner на цю тему, зупинись.
Не чіпай чужі теми / rename env mid-flight без freeze.
```

4. Напиши оркестратору: `start <ТЕМА> <точна назва агента>` — він зареєструє owner.

---

## 6. Merge gate (залежності)

Якщо робота **залежна** (API → UI → інтеграція):

```
A merged to main  →  B starts  →  B merged  →  C (integration) starts
```

Паралельно можна лише **незалежні** теми (різні paths, різні owners).  
Brand / rename env = окреме вікно або **freeze** інших PR.

Після merge теми **того ж дня**: close obsolete PR + archive IDLE агента тієї теми.

---

## 7. Пріоритети

| | |
|---|---|
| **P0** | блокери, конфлікти агентів, зламаний main, merge gate |
| **P1** | активна імплементація (theme owner) |
| **P2** | інтеграція після gate |
| **P3** | docs, polish, brand поза P0 paths |

Нова задача завжди: **пріоритет → BACKLOG → OWNERS → виконання owner-ом**.

---

## 8. Checklist «новий проєкт за 15 хв»

- [ ] `docs/ops/` з файлами з §2 (або з `templates/`)
- [ ] RULES адаптовані під проєкт (свої теми / merge gate, без чужих ADR)
- [ ] Orchestrator agent + CreateGoal + daily timer 08:00
- [ ] OWNERS: рядок Orchestration
- [ ] BACKLOG: порожня черга або перший P0
- [ ] Ти знаєш команди: `start` / `merge` / `close` / `pause goal`
- [ ] Домовлено: одна тема = один агент = один PR

---

## 9. Антиприклад (не повторювати)

Паралельні великі теми + MVP + brand без OWNERS і без merge queue → роз’їзд tips, зайві PR, повторні конфлікти.  
IPCL: [RETRO_2026-09-25_PARALLEL_ADR.md](./RETRO_2026-09-25_PARALLEL_ADR.md).

---

## 10. Мінімальні шаблони (inline)

### OWNERS

```markdown
| Тема | Owner | Branch / PR | Статус |
|------|-------|-------------|--------|
| Orchestration | <agent name / bcId> | cursor/ops-… / #N | RUNNING |
| <Theme A> | unassigned | — | Ready |
```

### BACKLOG

```markdown
## P0
- [ ] …

## P1
- [ ] …

## P2
- [ ] …

## P3
- [ ] …
```

Повні файли: [`templates/`](./templates/).

---

**Підсумок:** на новому проєкті спочатку підніми **оркестратора + docs/ops**, потім кидай задачі йому; product-агентів — по одному на тему після запису в OWNERS.
