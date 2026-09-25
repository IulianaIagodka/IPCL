import { buildExportText } from "@/lib/vault";
import { jsonOk } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");
  const query = url.searchParams.get("q");
  const format = url.searchParams.get("format") || "json";

  const exported = buildExportText({
    projectId,
    query,
    includeProfile: url.searchParams.get("profile") !== "0",
    includePreferences: url.searchParams.get("preferences") !== "0",
    includeDecisions: url.searchParams.get("decisions") !== "0",
  });

  if (format === "text" || format === "markdown") {
    return new Response(exported.text, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": 'attachment; filename="context-vault-export.md"',
      },
    });
  }

  return jsonOk(exported);
}
