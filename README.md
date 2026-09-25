# IPCL — Independent Portable Context Layer

**Stop explaining yourself to AI.**

IPCL is a vendor-independent **Context Vault** with a **web-first control plane**:
you manage profile, projects, decisions, preferences, and permissions in the browser,
then make only the relevant fragments available to ChatGPT, Claude, Cursor, Codex,
Gemini, or any other AI client via MCP / API / export.

This is **not** a chat product. Daily AI work stays in the tools you already use.

## Architecture (ADR-004)

```text
Web App (control plane)
        │
        ↓
Context Service  ← system of record + policy
        │
   ┌────┴────┐
   ↓         ↓
 MCP API   Product API
```

Logical components (modular monolith today):

| Unit | Role |
|------|------|
| Web control plane | Onboarding, memory inspection, integrations, activity, settings |
| Context Service (`src/service`) | Memory, retrieval, permissions, audit |
| MCP / Product API | Access layers over the same service |
| Persistent storage | SQLite + FTS (+ optional vector index later) |

Architecture decisions:

- [ADR-001](docs/adr/ADR-001-portable-ai-context-layer.md) — portable context layer
- [ADR-002](docs/adr/ADR-002-context-storage-retrieval.md) — storage & retrieval
- [ADR-003](docs/adr/ADR-003-security-privacy-model.md) — security & privacy
- [ADR-004](docs/adr/ADR-004-web-first-control-plane.md) — web-first control plane (**this branch**)
- [ADR-005](docs/adr/ADR-005-product-experience-visual-design.md) — product experience

## Control plane surfaces

| Route | Purpose |
|-------|---------|
| `/vault` | Home + setup checklist |
| `/vault/onboarding` | Guided configure → connect flow |
| `/vault/context` | Memory inspection & retrieval |
| `/vault/projects` | Project contexts |
| `/vault/integrations` | MCP connect wizard + permissions |
| `/vault/activity` | Audit visibility |
| `/vault/preview` | Manual export fallback |
| `/vault/settings` | Account & privacy |

## Security model (ADR-003)

Default deny. Least privilege. Every external AI is a separate, minimally trusted consumer.

1. Authenticated vault owner (session cookie)
2. Tenant isolation via `owner_id`
3. Per-integration scopes / project allowlists
4. Integrations default to **READ_ONLY**
5. Classification: `NORMAL` / `SENSITIVE` / `RESTRICTED`
6. Audit trail on search / preview / export / MCP use
7. MCP writes become **candidate memories** until approved

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000/vault/onboarding](http://localhost:3000/vault/onboarding),
create the vault owner, then connect an AI under **Integrations**.

```bash
npm test
npm run mcp
```

## MCP (Cursor / Claude Desktop)

1. In **Integrations**, connect a provider (read-only by default).
2. Copy the issued token and generated MCP config JSON.
3. Paste into your AI client; set `IPCL_INTEGRATION_TOKEN`.

Example: `mcp/cursor-mcp.config.example.json`

```json
{
  "mcpServers": {
    "ipcl-context-vault": {
      "command": "npx",
      "args": ["tsx", "mcp/server.ts"],
      "cwd": "/absolute/path/to/IPCL",
      "env": {
        "IPCL_DATA_DIR": "/absolute/path/to/IPCL/data",
        "IPCL_INTEGRATION_TOKEN": "paste-token-from-integrations"
      }
    }
  }
}
```

## Optional LLM extraction

Set `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` for model-assisted import extraction.
Keys stay in process env — never in the vault database.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Web control plane + Product API |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run mcp` | Start MCP integration endpoint |
| `npm test` | Vault / security / control-plane tests |
