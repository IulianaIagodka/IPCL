import { buildPreview } from "@/lib/vault";
import { readJson, withAuth } from "@/lib/http";
import { recordAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return withAuth(request, async (principal) => {
    const body = await readJson<{
      destination?: string;
      query?: string | null;
      projectId?: string | null;
      includeProfile?: boolean;
      includePreferences?: boolean;
      includeDecisions?: boolean;
      includeSearchHits?: boolean;
      acknowledgeSensitive?: boolean;
    }>(request);

    const preview = buildPreview({
      destination: body.destination || "clipboard / manual paste",
      query: body.query,
      projectId: body.projectId,
      includeProfile: body.includeProfile,
      includePreferences: body.includePreferences,
      includeDecisions: body.includeDecisions,
      includeSearchHits: body.includeSearchHits,
      acknowledgeSensitive: body.acknowledgeSensitive,
    });

    if (body.acknowledgeSensitive && preview.includesSensitive) {
      recordAudit({
        action: "bulk_export",
        principal,
        includedSensitive: true,
        destination: preview.destination,
        memoryCount: preview.fragments.length,
      });
    }

    return preview;
  });
}
