import { importAndExtract, listSources } from "@/lib/vault";
import { jsonError, jsonOk, readJson } from "@/lib/http";
import type { SourceType } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const projectId = new URL(request.url).searchParams.get("projectId");
  return jsonOk(listSources(projectId));
}

export async function POST(request: Request) {
  try {
    const body = await readJson<{
      content: string;
      type?: SourceType;
      title?: string;
      projectId?: string | null;
      applyExtraction?: boolean;
      useLlm?: boolean;
    }>(request);
    if (!body.content?.trim()) return jsonError("content is required");
    const result = await importAndExtract({
      content: body.content,
      type: body.type ?? "note",
      title: body.title,
      projectId: body.projectId,
      applyExtraction: body.applyExtraction,
      useLlm: body.useLlm,
    });
    return jsonOk(result, { status: 201 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Invalid request");
  }
}
