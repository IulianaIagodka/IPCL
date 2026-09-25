import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

/** Align with vault/control-plane data dir resolution (INT-1). */
const DATA_DIR = process.env.EIDOTHEA_DATA_DIR
  ? path.resolve(process.env.EIDOTHEA_DATA_DIR)
  : process.env.SLID_DATA_DIR
    ? path.resolve(process.env.SLID_DATA_DIR)
    : process.env.MEMORA_DATA_DIR
      ? path.resolve(process.env.MEMORA_DATA_DIR)
      : process.env.IPCL_DATA_DIR
        ? path.resolve(process.env.IPCL_DATA_DIR)
        : path.join(process.cwd(), "data");

/**
 * INT-1: one storage path with the vault control plane.
 * ADR-002 tables that would collide with vault (`sources`, `projects`)
 * use the `adr_` prefix inside the same SQLite file.
 */
const DB_PATH = path.join(DATA_DIR, "context-vault.sqlite");

let dbInstance: Database.Database | null = null;
/** True when this module opened the connection (vs bindSharedDb). */
let ownsConnection = false;

/**
 * ADR-002 schema co-located with the vault DB.
 * Uses adr_sources / adr_projects to avoid colliding with vault tables.
 */
export function ensureAdrSchema(db: Database.Database) {
  db.exec(`
    PRAGMA foreign_keys = ON;

    -- Layer 1: immutable raw sources (evidence)
    CREATE TABLE IF NOT EXISTS adr_sources (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL,
      scope TEXT,
      object_key TEXT,
      created_at TEXT NOT NULL
    );

    -- Projects are scope helpers (project/<slug>)
    CREATE TABLE IF NOT EXISTS adr_projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Layer 2: structured memory (canonical knowledge)
    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      scope TEXT NOT NULL,
      statement TEXT NOT NULL,
      importance TEXT NOT NULL DEFAULT 'medium',
      confidence TEXT NOT NULL DEFAULT 'medium',
      sensitivity TEXT NOT NULL DEFAULT 'normal',
      valid_from TEXT,
      valid_until TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      pinned INTEGER NOT NULL DEFAULT 0,
      supersedes_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (supersedes_id) REFERENCES memories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS memory_source_links (
      memory_id TEXT NOT NULL,
      source_id TEXT NOT NULL,
      PRIMARY KEY (memory_id, source_id),
      FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE CASCADE,
      FOREIGN KEY (source_id) REFERENCES adr_sources(id) ON DELETE CASCADE
    );

    -- Layer 3: semantic index (regenerable)
    CREATE TABLE IF NOT EXISTS memory_embeddings (
      memory_id TEXT PRIMARY KEY,
      embedding TEXT NOT NULL,
      model TEXT NOT NULL DEFAULT 'local-tf-v1',
      updated_at TEXT NOT NULL,
      FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_memories_scope_status
      ON memories(scope, status);
    CREATE INDEX IF NOT EXISTS idx_memories_type_status
      ON memories(type, status);
    CREATE INDEX IF NOT EXISTS idx_adr_sources_scope
      ON adr_sources(scope);
  `);
}

/**
 * Attach to the vault's open SQLite connection (one storage path).
 * Does not take ownership — vault closes the handle.
 */
export function bindSharedDb(db: Database.Database): void {
  if (dbInstance && ownsConnection && dbInstance !== db) {
    dbInstance.close();
  }
  dbInstance = db;
  ownsConnection = false;
  ensureAdrSchema(db);
}

export function getDb(): Database.Database {
  if (dbInstance) return dbInstance;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  dbInstance = new Database(DB_PATH);
  ownsConnection = true;
  dbInstance.exec("PRAGMA journal_mode = WAL;");
  ensureAdrSchema(dbInstance);
  return dbInstance;
}

export function resetDbForTests(tempPath: string): Database.Database {
  if (dbInstance && ownsConnection) {
    dbInstance.close();
  }
  dbInstance = null;
  ownsConnection = false;
  fs.mkdirSync(path.dirname(tempPath), { recursive: true });
  if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  dbInstance = new Database(tempPath);
  ownsConnection = true;
  dbInstance.exec("PRAGMA journal_mode = WAL;");
  ensureAdrSchema(dbInstance);
  return dbInstance;
}

export function closeDb(): void {
  if (dbInstance && ownsConnection) {
    dbInstance.close();
  }
  dbInstance = null;
  ownsConnection = false;
}

export function getDataDir(): string {
  return DATA_DIR;
}

export function getDbPath(): string {
  return DB_PATH;
}
