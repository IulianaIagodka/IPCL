import { getDb } from "./db.js";
import { createId, nowIso } from "./id.js";
import type { Scope, Source, SourceType } from "./types.js";

function rowToSource(row: Record<string, unknown>): Source {
  return {
    id: String(row.id),
    type: String(row.type) as SourceType,
    title: String(row.title ?? ""),
    content: String(row.content),
    scope: row.scope ? String(row.scope) : null,
    createdAt: String(row.created_at),
    objectKey: row.object_key ? String(row.object_key) : null,
  };
}

export function createSource(input: {
  type: SourceType;
  title?: string;
  content: string;
  scope?: Scope | null;
  objectKey?: string | null;
}): Source {
  const db = getDb();
  const source: Source = {
    id: createId("src"),
    type: input.type,
    title: input.title ?? "",
    content: input.content,
    scope: input.scope ?? null,
    createdAt: nowIso(),
    objectKey: input.objectKey ?? null,
  };

  db.prepare(
    `INSERT INTO sources (id, type, title, content, scope, object_key, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    source.id,
    source.type,
    source.title,
    source.content,
    source.scope,
    source.objectKey,
    source.createdAt
  );

  return source;
}

export function getSource(id: string): Source | null {
  const row = getDb()
    .prepare("SELECT * FROM sources WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;
  return row ? rowToSource(row) : null;
}

export function listSources(options?: { scope?: Scope | null }): Source[] {
  const db = getDb();
  const rows = options?.scope
    ? (db
        .prepare("SELECT * FROM sources WHERE scope = ? ORDER BY created_at DESC")
        .all(options.scope) as Record<string, unknown>[])
    : (db
        .prepare("SELECT * FROM sources ORDER BY created_at DESC")
        .all() as Record<string, unknown>[]);
  return rows.map(rowToSource);
}
