import { getProfile, updateProfile } from "@/lib/vault";
import { jsonError, jsonOk, readJson } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  return jsonOk(getProfile());
}

export async function PUT(request: Request) {
  try {
    const body = await readJson<{
      displayName?: string;
      role?: string;
      expertise?: string[];
      communicationPreferences?: string;
      recurringInstructions?: string;
    }>(request);
    return jsonOk(updateProfile(body));
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Invalid request");
  }
}
