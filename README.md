# IPCL — Independent Portable Context Layer

**Stop explaining yourself to AI.**

IPCL is a vendor-independent **Context Vault**: you keep profile, projects, decisions, preferences, and knowledge in one place, then make only the relevant fragments available to ChatGPT, Claude, Cursor, Codex, Gemini, or any other AI client.

Architecture decisions:

- [ADR-001](docs/adr/ADR-001-portable-ai-context-layer.md) — portable context layer
- [ADR-002](docs/adr/ADR-002-context-storage-retrieval.md) — storage & retrieval
- [ADR-003](docs/adr/ADR-003-security-privacy-model.md) — security & privacy (**implemented in this branch**)
- [ADR-004](docs/adr/ADR-004-web-first-control-plane.md) — web-first control plane
- [ADR-005](docs/adr/ADR-005-product-experience-visual-design.md) — product experience

## Security model (ADR-003)

Default deny. Least privilege. Every external AI is a separate, minimally trusted consumer.

MVP controls included:

1. Authenticated vault owner (session cookie)
2. Tenant isolation via `owner_id`
3. Encrypted transport in production (`Secure` cookies) + HTTPS expected
4. Application-level encryption at rest for secrets and `RESTRICTED` content (`IPCL_MASTER_KEY` / `data/master.key`)
5. Dedicated secrets table (ciphertext only)
6. Per-integration permissions and project scopes
7. Integrations default to **READ_ONLY**
8. Data classification: `NORMAL` / `SENSITIVE` / `RESTRICTED`
9. `RESTRICTED` excluded from normal search / MCP retrieval / export
10. Sanitized logging
11. Audit trail + security activity UI
12. Integration revoke / rotate
13. Sensitive share acknowledgment in preview
14. Account / vault deletion
15. MCP writes become **candidate memories** until approved

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

## MCP (Cursor / Claude Desktop)

1. In **Vault → Security**, connect an integration (read-only by default).
2. Copy the issued token into your MCP config as `IPCL_INTEGRATION_TOKEN`.

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
