# Eidothea

**https://eidothea.app**

**Stop explaining yourself.**

*One memory. Every AI.*  
Your context follows you across AI.

Eidothea is a vendor-independent context layer: you keep profile, projects, decisions, preferences, and knowledge in one place, then make only the relevant fragments available to ChatGPT, Claude, Cursor, Codex, Gemini, or any other AI client.

## Architecture

- ADR index: [docs/adr/](docs/adr/)
- Visual system: [ADR-005](docs/adr/ADR-005-product-experience-visual-design.md) — dark-first control plane for memory, scope, permission, and AI access.
- Memory model: [ADR-002](docs/adr/ADR-002-context-storage-retrieval.md) — structured memory + semantic index (`packages/context-store`).

## What this MVP includes

1. Personal context profile  
2. Project contexts  
3. Notes and decisions  
4. Import text / conversations  
5. AI-assisted extraction (heuristic by default; optional LLM with API keys)  
6. Semantic context search (FTS5 + local cosine similarity)  
7. MCP access (`get_profile`, `get_project`, `search_context`, `get_decisions`, `get_preferences`, `save_context`, `save_decision`)  
8. Manual copy / export fallback  
9. Context preview of exactly what will be shared  
10. Dark-first control-plane UI (memories, scopes, integrations matrix, activity)

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm test
npm run mcp
```

## ADR-002 context store

Structured memory lives in `packages/context-store`:

```bash
npm run test:adr002
npm run benchmark
npm run demo:adr002
```

```ts
import { createContextStore } from "./packages/context-store/index.ts";

const store = createContextStore();
const project = store.createProject({ name: "Paypace" });
store.importSource({
  type: "conversation",
  title: "Pricing discussion",
  scope: project.scope,
  content: "We decided on monthly and yearly subscriptions.",
});
```

## Deploy on Fly.io

Cheapest path for the full app (Next.js + SQLite on a persistent volume).

1. Install the Fly CLI and sign in: https://fly.io/docs/hands-on/install-flyctl/
2. From this repo:

```bash
fly auth login
fly apps create eidothea   # pick another name if taken
fly deploy
fly certs add eidothea.app
fly certs add www.eidothea.app   # optional
```

3. In Cloudflare DNS for `eidothea.app`:

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | `@` | `eidothea.fly.dev` | DNS only (grey cloud) while cert issues, then can proxy |
| CNAME | `www` | `eidothea.fly.dev` | same |

Fly serves HTTPS. SQLite lives on the `eidothea_data` volume at `/data`.

Config files: `Dockerfile`, `fly.toml`.

## MCP (Cursor / Claude Desktop)

Example config is in `mcp/cursor-mcp.config.example.json`:

```json
{
  "mcpServers": {
    "eidothea": {
      "command": "npx",
      "args": ["tsx", "mcp/server.ts"],
      "cwd": "/absolute/path/to/Eidothea",
      "env": {
        "EIDOTHEA_DATA_DIR": "/absolute/path/to/Eidothea/data"
      }
    }
  }
}
```

## Privacy

Nothing is shared with an AI provider unless you explicitly preview, export, or invoke an integration. Context is stored locally in SQLite under `data/`.

## Optional LLM extraction

Set `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` to use model-assisted extraction on import. Without keys, deterministic heuristics still extract reusable context.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Web UI + API |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run mcp` | Start MCP stdio server |
| `npm test` | Vault + ADR-002 tests |
| `npm run test:adr002` | ADR-002 store tests |
| `npm run benchmark` | Retrieval benchmark |
| `npm run demo:adr002` | ADR-002 demo script |
