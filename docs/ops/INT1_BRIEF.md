# INT-1 brief — ADR-002 library ↔ vault/control-plane

Статус: **готово до виконання після merge #7** (не стартувати зараз — overlapping + #7 ще не в main).  
Пріоритет: P2 → **P1** одразу після merge #7.  
Owner (майбутній): окремий агент `cursor/int1-adr002-vault-…` — перевірити OWNERS перед стартом.

## Проблема
Два паралельні світи:

| Світ | Де | Канонічний об’єкт | API |
|------|-----|-------------------|-----|
| ADR-002 library | `main` → `src/memories.ts`, `store.ts`, `retrieve.ts`, `assemble.ts` | **Memory** + Source + Project | `createContextStore()`, `assembleContext()` |
| Vault / ADR-003/004 | PR #7 → `src/lib/vault.ts` + `src/service/context-service.ts` | Context items + classification + integrations | HTTP `/api/*` + Context Service façade |

`#7` **не містить** `src/memories.ts` / `createContextStore`. Vault має власний SQLite/`search.ts`.

## Ціль INT-1
Один storage+retrieval шлях: Context Service викликає ADR-002 primitives; UI/MCP лишаються за façade (ADR-004).

## Рекомендовані кроки (після merge #7)
1. **Bring-up:** скопіювати/перенести ADR-002 modules з `main` у пакет (напр. `src/core/` або `packages/context-store`), без ламання Next aliases.
2. **Adapter:** у `context-service` / `vault` замінити прямі writes на:
   - import → `createSource` + `extractMemoriesFromText` + `createMemory`
   - search → `retrieveMemories` (+ classification filter з ADR-003)
   - preview/export → `assembleContext` у token budget
3. **Conflicts:** підключити `detectConflicts` / `requiresConfirmation` до candidate flow (`/api/candidates`).
4. **Security bridge:** RESTRICTED/SENSITIVE (vault policy) ↔ memory scope/metadata ADR-002.
5. **Tests:** перенести `tests/adr-002.test.ts` + розширити `scripts/test-vault.ts` на hybrid path.
6. **Do not:** паралельний другий SQLite schema назавжди — міграція або dual-read→single-write.

## Антидубль
Не стартувати INT-1 поки:
- #7 не змерджено (або явно assigned на гілку від #7 tip);
- Open control plane / Demo 003 / Open landing ще пишуть у ті самі UI/API файли.

## Acceptance
- [ ] One DB path for memories
- [ ] `/api/search` і `/api/preview` йдуть через ADR-002 retrieve/assemble
- [ ] ADR-002 unit tests + vault tests green
- [ ] OWNERS оновлено: INT-1 owner + Done
