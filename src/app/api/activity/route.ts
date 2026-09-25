import { listAuditEvents } from "@/lib/audit";
import { withAuth } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return withAuth(request, async (principal) => {
    if (principal.kind !== "user") throw new Error("User session required");
    const events = listAuditEvents(principal.userId, 50).map((event) => ({
      id: event.id,
      kind: mapKind(event.action),
      summary: event.action.replaceAll("_", " "),
      detail: [
        event.scope ? `scope ${event.scope}` : null,
        event.memoryCount ? `${event.memoryCount} memories` : null,
        event.includedSensitive ? "sensitive" : null,
        event.destination ? `→ ${event.destination}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      createdAt: event.createdAt,
    }));
    return { events };
  });
}

function mapKind(
  action: string
): "share" | "access" | "connect" | "disconnect" | "restrict" | "learn" {
  if (action.includes("integration_connected")) return "connect";
  if (action.includes("revoked")) return "disconnect";
  if (action.includes("preview") || action.includes("export")) return "share";
  if (action.includes("sensitive") || action.includes("RESTRICTED")) {
    return "restrict";
  }
  if (action.includes("search") || action.includes("accessed")) return "access";
  return "learn";
}
