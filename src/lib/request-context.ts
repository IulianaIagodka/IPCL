import { AsyncLocalStorage } from "node:async_hooks";
import { getDb } from "./db";
import type { Principal } from "./policy";

const storage = new AsyncLocalStorage<Principal>();

/** Fallback owner for sync local/scripts when ALS is unset (single-tenant). */
let fallbackOwnerId: string | null = null;

export function runWithPrincipal<T>(principal: Principal, fn: () => T): T {
  return storage.run(principal, fn);
}

export async function runWithPrincipalAsync<T>(
  principal: Principal,
  fn: () => Promise<T>
): Promise<T> {
  return storage.run(principal, fn);
}

export function getPrincipal(): Principal | null {
  return storage.getStore() ?? null;
}

export function requirePrincipal(): Principal {
  const principal = getPrincipal();
  if (principal) return principal;

  if (fallbackOwnerId) {
    return {
      kind: "user",
      userId: fallbackOwnerId,
      email: "local",
      sessionId: "fallback",
    };
  }

  const row = getDb()
    .prepare("SELECT id, email FROM users LIMIT 1")
    .get() as { id: string; email: string } | undefined;
  if (row) {
    return {
      kind: "user",
      userId: row.id,
      email: row.email,
      sessionId: "implicit",
    };
  }

  throw new Error("Unauthenticated");
}

export function requireOwnerId(): string {
  return requirePrincipal().userId;
}

export function setFallbackOwnerId(ownerId: string | null) {
  fallbackOwnerId = ownerId;
}
