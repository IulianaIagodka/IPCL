/**
 * Context Service — ADR-004 trusted boundary.
 *
 * Web UI and MCP must not query storage directly. They go through this
 * façade (or the authenticated Product/MCP APIs that call it).
 *
 * Logical deployment units (may share one process as a modular monolith):
 *   Web control plane  →  Context Service  →  Storage
 *   MCP / Product API  →  Context Service  →  Storage
 */
export {
  getProfile,
  updateProfile,
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  listPreferences,
  createPreference,
  deletePreference,
  listDecisions,
  createDecision,
  deleteDecision,
  listSources,
  createSource,
  listContextItems,
  saveContext,
  updateContextClassification,
  deleteContextItem,
  searchContext,
  importAndExtract,
  buildExportText,
  buildPreview,
  proposeCandidateMemory,
  listCandidateMemories,
  resolveCandidateMemory,
  wipeAllContext,
  getVaultStats,
  principalCanUseTool,
} from "@/lib/vault";

export {
  listIntegrations,
  getIntegration,
  createIntegration,
  updateIntegration,
  revokeIntegration,
  rotateIntegrationToken,
  resolveIntegrationToken,
} from "@/lib/integrations";

export { listAuditEvents, recordAudit } from "@/lib/audit";

export {
  countUsers,
  createUser,
  loginUser,
  getUserById,
  resolveSessionToken,
  deleteAccount,
} from "@/lib/auth";

export type { Principal } from "@/lib/policy";
export { PolicyDeniedError, DEFAULT_READ_SCOPES } from "@/lib/policy";

import { countUsers, getUserById } from "@/lib/auth";
import { listIntegrations } from "@/lib/integrations";
import { getVaultStats, getProfile, listProjects } from "@/lib/vault";
import type { Principal } from "@/lib/policy";
import type { ControlPlaneStatus } from "@/lib/types";

export type { ControlPlaneStatus };

export function getControlPlaneStatus(
  principal: Principal | null
): ControlPlaneStatus {
  const setupRequired = countUsers() === 0;
  if (setupRequired || !principal || principal.kind !== "user") {
    return {
      setupRequired,
      authenticated: false,
      ownerId: null,
      displayName: null,
      steps: {
        account: !setupRequired,
        profile: false,
        project: false,
        integration: false,
      },
      nextStep: "setup_account",
      stats: null,
    };
  }

  const user = getUserById(principal.userId);
  const stats = getVaultStats();
  const profile = getProfile();
  const projects = listProjects();
  const integrations = listIntegrations(principal.userId).filter(
    (i) => !i.revokedAt
  );

  const steps = {
    account: true,
    profile: Boolean(profile.displayName?.trim() || profile.role?.trim()),
    project: projects.length > 0,
    integration: integrations.length > 0,
  };

  let nextStep: ControlPlaneStatus["nextStep"] = "ready";
  if (!steps.profile) nextStep = "complete_profile";
  else if (!steps.project) nextStep = "create_project";
  else if (!steps.integration) nextStep = "connect_integration";

  return {
    setupRequired: false,
    authenticated: true,
    ownerId: principal.userId,
    displayName: user?.displayName ?? profile.displayName ?? null,
    steps,
    nextStep,
    stats,
  };
}

/** Build a ready-to-paste Cursor/Claude MCP config for an integration token. */
export function buildMcpClientConfig(input: {
  token: string;
  cwd: string;
  dataDir?: string;
}): {
  mcpServers: Record<
    string,
    {
      command: string;
      args: string[];
      cwd: string;
      env: Record<string, string>;
    }
  >;
} {
  return {
    mcpServers: {
      "ipcl-context-vault": {
        command: "npx",
        args: ["tsx", "mcp/server.ts"],
        cwd: input.cwd,
        env: {
          IPCL_DATA_DIR: input.dataDir ?? `${input.cwd}/data`,
          IPCL_INTEGRATION_TOKEN: input.token,
        },
      },
    },
  };
}
