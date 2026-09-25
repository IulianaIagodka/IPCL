# WAIT STATE — orchestrator gates

Оновлено: YYYY-MM-DD

Канон: **[RULES.md](./RULES.md)**. Product-код оркестратором — стоп.

## Gates
- …

## Wake
| Подія | Дія |
|-------|-----|
| 08:00 | план |
| PR від owner | оновити BACKLOG/OWNERS |
| Другий агент на ту саму тему | **конфлікт P0** — stop |
| Goal continue без delta | тиша |
| User `merge #N` | лише після явного OK |
