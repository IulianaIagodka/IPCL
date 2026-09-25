import {
  createIntegration,
  listIntegrations,
  revokeIntegration,
  rotateIntegrationToken,
  updateIntegration,
} from "@/lib/integrations";
import { readJson, withAuth } from "@/lib/http";
import type {
  DataClassification,
  IntegrationAccessMode,
  IntegrationScope,
} from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return withAuth(request, async (principal) => {
    if (principal.kind !== "user") throw new Error("User session required");
    return listIntegrations(principal.userId);
  });
}

export async function POST(request: Request) {
  return withAuth(request, async (principal) => {
    if (principal.kind !== "user") throw new Error("User session required");
    const body = await readJson<{
      action?: "create" | "update" | "revoke" | "rotate";
      id?: string;
      name?: string;
      provider?: string;
      accessMode?: IntegrationAccessMode;
      scopes?: IntegrationScope[];
      allowedProjectIds?: string[] | null;
      allowedClassifications?: DataClassification[];
    }>(request);

    if (body.action === "create") {
      if (!body.name) throw new Error("name is required");
      return createIntegration({
        ownerId: principal.userId,
        name: body.name,
        provider: body.provider || "mcp",
        accessMode: body.accessMode,
        scopes: body.scopes,
        allowedProjectIds: body.allowedProjectIds,
        allowedClassifications: body.allowedClassifications,
      });
    }

    if (!body.id) throw new Error("id is required");

    if (body.action === "update") {
      const updated = updateIntegration(body.id, principal.userId, {
        name: body.name,
        accessMode: body.accessMode,
        scopes: body.scopes,
        allowedProjectIds: body.allowedProjectIds,
        allowedClassifications: body.allowedClassifications,
      });
      if (!updated) throw new Error("Integration not found");
      return updated;
    }

    if (body.action === "revoke") {
      const ok = revokeIntegration(body.id, principal.userId);
      if (!ok) throw new Error("Integration not found");
      return { ok: true };
    }

    if (body.action === "rotate") {
      const rotated = rotateIntegrationToken(body.id, principal.userId);
      if (!rotated) throw new Error("Integration not found");
      return rotated;
    }

    throw new Error("Unknown action");
  });
}
