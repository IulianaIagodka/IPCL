import { createProject, listProjects } from "@/lib/vault";
import { readJson, withAuth } from "@/lib/http";
import { assertScope } from "@/lib/policy";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return withAuth(
    request,
    async (principal) => {
      assertScope(principal, "projects:read");
      return listProjects().filter((p) => {
        if (principal.kind === "user") return true;
        if (principal.allowedProjectIds === null) return true;
        return principal.allowedProjectIds.includes(p.id);
      });
    },
    { allowIntegration: true }
  );
}

export async function POST(request: Request) {
  return withAuth(request, async () => {
    const body = await readJson<{
      name: string;
      description?: string;
      technologyStack?: string[];
      targetUsers?: string;
      architecture?: string;
      constraints?: string;
    }>(request);
    if (!body.name?.trim()) throw new Error("name is required");
    return createProject(body);
  });
}
