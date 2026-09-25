import { listAuditEvents } from "@/lib/audit";
import { withAuth } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") || "50");
  return withAuth(request, async (principal) => {
    if (principal.kind !== "user") throw new Error("User session required");
    return listAuditEvents(principal.userId, Number.isFinite(limit) ? limit : 50);
  });
}
