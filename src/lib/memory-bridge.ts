/**
 * INT-1 bridge: vault / Context Service ↔ packages/context-store (ADR-002).
 *
 * One storage path: vault and ADR-002 share `context-vault.sqlite` via
 * `bindSharedDb`. Canonical retrieval is ADR-002 retrieve/assemble.
 * Control-plane entities dual-write into memories and link by vault ref.
 */
import {
  archiveMemory,
  assembleContext,
  createContextStore,
  createMemory,
  createProject as createStoreProject,
  deleteMemory,
  detectConflicts,
  getMemory,
  getProjectBySlug,
  listProjects as listStoreProjects,
  projectScope,
  requiresConfirmation,
  retrieveMemories,
  slugify,
  updateMemory,
  type ConflictProposal,
  type ContextPackage,
  type ContextStore,
  type Memory,
  type MemoryCandidate,
  type MemoryType,
  type RankedMemory,
  type Scope,
  type Sensitivity,
} from "../../packages/context-store/index.js";
import { getDb } from "./db";
import type {
  ContextItem,
  ContextKind,
  DataClassification,
  SearchHit,
} from "./types";

let storeInstance: ContextStore | null = null;

export function getMemoryStore(): ContextStore {
  // Ensure vault DB (and shared ADR schema) is open before first store use.
  getDb();
  if (!storeInstance) storeInstance = createContextStore();
  return storeInstance;
}

/**
 * Test helper — reuse the vault test DB (one storage path).
 * Call after `resetDbForTests` so bindSharedDb already attached ADR schema.
 */
export function resetMemoryStoreForTests(_tempPath?: string) {
  storeInstance = null;
  getDb();
  storeInstance = createContextStore();
  return storeInstance;
}

export function classificationToSensitivity(
  classification: DataClassification
): Sensitivity {
  if (classification === "RESTRICTED") return "restricted";
  if (classification === "SENSITIVE") return "sensitive";
  return "normal";
}

export function sensitivityToClassification(
  sensitivity: Sensitivity
): DataClassification {
  if (sensitivity === "restricted") return "RESTRICTED";
  if (sensitivity === "sensitive") return "SENSITIVE";
  return "NORMAL";
}

export function kindToMemoryType(kind: ContextKind | string): MemoryType {
  switch (kind) {
    case "profile":
      return "profile";
    case "preference":
      return "preference";
    case "decision":
      return "decision";
    case "project":
      return "project_fact";
    case "note":
      return "open_question";
    case "knowledge":
    default:
      return "project_fact";
  }
}

export function memoryTypeToKind(type: MemoryType): ContextKind {
  switch (type) {
    case "profile":
      return "profile";
    case "preference":
      return "preference";
    case "decision":
    case "constraint":
      return "decision";
    case "open_question":
      return "note";
    default:
      return "knowledge";
  }
}

function ensureLinkTable() {
  getDb().exec(`
    CREATE TABLE IF NOT EXISTS adr_memory_links (
      vault_ref TEXT PRIMARY KEY,
      memory_id TEXT NOT NULL,
      owner_id TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_adr_memory_links_memory
      ON adr_memory_links(memory_id);
  `);
}

export function linkVaultRefToMemory(
  vaultRef: string,
  memoryId: string,
  ownerId?: string | null
) {
  ensureLinkTable();
  getDb()
    .prepare(
      `INSERT INTO adr_memory_links (vault_ref, memory_id, owner_id, created_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(vault_ref) DO UPDATE SET
         memory_id = excluded.memory_id,
         owner_id = excluded.owner_id`
    )
    .run(vaultRef, memoryId, ownerId ?? null, new Date().toISOString());
}

export function getMemoryIdForVaultRef(vaultRef: string): string | null {
  ensureLinkTable();
  const row = getDb()
    .prepare("SELECT memory_id FROM adr_memory_links WHERE vault_ref = ?")
    .get(vaultRef) as { memory_id: string } | undefined;
  return row?.memory_id ?? null;
}

export function getVaultRefForMemory(memoryId: string): string | null {
  ensureLinkTable();
  const row = getDb()
    .prepare(
      "SELECT vault_ref FROM adr_memory_links WHERE memory_id = ? LIMIT 1"
    )
    .get(memoryId) as { vault_ref: string } | undefined;
  return row?.vault_ref ?? null;
}

export function unlinkVaultRef(vaultRef: string) {
  ensureLinkTable();
  getDb()
    .prepare("DELETE FROM adr_memory_links WHERE vault_ref = ?")
    .run(vaultRef);
}

export function scopeForProjectName(name: string): Scope {
  return projectScope(name);
}

export function ensureStoreProject(input: {
  name: string;
  description?: string;
}): { scope: Scope; slug: string } {
  const slug = slugify(input.name);
  const existing = getProjectBySlug(slug);
  if (existing) return { scope: existing.scope, slug: existing.slug };
  const created = createStoreProject({
    name: input.name,
    description: input.description,
    slug,
  });
  return { scope: created.scope, slug: created.slug };
}

export function resolveScopeForProjectId(
  projectId: string | null | undefined,
  lookup: (id: string) => { name: string; description?: string } | null
): Scope | null {
  if (!projectId) return null;
  const project = lookup(projectId);
  if (!project) return null;
  return ensureStoreProject(project).scope;
}

export function syncVaultItemToMemory(input: {
  vaultRef: string;
  ownerId?: string | null;
  kind: ContextKind | string;
  statement: string;
  projectScope: Scope | null;
  classification?: DataClassification;
  sourceIds?: string[];
  pinned?: boolean;
}): Memory {
  const scope = input.projectScope ?? "global";
  const sensitivity = classificationToSensitivity(
    input.classification ?? "NORMAL"
  );
  const type = kindToMemoryType(input.kind);
  const existingId = getMemoryIdForVaultRef(input.vaultRef);

  if (existingId) {
    const existing = getMemory(existingId);
    if (existing && existing.status === "active") {
      const updated = updateMemory(existingId, {
        statement: input.statement,
        type,
        scope,
        sensitivity,
        pinned: input.pinned,
      });
      return updated;
    }
  }

  const memory = createMemory({
    type,
    scope,
    statement: input.statement,
    sensitivity,
    importance: type === "decision" || type === "constraint" ? "high" : "medium",
    confidence: "high",
    pinned: input.pinned,
  });
  linkVaultRefToMemory(input.vaultRef, memory.id, input.ownerId);
  return memory;
}

export function archiveLinkedMemory(vaultRef: string) {
  const memoryId = getMemoryIdForVaultRef(vaultRef);
  if (!memoryId) return;
  try {
    archiveMemory(memoryId);
  } catch {
    try {
      deleteMemory(memoryId);
    } catch {
      // ignore missing memory
    }
  }
  unlinkVaultRef(vaultRef);
}

export function updateLinkedMemorySensitivity(
  vaultRef: string,
  classification: DataClassification
) {
  const memoryId = getMemoryIdForVaultRef(vaultRef);
  if (!memoryId) return;
  try {
    updateMemory(memoryId, {
      sensitivity: classificationToSensitivity(classification),
    });
  } catch {
    // ignore
  }
}

export function memoryAsContextItem(
  memory: Memory,
  ownerId: string,
  projectId: string | null = null
): ContextItem {
  return {
    id: getVaultRefForMemory(memory.id) ?? memory.id,
    ownerId,
    kind: memoryTypeToKind(memory.type),
    projectId,
    sourceId: memory.sourceIds[0] ?? null,
    title: memory.type,
    content: memory.statement,
    tags: [memory.type, memory.scope],
    classification: sensitivityToClassification(memory.sensitivity),
    createdAt: memory.createdAt,
    updatedAt: memory.updatedAt,
  };
}

export function rankedToSearchHits(
  ranked: RankedMemory[],
  options: {
    ownerId: string;
    resolveVaultItem: (vaultRef: string) => ContextItem | null;
    projectIdForScope: (scope: Scope) => string | null;
    allowItem: (item: ContextItem) => boolean;
  }
): SearchHit[] {
  const hits: SearchHit[] = [];
  for (const entry of ranked) {
    const vaultRef = getVaultRefForMemory(entry.memory.id);
    let item: ContextItem | null = null;
    if (vaultRef) {
      item = options.resolveVaultItem(vaultRef);
    }
    if (!item) {
      item = memoryAsContextItem(
        entry.memory,
        options.ownerId,
        options.projectIdForScope(entry.memory.scope)
      );
    }
    if (item.classification === "RESTRICTED") continue;
    if (!options.allowItem(item)) continue;
    const matchedOn = ["semantic"];
    if (entry.components.scopeMatch > 0.4) matchedOn.push("scope");
    hits.push({ item, score: entry.score, matchedOn });
  }
  return hits;
}

export function retrieveForVault(input: {
  query: string;
  scope?: Scope | null;
  limit?: number;
  includeRestricted?: boolean;
}): RankedMemory[] {
  return retrieveMemories({
    query: input.query,
    scope: input.scope,
    limit: input.limit ?? 20,
    includeRestricted: input.includeRestricted === true,
  });
}

export function assembleForVault(input: {
  query: string;
  scope?: Scope | null;
  tokenBudget?: number;
  types?: MemoryType[];
  includeRestricted?: boolean;
}): ContextPackage {
  return assembleContext({
    query: input.query,
    scope: input.scope,
    tokenBudget: input.tokenBudget ?? 3000,
    types: input.types,
    includeRestricted: input.includeRestricted === true,
    limit: 40,
  });
}

export function detectStatementConflicts(
  candidates: MemoryCandidate[]
): ConflictProposal[] {
  return detectConflicts(candidates);
}

export function conflictNeedsConfirmation(proposal: ConflictProposal): boolean {
  return requiresConfirmation(proposal);
}

export function wipeMemoryStore() {
  const store = getMemoryStore();
  for (const memory of store.listMemories({ includeDeleted: true })) {
    try {
      deleteMemory(memory.id);
    } catch {
      // continue
    }
  }
  ensureLinkTable();
  getDb().exec("DELETE FROM adr_memory_links");
}

/** Wipe ADR-002 memories linked to one vault owner (INT-1). */
export function wipeOwnerMemories(ownerId: string) {
  ensureLinkTable();
  const links = getDb()
    .prepare(
      "SELECT vault_ref, memory_id FROM adr_memory_links WHERE owner_id = ?"
    )
    .all(ownerId) as Array<{ vault_ref: string; memory_id: string }>;
  for (const link of links) {
    try {
      deleteMemory(link.memory_id);
    } catch {
      // continue
    }
  }
  getDb()
    .prepare("DELETE FROM adr_memory_links WHERE owner_id = ?")
    .run(ownerId);
}

export function listKnownStoreScopes(): Scope[] {
  return listStoreProjects().map((p) => p.scope);
}
