import {
  createDecision,
  deleteDecision,
  listDecisions,
} from "@/lib/vault";
import { readJson, withAuth } from "@/lib/http";
import type { DataClassification } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return withAuth(request, async () => {
    const projectId = new URL(request.url).searchParams.get("projectId");
    return listDecisions(projectId);
  }, { allowIntegration: true });
}

export async function POST(request: Request) {
  return withAuth(request, async () => {
    const body = await readJson<{
      content: string;
      projectId?: string | null;
      rationale?: string;
      classification?: DataClassification;
    }>(request);
    if (!body.content?.trim()) throw new Error("content is required");
    return createDecision(body);
  });
}

export async function DELETE(request: Request) {
  return withAuth(request, async () => {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) throw new Error("id is required");
    if (!deleteDecision(id)) throw new Error("Decision not found");
    return { ok: true };
  });
}
