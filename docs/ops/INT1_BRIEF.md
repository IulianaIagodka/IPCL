# INT-1 brief — ADR-002 library ↔ vault/control-plane

**Status:** IN PROGRESS → completing one storage path  
**Priority:** P1  
**Owner:** Context store wiring (`bc-01a0d840-…4e11`)  
**Rule:** one PR · one agent · no brand/UI/ADR-003/004 side work  
**PR:** https://github.com/IulianaIagodka/IPCL/pull/12

## Problem

Two parallel worlds after ADR-002 and ADR-003/004 on main:

| World | Location | Canonical object | API |
|------|----------|------------------|-----|
| ADR-002 library | `packages/context-store` | Memory + Source + Project | `createContextStore()`, retrieve/assemble |
| Vault / Context Service | `src/lib/vault.ts` + `src/service` | Context items + classification | HTTP `/api/*` + façade |

## Target

**One storage + retrieval path:** Context Service / vault call ADR-002 primitives; UI/MCP stay behind façade (ADR-004).

## Implemented

- Adapter: dual-write vault → ADR-002 memories (`src/lib/memory-bridge.ts`)
- `/api/search` → `retrieveMemories` + ADR-003 policy filters
- `/api/preview` → `assembleContext` within token budget
- Conflicts on candidate flow (`detectConflicts` / `requiresConfirmation`)
- Classification bridge: `NORMAL|SENSITIVE|RESTRICTED` ↔ `normal|sensitive|restricted`
- Link table `adr_memory_links` (vault ref ↔ memory id)
- **One SQLite file:** `data/context-vault.sqlite` — vault + ADR-002 (`adr_sources`, `adr_projects`, `memories`, …) via `bindSharedDb`

## Acceptance

- [x] One DB path for memories (`context-vault.sqlite` shared connection)
- [x] `/api/search` and `/api/preview` go through ADR-002 retrieve/assemble
- [x] ADR-002 unit tests + vault tests green
- [x] OWNERS updated: INT-1 owner

## Do not

- Parallel second SQLite file (`context-memories.sqlite` removed)
- Brand / UI / ADR-003/004 feature work in this PR
