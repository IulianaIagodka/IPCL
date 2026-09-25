import { importAndExtract, listSources } from "@/lib/vault";
import { readJson, withAuth } from "@/lib/http";
import type { DataClassification, SourceType } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return withAuth(request, async () => {
    const projectId = new URL(request.url).searchParams.get("projectId");
    return listSources(projectId);
  });
}

export async function POST(request: Request) {
  return withAuth(request, async () => {
    const body = await readJson<{
      content: string;
      type?: SourceType;
      title?: string;
      projectId?: string | null;
      applyExtraction?: boolean;
      useLlm?: boolean;
      classification?: DataClassification;
    }>(request);
    if (!body.content?.trim()) throw new Error("content is required");
    return importAndExtract({
      content: body.content,
      type: body.type ?? "note",
      title: body.title,
      projectId: body.projectId,
      applyExtraction: body.applyExtraction,
      useLlm: body.useLlm,
      classification: body.classification,
    });
  });
}
