import { searchContext, updateContextClassification } from "@/lib/vault";
import { jsonError, readJson, withAuth } from "@/lib/http";
import type { DataClassification } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return withAuth(request, async () => {
    const url = new URL(request.url);
    const query = url.searchParams.get("q")?.trim();
    if (!query) throw new Error("q is required");
    const projectId = url.searchParams.get("projectId");
    const limit = Number(url.searchParams.get("limit") || "10");
    return searchContext(query, {
      projectId,
      limit: Number.isFinite(limit) ? limit : 10,
    });
  }, { allowIntegration: true });
}

export async function PATCH(request: Request) {
  return withAuth(request, async () => {
    const body = await readJson<{
      id?: string;
      classification?: DataClassification;
    }>(request);
    if (!body.id || !body.classification) {
      throw new Error("id and classification are required");
    }
    if (!["NORMAL", "SENSITIVE", "RESTRICTED"].includes(body.classification)) {
      throw new Error("Invalid classification");
    }
    const item = updateContextClassification(body.id, body.classification);
    if (!item) throw new Error("Context item not found");
    return item;
  });
}
