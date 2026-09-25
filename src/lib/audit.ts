import { getDb } from "./db";
import { createId, nowIso } from "./id";
import type { AuditEvent, AuditAction } from "./types";
import type { Principal } from "./policy";
import { sanitizeForLog } from "./logger";

export function recordAudit(input: {
  action: AuditAction;
  principal: Principal | null;
  scope?: string | null;
  memoryIds?: string[];
  memoryCount?: number;
  includedSensitive?: boolean;
  destination?: string | null;
  requestId?: string | null;
  metadata?: Record<string, unknown>;
}): AuditEvent {
  const db = getDb();
  const event: AuditEvent = {
    id: createId("aud"),
    action: input.action,
    actorType: input.principal?.kind ?? "system",
    actorId:
      input.principal?.kind === "user"
        ? input.principal.userId
        : input.principal?.kind === "integration"
          ? input.principal.integrationId
          : null,
    ownerId: input.principal?.userId ?? null,
    scope: input.scope ?? null,
    memoryIds: input.memoryIds ?? [],
    memoryCount: input.memoryCount ?? input.memoryIds?.length ?? 0,
    includedSensitive: Boolean(input.includedSensitive),
    destination: input.destination ?? null,
    requestId: input.requestId ?? null,
    metadata: input.metadata ?? {},
    createdAt: nowIso(),
  };

  db.prepare(
    `INSERT INTO audit_events
      (id, action, actor_type, actor_id, owner_id, scope, memory_ids, memory_count,
       included_sensitive, destination, request_id, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    event.id,
    event.action,
    event.actorType,
    event.actorId,
    event.ownerId,
    event.scope,
    JSON.stringify(event.memoryIds),
    event.memoryCount,
    event.includedSensitive ? 1 : 0,
    event.destination,
    event.requestId,
    JSON.stringify(sanitizeForLog(event.metadata)),
    event.createdAt
  );

  return event;
}

export function listAuditEvents(ownerId: string, limit = 50): AuditEvent[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM audit_events
       WHERE owner_id = ? OR owner_id IS NULL
       ORDER BY created_at DESC
       LIMIT ?`
    )
    .all(ownerId, limit) as Record<string, unknown>[];

  return rows.map((row) => ({
    id: String(row.id),
    action: String(row.action) as AuditAction,
    actorType: String(row.actor_type) as AuditEvent["actorType"],
    actorId: row.actor_id ? String(row.actor_id) : null,
    ownerId: row.owner_id ? String(row.owner_id) : null,
    scope: row.scope ? String(row.scope) : null,
    memoryIds: JSON.parse(String(row.memory_ids || "[]")) as string[],
    memoryCount: Number(row.memory_count || 0),
    includedSensitive: Boolean(row.included_sensitive),
    destination: row.destination ? String(row.destination) : null,
    requestId: row.request_id ? String(row.request_id) : null,
    metadata: JSON.parse(String(row.metadata || "{}")) as Record<string, unknown>,
    createdAt: String(row.created_at),
  }));
}
