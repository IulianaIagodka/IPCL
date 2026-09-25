import {
  deleteProject,
  getProject,
  updateProject,
} from "@/lib/vault";
import { jsonError, jsonOk, readJson } from "@/lib/http";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) return jsonError("Project not found", 404);
  return jsonOk(project);
}

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const body = await readJson<{
      name?: string;
      description?: string;
      technologyStack?: string[];
      targetUsers?: string;
      architecture?: string;
      constraints?: string;
    }>(request);
    const project = updateProject(id, body);
    if (!project) return jsonError("Project not found", 404);
    return jsonOk(project);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Invalid request");
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  if (!deleteProject(id)) return jsonError("Project not found", 404);
  return jsonOk({ ok: true });
}
