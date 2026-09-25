import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = process.env.EIDOTHEA_DATA_DIR
  ? path.resolve(process.env.EIDOTHEA_DATA_DIR)
  : process.env.SLID_DATA_DIR
    ? path.resolve(process.env.SLID_DATA_DIR)
    : process.env.MEMORA_DATA_DIR
      ? path.resolve(process.env.MEMORA_DATA_DIR)
      : process.env.IPCL_DATA_DIR
        ? path.resolve(process.env.IPCL_DATA_DIR)
        : path.join(process.cwd(), "data");

const DB_PATH = path.join(DATA_DIR, "context-vault.sqlite");

let dbInstance: Database.Database | null = null;

function tableColumns(db: Database.Database, table: string): Set<string> {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as {
    name: string;
  }[];
  return new Set(rows.map((r) => r.name));
}

function addColumnIfMissing(
  db: Database.Database,
  table: string,
  column: string,
  ddl: string
) {
  const cols = tableColumns(db, table);
  if (!cols.has(column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
  }
}

function ensureSchema(db: Database.Database) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL DEFAULT '',
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      revoked_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS secrets (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      label TEXT NOT NULL DEFAULT '',
      ciphertext TEXT NOT NULL,
      created_at TEXT NOT NULL,
      rotated_at TEXT NOT NULL,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS integrations (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      name TEXT NOT NULL,
      provider TEXT NOT NULL DEFAULT 'mcp',
      access_mode TEXT NOT NULL DEFAULT 'READ_ONLY',
      scopes TEXT NOT NULL DEFAULT '[]',
      allowed_project_ids TEXT NOT NULL DEFAULT 'null',
      allowed_classifications TEXT NOT NULL DEFAULT '["NORMAL"]',
      token_hash TEXT NOT NULL,
      token_hint TEXT NOT NULL DEFAULT '',
      secret_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      revoked_at TEXT,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity_events (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      summary TEXT NOT NULL,
      detail TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      actor_type TEXT NOT NULL,
      actor_id TEXT,
      owner_id TEXT,
      scope TEXT,
      memory_ids TEXT NOT NULL DEFAULT '[]',
      memory_count INTEGER NOT NULL DEFAULT 0,
      included_sensitive INTEGER NOT NULL DEFAULT 0,
      destination TEXT,
      request_id TEXT,
      metadata TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS candidate_memories (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      integration_id TEXT,
      kind TEXT NOT NULL,
      project_id TEXT,
      title TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL,
      rationale TEXT NOT NULL DEFAULT '',
      classification TEXT NOT NULL DEFAULT 'NORMAL',
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      resolved_at TEXT,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS profile (
      id TEXT PRIMARY KEY,
      owner_id TEXT,
      display_name TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT '',
      expertise TEXT NOT NULL DEFAULT '[]',
      communication_preferences TEXT NOT NULL DEFAULT '',
      recurring_instructions TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      owner_id TEXT,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      technology_stack TEXT NOT NULL DEFAULT '[]',
      target_users TEXT NOT NULL DEFAULT '',
      architecture TEXT NOT NULL DEFAULT '',
      constraints TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS preferences (
      id TEXT PRIMARY KEY,
      owner_id TEXT,
      content TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      classification TEXT NOT NULL DEFAULT 'NORMAL',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS decisions (
      id TEXT PRIMARY KEY,
      owner_id TEXT,
      project_id TEXT,
      content TEXT NOT NULL,
      rationale TEXT NOT NULL DEFAULT '',
      classification TEXT NOT NULL DEFAULT 'NORMAL',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sources (
      id TEXT PRIMARY KEY,
      owner_id TEXT,
      project_id TEXT,
      type TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL,
      classification TEXT NOT NULL DEFAULT 'NORMAL',
      created_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS context_items (
      id TEXT PRIMARY KEY,
      owner_id TEXT,
      kind TEXT NOT NULL,
      project_id TEXT,
      source_id TEXT,
      title TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      classification TEXT NOT NULL DEFAULT 'NORMAL',
      embedding TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE SET NULL
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS context_fts USING fts5(
      item_id UNINDEXED,
      title,
      content,
      tags,
      kind,
      tokenize = 'porter unicode61'
    );

    -- INT-1: links vault context item ids to ADR-002 memory ids
    CREATE TABLE IF NOT EXISTS adr_memory_links (
      vault_ref TEXT PRIMARY KEY,
      memory_id TEXT NOT NULL,
      owner_id TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Soft migrations for vaults created before ADR-003.
  addColumnIfMissing(db, "profile", "owner_id", "owner_id TEXT");
  addColumnIfMissing(db, "projects", "owner_id", "owner_id TEXT");
  addColumnIfMissing(db, "preferences", "owner_id", "owner_id TEXT");
  addColumnIfMissing(db, "preferences", "classification", "classification TEXT NOT NULL DEFAULT 'NORMAL'");
  addColumnIfMissing(db, "decisions", "owner_id", "owner_id TEXT");
  addColumnIfMissing(db, "decisions", "classification", "classification TEXT NOT NULL DEFAULT 'NORMAL'");
  addColumnIfMissing(db, "sources", "owner_id", "owner_id TEXT");
  addColumnIfMissing(db, "sources", "classification", "classification TEXT NOT NULL DEFAULT 'NORMAL'");
  addColumnIfMissing(db, "context_items", "owner_id", "owner_id TEXT");
  addColumnIfMissing(
    db,
    "context_items",
    "classification",
    "classification TEXT NOT NULL DEFAULT 'NORMAL'"
  );

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);
    CREATE INDEX IF NOT EXISTS idx_integrations_token ON integrations(token_hash);
    CREATE INDEX IF NOT EXISTS idx_context_owner ON context_items(owner_id);
    CREATE INDEX IF NOT EXISTS idx_audit_owner ON audit_events(owner_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_adr_memory_links_memory ON adr_memory_links(memory_id);
  `);
}

export function getDb(): Database.Database {
  if (dbInstance) return dbInstance;

  fs.mkdirSync(DATA_DIR, { recursive: true });
  dbInstance = new Database(DB_PATH);
  ensureSchema(dbInstance);
  return dbInstance;
}

export function resetDbForTests(tempPath: string) {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
  fs.mkdirSync(path.dirname(tempPath), { recursive: true });
  if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  dbInstance = new Database(tempPath);
  ensureSchema(dbInstance);
  return dbInstance;
}

export function getDataDir(): string {
  return DATA_DIR;
}

export function closeDb() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
