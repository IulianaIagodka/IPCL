import {
  createPreference,
  deletePreference,
  listPreferences,
} from "@/lib/vault";
import { readJson, withAuth } from "@/lib/http";
import type { DataClassification } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return withAuth(request, async () => listPreferences(), {
    allowIntegration: true,
  });
}

export async function POST(request: Request) {
  return withAuth(request, async () => {
    const body = await readJson<{
      content: string;
      tags?: string[];
      classification?: DataClassification;
    }>(request);
    if (!body.content?.trim()) throw new Error("content is required");
    return createPreference(
      body.content,
      body.tags ?? [],
      body.classification ?? "NORMAL"
    );
  });
}

export async function DELETE(request: Request) {
  return withAuth(request, async () => {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) throw new Error("id is required");
    if (!deletePreference(id)) throw new Error("Preference not found");
    return { ok: true };
  });
}
