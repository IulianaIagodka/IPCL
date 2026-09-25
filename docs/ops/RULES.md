# IPCL Rules (канон)

Оновлено: 2026-09-25  
Джерело: ретро паралельних ADR + оркестраторський режим.  
Канон у репо: `docs/ops/` (PR #8). Копія: `/cursor/stores/self/`.

Ці правила обов’язкові для людини й усіх агентів. Порушення → задача лише в BACKLOG як P0 конфлікт, не «тихо продовжити».

---

## 1. Ролі

| Роль | Хто | Робить | Не робить |
|------|-----|--------|-----------|
| **Оркестратор** | агент ops `…70c7` / PR #8 | BACKLOG P0–P3, OWNERS, anti-dup, план 08:00 Kyiv, briefs, оновлення docs/ops на delta | product-код (ADR/UI/brand/INT-1), merge без OK людини, rebase «за всіх», spam без delta |
| **Theme owner** | один агент на тему | імплементація своєї теми в своєму PR | чужі ADR, другий PR на ту саму тему |
| **Integration owner** | один агент (може ≠ feature) | звести тему на актуальний `main` (один rebase/PR) | паралельні «рятівні» PR на ту ж тему |
| **Людина** | ти | merge OK, pause overlapping, пріоритет P0 | — |

---

## 2. Merge gate (залежні стрічки — СЕРІЙНО)

Порядок:

1. ADR-002 / store stable на `main`
2. MVP vault stable на `main`
3. **ADR-003** → merge
4. **ADR-004** → merge (**DONE** #11 → `bbd3eba`)
5. **INT-1** (wire `packages/context-store`) — **DONE** #12 → `main@7da1b79`
6. ADR-005 / brand / polish — лише якщо **не** перетинає open P0 paths (ADR-005 вже на main)

**Заборонено:** стартувати ADR-N+1 у код, поки залежний ADR-N не в `main`.

**Заборонено:** 2+ відкритих PR з тим самим ADR у diff (антиприклад: #6+#7+#9+#11).

---

## 3. Перед новим агентом / новою роботою

Обов’язково, у цьому порядку:

1. Запис у **BACKLOG.md** з пріоритетом **P0–P3**
2. Рядок у **OWNERS.md** (тема → owner → branch/PR)
3. `list-cloud-agents` (RUNNING / IDLE / WAITING) — anti-dup
4. Якщо тема вже має owner або overlapping PR → **не стартувати**; лише BACKLOG + pause-рекомендація
5. Немає рядка в OWNERS/BACKLOG → **агент не стартує**

TodoWrite — на оркестраційні або owner-кроки до виконання.

---

## 4. Одна тема = один owner = один активний PR

- Одна тема (ADR-00N, brand, INT-1, MVP, ops) → **один** owner-агент.
- Один активний PR на тему; obsolete PR закриваються **того ж дня** після merge/supersede.
- Після merge теми: **close obsolete PR + pause/archive** агента-owner.
- Research / Map / Extract / Summarize / Demo агенти → **не** отримують імплементаційних задач.

---

## 5. Brand / env / rename

- Зміна бренду або env (`IPCL_*` ↔ `EIDOTHEA_*`, домени, Fly) = **окреме P0-вікно** або **freeze** інших open PR.
- Не робити brand/env mid-flight під час відкритих security/control-plane PR.

---

## 6. Пріоритети (P0–P3)

| Рівень | Що |
|--------|----|
| **P0** | блокери, конфлікти агентів, зламаний main, merge gate, freeze |
| **P1** | активна імплементація ADR — лише theme owner |
| **P2** | інтеграція після gate (INT-1) |
| **P3** | docs, polish, brand (поза P0 paths) |

Нова задача завжди: **пріоритет → BACKLOG → OWNERS → виконання owner-ом**.

---

## 7. Merge і команди людини

- **Жоден агент не merge в `main` без явного OK** (`merge #N` / approve в UI).
- Оркестратор не закриває чужі PR без команди (`close #N`).
- Корисні команди: `merge #11`, `close #7 #9`, `pause goal`, нова задача текстом → у BACKLOG.

---

## 8. Оркестратор: wake і тиша

| Подія | Дія |
|-------|-----|
| 08:00 Europe/Kyiv (`0 5 * * *` UTC) | короткий план: фокус / owners / конфлікти / next / do-not-start |
| PR/agent **delta** | оновити BACKLOG/OWNERS/ACTION; користувачу — лише якщо змінився пріоритет або новий конфлікт |
| Goal continue, tips+agents **ті самі** | **тиша, 0 commits** |
| Власний synchronize свого PR | ігнор |

Таймери: `daily-plan-0800-kyiv` + renew; якщо `expiresAt` < 48h — re-subscribe.

---

## 9. Що РОБИТИ (checklist)

- [ ] Тримати одну merge-чергу в BACKLOG
- [ ] Перед агентом: BACKLOG + OWNERS + list-cloud-agents
- [ ] Після merge: close obsolete + pause owner
- [ ] INT-1 — один owner, після #11
- [ ] Daily план о 08:00 Kyiv
- [ ] Конфлікт агентів → P0 у ACTION_REQUIRED, не дублювати роботу

---

## 10. Чого НЕ робити (checklist)

- [ ] Не стартувати 2+ агентів на той самий ADR/UI
- [ ] Не тримати паралельні PR на одну тему «про всяк випадок»
- [ ] Не rebase трьома агентами одночасно на той самий stack
- [ ] Не міняти brand/env mid-flight без freeze
- [ ] Не давати імплементацію Map/Summarize/Demo
- [ ] Не стартувати INT-1 / новий ADR до закриття поточного gate
- [ ] Не merge без OK людини
- [ ] Не плодити docs/commits на goal-continue без delta

---

Пов’язані файли

| Файл | Роль |
|------|------|
| [TEAM_SETUP.md](./TEAM_SETUP.md) | **Bootstrap нового проєкту з цим сетапом** |
| [templates/](./templates/) | Порожні файли `docs/ops/` для копіювання в інший репо |
| [PROCESS.md](./PROCESS.md) | операційний цикл оркестратора |
| [OWNERS.md](./OWNERS.md) | реєстр owners |
| [BACKLOG.md](./BACKLOG.md) | P0–P3 + черга |
| [ACTION_REQUIRED.md](./ACTION_REQUIRED.md) | рішення від людини |
| [WAIT_STATE.md](./WAIT_STATE.md) | gates / тиша |
| [RETRO_2026-09-25_PARALLEL_ADR.md](./RETRO_2026-09-25_PARALLEL_ADR.md) | чому ці правила з’явились |
