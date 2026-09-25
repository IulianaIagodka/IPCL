import {
  createPreference,
  deletePreference,
  listPreferences,
} from "@/lib/vault";
import { jsonError, jsonOk, readJson } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  return jsonOk(listPreferences());
}

export async function POST(request: Request) {
  try {
    const body = await readJson<{ content: string; tags?: string[] }>(request);
    if (!body.content?.trim()) return jsonError("content is required");
    return jsonOk(createPreference(body.content, body.tags ?? []), {
      status: 201,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Invalid request");
  }
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return jsonError("id is required");
  if (!deletePreference(id)) return jsonError("Preference not found", 404);
  return jsonOk({ ok: true });
}
