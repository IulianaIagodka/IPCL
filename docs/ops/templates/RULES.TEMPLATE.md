# <PROJECT> Rules (канон)

Оновлено: YYYY-MM-DD  
Канон у репо: `docs/ops/`.

Ці правила обов’язкові для людини й усіх агентів. Порушення → задача лише в BACKLOG як P0 конфлікт, не «тихо продовжити».

---

## 1. Ролі

| Роль | Хто | Робить | Не робить |
|------|-----|--------|-----------|
| **Оркестратор** | агент ops | BACKLOG P0–P3, OWNERS, anti-dup, план 08:00 Kyiv, briefs, оновлення docs/ops на delta | product-код, merge без OK людини, spam без delta |
| **Theme owner** | один агент на тему | імплементація своєї теми в своєму PR | чужі теми, другий PR на ту саму тему |
| **Integration owner** | один агент (може ≠ feature) | звести тему на актуальний `main` (один rebase/PR) | паралельні «рятівні» PR на ту ж тему |
| **Людина** | ти | merge OK, pause overlapping, пріоритет P0 | — |

---

## 2. Merge gate (залежні стрічки — СЕРІЙНО)

Порядок (заповни під проєкт):

1. `<Theme A>` → merge
2. `<Theme B>` → merge
3. `<Integration>` → merge
4. Brand / polish — лише якщо **не** перетинає open P0 paths

**Заборонено:** стартувати залежну тему в код, поки попередня не в `main`.  
**Заборонено:** 2+ відкритих PR з тією самою темою в diff.

---

## 3. Перед новим агентом / новою роботою

1. Запис у **BACKLOG.md** з пріоритетом **P0–P3**
2. Рядок у **OWNERS.md** (тема → owner → branch/PR)
3. `list-cloud-agents` (RUNNING / IDLE / WAITING) — anti-dup
4. Якщо тема вже має owner або overlapping PR → **не стартувати**
5. Немає рядка в OWNERS/BACKLOG → **агент не стартує**

---

## 4. Одна тема = один owner = один активний PR

- Одна тема → **один** owner-агент.
- Один активний PR на тему; obsolete PR закриваються **того ж дня** після merge/supersede.
- Після merge теми: **close obsolete PR + pause/archive** агента-owner.
- Research / Map / Demo агенти → **не** отримують імплементаційних задач.

---

## 5. Brand / env / rename

Зміна бренду або env = **окреме P0-вікно** або **freeze** інших open PR.  
Не робити mid-flight під час відкритих security/core PR.

---

## 6. Пріоритети (P0–P3)

| Рівень | Що |
|--------|----|
| **P0** | блокери, конфлікти агентів, зламаний main, merge gate, freeze |
| **P1** | активна імплементація — лише theme owner |
| **P2** | інтеграція після gate |
| **P3** | docs, polish, brand (поза P0 paths) |

Нова задача: **пріоритет → BACKLOG → OWNERS → виконання owner-ом**.

---

## 7. Merge і команди людини

- **Жоден агент не merge в `main` без явного OK** (`merge #N`).
- Оркестратор не закриває чужі PR без команди (`close #N`).
- Команди: `merge #N`, `close #N`, `pause goal`, нова задача текстом → у BACKLOG.

---

## 8. Оркестратор: wake і тиша

| Подія | Дія |
|-------|-----|
| 08:00 Europe/Kyiv | короткий план: фокус / owners / конфлікти / next / do-not-start |
| PR/agent **delta** | оновити BACKLOG/OWNERS/ACTION |
| Goal continue, tips+agents **ті самі** | **тиша, 0 commits** |

---

## 9. Що РОБИТИ

- [ ] Одна merge-черга в BACKLOG
- [ ] Перед агентом: BACKLOG + OWNERS + list-cloud-agents
- [ ] Після merge: close obsolete + pause owner
- [ ] Daily план о 08:00 Kyiv
- [ ] Конфлікт агентів → P0 у ACTION_REQUIRED

## 10. Чого НЕ робити

- [ ] Не стартувати 2+ агентів на ту саму тему
- [ ] Не тримати паралельні PR на одну тему «про всяк випадок»
- [ ] Не rebase трьома агентами одночасно на той самий stack
- [ ] Не міняти brand/env mid-flight без freeze
- [ ] Не merge без OK людини
- [ ] Не плодити commits на goal-continue без delta
