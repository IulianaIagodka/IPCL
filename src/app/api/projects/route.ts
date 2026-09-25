import {
  createProject,
  listProjects,
} from "@/lib/vault";
import { jsonError, jsonOk, readJson } from "@/lib/http";

export const runtime = "nodejs";

export async function GET() {
  return jsonOk(listProjects());
}

export async function POST(request: Request) {
  try {
    const body = await readJson<{
      name: string;
      description?: string;
      technologyStack?: string[];
      targetUsers?: string;
      architecture?: string;
      constraints?: string;
    }>(request);
    if (!body.name?.trim()) return jsonError("name is required");
    return jsonOk(createProject(body), { status: 201 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Invalid request");
  }
}
