# INT-1 brief — ADR-002 library ↔ vault/control-plane

**Status:** Done (wired on `cursor/int1-wire-context-store-4e11`)  
**Priority:** P1  
**Owner:** Context store wiring (`bc-01a0d840-…4e11`)

## Problem (solved)

Two parallel worlds existed after ADR-002 and ADR-003/004 landed on main:

| World | Location | Canonical object | API |
|------|----------|------------------|-----|
| ADR-002 library | `packages/context-store` | Memory + Source + Project | `createContextStore()`, `retrieveMemories()`, `assembleContext()` |
| Vault / Context Service | `src/lib/vault.ts` + `src/service` | Context items + classification + integrations | HTTP `/api/*` + façade |

## Target (implemented)

One retrieval path for memories:

- Dual-write vault entities → ADR-002 memories via `src/lib/memory-bridge.ts`
- `/api/search` → `retrieveMemories` (ADR-002) + ADR-003 policy filters
- `/api/preview` / export hits → `assembleContext` (ADR-002) within token budget
- Candidate writes run `detectConflicts` / `requiresConfirmation`
- Classification bridge: `NORMAL|SENSITIVE|RESTRICTED` ↔ `normal|sensitive|restricted`
- Link table `adr_memory_links` maps vault refs ↔ memory ids
- Memory index file: `data/context-memories.sqlite` (same `EIDOTHEA_DATA_DIR` / `IPCL_DATA_DIR`)

UI/MCP remain behind the Context Service façade (ADR-004).

## Acceptance

- [x] One retrieval path for memories (ADR-002)
- [x] `/api/search` and `/api/preview` go through retrieve/assemble
- [x] ADR-002 unit tests + vault tests green
- [x] OWNERS updated: INT-1 Done

## Follow-up (not blocking)

- Full single-SQLite schema merge (drop dual files) once control-plane tables absorb ADR-002 source/project shapes
- Route remaining `/api/*` call sites through `@/service` only
