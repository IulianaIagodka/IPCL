import { searchContext } from "@/lib/vault";
import { jsonError, jsonOk } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim();
  if (!query) return jsonError("q is required");
  const projectId = url.searchParams.get("projectId");
  const limit = Number(url.searchParams.get("limit") || "10");
  return jsonOk(
    searchContext(query, {
      projectId,
      limit: Number.isFinite(limit) ? limit : 10,
    })
  );
}
