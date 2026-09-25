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

/** ADR-002 memory index — separate file until full schema merge. */
const DB_PATH = path.join(DATA_DIR, "context-memories.sqlite");

let dbInstance: Database.Database | null = null;

function ensureSchema(db: Database.Database) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    -- Layer 1: immutable raw sources (evidence)
    CREATE TABLE IF NOT EXISTS sources (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL,
      scope TEXT,
      object_key TEXT,
      created_at TEXT NOT NULL
    );

    -- Projects are scope helpers (project/<slug>)
    CREATE TABLE IF NOT EXISTS projects (
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
      FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE
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
    CREATE INDEX IF NOT EXISTS idx_sources_scope
      ON sources(scope);
  `);
}

export function getDb(): Database.Database {
  if (dbInstance) return dbInstance;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  dbInstance = new Database(DB_PATH);
  ensureSchema(dbInstance);
  return dbInstance;
}

export function resetDbForTests(tempPath: string): Database.Database {
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

export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

export function getDataDir(): string {
  return DATA_DIR;
}
