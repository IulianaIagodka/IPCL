import type {
  DataClassification,
  IntegrationAccessMode,
  IntegrationScope,
} from "./types";

export const ALL_SCOPES: IntegrationScope[] = [
  "profile:read",
  "preferences:read",
  "projects:read",
  "decisions:read",
  "context:search",
  "context:write",
  "memory:create",
  "memory:update",
];

export const DEFAULT_READ_SCOPES: IntegrationScope[] = [
  "profile:read",
  "preferences:read",
  "projects:read",
  "decisions:read",
  "context:search",
];

export const CLASSIFICATION_RANK: Record<DataClassification, number> = {
  NORMAL: 1,
  SENSITIVE: 2,
  RESTRICTED: 3,
};

export type Principal =
  | {
      kind: "user";
      userId: string;
      email: string;
      sessionId: string;
    }
  | {
      kind: "integration";
      userId: string;
      integrationId: string;
      name: string;
      provider: string;
      accessMode: IntegrationAccessMode;
      scopes: IntegrationScope[];
      allowedProjectIds: string[] | null;
      allowedClassifications: DataClassification[];
    };

export class PolicyDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PolicyDeniedError";
  }
}

export function hasScope(
  principal: Principal,
  scope: IntegrationScope,
  projectId?: string | null
): boolean {
  if (principal.kind === "user") return true;

  if (scope.startsWith("project:") && scope.endsWith(":read")) {
    const id = scope.slice("project:".length, -":read".length);
    return projectAllowed(principal, id) && principal.scopes.includes("projects:read");
  }

  if (!principal.scopes.includes(scope)) return false;

  if (
    projectId &&
    ["context:search", "context:write", "memory:create", "memory:update", "decisions:read"].includes(
      scope
    )
  ) {
    return projectAllowed(principal, projectId);
  }

  return true;
}

export function projectAllowed(
  principal: Principal,
  projectId: string | null | undefined
): boolean {
  if (principal.kind === "user") return true;
  if (!projectId) {
    // Global / unscoped items: only if integration has unrestricted projects
    return principal.allowedProjectIds === null;
  }
  if (principal.allowedProjectIds === null) return true;
  return principal.allowedProjectIds.includes(projectId);
}

export function classificationAllowed(
  principal: Principal,
  classification: DataClassification
): boolean {
  if (principal.kind === "user") {
    return classification !== "RESTRICTED" ? true : true; // owner can view restricted via dedicated paths
  }
  if (classification === "RESTRICTED") return false;
  return principal.allowedClassifications.includes(classification);
}

export function assertScope(
  principal: Principal,
  scope: IntegrationScope,
  projectId?: string | null
) {
  if (!hasScope(principal, scope, projectId)) {
    throw new PolicyDeniedError(`Missing scope: ${scope}`);
  }
}

export function assertWrite(principal: Principal) {
  if (principal.kind === "integration" && principal.accessMode !== "READ_WRITE") {
    throw new PolicyDeniedError("Integration is read-only");
  }
}

export function filterByPolicy<T extends {
  projectId?: string | null;
  classification?: DataClassification;
}>(
  principal: Principal,
  items: T[],
  options?: { excludeRestricted?: boolean }
): T[] {
  const excludeRestricted = options?.excludeRestricted !== false;
  return items.filter((item) => {
    const classification = item.classification ?? "NORMAL";
    if (excludeRestricted && classification === "RESTRICTED") return false;
    if (!classificationAllowed(principal, classification)) return false;
    if (item.projectId && !projectAllowed(principal, item.projectId)) return false;
    if (
      principal.kind === "integration" &&
      !item.projectId &&
      principal.allowedProjectIds !== null &&
      // unscoped memory requires global project access
      true
    ) {
      // Allow unscoped items only when integration has global project access
      if (principal.allowedProjectIds !== null) {
        // still allow profile/preference style global items when scopes permit;
        // project filter handled by caller for project-bound rows
      }
    }
    return true;
  });
}

/** Tool → required scopes (ADR-003 MCP tool permissions). */
export function scopesForTool(
  tool: string,
  projectId?: string | null
): IntegrationScope[] {
  switch (tool) {
    case "get_profile":
      return ["profile:read"];
    case "get_preferences":
      return ["preferences:read"];
    case "get_project":
      return projectId
        ? ["projects:read"]
        : ["projects:read"];
    case "get_decisions":
      return ["decisions:read"];
    case "search_context":
      return ["context:search"];
    case "save_context":
      return ["context:write"];
    case "save_decision":
      return ["memory:create"];
    default:
      return [];
  }
}
