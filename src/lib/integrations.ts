import { getDb } from "./db";
import { createId, nowIso } from "./id";

export type IntegrationStatus = "connected" | "disconnected";

export interface Integration {
  id: string;
  name: string;
  status: IntegrationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationPermission {
  integrationId: string;
  scopeKey: string;
  allowed: boolean;
}

export interface ActivityEvent {
  id: string;
  kind: "share" | "access" | "connect" | "disconnect" | "restrict" | "learn";
  summary: string;
  detail: string;
  createdAt: string;
}

const DEFAULT_INTEGRATIONS = ["ChatGPT", "Claude", "Cursor", "Gemini"] as const;

function ensureIntegrationTables() {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS integrations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'disconnected',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS integration_permissions (
      integration_id TEXT NOT NULL,
      scope_key TEXT NOT NULL,
      allowed INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (integration_id, scope_key),
      FOREIGN KEY (integration_id) REFERENCES integrations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity_events (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      summary TEXT NOT NULL,
      detail TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
  `);

  const count = (
    db.prepare("SELECT COUNT(*) AS c FROM integrations").get() as { c: number }
  ).c;
  if (count === 0) {
    const insert = db.prepare(
      `INSERT INTO integrations (id, name, status, created_at, updated_at)
       VALUES (?, ?, 'disconnected', ?, ?)`
    );
    const now = nowIso();
    for (const name of DEFAULT_INTEGRATIONS) {
      insert.run(createId(), name, now, now);
    }
  }
}

function rowToIntegration(row: Record<string, unknown>): Integration {
  return {
    id: String(row.id),
    name: String(row.name),
    status: String(row.status) as IntegrationStatus,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function listIntegrations(): Integration[] {
  ensureIntegrationTables();
  const rows = getDb()
    .prepare("SELECT * FROM integrations ORDER BY name ASC")
    .all() as Record<string, unknown>[];
  return rows.map(rowToIntegration);
}

export function setIntegrationStatus(
  id: string,
  status: IntegrationStatus
): Integration | null {
  ensureIntegrationTables();
  const db = getDb();
  const existing = db
    .prepare("SELECT * FROM integrations WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;
  if (!existing) return null;

  const now = nowIso();
  db.prepare(
    "UPDATE integrations SET status = ?, updated_at = ? WHERE id = ?"
  ).run(status, now, id);

  recordActivity({
    kind: status === "connected" ? "connect" : "disconnect",
    summary:
      status === "connected"
        ? `${existing.name} connected`
        : `${existing.name} disconnected`,
    detail:
      status === "connected"
        ? "Integration can receive allowed scopes when you share."
        : "Integration no longer has live access.",
  });

  return rowToIntegration({ ...existing, status, updated_at: now });
}

export function listPermissions(): IntegrationPermission[] {
  ensureIntegrationTables();
  const rows = getDb()
    .prepare(
      "SELECT integration_id, scope_key, allowed FROM integration_permissions"
    )
    .all() as Record<string, unknown>[];
  return rows.map((row) => ({
    integrationId: String(row.integration_id),
    scopeKey: String(row.scope_key),
    allowed: Boolean(row.allowed),
  }));
}

export function setPermission(
  integrationId: string,
  scopeKey: string,
  allowed: boolean
): IntegrationPermission {
  ensureIntegrationTables();
  getDb()
    .prepare(
      `INSERT INTO integration_permissions (integration_id, scope_key, allowed)
       VALUES (?, ?, ?)
       ON CONFLICT(integration_id, scope_key)
       DO UPDATE SET allowed = excluded.allowed`
    )
    .run(integrationId, scopeKey, allowed ? 1 : 0);

  const integration = listIntegrations().find((i) => i.id === integrationId);
  recordActivity({
    kind: "restrict",
    summary: `${integration?.name ?? "Integration"} · ${scopeKey} ${allowed ? "allowed" : "restricted"}`,
    detail: allowed
      ? "Scope marked as shareable for this integration."
      : "Scope blocked for this integration.",
  });

  return { integrationId, scopeKey, allowed };
}

export function listActivity(limit = 40): ActivityEvent[] {
  ensureIntegrationTables();
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
  ensureIntegrationTables();
  const event: ActivityEvent = {
    id: createId(),
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

export function getPermissionMatrix(scopes: string[]) {
  const integrations = listIntegrations();
  const permissions = listPermissions();
  const lookup = new Map(
    permissions.map((p) => [`${p.integrationId}:${p.scopeKey}`, p.allowed])
  );

  return {
    integrations,
    scopes,
    cells: integrations.flatMap((integration) =>
      scopes.map((scope) => ({
        integrationId: integration.id,
        integrationName: integration.name,
        scopeKey: scope,
        allowed: lookup.get(`${integration.id}:${scope}`) ?? false,
        connected: integration.status === "connected",
      }))
    ),
  };
}
