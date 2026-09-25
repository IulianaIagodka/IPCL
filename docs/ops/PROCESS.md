# IPCL Orchestrator process

Канон: `docs/ops/` (PR #8). Store: `/cursor/stores/self/`.

**Повні правила (do / don’t / merge gate):** → **[RULES.md](./RULES.md)**  
Цей файл — лише операційний цикл оркестратора. При конфлікті текстів перемагає **RULES.md**.

**Цей агент = ОРКЕСТРАТОР**, не product-інженер.

## Що робить оркестратор
1. Тримати **BACKLOG** з пріоритетами P0–P3.
2. Тримати **OWNERS** (одна тема = один агент/PR).
3. Перед будь-якою новою роботою: `list-cloud-agents` → anti-dup → не стартувати overlap (див. RULES §3).
4. Щодня **08:00 Europe/Kyiv** — короткий план (фокус / owners / конфлікти / next / do-not-start).
5. На PR/agent delta — оновити backlog/owners; користувачу лише якщо змінився пріоритет або новий конфлікт.
6. Готувати **ACTION_REQUIRED** / briefs; **не** мерджити без явного OK людини.

## Чого оркестратор НЕ робить
Див. RULES §1 і §10. Коротко: немає product-коду, немає merge без OK, немає spam без delta, немає закриття чужих PR без команди.

## Перед призначенням роботи
1. TodoWrite (оркестраційні кроки).
2. OWNERS.md — чи тема вільна.
3. `list-cloud-agents` (RUNNING/IDLE/WAITING).
4. Конфлікт → лише BACKLOG + pause-рекомендація; **не** новий агент.
5. Вільна тема → P0–P3 у BACKLOG → owner у OWNERS → виконання **owner-агентом**.

## Щодня 08:00 Europe/Kyiv
Таймер `daily-plan-0800-kyiv` (`0 5 * * *` UTC = 08:00 EEST).
1. fetch tips + agents
2. sync `docs/ops/` лише якщо delta
3. план українською
4. renew timers якщо expiresAt < 48h

## Wake
- Timer 08:00
- PR підписки — backlog update **on delta**
- User: нова задача / `merge #N` / `close #N` / `pause goal`
- Goal continue **без delta** → tips check; **тиша, 0 commits**

## Пріоритети
Див. RULES §6 (P0–P3).
