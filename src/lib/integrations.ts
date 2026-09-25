import { getDb } from "./db";
import { generateToken, hashToken } from "./crypto";
import { createId, nowIso } from "./id";
import { storeEncryptedSecret, deleteSecret } from "./auth";
import { recordAudit } from "./audit";
import { DEFAULT_READ_SCOPES } from "./policy";
import type { Principal } from "./policy";
import type {
  ActivityEvent,
  DataClassification,
  Integration,
  IntegrationAccessMode,
  IntegrationScope,
} from "./types";

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function rowToIntegration(row: Record<string, unknown>): Integration {
  return {
    id: String(row.id),
    ownerId: String(row.owner_id),
    name: String(row.name),
    provider: String(row.provider),
    accessMode: String(row.access_mode) as IntegrationAccessMode,
    scopes: parseJson<IntegrationScope[]>(String(row.scopes), []),
    allowedProjectIds: parseJson<string[] | null>(
      String(row.allowed_project_ids),
      null
    ),
    allowedClassifications: parseJson<DataClassification[]>(
      String(row.allowed_classifications),
      ["NORMAL"]
    ),
    tokenHint: String(row.token_hint ?? ""),
    revokedAt: row.revoked_at ? String(row.revoked_at) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function listIntegrations(ownerId: string): Integration[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM integrations WHERE owner_id = ? ORDER BY created_at DESC`
    )
    .all(ownerId) as Record<string, unknown>[];
  return rows.map(rowToIntegration);
}

export function getIntegration(id: string, ownerId: string): Integration | null {
  const row = getDb()
    .prepare(`SELECT * FROM integrations WHERE id = ? AND owner_id = ?`)
    .get(id, ownerId) as Record<string, unknown> | undefined;
  return row ? rowToIntegration(row) : null;
}

export function createIntegration(input: {
  ownerId: string;
  name: string;
  provider: string;
  accessMode?: IntegrationAccessMode;
  scopes?: IntegrationScope[];
  allowedProjectIds?: string[] | null;
  allowedClassifications?: DataClassification[];
}): { integration: Integration; token: string } {
  const now = nowIso();
  const token = generateToken(32);
  const accessMode = input.accessMode ?? "READ_ONLY";
  let scopes = input.scopes ?? [...DEFAULT_READ_SCOPES];
  if (accessMode === "READ_ONLY") {
    scopes = scopes.filter(
      (s) => !["context:write", "memory:create", "memory:update"].includes(s)
    );
  }
  const classifications = input.allowedClassifications ?? ["NORMAL"];
  // RESTRICTED never granted to integrations
  const allowedClassifications = classifications.filter((c) => c !== "RESTRICTED");

  const secretId = storeEncryptedSecret(
    input.ownerId,
    `integration:${input.name}`,
    token
  );

  const integration: Integration = {
    id: createId("int"),
    ownerId: input.ownerId,
    name: input.name.trim(),
    provider: input.provider.trim() || "mcp",
    accessMode,
    scopes,
    allowedProjectIds: input.allowedProjectIds ?? null,
    allowedClassifications,
    tokenHint: `${token.slice(0, 4)}…${token.slice(-4)}`,
    revokedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  getDb()
    .prepare(
      `INSERT INTO integrations
        (id, owner_id, name, provider, access_mode, scopes, allowed_project_ids,
         allowed_classifications, token_hash, token_hint, secret_id, created_at, updated_at, revoked_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`
    )
    .run(
      integration.id,
      integration.ownerId,
      integration.name,
      integration.provider,
      integration.accessMode,
      JSON.stringify(integration.scopes),
      JSON.stringify(integration.allowedProjectIds),
      JSON.stringify(integration.allowedClassifications),
      hashToken(token),
      integration.tokenHint,
      secretId,
      integration.createdAt,
      integration.updatedAt
    );

  recordAudit({
    action: "integration_connected",
    principal: {
      kind: "user",
      userId: input.ownerId,
      email: "",
      sessionId: "",
    },
    metadata: {
      integrationId: integration.id,
      accessMode,
      scopes,
      projects: integration.allowedProjectIds,
    },
  });

  return { integration, token };
}

export function updateIntegration(
  id: string,
  ownerId: string,
  updates: Partial<{
    name: string;
    accessMode: IntegrationAccessMode;
    scopes: IntegrationScope[];
    allowedProjectIds: string[] | null;
    allowedClassifications: DataClassification[];
  }>
): Integration | null {
  const current = getIntegration(id, ownerId);
  if (!current || current.revokedAt) return null;

  let scopes = updates.scopes ?? current.scopes;
  const accessMode = updates.accessMode ?? current.accessMode;
  if (accessMode === "READ_ONLY") {
    scopes = scopes.filter(
      (s) => !["context:write", "memory:create", "memory:update"].includes(s)
    );
  }
  const allowedClassifications = (
    updates.allowedClassifications ?? current.allowedClassifications
  ).filter((c) => c !== "RESTRICTED");

  const next: Integration = {
    ...current,
    name: updates.name?.trim() ?? current.name,
    accessMode,
    scopes,
    allowedProjectIds:
      updates.allowedProjectIds !== undefined
        ? updates.allowedProjectIds
        : current.allowedProjectIds,
    allowedClassifications,
    updatedAt: nowIso(),
  };

  getDb()
    .prepare(
      `UPDATE integrations SET
        name = ?, access_mode = ?, scopes = ?, allowed_project_ids = ?,
        allowed_classifications = ?, updated_at = ?
       WHERE id = ? AND owner_id = ?`
    )
    .run(
      next.name,
      next.accessMode,
      JSON.stringify(next.scopes),
      JSON.stringify(next.allowedProjectIds),
      JSON.stringify(next.allowedClassifications),
      next.updatedAt,
      id,
      ownerId
    );

  if (
    updates.accessMode === "READ_WRITE" ||
    (updates.scopes && updates.scopes.some((s) => s.includes("write") || s.includes("create")))
  ) {
    recordAudit({
      action: "integration_permission_expanded",
      principal: {
        kind: "user",
        userId: ownerId,
        email: "",
        sessionId: "",
      },
      metadata: { integrationId: id, accessMode, scopes },
    });
  }

  return next;
}

export function revokeIntegration(id: string, ownerId: string): boolean {
  const row = getDb()
    .prepare(`SELECT secret_id FROM integrations WHERE id = ? AND owner_id = ?`)
    .get(id, ownerId) as { secret_id: string | null } | undefined;
  if (!row) return false;

  getDb()
    .prepare(
      `UPDATE integrations
       SET revoked_at = ?, updated_at = ?, token_hash = 'revoked'
       WHERE id = ? AND owner_id = ?`
    )
    .run(nowIso(), nowIso(), id, ownerId);

  if (row.secret_id) deleteSecret(row.secret_id, ownerId);

  recordAudit({
    action: "integration_revoked",
    principal: {
      kind: "user",
      userId: ownerId,
      email: "",
      sessionId: "",
    },
    metadata: { integrationId: id },
  });
  return true;
}

export function rotateIntegrationToken(
  id: string,
  ownerId: string
): { integration: Integration; token: string } | null {
  const current = getIntegration(id, ownerId);
  if (!current || current.revokedAt) return null;

  const row = getDb()
    .prepare(`SELECT secret_id FROM integrations WHERE id = ?`)
    .get(id) as { secret_id: string | null };

  if (row?.secret_id) deleteSecret(row.secret_id, ownerId);

  const token = generateToken(32);
  const secretId = storeEncryptedSecret(ownerId, `integration:${current.name}`, token);
  const hint = `${token.slice(0, 4)}…${token.slice(-4)}`;
  const updatedAt = nowIso();

  getDb()
    .prepare(
      `UPDATE integrations
       SET token_hash = ?, token_hint = ?, secret_id = ?, updated_at = ?
       WHERE id = ? AND owner_id = ?`
    )
    .run(hashToken(token), hint, secretId, updatedAt, id, ownerId);

  recordAudit({
    action: "credential_rotated",
    principal: {
      kind: "user",
      userId: ownerId,
      email: "",
      sessionId: "",
    },
    metadata: { integrationId: id },
  });

  return {
    integration: { ...current, tokenHint: hint, updatedAt },
    token,
  };
}

export function resolveIntegrationToken(token: string | null | undefined): Principal | null {
  if (!token) return null;
  const row = getDb()
    .prepare(
      `SELECT * FROM integrations
       WHERE token_hash = ? AND revoked_at IS NULL`
    )
    .get(hashToken(token)) as Record<string, unknown> | undefined;
  if (!row) return null;

  const integration = rowToIntegration(row);
  return {
    kind: "integration",
    userId: integration.ownerId,
    integrationId: integration.id,
    name: integration.name,
    provider: integration.provider,
    accessMode: integration.accessMode,
    scopes: integration.scopes,
    allowedProjectIds: integration.allowedProjectIds,
    allowedClassifications: integration.allowedClassifications,
  };
}

/** Activity feed retained from main (ADR-005 vault UI) after ADR-003/004 merge. */
export function listActivity(limit = 40): ActivityEvent[] {
  const rows = getDb()
    .prepare(
      "SELECT * FROM activity_events ORDER BY created_at DESC LIMIT ?"
    )
    .all(limit) as Record<string, unknown>[];
  return rows.map((row) => ({
    id: String(row.id),
    kind: String(row.kind) as ActivityEvent["kind"],
    summary: String(row.summary),
    detail: String(row.detail ?? ""),
    createdAt: String(row.created_at),
  }));
}

export function recordActivity(input: {
  kind: ActivityEvent["kind"];
  summary: string;
  detail?: string;
}): ActivityEvent {
  const event: ActivityEvent = {
    id: createId("act"),
    kind: input.kind,
    summary: input.summary,
    detail: input.detail ?? "",
    createdAt: nowIso(),
  };
  getDb()
    .prepare(
      `INSERT INTO activity_events (id, kind, summary, detail, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(event.id, event.kind, event.summary, event.detail, event.createdAt);
  return event;
}
