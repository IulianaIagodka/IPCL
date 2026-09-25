# Ops templates — скопіюй у новий репо

1. Створи `docs/ops/` у новому проєкті.
2. Скопіюй кожен `*.TEMPLATE.md` → відповідний файл без суфікса:

| Шаблон | → файл |
|--------|--------|
| `RULES.TEMPLATE.md` | `docs/ops/RULES.md` |
| `PROCESS.TEMPLATE.md` | `docs/ops/PROCESS.md` |
| `OWNERS.TEMPLATE.md` | `docs/ops/OWNERS.md` |
| `BACKLOG.TEMPLATE.md` | `docs/ops/BACKLOG.md` |
| `ACTION_REQUIRED.TEMPLATE.md` | `docs/ops/ACTION_REQUIRED.md` |
| `WAIT_STATE.TEMPLATE.md` | `docs/ops/WAIT_STATE.md` |
| `LAST_PLAN.TEMPLATE.md` | `docs/ops/LAST_PLAN.md` |
| `README.TEMPLATE.md` | `docs/ops/README.md` |

3. Скопіюй також [`../TEAM_SETUP.md`](../TEAM_SETUP.md) як є (або адаптовану копію).
4. Заміни плейсхолдери `<PROJECT>`, `<theme>`, тощо.
5. Запусти оркестратора за [TEAM_SETUP §3](../TEAM_SETUP.md).
