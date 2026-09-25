import { getDb } from "./db";
import { encryptString, decryptString, isEncrypted } from "./crypto";
import { createId, nowIso } from "./id";
import { buildFtsQuery, estimateTokens, semanticScore } from "./search";
import { extractContextFromText } from "./extract";
import { recordAudit } from "./audit";
import {
  assertScope,
  assertWrite,
  classificationAllowed,
  projectAllowed,
  scopesForTool,
  type Principal,
} from "./policy";
import { getPrincipal, requireOwnerId, requirePrincipal } from "./request-context";
import type {
  CandidateMemory,
  ContextItem,
  ContextKind,
  DataClassification,
  Decision,
  ExtractionResult,
  Preference,
  PreviewPayload,
  Profile,
  Project,
  SearchHit,
  Source,
  SourceType,
} from "./types";
import { recordActivity } from "./integrations";

function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function asClassification(value: unknown): DataClassification {
  const v = String(value || "NORMAL").toUpperCase();
  if (v === "SENSITIVE" || v === "RESTRICTED") return v;
  return "NORMAL";
}

function storeContent(content: string, classification: DataClassification): string {
  if (classification === "RESTRICTED") return encryptString(content);
  return content;
}

function loadContent(content: string, forExport: boolean): string {
  if (!isEncrypted(content)) return content;
  if (forExport) return "[RESTRICTED — excluded from export]";
  return decryptString(content);
}

function rowToProfile(row: Record<string, unknown>): Profile {
  return {
    id: String(row.id),
    ownerId: String(row.owner_id ?? ""),
    displayName: String(row.display_name ?? ""),
    role: String(row.role ?? ""),
    expertise: parseJsonArray(String(row.expertise ?? "[]")),
    communicationPreferences: String(row.communication_preferences ?? ""),
    recurringInstructions: String(row.recurring_instructions ?? ""),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function rowToProject(row: Record<string, unknown>): Project {
  return {
    id: String(row.id),
    ownerId: String(row.owner_id ?? ""),
    name: String(row.name),
    description: String(row.description ?? ""),
    technologyStack: parseJsonArray(String(row.technology_stack ?? "[]")),
    targetUsers: String(row.target_users ?? ""),
    architecture: String(row.architecture ?? ""),
    constraints: String(row.constraints ?? ""),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function rowToPreference(row: Record<string, unknown>): Preference {
  return {
    id: String(row.id),
    ownerId: String(row.owner_id ?? ""),
    content: loadContent(String(row.content), false),
    tags: parseJsonArray(String(row.tags ?? "[]")),
    classification: asClassification(row.classification),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function rowToDecision(row: Record<string, unknown>): Decision {
  return {
    id: String(row.id),
    ownerId: String(row.owner_id ?? ""),
    projectId: row.project_id ? String(row.project_id) : null,
    content: loadContent(String(row.content), false),
    rationale: String(row.rationale ?? ""),
    classification: asClassification(row.classification),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function rowToSource(row: Record<string, unknown>): Source {
  const classification = asClassification(row.classification);
  return {
    id: String(row.id),
    ownerId: String(row.owner_id ?? ""),
    projectId: row.project_id ? String(row.project_id) : null,
    type: String(row.type) as SourceType,
    title: String(row.title ?? ""),
    content: loadContent(String(row.content), classification === "RESTRICTED"),
    classification,
    createdAt: String(row.created_at),
  };
}

function rowToContextItem(
  row: Record<string, unknown>,
  options?: { forRetrieval?: boolean }
): ContextItem {
  const classification = asClassification(row.classification);
  const forRetrieval = options?.forRetrieval === true;
  let content = String(row.content);
  if (isEncrypted(content)) {
    content =
      forRetrieval || classification === "RESTRICTED"
        ? "[RESTRICTED]"
        : decryptString(content);
  }
  return {
    id: String(row.id),
    ownerId: String(row.owner_id ?? ""),
    kind: String(row.kind) as ContextKind,
    projectId: row.project_id ? String(row.project_id) : null,
    sourceId: row.source_id ? String(row.source_id) : null,
    title: String(row.title ?? ""),
    content,
    tags: parseJsonArray(String(row.tags ?? "[]")),
    classification,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function upsertFts(item: ContextItem) {
  const db = getDb();
  db.prepare("DELETE FROM context_fts WHERE item_id = ?").run(item.id);
  // RESTRICTED memories are never indexed for semantic/keyword retrieval.
  if (item.classification === "RESTRICTED") return;
  const plain = isEncrypted(item.content)
    ? "[RESTRICTED]"
    : item.content;
  db.prepare(
    `INSERT INTO context_fts (item_id, title, content, tags, kind)
     VALUES (?, ?, ?, ?, ?)`
  ).run(item.id, item.title, plain, item.tags.join(" "), item.kind);
}

function removeFts(id: string) {
  getDb().prepare("DELETE FROM context_fts WHERE item_id = ?").run(id);
}

function insertContextItem(input: {
  kind: ContextKind;
  projectId?: string | null;
  sourceId?: string | null;
  title: string;
  content: string;
  tags?: string[];
  classification?: DataClassification;
}): ContextItem {
  const db = getDb();
  const ownerId = requireOwnerId();
  const now = nowIso();
  const classification = input.classification ?? "NORMAL";
  const stored = storeContent(input.content, classification);
  const item: ContextItem = {
    id: createId("ctx"),
    ownerId,
    kind: input.kind,
    projectId: input.projectId ?? null,
    sourceId: input.sourceId ?? null,
    title: input.title,
    content: input.content,
    tags: input.tags ?? [],
    classification,
    createdAt: now,
    updatedAt: now,
  };

  db.prepare(
    `INSERT INTO context_items
      (id, owner_id, kind, project_id, source_id, title, content, tags, classification, embedding, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`
  ).run(
    item.id,
    item.ownerId,
    item.kind,
    item.projectId,
    item.sourceId,
    item.title,
    stored,
    JSON.stringify(item.tags),
    item.classification,
    item.createdAt,
    item.updatedAt
  );
  upsertFts(item);
  return item;
}

export function getProfile(): Profile {
  const ownerId = requireOwnerId();
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM profile WHERE owner_id = ? LIMIT 1")
    .get(ownerId) as Record<string, unknown> | undefined;

  if (row) return rowToProfile(row);

  const now = nowIso();
  const profile: Profile = {
    id: createId("profile"),
    ownerId,
    displayName: "",
    role: "",
    expertise: [],
    communicationPreferences: "",
    recurringInstructions: "",
    createdAt: now,
    updatedAt: now,
  };

  db.prepare(
    `INSERT INTO profile
      (id, owner_id, display_name, role, expertise, communication_preferences, recurring_instructions, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    profile.id,
    profile.ownerId,
    profile.displayName,
    profile.role,
    JSON.stringify(profile.expertise),
    profile.communicationPreferences,
    profile.recurringInstructions,
    profile.createdAt,
    profile.updatedAt
  );

  return profile;
}

export function updateProfile(
  updates: Partial<
    Pick<
      Profile,
      | "displayName"
      | "role"
      | "expertise"
      | "communicationPreferences"
      | "recurringInstructions"
    >
  > & { mergeExpertise?: boolean }
): Profile {
  const current = getProfile();
  const expertise = updates.expertise
    ? updates.mergeExpertise
      ? [...new Set([...current.expertise, ...updates.expertise])]
      : updates.expertise
    : current.expertise;
  const next: Profile = {
    ...current,
    displayName: updates.displayName ?? current.displayName,
    role: updates.role ?? current.role,
    expertise,
    communicationPreferences:
      updates.communicationPreferences ?? current.communicationPreferences,
    recurringInstructions:
      updates.recurringInstructions ?? current.recurringInstructions,
    updatedAt: nowIso(),
  };

  getDb()
    .prepare(
      `UPDATE profile SET
        display_name = ?,
        role = ?,
        expertise = ?,
        communication_preferences = ?,
        recurring_instructions = ?,
        updated_at = ?
       WHERE id = ? AND owner_id = ?`
    )
    .run(
      next.displayName,
      next.role,
      JSON.stringify(next.expertise),
      next.communicationPreferences,
      next.recurringInstructions,
      next.updatedAt,
      next.id,
      next.ownerId
    );

  syncProfileContextItem(next);
  return next;
}

function syncProfileContextItem(profile: Profile) {
  const db = getDb();
  const existing = db
    .prepare(
      "SELECT id FROM context_items WHERE kind = 'profile' AND owner_id = ? LIMIT 1"
    )
    .get(profile.ownerId) as { id: string } | undefined;

  const content = [
    profile.displayName && `Name: ${profile.displayName}`,
    profile.role && `Role: ${profile.role}`,
    profile.expertise.length && `Expertise: ${profile.expertise.join(", ")}`,
    profile.communicationPreferences &&
      `Communication: ${profile.communicationPreferences}`,
    profile.recurringInstructions &&
      `Instructions: ${profile.recurringInstructions}`,
  ]
    .filter(Boolean)
    .join("\n");

  if (!content) {
    if (existing) {
      db.prepare("DELETE FROM context_items WHERE id = ?").run(existing.id);
      removeFts(existing.id);
    }
    return;
  }

  const now = nowIso();
  if (existing) {
    db.prepare(
      `UPDATE context_items SET title = ?, content = ?, tags = ?, classification = 'NORMAL', updated_at = ? WHERE id = ?`
    ).run("User profile", content, JSON.stringify(["profile"]), now, existing.id);
    upsertFts({
      id: existing.id,
      ownerId: profile.ownerId,
      kind: "profile",
      projectId: null,
      sourceId: null,
      title: "User profile",
      content,
      tags: ["profile"],
      classification: "NORMAL",
      createdAt: now,
      updatedAt: now,
    });
  } else {
    insertContextItem({
      kind: "profile",
      title: "User profile",
      content,
      tags: ["profile"],
      classification: "NORMAL",
    });
  }
}

export function listProjects(): Project[] {
  const ownerId = requireOwnerId();
  const rows = getDb()
    .prepare(
      "SELECT * FROM projects WHERE owner_id = ? ORDER BY updated_at DESC"
    )
    .all(ownerId) as Record<string, unknown>[];
  return rows.map(rowToProject);
}

export function getProject(projectId: string): Project | null {
  const principal = requirePrincipal();
  if (!projectAllowed(principal, projectId)) return null;
  const row = getDb()
    .prepare("SELECT * FROM projects WHERE id = ? AND owner_id = ?")
    .get(projectId, principal.userId) as Record<string, unknown> | undefined;
  return row ? rowToProject(row) : null;
}

export function createProject(input: {
  name: string;
  description?: string;
  technologyStack?: string[];
  targetUsers?: string;
  architecture?: string;
  constraints?: string;
}): Project {
  const ownerId = requireOwnerId();
  const now = nowIso();
  const project: Project = {
    id: createId("proj"),
    ownerId,
    name: input.name.trim(),
    description: input.description?.trim() ?? "",
    technologyStack: input.technologyStack ?? [],
    targetUsers: input.targetUsers?.trim() ?? "",
    architecture: input.architecture?.trim() ?? "",
    constraints: input.constraints?.trim() ?? "",
    createdAt: now,
    updatedAt: now,
  };

  getDb()
    .prepare(
      `INSERT INTO projects
        (id, owner_id, name, description, technology_stack, target_users, architecture, constraints, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      project.id,
      project.ownerId,
      project.name,
      project.description,
      JSON.stringify(project.technologyStack),
      project.targetUsers,
      project.architecture,
      project.constraints,
      project.createdAt,
      project.updatedAt
    );

  syncProjectContextItem(project);
  return project;
}

export function updateProject(
  projectId: string,
  updates: Partial<
    Pick<
      Project,
      | "name"
      | "description"
      | "technologyStack"
      | "targetUsers"
      | "architecture"
      | "constraints"
    >
  >
): Project | null {
  const current = getProject(projectId);
  if (!current) return null;

  const next: Project = {
    ...current,
    name: updates.name?.trim() ?? current.name,
    description: updates.description ?? current.description,
    technologyStack: updates.technologyStack ?? current.technologyStack,
    targetUsers: updates.targetUsers ?? current.targetUsers,
    architecture: updates.architecture ?? current.architecture,
    constraints: updates.constraints ?? current.constraints,
    updatedAt: nowIso(),
  };

  getDb()
    .prepare(
      `UPDATE projects SET
        name = ?, description = ?, technology_stack = ?, target_users = ?,
        architecture = ?, constraints = ?, updated_at = ?
       WHERE id = ? AND owner_id = ?`
    )
    .run(
      next.name,
      next.description,
      JSON.stringify(next.technologyStack),
      next.targetUsers,
      next.architecture,
      next.constraints,
      next.updatedAt,
      next.id,
      next.ownerId
    );

  syncProjectContextItem(next);
  return next;
}

export function deleteProject(projectId: string): boolean {
  const ownerId = requireOwnerId();
  const result = getDb()
    .prepare("DELETE FROM projects WHERE id = ? AND owner_id = ?")
    .run(projectId, ownerId);
  return result.changes > 0;
}

function syncProjectContextItem(project: Project) {
  const db = getDb();
  const existing = db
    .prepare(
      "SELECT id FROM context_items WHERE kind = 'project' AND project_id = ? AND owner_id = ? LIMIT 1"
    )
    .get(project.id, project.ownerId) as { id: string } | undefined;

  const content = [
    `Project: ${project.name}`,
    project.description && `Description: ${project.description}`,
    project.technologyStack.length &&
      `Stack: ${project.technologyStack.join(", ")}`,
    project.targetUsers && `Target users: ${project.targetUsers}`,
    project.architecture && `Architecture: ${project.architecture}`,
    project.constraints && `Constraints: ${project.constraints}`,
  ]
    .filter(Boolean)
    .join("\n");

  const now = nowIso();
  if (existing) {
    db.prepare(
      `UPDATE context_items SET title = ?, content = ?, tags = ?, updated_at = ? WHERE id = ?`
    ).run(
      project.name,
      content,
      JSON.stringify(["project", project.name.toLowerCase()]),
      now,
      existing.id
    );
    upsertFts({
      id: existing.id,
      ownerId: project.ownerId,
      kind: "project",
      projectId: project.id,
      sourceId: null,
      title: project.name,
      content,
      tags: ["project", project.name.toLowerCase()],
      classification: "NORMAL",
      createdAt: now,
      updatedAt: now,
    });
  } else {
    insertContextItem({
      kind: "project",
      projectId: project.id,
      title: project.name,
      content,
      tags: ["project", project.name.toLowerCase()],
    });
  }
}

export function listPreferences(): Preference[] {
  const principal = requirePrincipal();
  assertScope(principal, "preferences:read");
  const rows = getDb()
    .prepare(
      "SELECT * FROM preferences WHERE owner_id = ? ORDER BY updated_at DESC"
    )
    .all(principal.userId) as Record<string, unknown>[];
  return rows
    .map(rowToPreference)
    .filter((p) => classificationAllowed(principal, p.classification))
    .filter((p) => p.classification !== "RESTRICTED" || principal.kind === "user");
}

export function createPreference(
  content: string,
  tags: string[] = [],
  classification: DataClassification = "NORMAL"
): Preference {
  const ownerId = requireOwnerId();
  const now = nowIso();
  const preference: Preference = {
    id: createId("pref"),
    ownerId,
    content: content.trim(),
    tags,
    classification,
    createdAt: now,
    updatedAt: now,
  };

  getDb()
    .prepare(
      `INSERT INTO preferences (id, owner_id, content, tags, classification, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      preference.id,
      preference.ownerId,
      storeContent(preference.content, classification),
      JSON.stringify(preference.tags),
      preference.classification,
      preference.createdAt,
      preference.updatedAt
    );

  insertContextItem({
    kind: "preference",
    title: "Preference",
    content: preference.content,
    tags: ["preference", ...tags],
    classification,
  });

  return preference;
}

export function deletePreference(id: string): boolean {
  const ownerId = requireOwnerId();
  const pref = getDb()
    .prepare("SELECT content FROM preferences WHERE id = ? AND owner_id = ?")
    .get(id, ownerId) as { content: string } | undefined;
  if (!pref) return false;

  getDb()
    .prepare("DELETE FROM preferences WHERE id = ? AND owner_id = ?")
    .run(id, ownerId);
  const mirrored = getDb()
    .prepare(
      "SELECT id, content FROM context_items WHERE kind = 'preference' AND owner_id = ?"
    )
    .all(ownerId) as { id: string; content: string }[];
  for (const item of mirrored) {
    const plain = isEncrypted(item.content)
      ? decryptString(item.content)
      : item.content;
    if (plain === (isEncrypted(pref.content) ? decryptString(pref.content) : pref.content)) {
      getDb().prepare("DELETE FROM context_items WHERE id = ?").run(item.id);
      removeFts(item.id);
    }
  }
  return true;
}

export function listDecisions(projectId?: string | null): Decision[] {
  const principal = requirePrincipal();
  assertScope(principal, "decisions:read", projectId);
  const db = getDb();
  const rows = projectId
    ? (db
        .prepare(
          "SELECT * FROM decisions WHERE owner_id = ? AND project_id = ? ORDER BY updated_at DESC"
        )
        .all(principal.userId, projectId) as Record<string, unknown>[])
    : (db
        .prepare(
          "SELECT * FROM decisions WHERE owner_id = ? ORDER BY updated_at DESC"
        )
        .all(principal.userId) as Record<string, unknown>[]);
  return rows
    .map(rowToDecision)
    .filter((d) => projectAllowed(principal, d.projectId))
    .filter((d) => classificationAllowed(principal, d.classification))
    .filter((d) => d.classification !== "RESTRICTED" || principal.kind === "user");
}

export function createDecision(input: {
  projectId?: string | null;
  content: string;
  rationale?: string;
  classification?: DataClassification;
}): Decision {
  const ownerId = requireOwnerId();
  const now = nowIso();
  const classification = input.classification ?? "NORMAL";
  const decision: Decision = {
    id: createId("dec"),
    ownerId,
    projectId: input.projectId ?? null,
    content: input.content.trim(),
    rationale: input.rationale?.trim() ?? "",
    classification,
    createdAt: now,
    updatedAt: now,
  };

  getDb()
    .prepare(
      `INSERT INTO decisions (id, owner_id, project_id, content, rationale, classification, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      decision.id,
      decision.ownerId,
      decision.projectId,
      storeContent(decision.content, classification),
      decision.rationale,
      decision.classification,
      decision.createdAt,
      decision.updatedAt
    );

  insertContextItem({
    kind: "decision",
    projectId: decision.projectId,
    title: "Decision",
    content: decision.rationale
      ? `${decision.content}\nRationale: ${decision.rationale}`
      : decision.content,
    tags: ["decision"],
    classification,
  });

  return decision;
}

export function deleteDecision(id: string): boolean {
  const ownerId = requireOwnerId();
  const decision = getDb()
    .prepare("SELECT content FROM decisions WHERE id = ? AND owner_id = ?")
    .get(id, ownerId) as { content: string } | undefined;
  if (!decision) return false;

  getDb()
    .prepare("DELETE FROM decisions WHERE id = ? AND owner_id = ?")
    .run(id, ownerId);
  const items = getDb()
    .prepare(
      "SELECT id, content FROM context_items WHERE kind = 'decision' AND owner_id = ?"
    )
    .all(ownerId) as { id: string; content: string }[];
  const target = isEncrypted(decision.content)
    ? decryptString(decision.content)
    : decision.content;
  for (const item of items) {
    const plain = isEncrypted(item.content)
      ? decryptString(item.content)
      : item.content;
    if (plain.startsWith(target)) {
      getDb().prepare("DELETE FROM context_items WHERE id = ?").run(item.id);
      removeFts(item.id);
    }
  }
  return true;
}

export function listSources(projectId?: string | null): Source[] {
  const ownerId = requireOwnerId();
  const db = getDb();
  const rows = projectId
    ? (db
        .prepare(
          "SELECT * FROM sources WHERE owner_id = ? AND project_id = ? ORDER BY created_at DESC"
        )
        .all(ownerId, projectId) as Record<string, unknown>[])
    : (db
        .prepare(
          "SELECT * FROM sources WHERE owner_id = ? ORDER BY created_at DESC"
        )
        .all(ownerId) as Record<string, unknown>[]);
  return rows.map(rowToSource);
}

export function createSource(input: {
  type: SourceType;
  title?: string;
  content: string;
  projectId?: string | null;
  classification?: DataClassification;
}): Source {
  const ownerId = requireOwnerId();
  const classification = input.classification ?? "NORMAL";
  const source: Source = {
    id: createId("src"),
    ownerId,
    projectId: input.projectId ?? null,
    type: input.type,
    title: input.title?.trim() || `${input.type} import`,
    content: input.content,
    classification,
    createdAt: nowIso(),
  };

  getDb()
    .prepare(
      `INSERT INTO sources (id, owner_id, project_id, type, title, content, classification, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      source.id,
      source.ownerId,
      source.projectId,
      source.type,
      source.title,
      storeContent(source.content, classification),
      source.classification,
      source.createdAt
    );

  return source;
}

export function listContextItems(filters?: {
  projectId?: string | null;
  kind?: ContextKind;
  includeRestricted?: boolean;
}): ContextItem[] {
  const principal = requirePrincipal();
  const db = getDb();
  let sql = "SELECT * FROM context_items WHERE owner_id = ?";
  const params: (string | number)[] = [principal.userId];
  if (filters?.projectId) {
    sql += " AND project_id = ?";
    params.push(filters.projectId);
  }
  if (filters?.kind) {
    sql += " AND kind = ?";
    params.push(filters.kind);
  }
  if (!filters?.includeRestricted) {
    sql += " AND classification != 'RESTRICTED'";
  }
  sql += " ORDER BY updated_at DESC";
  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
  return rows
    .map((row) => rowToContextItem(row, { forRetrieval: true }))
    .filter((item) => projectAllowed(principal, item.projectId))
    .filter((item) => classificationAllowed(principal, item.classification));
}

export function saveContext(
  content: string,
  options?: {
    projectId?: string | null;
    title?: string;
    kind?: ContextKind;
    tags?: string[];
    classification?: DataClassification;
  }
): ContextItem {
  return insertContextItem({
    kind: options?.kind ?? "knowledge",
    projectId: options?.projectId,
    title: options?.title ?? "Saved context",
    content: content.trim(),
    tags: options?.tags ?? ["knowledge"],
    classification: options?.classification ?? "NORMAL",
  });
}

export function updateContextClassification(
  id: string,
  classification: DataClassification
): ContextItem | null {
  const ownerId = requireOwnerId();
  const row = getDb()
    .prepare("SELECT * FROM context_items WHERE id = ? AND owner_id = ?")
    .get(id, ownerId) as Record<string, unknown> | undefined;
  if (!row) return null;

  const current = rowToContextItem(row, { forRetrieval: false });
  const plain = isEncrypted(String(row.content))
    ? decryptString(String(row.content))
    : String(row.content);
  const stored = storeContent(plain, classification);
  const now = nowIso();

  getDb()
    .prepare(
      `UPDATE context_items SET content = ?, classification = ?, updated_at = ?
       WHERE id = ? AND owner_id = ?`
    )
    .run(stored, classification, now, id, ownerId);

  const next: ContextItem = {
    ...current,
    content: plain,
    classification,
    updatedAt: now,
  };
  upsertFts(next);
  return next;
}

export function deleteContextItem(id: string): boolean {
  const ownerId = requireOwnerId();
  const result = getDb()
    .prepare("DELETE FROM context_items WHERE id = ? AND owner_id = ?")
    .run(id, ownerId);
  if (result.changes > 0) removeFts(id);
  return result.changes > 0;
}

export function searchContext(
  query: string,
  options?: { projectId?: string | null; limit?: number }
): SearchHit[] {
  const principal = requirePrincipal();
  assertScope(principal, "context:search", options?.projectId);

  const db = getDb();
  const limit = options?.limit ?? 10;
  const ftsQuery = buildFtsQuery(query);

  let ftsRows: { item_id: string; rank: number }[] = [];
  try {
    ftsRows = db
      .prepare(
        `SELECT item_id, bm25(context_fts) AS rank
         FROM context_fts
         WHERE context_fts MATCH ?
         ORDER BY rank
         LIMIT 50`
      )
      .all(ftsQuery) as { item_id: string; rank: number }[];
  } catch {
    ftsRows = [];
  }

  const allItems = listContextItems(
    options?.projectId ? { projectId: options.projectId } : undefined
  );

  const ftsScore = new Map<string, number>();
  for (const row of ftsRows) {
    ftsScore.set(row.item_id, 1 / (1 + Math.abs(row.rank)));
  }

  const hits: SearchHit[] = allItems.map((item) => {
    const haystack = `${item.title}\n${item.content}\n${item.tags.join(" ")}`;
    const semantic = semanticScore(query, haystack);
    const keyword = ftsScore.get(item.id) ?? 0;
    const score = semantic * 0.65 + keyword * 0.35;
    const matchedOn: string[] = [];
    if (semantic > 0.05) matchedOn.push("semantic");
    if (keyword > 0) matchedOn.push("keyword");
    return { item, score, matchedOn };
  });

  const filtered = hits
    .filter((h) => h.score > 0.02 || h.matchedOn.includes("keyword"))
    .filter((h) => h.item.classification !== "RESTRICTED")
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const includedSensitive = filtered.some(
    (h) => h.item.classification === "SENSITIVE"
  );

  recordAudit({
    action: includedSensitive ? "sensitive_context_accessed" : "context_search",
    principal,
    scope: options?.projectId ? `project/${options.projectId}` : "global",
    memoryIds: filtered.map((h) => h.item.id),
    memoryCount: filtered.length,
    includedSensitive,
    metadata: { resultCount: filtered.length },
  });

  return filtered;
}

export async function importAndExtract(input: {
  content: string;
  type: SourceType;
  title?: string;
  projectId?: string | null;
  applyExtraction?: boolean;
  useLlm?: boolean;
  classification?: DataClassification;
}): Promise<{
  source: Source;
  extraction: ExtractionResult;
  created: {
    preferences: Preference[];
    decisions: Decision[];
    items: ContextItem[];
    profile: Profile | null;
  };
}> {
  const classification = input.classification ?? "NORMAL";
  const source = createSource({
    type: input.type,
    title: input.title,
    content: input.content,
    projectId: input.projectId,
    classification,
  });

  const extraction = await extractContextFromText(input.content, {
    title: input.title,
    useLlm: input.useLlm,
  });

  const created = {
    preferences: [] as Preference[],
    decisions: [] as Decision[],
    items: [] as ContextItem[],
    profile: null as Profile | null,
  };

  if (input.applyExtraction !== false) {
    if (Object.keys(extraction.profileUpdates).length) {
      created.profile = updateProfile({
        ...extraction.profileUpdates,
        mergeExpertise: true,
      });
    }
    for (const pref of extraction.preferences) {
      created.preferences.push(createPreference(pref, [], classification));
    }
    for (const decision of extraction.decisions) {
      created.decisions.push(
        createDecision({
          projectId: input.projectId,
          content: decision,
          classification,
        })
      );
    }
    for (const knowledge of extraction.knowledge) {
      created.items.push(
        insertContextItem({
          kind: "knowledge",
          projectId: input.projectId,
          sourceId: source.id,
          title: knowledge.title,
          content: knowledge.content,
          tags: knowledge.tags,
          classification,
        })
      );
    }
    for (const note of extraction.notes) {
      created.items.push(
        insertContextItem({
          kind: "note",
          projectId: input.projectId,
          sourceId: source.id,
          title: input.title || "Note",
          content: note,
          tags: ["note"],
          classification,
        })
      );
    }
  } else {
    created.items.push(
      insertContextItem({
        kind: "note",
        projectId: input.projectId,
        sourceId: source.id,
        title: source.title,
        content: source.content,
        tags: ["imported", input.type],
        classification,
      })
    );
  }

  return { source, extraction, created };
}

export function buildExportText(options?: {
  projectId?: string | null;
  query?: string | null;
  includeProfile?: boolean;
  includePreferences?: boolean;
  includeDecisions?: boolean;
  searchLimit?: number;
  allowSensitive?: boolean;
}): {
  text: string;
  fragments: PreviewPayload["fragments"];
  estimatedTokens: number;
  includesSensitive: boolean;
} {
  const principal = requirePrincipal();
  const includeProfile = options?.includeProfile !== false;
  const includePreferences = options?.includePreferences !== false;
  const includeDecisions = options?.includeDecisions !== false;
  const fragments: PreviewPayload["fragments"] = [];
  let includesSensitive = false;

  const pushFragment = (
    fragment: PreviewPayload["fragments"][number]
  ) => {
    if (fragment.classification === "RESTRICTED") return;
    if (
      fragment.classification === "SENSITIVE" &&
      options?.allowSensitive === false
    ) {
      return;
    }
    if (fragment.classification === "SENSITIVE") includesSensitive = true;
    fragments.push(fragment);
  };

  if (includeProfile && (principal.kind === "user" || principal.scopes.includes("profile:read"))) {
    const profile = getProfile();
    const parts = [
      profile.displayName && `Name: ${profile.displayName}`,
      profile.role && `Role: ${profile.role}`,
      profile.expertise.length && `Expertise: ${profile.expertise.join(", ")}`,
      profile.communicationPreferences &&
        `Communication preferences: ${profile.communicationPreferences}`,
      profile.recurringInstructions &&
        `Recurring instructions: ${profile.recurringInstructions}`,
    ].filter(Boolean);
    if (parts.length) {
      pushFragment({
        kind: "profile",
        title: "Profile",
        content: parts.join("\n"),
        source: "vault:profile",
        classification: "NORMAL",
      });
    }
  }

  if (includePreferences) {
    for (const pref of listPreferences()) {
      pushFragment({
        kind: "preference",
        title: "Preference",
        content: pref.content,
        source: `vault:preference:${pref.id}`,
        classification: pref.classification,
      });
    }
  }

  if (includeDecisions) {
    const decisions = listDecisions(options?.projectId);
    for (const decision of decisions) {
      pushFragment({
        kind: "decision",
        title: "Decision",
        content: decision.rationale
          ? `${decision.content}\nRationale: ${decision.rationale}`
          : decision.content,
        source: `vault:decision:${decision.id}`,
        classification: decision.classification,
      });
    }
  }

  if (options?.projectId) {
    const project = getProject(options.projectId);
    if (project) {
      pushFragment({
        kind: "project",
        title: project.name,
        content: [
          project.description,
          project.technologyStack.length &&
            `Stack: ${project.technologyStack.join(", ")}`,
          project.targetUsers && `Target users: ${project.targetUsers}`,
          project.architecture && `Architecture: ${project.architecture}`,
          project.constraints && `Constraints: ${project.constraints}`,
        ]
          .filter(Boolean)
          .join("\n"),
        source: `vault:project:${project.id}`,
        classification: "NORMAL",
      });
    }
  }

  if (options?.query) {
    const hits = searchContext(options.query, {
      projectId: options.projectId,
      limit: options.searchLimit ?? 8,
    });
    for (const hit of hits) {
      if (["profile", "preference", "decision", "project"].includes(hit.item.kind)) {
        continue;
      }
      pushFragment({
        kind: hit.item.kind,
        title: hit.item.title || hit.item.kind,
        content: hit.item.content,
        source: `vault:item:${hit.item.id}`,
        classification: hit.item.classification,
      });
    }
  }

  const sections = fragments.map(
    (f) =>
      `### ${f.title} (${f.kind}${f.classification !== "NORMAL" ? `, ${f.classification}` : ""})\n${f.content}`
  );
  const text = [
    "# Context Vault export",
    "Only the fragments below are intended for sharing with an AI provider.",
    "Secrets and RESTRICTED memories are never included.",
    "",
    ...sections,
  ].join("\n");

  return {
    text,
    fragments,
    estimatedTokens: estimateTokens(text),
    includesSensitive,
  };
}

export function buildPreview(input: {
  destination: string;
  query?: string | null;
  projectId?: string | null;
  includeProfile?: boolean;
  includePreferences?: boolean;
  includeDecisions?: boolean;
  includeSearchHits?: boolean;
  allowSensitive?: boolean;
  acknowledgeSensitive?: boolean;
}): PreviewPayload {
  const principal = requirePrincipal();
  const exported = buildExportText({
    projectId: input.projectId,
    query: input.includeSearchHits === false ? null : input.query,
    includeProfile: input.includeProfile,
    includePreferences: input.includePreferences,
    includeDecisions: input.includeDecisions,
    allowSensitive: input.allowSensitive !== false,
  });

  const requiresSensitiveAck =
    exported.includesSensitive && !input.acknowledgeSensitive;

  recordAudit({
    action: "context_preview",
    principal,
    scope: input.projectId ? `project/${input.projectId}` : "global",
    memoryCount: exported.fragments.length,
    includedSensitive: exported.includesSensitive,
    destination: input.destination,
    metadata: {
      fragmentCount: exported.fragments.length,
      acknowledged: Boolean(input.acknowledgeSensitive),
    },
  });

  const payload: PreviewPayload = {
    destination: input.destination,
    query: input.query ?? null,
    projectId: input.projectId ?? null,
    includeProfile: input.includeProfile !== false,
    includePreferences: input.includePreferences !== false,
    includeDecisions: input.includeDecisions !== false,
    includeSearchHits: input.includeSearchHits !== false,
    fragments: exported.fragments,
    estimatedTokens: exported.estimatedTokens,
    exportText: requiresSensitiveAck
      ? "# Sensitive context included\nAcknowledge sensitive sharing before export is available."
      : exported.text,
    includesSensitive: exported.includesSensitive,
    requiresSensitiveAck,
  };

  const project = input.projectId ? getProject(input.projectId) : null;
  const decisionCount = exported.fragments.filter((f) => f.kind === "decision").length;
  recordActivity({
    kind: "share",
    summary: `${input.destination} preview · ${exported.fragments.length} memories`,
    detail: [
      project ? `Project: ${project.name}` : "Scope: global / selected",
      decisionCount ? `${decisionCount} decisions` : null,
      `${exported.estimatedTokens} estimated tokens`,
    ]
      .filter(Boolean)
      .join(" · "),
  });

  return payload;
}

/** MCP write path: create candidate memory pending user approval (ADR-003). */
export function proposeCandidateMemory(input: {
  kind: CandidateMemory["kind"];
  content: string;
  title?: string;
  projectId?: string | null;
  rationale?: string;
  classification?: DataClassification;
}): CandidateMemory {
  const principal = requirePrincipal();
  assertWrite(principal);
  if (input.kind === "decision") {
    assertScope(principal, "memory:create", input.projectId);
  } else {
    assertScope(principal, "context:write", input.projectId);
  }

  const candidate: CandidateMemory = {
    id: createId("cand"),
    ownerId: principal.userId,
    integrationId: principal.kind === "integration" ? principal.integrationId : null,
    kind: input.kind,
    projectId: input.projectId ?? null,
    title: input.title?.trim() || input.kind,
    content: input.content.trim(),
    rationale: input.rationale?.trim() ?? "",
    classification: input.classification ?? "NORMAL",
    status: "pending",
    createdAt: nowIso(),
    resolvedAt: null,
  };

  getDb()
    .prepare(
      `INSERT INTO candidate_memories
        (id, owner_id, integration_id, kind, project_id, title, content, rationale, classification, status, created_at, resolved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, NULL)`
    )
    .run(
      candidate.id,
      candidate.ownerId,
      candidate.integrationId,
      candidate.kind,
      candidate.projectId,
      candidate.title,
      candidate.content,
      candidate.rationale,
      candidate.classification,
      candidate.createdAt
    );

  recordAudit({
    action: "candidate_memory_created",
    principal,
    scope: candidate.projectId ? `project/${candidate.projectId}` : "global",
    metadata: { candidateId: candidate.id, kind: candidate.kind },
  });

  return candidate;
}

export function listCandidateMemories(
  status: CandidateMemory["status"] = "pending"
): CandidateMemory[] {
  const ownerId = requireOwnerId();
  const rows = getDb()
    .prepare(
      `SELECT * FROM candidate_memories WHERE owner_id = ? AND status = ? ORDER BY created_at DESC`
    )
    .all(ownerId, status) as Record<string, unknown>[];
  return rows.map((row) => ({
    id: String(row.id),
    ownerId: String(row.owner_id),
    integrationId: row.integration_id ? String(row.integration_id) : null,
    kind: String(row.kind) as CandidateMemory["kind"],
    projectId: row.project_id ? String(row.project_id) : null,
    title: String(row.title ?? ""),
    content: String(row.content),
    rationale: String(row.rationale ?? ""),
    classification: asClassification(row.classification),
    status: String(row.status) as CandidateMemory["status"],
    createdAt: String(row.created_at),
    resolvedAt: row.resolved_at ? String(row.resolved_at) : null,
  }));
}

export function resolveCandidateMemory(
  id: string,
  decision: "approved" | "rejected"
): CandidateMemory | null {
  const ownerId = requireOwnerId();
  const rows = listCandidateMemories("pending");
  const candidate = rows.find((c) => c.id === id);
  if (!candidate) return null;

  const resolvedAt = nowIso();
  getDb()
    .prepare(
      `UPDATE candidate_memories SET status = ?, resolved_at = ? WHERE id = ? AND owner_id = ?`
    )
    .run(decision, resolvedAt, id, ownerId);

  if (decision === "approved") {
    if (candidate.kind === "decision") {
      createDecision({
        projectId: candidate.projectId,
        content: candidate.content,
        rationale: candidate.rationale,
        classification: candidate.classification,
      });
    } else if (candidate.kind === "preference") {
      createPreference(candidate.content, [], candidate.classification);
    } else {
      saveContext(candidate.content, {
        projectId: candidate.projectId,
        title: candidate.title,
        kind: candidate.kind === "note" ? "note" : "knowledge",
        classification: candidate.classification,
      });
    }
  }

  recordAudit({
    action:
      decision === "approved"
        ? "candidate_memory_approved"
        : "candidate_memory_rejected",
    principal: getPrincipal(),
    metadata: { candidateId: id },
  });

  return { ...candidate, status: decision, resolvedAt };
}

export function wipeAllContext(): void {
  const ownerId = requireOwnerId();
  const principal = getPrincipal();
  const db = getDb();
  db.exec(`
    DELETE FROM context_fts;
  `);
  db.prepare("DELETE FROM context_items WHERE owner_id = ?").run(ownerId);
  db.prepare("DELETE FROM sources WHERE owner_id = ?").run(ownerId);
  db.prepare("DELETE FROM decisions WHERE owner_id = ?").run(ownerId);
  db.prepare("DELETE FROM preferences WHERE owner_id = ?").run(ownerId);
  db.prepare("DELETE FROM projects WHERE owner_id = ?").run(ownerId);
  db.prepare("DELETE FROM profile WHERE owner_id = ?").run(ownerId);
  db.prepare("DELETE FROM candidate_memories WHERE owner_id = ?").run(ownerId);
  recordAudit({
    action: "vault_wiped",
    principal,
    metadata: { ownerId },
  });
}

export function getVaultStats() {
  const ownerId = requireOwnerId();
  const db = getDb();
  const count = (table: string) =>
    (
      db
        .prepare(`SELECT COUNT(*) AS c FROM ${table} WHERE owner_id = ?`)
        .get(ownerId) as { c: number }
    ).c;

  const recent = listContextItems().slice(0, 8);
  const projects = listProjects();
  const projectName = new Map(projects.map((p) => [p.id, p.name]));

  return {
    projects: count("projects"),
    preferences: count("preferences"),
    decisions: count("decisions"),
    sources: count("sources"),
    contextItems: count("context_items"),
    pendingCandidates: (
      db
        .prepare(
          `SELECT COUNT(*) AS c FROM candidate_memories WHERE owner_id = ? AND status = 'pending'`
        )
        .get(ownerId) as { c: number }
    ).c,
    hasProfile: Boolean(
      getProfile().displayName || getProfile().role || getProfile().expertise.length
    ),
    recentMemories: recent.map((item) => ({
      ...item,
      projectName: item.projectId
        ? projectName.get(item.projectId) ?? null
        : null,
    })),
  };
}

export function principalCanUseTool(
  principal: Principal,
  tool: string,
  projectId?: string | null
) {
  for (const scope of scopesForTool(tool, projectId)) {
    assertScope(principal, scope, projectId);
  }
  if (tool.startsWith("save_")) assertWrite(principal);
}
