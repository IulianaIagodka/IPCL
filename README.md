# Slid

**Stop explaining yourself.**  
**Your context follows you across AI.**

*One memory. Every AI.*

Slid is a vendor-independent context layer: you keep profile, projects, decisions, preferences, and knowledge in one place, then make only the relevant fragments available to ChatGPT, Claude, Cursor, Codex, Gemini, or any other AI client.

Architecture decision: [docs/adr/001-portable-context-layer.md](docs/adr/001-portable-context-layer.md)

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

## MCP (Cursor / Claude Desktop)

Example config is in `mcp/cursor-mcp.config.example.json`:

```json
{
  "mcpServers": {
    "slid": {
      "command": "npx",
      "args": ["tsx", "mcp/server.ts"],
      "cwd": "/absolute/path/to/Slid",
      "env": {
        "SLID_DATA_DIR": "/absolute/path/to/Slid/data"
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
| `npm test` | Vault / search / preview tests |
