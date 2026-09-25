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

function ensureSchema(db: Database.Database) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS profile (
      id TEXT PRIMARY KEY,
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
      content TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS decisions (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      content TEXT NOT NULL,
      rationale TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sources (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      type TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS context_items (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      project_id TEXT,
      source_id TEXT,
      title TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
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
