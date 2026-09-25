/**
 * Application-level crypto for ADR-003 (secrets + restricted field encryption).
 * Master key: IPCL_MASTER_KEY (hex/base64/utf8) or data/master.key (auto-generated).
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ENC_PREFIX = "enc:v1:";

let cachedKey: Buffer | null = null;

function dataDir(): string {
  if (process.env.EIDOTHEA_DATA_DIR) {
    return path.resolve(process.env.EIDOTHEA_DATA_DIR);
  }
  if (process.env.IPCL_DATA_DIR) {
    return path.resolve(process.env.IPCL_DATA_DIR);
  }
  return path.join(process.cwd(), "data");
}

function parseKeyMaterial(raw: string): Buffer {
  const trimmed = raw.trim();
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return Buffer.from(trimmed, "hex");
  }
  try {
    const b64 = Buffer.from(trimmed, "base64");
    if (b64.length === 32) return b64;
  } catch {
    // fall through
  }
  return crypto.createHash("sha256").update(trimmed, "utf8").digest();
}

export function getMasterKey(): Buffer {
  if (cachedKey) return cachedKey;

  if (process.env.IPCL_MASTER_KEY) {
    cachedKey = parseKeyMaterial(process.env.IPCL_MASTER_KEY);
    return cachedKey;
  }

  const keyPath = path.join(dataDir(), "master.key");
  fs.mkdirSync(dataDir(), { recursive: true });
  if (fs.existsSync(keyPath)) {
    cachedKey = parseKeyMaterial(fs.readFileSync(keyPath, "utf8"));
    return cachedKey;
  }

  const generated = crypto.randomBytes(32);
  fs.writeFileSync(keyPath, generated.toString("hex"), { mode: 0o600 });
  cachedKey = generated;
  return cachedKey;
}

/** Reset cached key (tests). */
export function resetMasterKeyCache() {
  cachedKey = null;
}

export function encryptString(plaintext: string): string {
  const key = getMasterKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return (
    ENC_PREFIX +
    Buffer.concat([iv, tag, ciphertext]).toString("base64url")
  );
}

export function decryptString(payload: string): string {
  if (!payload.startsWith(ENC_PREFIX)) return payload;
  const raw = Buffer.from(payload.slice(ENC_PREFIX.length), "base64url");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const ciphertext = raw.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", getMasterKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString(
    "utf8"
  );
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(ENC_PREFIX);
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

export function generateToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function hashPassword(password: string, salt?: string): {
  hash: string;
  salt: string;
} {
  const usedSalt = salt ?? crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .scryptSync(password, usedSalt, 64, { N: 16384, r: 8, p: 1 })
    .toString("hex");
  return { hash, salt: usedSalt };
}

export function verifyPassword(
  password: string,
  salt: string,
  expectedHash: string
): boolean {
  const { hash } = hashPassword(password, salt);
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(expectedHash, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
