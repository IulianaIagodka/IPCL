import { jsonOk } from "@/lib/http";
import { listContextItems, listProjects, listSources } from "@/lib/vault";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const kind = searchParams.get("kind");

  const projects = listProjects();
  const projectName = new Map(projects.map((p) => [p.id, p.name]));
  const sources = listSources();
  const sourceTitle = new Map(sources.map((s) => [s.id, s.title || s.type]));

  const allowedKinds = new Set([
    "profile",
    "project",
    "decision",
    "preference",
    "knowledge",
    "note",
  ]);
  const items = listContextItems({
    projectId: projectId || undefined,
    kind:
      kind && allowedKinds.has(kind)
        ? (kind as
            | "profile"
            | "project"
            | "decision"
            | "preference"
            | "knowledge"
            | "note")
        : undefined,
  });

  return jsonOk({
    memories: items.map((item) => ({
      ...item,
      projectName: item.projectId
        ? projectName.get(item.projectId) ?? null
        : null,
      sourceLabel: item.sourceId
        ? sourceTitle.get(item.sourceId) ?? "Imported source"
        : "Manual entry",
    })),
    projects,
  });
}
