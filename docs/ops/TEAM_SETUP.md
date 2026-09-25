# Team setup — оркестратор + theme owners

Шаблон для **нових проєктів**: як стартувати той самий сетап, що на IPCL.  
Канон правил (деталі): [RULES.md](./RULES.md). Цей файл — **bootstrap playbook**.

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

- **Оркестратор** не пише product-код.
- **Theme owner** робить один PR на свою тему.
- **Ти** даєш `merge #N` / `start …` / пріоритети.

---

## 2. Що створити в репо (день 0)

Каталог `docs/ops/` (або `.cursor/ops/` — головне одне місце):

| Файл | Навіщо |
|------|--------|
| `RULES.md` | канон ролей, merge gate, do/don’t |
| `PROCESS.md` | цикл оркестратора (daily, wakes) |
| `OWNERS.md` | таблиця тема → агент → PR |
| `BACKLOG.md` | P0–P3 + черга merge |
| `ACTION_REQUIRED.md` | що треба від тебе зараз |
| `WAIT_STATE.md` | коли агент мовчить / які gates |
| `LAST_PLAN.md` | останній daily план |
| `TEAM_SETUP.md` | цей playbook |
| `briefs/…` | за потреби, бриф на велику тему |

Скопіюй структуру з IPCL `docs/ops/` і вичисти IPCL-специфіку (номери PR, ADR).

Гілка оркестратора: `cursor/ops-backlog-…` → draft PR «ops: backlog & orchestration».

---

## 3. Запуск оркестратора (Cloud Agent)

1. **New Cloud Agent** на репо, гілка від `main`.
2. Назва: `Orchestrator` / `Щоденне планування`.
3. Перший промпт (встав як є, підстав шляхи):

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

4. Підписки оркестратора:
   - timer `0 5 * * *` UTC (= 08:00 Kyiv EEST) — daily plan
   - PR watch на ops-PR + активні product PR
5. Зафіксуй агента в `OWNERS.md` як Orchestration owner.

---

## 4. Як ти кидаєш задачі

Пишеш **оркестратору** (цей чат), не одразу 5 product-агентам.

| Команда | Що станеться |
|---------|----------------|
| довільний опис фічі | → P0–P3 у BACKLOG, пропозиція owner / «створи агента X» |
| `start <тема> <ім’я агента>` | → рядок у OWNERS, sole owner |
| `merge #N` | → оркестратор мерджить (або каже як), оновлює backlog |
| `close #N` | → закрити obsolete PR |
| `pause goal` | → менше шуму від continuous goal |

**Не** стартуй 2 Cloud Agents на одну тему «про всяк випадок».

---

## 5. Як стартує theme owner

Після того як оркестратор сказав «створи агента»:

1. New Cloud Agent від **актуального `main`**.
2. Назва = тема (`INT-1 wire store`, `ADR-003 security`, …).
3. Перший промпт:

```text
Ти єдиний theme owner теми: <ТЕМА>.
Прочитай docs/ops/OWNERS.md і docs/ops/RULES.md.
Brief (якщо є): docs/ops/<BRIEF>.md
Один PR. Спочатку list-cloud-agents — якщо вже є owner на цю тему, зупинись.
Не чіпай чужі теми / brand mid-flight без freeze.
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

---

## 8. Checklist «новий проєкт за 15 хв»

- [ ] `docs/ops/` з файлами з §2
- [ ] RULES адаптовані під проєкт (без чужих ADR)
- [ ] Orchestrator agent + CreateGoal + daily timer 08:00
- [ ] OWNERS: рядок Orchestration
- [ ] BACKLOG: порожня черга або перший P0
- [ ] Ти знаєш команди: `start` / `merge` / `close` / `pause goal`
- [ ] Домовлено: одна тема = один агент = один PR

---

## 9. Антиприклад (не повторювати)

IPCL на старті: паралельні ADR-002…005 + MVP + brand без OWNERS і без merge queue → роз’їзд tips, зайві PR, повторні конфлікти.  
Див. [RETRO_2026-09-25_PARALLEL_ADR.md](./RETRO_2026-09-25_PARALLEL_ADR.md).

---

## 10. Мінімальний шаблон OWNERS (скопіюй)

```markdown
| Тема | Owner | Branch / PR | Статус |
|------|-------|-------------|--------|
| Orchestration | <agent name / bcId> | cursor/ops-… / #N | RUNNING |
| <Theme A> | unassigned | — | Ready |
```

## 11. Мінімальний шаблон BACKLOG

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

---

**Підсумок:** на новому проєкті спочатку підніми **оркестратора + docs/ops**, потім кидай задачі йому; product-агентів — по одному на тему після запису в OWNERS.
