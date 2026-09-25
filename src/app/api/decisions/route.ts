import {
  createDecision,
  deleteDecision,
  listDecisions,
} from "@/lib/vault";
import { jsonError, jsonOk, readJson } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const projectId = new URL(request.url).searchParams.get("projectId");
  return jsonOk(listDecisions(projectId));
}

export async function POST(request: Request) {
  try {
    const body = await readJson<{
      content: string;
      projectId?: string | null;
      rationale?: string;
    }>(request);
    if (!body.content?.trim()) return jsonError("content is required");
    return jsonOk(createDecision(body), { status: 201 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Invalid request");
  }
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return jsonError("id is required");
  if (!deleteDecision(id)) return jsonError("Decision not found", 404);
  return jsonOk({ ok: true });
}
