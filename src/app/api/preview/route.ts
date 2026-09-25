import { buildPreview } from "@/lib/vault";
import { jsonError, jsonOk, readJson } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await readJson<{
      destination?: string;
      query?: string | null;
      projectId?: string | null;
      includeProfile?: boolean;
      includePreferences?: boolean;
      includeDecisions?: boolean;
      includeSearchHits?: boolean;
    }>(request);

    return jsonOk(
      buildPreview({
        destination: body.destination || "clipboard / manual paste",
        query: body.query,
        projectId: body.projectId,
        includeProfile: body.includeProfile,
        includePreferences: body.includePreferences,
        includeDecisions: body.includeDecisions,
        includeSearchHits: body.includeSearchHits,
      })
    );
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Invalid request");
  }
}
