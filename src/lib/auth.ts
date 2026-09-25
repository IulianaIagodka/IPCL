import { getDb } from "./db";
import {
  encryptString,
  decryptString,
  generateToken,
  hashPassword,
  hashToken,
  verifyPassword,
} from "./crypto";
import { createId, nowIso } from "./id";
import type { UserAccount } from "./types";
import type { Principal } from "./policy";
import { recordAudit } from "./audit";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days
export const SESSION_COOKIE = "ipcl_session";

function rowToUser(row: Record<string, unknown>): UserAccount {
  return {
    id: String(row.id),
    email: String(row.email),
    displayName: String(row.display_name ?? ""),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function countUsers(): number {
  return (
    getDb().prepare("SELECT COUNT(*) AS c FROM users").get() as { c: number }
  ).c;
}

export function getUserById(id: string): UserAccount | null {
  const row = getDb()
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;
  return row ? rowToUser(row) : null;
}

export function getUserByEmail(email: string): UserAccount | null {
  const row = getDb()
    .prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE")
    .get(email.trim()) as Record<string, unknown> | undefined;
  return row ? rowToUser(row) : null;
}

export function createUser(input: {
  email: string;
  password: string;
  displayName?: string;
}): { user: UserAccount; sessionToken: string } {
  if (countUsers() > 0) {
    throw new Error("An owner account already exists on this vault");
  }
  const email = input.email.trim().toLowerCase();
  if (!email || !input.password || input.password.length < 8) {
    throw new Error("Email and password (min 8 chars) are required");
  }

  const now = nowIso();
  const { hash, salt } = hashPassword(input.password);
  const user: UserAccount = {
    id: createId("user"),
    email,
    displayName: input.displayName?.trim() || email.split("@")[0],
    createdAt: now,
    updatedAt: now,
  };

  getDb()
    .prepare(
      `INSERT INTO users (id, email, display_name, password_hash, password_salt, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      user.id,
      user.email,
      user.displayName,
      hash,
      salt,
      user.createdAt,
      user.updatedAt
    );

  // Claim any pre-auth local rows for this owner (single-tenant MVP).
  claimOrphanRows(user.id);

  const sessionToken = createSession(user.id);
  recordAudit({
    action: "account_created",
    principal: {
      kind: "user",
      userId: user.id,
      email: user.email,
      sessionId: "",
    },
  });
  return { user, sessionToken };
}

export function loginUser(input: {
  email: string;
  password: string;
}): { user: UserAccount; sessionToken: string } {
  const row = getDb()
    .prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE")
    .get(input.email.trim()) as Record<string, unknown> | undefined;
  if (!row) throw new Error("Invalid email or password");

  const ok = verifyPassword(
    input.password,
    String(row.password_salt),
    String(row.password_hash)
  );
  if (!ok) throw new Error("Invalid email or password");

  const user = rowToUser(row);
  const sessionToken = createSession(user.id);
  return { user, sessionToken };
}

export function createSession(userId: string): string {
  const token = generateToken(32);
  const now = Date.now();
  getDb()
    .prepare(
      `INSERT INTO sessions (id, user_id, token_hash, created_at, expires_at, revoked_at)
       VALUES (?, ?, ?, ?, ?, NULL)`
    )
    .run(
      createId("sess"),
      userId,
      hashToken(token),
      nowIso(),
      new Date(now + SESSION_TTL_MS).toISOString()
    );
  return token;
}

export function revokeSession(token: string): void {
  getDb()
    .prepare(
      `UPDATE sessions SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL`
    )
    .run(nowIso(), hashToken(token));
}

export function revokeAllSessions(userId: string): void {
  getDb()
    .prepare(
      `UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL`
    )
    .run(nowIso(), userId);
}

export function resolveSessionToken(token: string | null | undefined): Principal | null {
  if (!token) return null;
  const row = getDb()
    .prepare(
      `SELECT s.id AS session_id, s.expires_at, s.revoked_at, u.id AS user_id, u.email
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ?`
    )
    .get(hashToken(token)) as
    | {
        session_id: string;
        expires_at: string;
        revoked_at: string | null;
        user_id: string;
        email: string;
      }
    | undefined;

  if (!row || row.revoked_at) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;

  return {
    kind: "user",
    userId: row.user_id,
    email: row.email,
    sessionId: row.session_id,
  };
}

export function parseCookies(header: string | null): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    out[key] = decodeURIComponent(value);
  }
  return out;
}

export function sessionCookieHeader(token: string, maxAgeSeconds = SESSION_TTL_MS / 1000): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(maxAgeSeconds)}${secure}`;
}

export function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function getSessionTokenFromRequest(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  const cookies = parseCookies(request.headers.get("cookie"));
  return cookies[SESSION_COOKIE] || null;
}

function claimOrphanRows(ownerId: string) {
  const db = getDb();
  for (const table of [
    "profile",
    "projects",
    "preferences",
    "decisions",
    "sources",
    "context_items",
  ]) {
    db.prepare(
      `UPDATE ${table} SET owner_id = ? WHERE owner_id IS NULL OR owner_id = ''`
    ).run(ownerId);
  }
}

/** Delete the owner account and all associated vault data (ADR-003 deletion). */
export function deleteAccount(userId: string): void {
  const db = getDb();
  const wipe = db.transaction(() => {
    db.prepare("DELETE FROM audit_events WHERE owner_id = ?").run(userId);
    db.prepare("DELETE FROM candidate_memories WHERE owner_id = ?").run(userId);
    db.prepare("DELETE FROM integrations WHERE owner_id = ?").run(userId);
    db.prepare("DELETE FROM secrets WHERE owner_id = ?").run(userId);
    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
    db.prepare("DELETE FROM context_fts").run();
    db.prepare("DELETE FROM context_items WHERE owner_id = ?").run(userId);
    db.prepare("DELETE FROM sources WHERE owner_id = ?").run(userId);
    db.prepare("DELETE FROM decisions WHERE owner_id = ?").run(userId);
    db.prepare("DELETE FROM preferences WHERE owner_id = ?").run(userId);
    db.prepare("DELETE FROM projects WHERE owner_id = ?").run(userId);
    db.prepare("DELETE FROM profile WHERE owner_id = ?").run(userId);
    db.prepare("DELETE FROM users WHERE id = ?").run(userId);
  });
  wipe();
  recordAudit({
    action: "account_deleted",
    principal: null,
    metadata: { userId },
  });
}

/** Dev/test helper: ensure a default owner exists and return a session token. */
export function ensureTestOwner(password = "test-password-123"): {
  user: UserAccount;
  sessionToken: string;
} {
  const existing = getDb()
    .prepare("SELECT * FROM users LIMIT 1")
    .get() as Record<string, unknown> | undefined;
  if (existing) {
    return {
      user: rowToUser(existing),
      sessionToken: createSession(String(existing.id)),
    };
  }
  return createUser({
    email: "owner@ipcl.local",
    password,
    displayName: "Vault Owner",
  });
}

export function storeEncryptedSecret(ownerId: string, label: string, value: string): string {
  const id = createId("sec");
  getDb()
    .prepare(
      `INSERT INTO secrets (id, owner_id, label, ciphertext, created_at, rotated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(id, ownerId, label, encryptString(value), nowIso(), nowIso());
  return id;
}

export function readSecret(secretId: string, ownerId: string): string | null {
  const row = getDb()
    .prepare("SELECT ciphertext, owner_id FROM secrets WHERE id = ?")
    .get(secretId) as { ciphertext: string; owner_id: string } | undefined;
  if (!row || row.owner_id !== ownerId) return null;
  return decryptString(row.ciphertext);
}

export function deleteSecret(secretId: string, ownerId: string): boolean {
  const result = getDb()
    .prepare("DELETE FROM secrets WHERE id = ? AND owner_id = ?")
    .run(secretId, ownerId);
  return result.changes > 0;
}
