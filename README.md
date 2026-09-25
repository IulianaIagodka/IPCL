# IPCL

Independent Portable Context Layer — stop explaining yourself to AI.

## ADR-002 implementation

This repository implements **ADR-002: structured memory + semantic index + immutable sources**.

```text
RAW SOURCE
    ↓
MEMORY EXTRACTION
    ↓
STRUCTURED MEMORY
    ↓
SEMANTIC INDEX
```

Canonical object is a **Memory** (one reusable idea with scope, freshness, and provenance). Documents and chats are sources, not the product object.

### Layout

| Path | Role |
|------|------|
| `docs/adr/` | Architecture decision records |
| `src/` | ADR-002 context store (sources, memories, index, retrieval, assembly) |
| `tests/` | Unit tests |
| `scripts/` | Demo + retrieval benchmark |

### Quick start

```bash
npm install
npm test
npm run benchmark
npm run demo
```

SQLite data defaults to `./data/ipcl.sqlite` (override with `IPCL_DATA_DIR`).

### Usage

```ts
import { createContextStore, projectScope } from "./src/index.js";

const store = createContextStore();
const project = store.createProject({ name: "Paypace" });

store.importSource({
  type: "conversation",
  title: "Pricing discussion",
  scope: project.scope,
  content: "We decided on monthly and yearly subscriptions.",
});

const pack = store.assemble({
  query: "What pricing model did we choose for Paypace?",
  scope: project.scope,
  tokenBudget: 3000,
});

console.log(pack.text); // ephemeral — do not write back as memory
```

### Rules enforced

1. **Temporal memory** — updates supersede; history is retained.
2. **Conflicts need confirmation** — important decisions are not silently overwritten.
3. **AI output ≠ memory** — only explicit save, extraction from user sources, or approved suggestions.
4. **Embeddings are an index** — statements + metadata + provenance remain canonical.
5. **Context packages are ephemeral** — assembled per request within a token budget.

See `docs/adr/ADR-002-context-storage-retrieval.md` for the full decision.
