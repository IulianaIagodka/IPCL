#!/usr/bin/env node
/**
 * Eidothea MCP server (ADR-001 + ADR-003)
 *
 * Requires IPCL_INTEGRATION_TOKEN for a connected, non-revoked integration.
 * Default integrations are READ_ONLY; write tools create candidate memories.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { resolveIntegrationToken } from "../src/lib/integrations";
import { PolicyDeniedError, type Principal } from "../src/lib/policy";
import { runWithPrincipal } from "../src/lib/request-context";
import { logError } from "../src/lib/logger";
import {
  getProfile,
  getProject,
  listDecisions,
  listPreferences,
  principalCanUseTool,
  proposeCandidateMemory,
  searchContext,
} from "../src/lib/vault";

const server = new McpServer({
  name: "eidothea",
  version: "0.2.0",
});

function requireIntegrationPrincipal(): Principal & { kind: "integration" } {
  const token = process.env.IPCL_INTEGRATION_TOKEN;
  const principal = resolveIntegrationToken(token);
  if (!principal || principal.kind !== "integration") {
    throw new PolicyDeniedError(
      "MCP authentication failed. Set IPCL_INTEGRATION_TOKEN from Vault → Security."
    );
  }
  return principal;
}

function withIntegration<T>(fn: (principal: Principal & { kind: "integration" }) => T): T {
  const principal = requireIntegrationPrincipal();
  return runWithPrincipal(principal, () => fn(principal));
}

function toolResult(data: unknown, isError = false) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    isError,
  };
}

server.tool(
  "get_profile",
  "Return the user's long-lived profile from Eidothea.",
  {},
  async () => {
    try {
      return withIntegration((principal) => {
        principalCanUseTool(principal, "get_profile");
        return toolResult(getProfile());
      });
    } catch (error) {
      return toolResult(
        { error: error instanceof Error ? error.message : "Denied" },
        true
      );
    }
  }
);

server.tool(
  "get_project",
  "Return a project context by project_id when the integration is allowed.",
  { project_id: z.string() },
  async ({ project_id }) => {
    try {
      return withIntegration((principal) => {
        principalCanUseTool(principal, "get_project", project_id);
        const project = getProject(project_id);
        if (!project) {
          return toolResult({ error: `Project not found: ${project_id}` }, true);
        }
        return toolResult(project);
      });
    } catch (error) {
      return toolResult(
        { error: error instanceof Error ? error.message : "Denied" },
        true
      );
    }
  }
);

server.tool(
  "search_context",
  "Retrieve only authorized, relevant, non-restricted context fragments.",
  {
    query: z.string(),
    project_id: z.string().optional(),
    limit: z.number().int().min(1).max(25).optional(),
  },
  async ({ query, project_id, limit }) => {
    try {
      return withIntegration((principal) => {
        principalCanUseTool(principal, "search_context", project_id);
        const hits = searchContext(query, {
          projectId: project_id,
          limit: limit ?? 8,
        });
        return toolResult(hits);
      });
    } catch (error) {
      return toolResult(
        { error: error instanceof Error ? error.message : "Denied" },
        true
      );
    }
  }
);

server.tool(
  "get_decisions",
  "List durable decisions visible to this integration.",
  { project_id: z.string().optional() },
  async ({ project_id }) => {
    try {
      return withIntegration((principal) => {
        principalCanUseTool(principal, "get_decisions", project_id);
        return toolResult(listDecisions(project_id));
      });
    } catch (error) {
      return toolResult(
        { error: error instanceof Error ? error.message : "Denied" },
        true
      );
    }
  }
);

server.tool(
  "get_preferences",
  "List reusable behavioral preferences / instructions.",
  {},
  async () => {
    try {
      return withIntegration((principal) => {
        principalCanUseTool(principal, "get_preferences");
        return toolResult(listPreferences());
      });
    } catch (error) {
      return toolResult(
        { error: error instanceof Error ? error.message : "Denied" },
        true
      );
    }
  }
);

server.tool(
  "save_context",
  "Propose a reusable context fragment (candidate memory pending user approval).",
  {
    content: z.string(),
    title: z.string().optional(),
    project_id: z.string().optional(),
    tags: z.array(z.string()).optional(),
  },
  async ({ content, title, project_id }) => {
    try {
      return withIntegration((principal) => {
        principalCanUseTool(principal, "save_context", project_id);
        const candidate = proposeCandidateMemory({
          kind: "knowledge",
          content,
          title,
          projectId: project_id,
        });
        return toolResult({
          status: "pending_approval",
          message:
            "Saved as candidate memory. It becomes canonical only after user approval.",
          candidate,
        });
      });
    } catch (error) {
      return toolResult(
        { error: error instanceof Error ? error.message : "Denied" },
        true
      );
    }
  }
);

server.tool(
  "save_decision",
  "Propose a decision as candidate memory (requires write access + user approval).",
  {
    project_id: z.string().optional(),
    decision: z.string(),
    rationale: z.string().optional(),
  },
  async ({ project_id, decision, rationale }) => {
    try {
      return withIntegration((principal) => {
        principalCanUseTool(principal, "save_decision", project_id);
        const candidate = proposeCandidateMemory({
          kind: "decision",
          content: decision,
          projectId: project_id,
          rationale,
        });
        return toolResult({
          status: "pending_approval",
          message:
            "Decision saved as candidate. Approve it in Vault → Security.",
          candidate,
        });
      });
    } catch (error) {
      return toolResult(
        { error: error instanceof Error ? error.message : "Denied" },
        true
      );
    }
  }
);

async function main() {
  try {
    requireIntegrationPrincipal();
  } catch (error) {
    logError("mcp_auth_missing", {
      category: error instanceof Error ? error.name : "Error",
    });
    console.error(
      error instanceof Error ? error.message : "MCP authentication failed"
    );
    process.exit(1);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(
    "Eidothea MCP server failed:",
    error instanceof Error ? error.message : error
  );
  process.exit(1);
});
