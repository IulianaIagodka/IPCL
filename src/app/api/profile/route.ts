import { getProfile, updateProfile } from "@/lib/vault";
import { readJson, withAuth } from "@/lib/http";
import { assertScope } from "@/lib/policy";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return withAuth(
    request,
    async (principal) => {
      assertScope(principal, "profile:read");
      return getProfile();
    },
    { allowIntegration: true }
  );
}

export async function PUT(request: Request) {
  return withAuth(request, async () => {
    const body = await readJson<{
      displayName?: string;
      role?: string;
      expertise?: string[];
      communicationPreferences?: string;
      recurringInstructions?: string;
    }>(request);
    return updateProfile(body);
  });
}
