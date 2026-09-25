import { getDb } from "./db.js";
import { createId, nowIso, projectScope, slugify } from "./id.js";

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  scope: string;
  createdAt: string;
  updatedAt: string;
}

export function createProject(input: {
  name: string;
  description?: string;
  slug?: string;
}): Project {
  const db = getDb();
  const now = nowIso();
  const slug = input.slug ? slugify(input.slug) : slugify(input.name);
  const project: Project = {
    id: createId("proj"),
    name: input.name.trim(),
    slug,
    description: input.description ?? "",
    scope: projectScope(slug),
    createdAt: now,
    updatedAt: now,
  };

  db.prepare(
    `INSERT INTO adr_projects (id, name, slug, description, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    project.id,
    project.name,
    project.slug,
    project.description,
    project.createdAt,
    project.updatedAt
  );

  return project;
}

export function listProjects(): Project[] {
  const rows = getDb()
    .prepare("SELECT * FROM adr_projects ORDER BY name ASC")
    .all() as Array<{
    id: string;
    name: string;
    slug: string;
    description: string;
    created_at: string;
    updated_at: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    scope: projectScope(row.slug),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export function getProjectBySlug(slug: string): Project | null {
  const row = getDb()
    .prepare("SELECT * FROM adr_projects WHERE slug = ?")
    .get(slugify(slug)) as
    | {
        id: string;
        name: string;
        slug: string;
        description: string;
        created_at: string;
        updated_at: string;
      }
    | undefined;

  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    scope: projectScope(row.slug),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
