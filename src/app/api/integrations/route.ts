import { jsonOk, jsonError } from "@/lib/http";
import {
  getPermissionMatrix,
  listIntegrations,
  setIntegrationStatus,
  setPermission,
} from "@/lib/integrations";
import { listProjects } from "@/lib/vault";

export const runtime = "nodejs";

export async function GET() {
  const projects = listProjects();
  const scopes = ["global", "work", ...projects.map((p) => p.name.toLowerCase())];
  const uniqueScopes = Array.from(new Set(scopes));
  return jsonOk({
    integrations: listIntegrations(),
    matrix: getPermissionMatrix(uniqueScopes),
  });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return jsonError("Invalid body", 400);
  }

  if ("status" in body && "id" in body) {
    const updated = setIntegrationStatus(
      String(body.id),
      body.status === "connected" ? "connected" : "disconnected"
    );
    if (!updated) return jsonError("Integration not found", 404);
    return jsonOk(updated);
  }

  if ("integrationId" in body && "scopeKey" in body && "allowed" in body) {
    return jsonOk(
      setPermission(
        String(body.integrationId),
        String(body.scopeKey),
        Boolean(body.allowed)
      )
    );
  }

  return jsonError("Unsupported update", 400);
}
