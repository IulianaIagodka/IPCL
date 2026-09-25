import { buildExportText } from "@/lib/vault";
import { withAuth } from "@/lib/http";
import { recordAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return withAuth(request, async (principal) => {
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    const query = url.searchParams.get("q");
    const format = url.searchParams.get("format") || "json";
    const allowSensitive = url.searchParams.get("sensitive") === "1";

    const exported = buildExportText({
      projectId,
      query,
      includeProfile: url.searchParams.get("profile") !== "0",
      includePreferences: url.searchParams.get("preferences") !== "0",
      includeDecisions: url.searchParams.get("decisions") !== "0",
      allowSensitive,
    });

    recordAudit({
      action: "bulk_export",
      principal,
      includedSensitive: exported.includesSensitive,
      memoryCount: exported.fragments.length,
      destination: "export",
    });

    if (format === "text" || format === "markdown") {
      return new Response(exported.text, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": 'attachment; filename="context-vault-export.md"',
        },
      });
    }

    return exported;
  });
}
