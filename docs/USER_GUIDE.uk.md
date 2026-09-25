# Eidothea — інструкція користувача

**Прод:** https://eidothea.fly.dev/vault/login  
**Ідея:** це не чат. Тут ви керуєте пам’яттю й правами; відповіді AI отримуєте в Cursor / Claude / ChatGPT тощо.

---

## Швидкий старт (5 кроків)

1. Відкрийте `/vault/login` → **Create vault owner** (email + пароль ≥ 8 символів).
2. Пройдіть onboarding `/vault/onboarding`: профіль → проєкт → підключення AI.
3. Заповніть **Profile** (роль, експертиза, інструкції «завжди пам’ятай…»).
4. Створіть **Project** (назва, опис, стек).
5. У **Integrations** видайте MCP-токен → вставте в Cursor/Claude → працюйте в AI, а не в vault.

Чеклист готовності також на головній `/vault`.

---

## Карта екранів

| Куди | Навіщо |
|------|--------|
| `/vault` | Статус control plane, наступний крок |
| `/vault/onboarding` | Чеклист першого налаштування |
| `/vault/profile` | Хто ви: роль, expertise, стиль, recurring instructions |
| `/vault/projects` | Проєкти як scope для пам’яті й permissions |
| `/vault/context` | Перегляд memories + семантичний пошук |
| `/vault/import` | Вставити нотатку/чат → витягнути decisions / preferences |
| `/vault/preview` | Побачити й скопіювати, **що саме** піде в AI |
| `/vault/integrations` | MCP-токени, revoke/rotate, candidate memories |
| `/vault/activity` | Аудит (хто що дивився / шарив) |
| `/vault/settings` | Налаштування акаунта / vault |

---

## Юзер-кейси

### UC-1. Перший вхід (новий vault)
**Актор:** власник vault  
**Кроки:** login → setup owner → onboarding → profile → project → integration  
**Результат:** `nextStep = ready`, можна шукати контекст і підключати AI.

### UC-2. «AI має знати, хто я»
**Кроки:** Profile → display name, role, expertise, communication preferences, recurring instructions → Save.  
**Результат:** довгоживучий профіль у retrieval / preview / MCP.

### UC-3. Окремий контекст на продукт
**Кроки:** Projects → Create (name, description, stack) → відкрити проєкт за потреби.  
**Результат:** memories і permissions можна обмежити цим проєктом.

### UC-4. Залити історію з чату / нотаток
**Кроки:** Import → обрати type (conversation/…) → title → paste text → (опційно) apply extraction → Submit.  
**Результат:** source збережено; з’являються preferences / decisions / knowledge fragments.

### UC-5. Знайти, що vault уже знає
**Кроки:** Context → query («billing decision») → optionally limit to project → Search.  
**Результат:** ranked fragments (ADR-002 retrieve), без чату в UI.

### UC-6. Перед шарингом — перевірити payload
**Кроки:** Preview → destination (Claude/Cursor/…) → query / project → toggles (profile, preferences, decisions, hits) → Preview.  
Якщо є sensitive — acknowledge → Copy export.  
**Результат:** бачите точний текст, який піде назовні; копіюєте в AI вручну.

### UC-7. Підключити Cursor / Claude через MCP
**Кроки:** Integrations → Connect → Copy config JSON → вставити в **Cursor Desktop → Settings → MCP** (не mobile Plugins marketplace).  
**Важливо (Fly/прод):** wizard може дати `"cwd": "/app"` — це шлях контейнера, **не** ваш Mac/PC. Для локального MCP потрібен clone репо і свій абсолютний `cwd` / `IPCL_DATA_DIR`. Поки це не виправлено: **UC-6 Preview → Copy** у чат Cursor.  
**Результат:** AI-інструмент читає лише дозволений контекст (локальний SQLite).

### UC-8. AI запропонував новий memory (WRITE)
**Передумова:** integration у режимі READ_WRITE.  
**Кроки:** AI пише candidate → Integrations → Candidates → Approve / Reject.  
**Результат:** у vault потрапляє лише явно схвалене (AI output ≠ memory за замовчуванням).

### UC-9. Відкликати доступ
**Кроки:** Integrations → Revoke (або Rotate token).  
**Результат:** старий токен недійсний; аудит у Activity.

### UC-10. День-за-днем (після setup)
1. За потреби — Import або правки Profile/Project.  
2. Preview або MCP у робочому AI.  
3. Працювати в Cursor/Claude; у vault повертатися лише керувати пам’яттю/правами.

---

## Чого додаток **не** робить

- Не є чатом з LLM у браузері.
- Не пише AI-відповіді назад у memory без явного save / extraction / approve.
- Не віддає `RESTRICTED` у звичайний search / MCP / export (див. ADR-003).

---

## Безпека (коротко для юзера)

- Сесія: cookie після login.
- Інтеграції: за замовчуванням **READ_ONLY**, least privilege.
- Sensitive share в Preview потребує підтвердження.
- Токен показується один раз при create/rotate — збережіть одразу.

---

## Troubleshooting

| Симптом | Що зробити |
|---------|------------|
| Редірект на login | Сесія зникла → увійти знову |
| Onboarding «висить» на кроці | Refresh checklist; переконайтесь, що профіль/проєкт/інтеграція збережені |
| MCP «порожній» контекст | Перевірте scopes, project allow-list, classification; зробіть Preview з тим самим query |
| Після деплою немає даних | На Fly дані на volume `/data`; локальний `data/` — окремий файл |
