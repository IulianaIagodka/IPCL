import {
  deleteProject,
  getProject,
  updateProject,
} from "@/lib/vault";
import { readJson, withAuth } from "@/lib/http";
import { assertScope } from "@/lib/policy";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  return withAuth(
    request,
    async (principal) => {
      assertScope(principal, "projects:read", id);
      const project = getProject(id);
      if (!project) throw new Error("Project not found");
      return project;
    },
    { allowIntegration: true }
  );
}

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  return withAuth(request, async () => {
    const body = await readJson<{
      name?: string;
      description?: string;
      technologyStack?: string[];
      targetUsers?: string;
      architecture?: string;
      constraints?: string;
    }>(request);
    const project = updateProject(id, body);
    if (!project) throw new Error("Project not found");
    return project;
  });
}

export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params;
  return withAuth(request, async () => {
    if (!deleteProject(id)) throw new Error("Project not found");
    return { ok: true };
  });
}
