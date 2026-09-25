import { getDb } from "./db.js";
import {
  cosineSimilarity,
  deserializeEmbedding,
  embed,
  serializeEmbedding,
  type SparseEmbedding,
} from "./embed.js";
import { createId, nowIso } from "./id.js";
import type {
  Confidence,
  Importance,
  Memory,
  MemoryStatus,
  MemoryType,
  Scope,
  Sensitivity,
} from "./types.js";

interface MemoryRow {
  id: string;
  type: string;
  scope: string;
  statement: string;
  importance: string;
  confidence: string;
  sensitivity: string;
  valid_from: string | null;
  valid_until: string | null;
  status: string;
  pinned: number;
  supersedes_id: string | null;
  created_at: string;
  updated_at: string;
}

function rowToMemory(row: MemoryRow, sourceIds: string[]): Memory {
  return {
    id: row.id,
    type: row.type as MemoryType,
    scope: row.scope,
    statement: row.statement,
    importance: row.importance as Importance,
    confidence: row.confidence as Confidence,
    sensitivity: row.sensitivity as Sensitivity,
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    status: row.status as MemoryStatus,
    sourceIds,
    pinned: Boolean(row.pinned),
    supersedesId: row.supersedes_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function loadSourceIds(memoryId: string): string[] {
  const rows = getDb()
    .prepare(
      "SELECT source_id FROM memory_source_links WHERE memory_id = ? ORDER BY source_id"
    )
    .all(memoryId) as Array<{ source_id: string }>;
  return rows.map((r) => r.source_id);
}

function linkSources(memoryId: string, sourceIds: string[]): void {
  const db = getDb();
  const insert = db.prepare(
    `INSERT OR IGNORE INTO memory_source_links (memory_id, source_id) VALUES (?, ?)`
  );
  for (const sourceId of sourceIds) {
    insert.run(memoryId, sourceId);
  }
}

export function indexMemory(memory: Memory): SparseEmbedding {
  const db = getDb();
  const embedding = embed(
    `${memory.type} ${memory.scope} ${memory.statement}`
  );
  db.prepare(
    `INSERT INTO memory_embeddings (memory_id, embedding, model, updated_at)
     VALUES (?, ?, 'local-tf-v1', ?)
     ON CONFLICT(memory_id) DO UPDATE SET
       embedding = excluded.embedding,
       updated_at = excluded.updated_at`
  ).run(memory.id, serializeEmbedding(embedding), nowIso());
  return embedding;
}

export function getMemoryEmbedding(memoryId: string): SparseEmbedding {
  const row = getDb()
    .prepare("SELECT embedding FROM memory_embeddings WHERE memory_id = ?")
    .get(memoryId) as { embedding: string } | undefined;
  return deserializeEmbedding(row?.embedding ?? null);
}

export function createMemory(input: {
  type: MemoryType;
  scope: Scope;
  statement: string;
  importance?: Importance;
  confidence?: Confidence;
  sensitivity?: Sensitivity;
  validFrom?: string | null;
  validUntil?: string | null;
  status?: MemoryStatus;
  sourceIds?: string[];
  pinned?: boolean;
  supersedesId?: string | null;
}): Memory {
  const db = getDb();
  const now = nowIso();
  const memory: Memory = {
    id: createId("mem"),
    type: input.type,
    scope: input.scope,
    statement: input.statement.trim(),
    importance: input.importance ?? "medium",
    confidence: input.confidence ?? "medium",
    sensitivity: input.sensitivity ?? "normal",
    validFrom: input.validFrom ?? now,
    validUntil: input.validUntil ?? null,
    status: input.status ?? "active",
    sourceIds: [...new Set(input.sourceIds ?? [])],
    pinned: input.pinned ?? false,
    supersedesId: input.supersedesId ?? null,
    createdAt: now,
    updatedAt: now,
  };

  db.prepare(
    `INSERT INTO memories (
      id, type, scope, statement, importance, confidence, sensitivity,
      valid_from, valid_until, status, pinned, supersedes_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    memory.id,
    memory.type,
    memory.scope,
    memory.statement,
    memory.importance,
    memory.confidence,
    memory.sensitivity,
    memory.validFrom,
    memory.validUntil,
    memory.status,
    memory.pinned ? 1 : 0,
    memory.supersedesId,
    memory.createdAt,
    memory.updatedAt
  );

  if (memory.sourceIds.length) linkSources(memory.id, memory.sourceIds);
  indexMemory(memory);
  return memory;
}

export function getMemory(id: string): Memory | null {
  const row = getDb()
    .prepare("SELECT * FROM memories WHERE id = ?")
    .get(id) as MemoryRow | undefined;
  if (!row) return null;
  return rowToMemory(row, loadSourceIds(id));
}

export function listMemories(options?: {
  scope?: Scope | null;
  status?: MemoryStatus | MemoryStatus[];
  type?: MemoryType | MemoryType[];
  includeDeleted?: boolean;
}): Memory[] {
  const db = getDb();
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (options?.scope) {
    clauses.push("scope = ?");
    params.push(options.scope);
  }

  if (options?.status) {
    const statuses = Array.isArray(options.status)
      ? options.status
      : [options.status];
    clauses.push(`status IN (${statuses.map(() => "?").join(",")})`);
    params.push(...statuses);
  } else if (!options?.includeDeleted) {
    clauses.push("status != 'deleted'");
  }

  if (options?.type) {
    const types = Array.isArray(options.type) ? options.type : [options.type];
    clauses.push(`type IN (${types.map(() => "?").join(",")})`);
    params.push(...types);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = db
    .prepare(`SELECT * FROM memories ${where} ORDER BY updated_at DESC`)
    .all(...params) as MemoryRow[];

  return rows.map((row) => rowToMemory(row, loadSourceIds(row.id)));
}

export function updateMemory(
  id: string,
  updates: Partial<{
    statement: string;
    importance: Importance;
    confidence: Confidence;
    sensitivity: Sensitivity;
    scope: Scope;
    type: MemoryType;
    status: MemoryStatus;
    pinned: boolean;
    validFrom: string | null;
    validUntil: string | null;
    sourceIds: string[];
  }>
): Memory {
  const existing = getMemory(id);
  if (!existing) throw new Error(`Memory not found: ${id}`);

  const next: Memory = {
    ...existing,
    statement: updates.statement?.trim() ?? existing.statement,
    importance: updates.importance ?? existing.importance,
    confidence: updates.confidence ?? existing.confidence,
    sensitivity: updates.sensitivity ?? existing.sensitivity,
    scope: updates.scope ?? existing.scope,
    type: updates.type ?? existing.type,
    status: updates.status ?? existing.status,
    pinned: updates.pinned ?? existing.pinned,
    validFrom:
      updates.validFrom !== undefined ? updates.validFrom : existing.validFrom,
    validUntil:
      updates.validUntil !== undefined
        ? updates.validUntil
        : existing.validUntil,
    sourceIds: updates.sourceIds ?? existing.sourceIds,
    updatedAt: nowIso(),
  };

  getDb()
    .prepare(
      `UPDATE memories SET
        type = ?, scope = ?, statement = ?, importance = ?, confidence = ?,
        sensitivity = ?, valid_from = ?, valid_until = ?, status = ?, pinned = ?,
        updated_at = ?
       WHERE id = ?`
    )
    .run(
      next.type,
      next.scope,
      next.statement,
      next.importance,
      next.confidence,
      next.sensitivity,
      next.validFrom,
      next.validUntil,
      next.status,
      next.pinned ? 1 : 0,
      next.updatedAt,
      next.id
    );

  if (updates.sourceIds) {
    const db = getDb();
    db.prepare("DELETE FROM memory_source_links WHERE memory_id = ?").run(id);
    linkSources(id, next.sourceIds);
  }

  indexMemory(next);
  return { ...next, sourceIds: loadSourceIds(id) };
}

/** Temporal update: mark old superseded and create a new active memory. */
export function supersedeMemory(
  oldId: string,
  input: {
    statement: string;
    sourceIds?: string[];
    importance?: Importance;
    confidence?: Confidence;
    sensitivity?: Sensitivity;
  }
): { old: Memory; next: Memory } {
  const old = getMemory(oldId);
  if (!old) throw new Error(`Memory not found: ${oldId}`);

  const now = nowIso();
  updateMemory(oldId, {
    status: "superseded",
    validUntil: now,
  });

  const next = createMemory({
    type: old.type,
    scope: old.scope,
    statement: input.statement,
    importance: input.importance ?? old.importance,
    confidence: input.confidence ?? old.confidence,
    sensitivity: input.sensitivity ?? old.sensitivity,
    sourceIds: input.sourceIds ?? old.sourceIds,
    supersedesId: old.id,
    pinned: old.pinned,
  });

  return { old: getMemory(oldId)!, next };
}

export function archiveMemory(id: string): Memory {
  return updateMemory(id, { status: "archived" });
}

export function deleteMemory(id: string): Memory {
  return updateMemory(id, { status: "deleted" });
}

export function pinMemory(id: string, pinned = true): Memory {
  return updateMemory(id, { pinned });
}

export function findConflictingMemories(
  statement: string,
  scope: Scope,
  threshold = 0.5
): Memory[] {
  const queryEmbedding = embed(statement);
  const actives = listMemories({ scope, status: "active" });
  const hits: Array<{ memory: Memory; score: number }> = [];

  for (const memory of actives) {
    const embedding = getMemoryEmbedding(memory.id);
    const score = cosineSimilarity(queryEmbedding, embedding);
    if (score >= threshold) hits.push({ memory, score });
  }

  return hits
    .sort((a, b) => b.score - a.score)
    .map((h) => h.memory);
}
