import {
  deleteContextItem,
  listContextItems,
  saveContext,
} from "@/lib/vault";
import { jsonError, jsonOk, readJson } from "@/lib/http";
import type { ContextKind } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");
  const kind = url.searchParams.get("kind") as ContextKind | null;
  return jsonOk(
    listContextItems({
      projectId,
      kind: kind || undefined,
    })
  );
}

export async function POST(request: Request) {
  try {
    const body = await readJson<{
      content: string;
      title?: string;
      projectId?: string | null;
      kind?: ContextKind;
      tags?: string[];
    }>(request);
    if (!body.content?.trim()) return jsonError("content is required");
    return jsonOk(saveContext(body.content, body), { status: 201 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Invalid request");
  }
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return jsonError("id is required");
  if (!deleteContextItem(id)) return jsonError("Item not found", 404);
  return jsonOk({ ok: true });
}
