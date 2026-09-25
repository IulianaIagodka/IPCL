# IPCL agent process

Канон у репо: `docs/ops/` (PR #8). Копія в agent store: `/cursor/stores/self/`.

## Перед новою роботою
1. Створити TodoWrite таски на всю роботу.
2. Відкрити `OWNERS.md` — чи тема вже має owner / PR.
3. Викликати `cursor-cloud/list-cloud-agents` (RUNNING/IDLE/WAITING) і перевірити:
   - ті самі ADR / теми / файли / PR;
   - overlapping гілки (`cursor/implement-adr-*`, MVP, UI);
   - дублікати назв агентів.
4. Якщо є конфлікт — не дублювати: задача лише в `BACKLOG.md`.
5. Нова задача → пріоритизація (P0–P3) → `BACKLOG.md` (+ owner у `OWNERS.md` якщо новий) → виконання.

## Щодня о 08:00 Europe/Kyiv
Таймер `daily-plan-0800-kyiv` (cron `0 5 * * *` UTC = 08:00 EEST / узимку `0 6 * * *` для EET).
На пробудженні:
1. Оновити агентів і гілки (`git fetch` + tips + ancestry якщо треба).
2. Оновити `BACKLOG.md` / `OWNERS.md` / `LAST_PLAN.md` (store + `docs/ops` на гілці `cursor/ops-backlog-process-70c7`).
3. Надіслати план користувачу українською: фокус, owners, конфлікти, next, do-not-start.
4. Не стартувати продуктову імплементацію без явного запиту.
5. Перевірити `expiresAt` таймерів; якщо < 48 год — re-subscribe (+ renew-daily-plan-timer).

## Wake на PR (не лише daily)
Підписки: PR **#7** (ADR-004 merge path), PR **#8** (ops docs).
На події: оновити беклог/owners за фактом; коротко повідомити користувача лише якщо змінився пріоритет або з’явився новий конфлікт. Не спамити на кожен коментар.

## Пріоритети
- **P0** — блокери / конфлікти агентів / зламаний main
- **P1** — активна імплементація ADR (owners only)
- **P2** — інтеграція після merge (INT-1, rebase #5)
- **P3** — polish, docs, brand
