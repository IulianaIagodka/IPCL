# Eidothea

**https://eidothea.app**

**Stop explaining yourself.**

*One memory. Every AI.*  
Your context follows you across AI.

Eidothea is a vendor-independent context layer: you keep profile, projects, decisions, preferences, and knowledge in one place, then make only the relevant fragments available to ChatGPT, Claude, Cursor, Codex, Gemini, or any other AI client.

## Architecture

- ADR index: [docs/adr/](docs/adr/)
- [ADR-001](docs/adr/ADR-001-portable-ai-context-layer.md) — portable context layer
- [ADR-002](docs/adr/ADR-002-context-storage-retrieval.md) — structured memory + semantic index (`packages/context-store`)
- [ADR-003](docs/adr/ADR-003-security-privacy-model.md) — security & privacy (**merged**)
- [ADR-004](docs/adr/ADR-004-web-first-control-plane.md) — web-first control plane
- [ADR-005](docs/adr/ADR-005-product-experience-visual-design.md) — dark-first product experience

**INT-1:** Context Service / vault search + preview go through ADR-002 `retrieveMemories` / `assembleContext` (`src/lib/memory-bridge.ts`). Vault and ADR-002 share one SQLite file (`context-vault.sqlite`).

## Security model (ADR-003)

Default deny. Least privilege. Every external AI is a separate, minimally trusted consumer.

1. Authenticated vault owner (session cookie)
2. Tenant isolation via `owner_id`
3. Encrypted transport in production (`Secure` cookies) + HTTPS expected
4. Application-level encryption at rest for secrets and `RESTRICTED` content (`IPCL_MASTER_KEY` / `data/master.key`)
5. Dedicated secrets table (ciphertext only)
6. Per-integration permissions and project scopes
7. Integrations default to **READ_ONLY**
8. Data classification: `NORMAL` / `SENSITIVE` / `RESTRICTED`
9. `RESTRICTED` excluded from normal search / MCP retrieval / export
10. Sanitized logging + audit trail
11. Integration revoke / rotate
12. Sensitive share acknowledgment in preview
13. Account / vault deletion
14. MCP writes become **candidate memories** until approved

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000/vault/login](http://localhost:3000/vault/login), create the vault owner, then connect an AI under **Security**.

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

1. In **Vault → Security**, connect an integration (read-only by default).
2. Copy the issued token into your MCP config as `IPCL_INTEGRATION_TOKEN`.

Example: `mcp/cursor-mcp.config.example.json`

```json
{
  "mcpServers": {
    "eidothea": {
      "command": "npx",
      "args": ["tsx", "mcp/server.ts"],
      "cwd": "/absolute/path/to/Eidothea",
      "env": {
        "EIDOTHEA_DATA_DIR": "/absolute/path/to/Eidothea/data",
        "IPCL_INTEGRATION_TOKEN": "paste-token-from-vault-security"
      }
    }
  }
}
```

## Optional LLM extraction

Set `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` to use model-assisted extraction on import. Keys stay in process env — never in the vault database. Without keys, deterministic heuristics still extract reusable context.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Web UI + API |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run mcp` | Start MCP stdio server |
| `npm test` | Vault / search / security tests |
| `npm run test:adr002` | ADR-002 store tests |
| `npm run benchmark` | Retrieval benchmark |
| `npm run demo:adr002` | ADR-002 demo script |
