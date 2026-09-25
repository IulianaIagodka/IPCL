#!/usr/bin/env node
/**
 * Memora MCP server
 *
 * Tools (ADR-001):
 *   get_profile, get_project, search_context, get_decisions,
 *   get_preferences, save_context, save_decision
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  createDecision,
  getProfile,
  getProject,
  listDecisions,
  listPreferences,
  saveContext,
  searchContext,
} from "../src/lib/vault";

const server = new McpServer({
  name: "memora",
  version: "0.1.0",
});

server.tool(
  "get_profile",
  "Return the user's long-lived profile from Memora.",
  {},
  async () => {
    const profile = getProfile();
    return {
      content: [{ type: "text", text: JSON.stringify(profile, null, 2) }],
    };
  }
);

server.tool(
  "get_project",
  "Return a project context by project_id.",
  { project_id: z.string() },
  async ({ project_id }) => {
    const project = getProject(project_id);
    if (!project) {
      return {
        content: [{ type: "text", text: `Project not found: ${project_id}` }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(project, null, 2) }],
    };
  }
);

server.tool(
  "search_context",
  "Retrieve only relevant context fragments for a query.",
  {
    query: z.string(),
    project_id: z.string().optional(),
    limit: z.number().int().min(1).max(25).optional(),
  },
  async ({ query, project_id, limit }) => {
    const hits = searchContext(query, {
      projectId: project_id,
      limit: limit ?? 8,
    });
    return {
      content: [{ type: "text", text: JSON.stringify(hits, null, 2) }],
    };
  }
);

server.tool(
  "get_decisions",
  "List durable decisions, optionally filtered by project_id.",
  { project_id: z.string().optional() },
  async ({ project_id }) => {
    const decisions = listDecisions(project_id);
    return {
      content: [{ type: "text", text: JSON.stringify(decisions, null, 2) }],
    };
  }
);

server.tool(
  "get_preferences",
  "List reusable behavioral preferences / instructions.",
  {},
  async () => {
    const preferences = listPreferences();
    return {
      content: [{ type: "text", text: JSON.stringify(preferences, null, 2) }],
    };
  }
);

server.tool(
  "save_context",
  "Save a reusable context fragment into the vault.",
  {
    content: z.string(),
    title: z.string().optional(),
    project_id: z.string().optional(),
    tags: z.array(z.string()).optional(),
  },
  async ({ content, title, project_id, tags }) => {
    const item = saveContext(content, {
      title,
      projectId: project_id,
      tags,
    });
    return {
      content: [{ type: "text", text: JSON.stringify(item, null, 2) }],
    };
  }
);

server.tool(
  "save_decision",
  "Save a decision that AI clients should not reopen.",
  {
    project_id: z.string().optional(),
    decision: z.string(),
    rationale: z.string().optional(),
  },
  async ({ project_id, decision, rationale }) => {
    const saved = createDecision({
      projectId: project_id,
      content: decision,
      rationale,
    });
    return {
      content: [{ type: "text", text: JSON.stringify(saved, null, 2) }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Memora MCP server failed:", error);
  process.exit(1);
});
