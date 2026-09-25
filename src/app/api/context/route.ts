import {
  deleteContextItem,
  listContextItems,
  saveContext,
} from "@/lib/vault";
import { readJson, withAuth } from "@/lib/http";
import type { ContextKind, DataClassification } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return withAuth(request, async () => {
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    const kind = url.searchParams.get("kind") as ContextKind | null;
    return listContextItems({
      projectId,
      kind: kind || undefined,
    });
  });
}

export async function POST(request: Request) {
  return withAuth(request, async () => {
    const body = await readJson<{
      content: string;
      title?: string;
      projectId?: string | null;
      kind?: ContextKind;
      tags?: string[];
      classification?: DataClassification;
    }>(request);
    if (!body.content?.trim()) throw new Error("content is required");
    return saveContext(body.content, body);
  });
}

export async function DELETE(request: Request) {
  return withAuth(request, async () => {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) throw new Error("id is required");
    if (!deleteContextItem(id)) throw new Error("Item not found");
    return { ok: true };
  });
}
