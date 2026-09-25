import { getDb } from "./db";
import { createId, nowIso } from "./id";
import { buildFtsQuery, estimateTokens, semanticScore } from "./search";
import { extractContextFromText } from "./extract";
import type {
  ContextItem,
  ContextKind,
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

function rowToProfile(row: Record<string, unknown>): Profile {
  return {
    id: String(row.id),
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
    content: String(row.content),
    tags: parseJsonArray(String(row.tags ?? "[]")),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function rowToDecision(row: Record<string, unknown>): Decision {
  return {
    id: String(row.id),
    projectId: row.project_id ? String(row.project_id) : null,
    content: String(row.content),
    rationale: String(row.rationale ?? ""),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function rowToSource(row: Record<string, unknown>): Source {
  return {
    id: String(row.id),
    projectId: row.project_id ? String(row.project_id) : null,
    type: String(row.type) as SourceType,
    title: String(row.title ?? ""),
    content: String(row.content),
    createdAt: String(row.created_at),
  };
}

function rowToContextItem(row: Record<string, unknown>): ContextItem {
  return {
    id: String(row.id),
    kind: String(row.kind) as ContextKind,
    projectId: row.project_id ? String(row.project_id) : null,
    sourceId: row.source_id ? String(row.source_id) : null,
    title: String(row.title ?? ""),
    content: String(row.content),
    tags: parseJsonArray(String(row.tags ?? "[]")),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function upsertFts(item: ContextItem) {
  const db = getDb();
  db.prepare("DELETE FROM context_fts WHERE item_id = ?").run(item.id);
  db.prepare(
    `INSERT INTO context_fts (item_id, title, content, tags, kind)
     VALUES (?, ?, ?, ?, ?)`
  ).run(item.id, item.title, item.content, item.tags.join(" "), item.kind);
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
}): ContextItem {
  const db = getDb();
  const now = nowIso();
  const item: ContextItem = {
    id: createId("ctx"),
    kind: input.kind,
    projectId: input.projectId ?? null,
    sourceId: input.sourceId ?? null,
    title: input.title,
    content: input.content,
    tags: input.tags ?? [],
    createdAt: now,
    updatedAt: now,
  };

  db.prepare(
    `INSERT INTO context_items
      (id, kind, project_id, source_id, title, content, tags, embedding, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`
  ).run(
    item.id,
    item.kind,
    item.projectId,
    item.sourceId,
    item.title,
    item.content,
    JSON.stringify(item.tags),
    item.createdAt,
    item.updatedAt
  );
  upsertFts(item);
  return item;
}

export function getProfile(): Profile {
  const db = getDb();
  const row = db.prepare("SELECT * FROM profile LIMIT 1").get() as
    | Record<string, unknown>
    | undefined;

  if (row) return rowToProfile(row);

  const now = nowIso();
  const profile: Profile = {
    id: createId("profile"),
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
      (id, display_name, role, expertise, communication_preferences, recurring_instructions, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    profile.id,
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
       WHERE id = ?`
    )
    .run(
      next.displayName,
      next.role,
      JSON.stringify(next.expertise),
      next.communicationPreferences,
      next.recurringInstructions,
      next.updatedAt,
      next.id
    );

  syncProfileContextItem(next);
  return next;
}

function syncProfileContextItem(profile: Profile) {
  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM context_items WHERE kind = 'profile' LIMIT 1")
    .get() as { id: string } | undefined;

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
      `UPDATE context_items SET title = ?, content = ?, tags = ?, updated_at = ? WHERE id = ?`
    ).run("User profile", content, JSON.stringify(["profile"]), now, existing.id);
    upsertFts({
      id: existing.id,
      kind: "profile",
      projectId: null,
      sourceId: null,
      title: "User profile",
      content,
      tags: ["profile"],
      createdAt: now,
      updatedAt: now,
    });
  } else {
    insertContextItem({
      kind: "profile",
      title: "User profile",
      content,
      tags: ["profile"],
    });
  }
}

export function listProjects(): Project[] {
  const rows = getDb()
    .prepare("SELECT * FROM projects ORDER BY updated_at DESC")
    .all() as Record<string, unknown>[];
  return rows.map(rowToProject);
}

export function getProject(projectId: string): Project | null {
  const row = getDb()
    .prepare("SELECT * FROM projects WHERE id = ?")
    .get(projectId) as Record<string, unknown> | undefined;
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
  const now = nowIso();
  const project: Project = {
    id: createId("proj"),
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
        (id, name, description, technology_stack, target_users, architecture, constraints, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      project.id,
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
       WHERE id = ?`
    )
    .run(
      next.name,
      next.description,
      JSON.stringify(next.technologyStack),
      next.targetUsers,
      next.architecture,
      next.constraints,
      next.updatedAt,
      next.id
    );

  syncProjectContextItem(next);
  return next;
}

export function deleteProject(projectId: string): boolean {
  const result = getDb().prepare("DELETE FROM projects WHERE id = ?").run(projectId);
  return result.changes > 0;
}

function syncProjectContextItem(project: Project) {
  const db = getDb();
  const existing = db
    .prepare(
      "SELECT id FROM context_items WHERE kind = 'project' AND project_id = ? LIMIT 1"
    )
    .get(project.id) as { id: string } | undefined;

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
      kind: "project",
      projectId: project.id,
      sourceId: null,
      title: project.name,
      content,
      tags: ["project", project.name.toLowerCase()],
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
  const rows = getDb()
    .prepare("SELECT * FROM preferences ORDER BY updated_at DESC")
    .all() as Record<string, unknown>[];
  return rows.map(rowToPreference);
}

export function createPreference(content: string, tags: string[] = []): Preference {
  const now = nowIso();
  const preference: Preference = {
    id: createId("pref"),
    content: content.trim(),
    tags,
    createdAt: now,
    updatedAt: now,
  };

  getDb()
    .prepare(
      `INSERT INTO preferences (id, content, tags, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(
      preference.id,
      preference.content,
      JSON.stringify(preference.tags),
      preference.createdAt,
      preference.updatedAt
    );

  insertContextItem({
    kind: "preference",
    title: "Preference",
    content: preference.content,
    tags: ["preference", ...tags],
  });

  return preference;
}

export function deletePreference(id: string): boolean {
  const pref = getDb()
    .prepare("SELECT content FROM preferences WHERE id = ?")
    .get(id) as { content: string } | undefined;
  if (!pref) return false;

  getDb().prepare("DELETE FROM preferences WHERE id = ?").run(id);
  const items = getDb()
    .prepare(
      "SELECT id FROM context_items WHERE kind = 'preference' AND content = ?"
    )
    .all(pref.content) as { id: string }[];
  for (const item of items) {
    getDb().prepare("DELETE FROM context_items WHERE id = ?").run(item.id);
    removeFts(item.id);
  }
  return true;
}

export function listDecisions(projectId?: string | null): Decision[] {
  const db = getDb();
  const rows = projectId
    ? (db
        .prepare(
          "SELECT * FROM decisions WHERE project_id = ? ORDER BY updated_at DESC"
        )
        .all(projectId) as Record<string, unknown>[])
    : (db
        .prepare("SELECT * FROM decisions ORDER BY updated_at DESC")
        .all() as Record<string, unknown>[]);
  return rows.map(rowToDecision);
}

export function createDecision(input: {
  projectId?: string | null;
  content: string;
  rationale?: string;
}): Decision {
  const now = nowIso();
  const decision: Decision = {
    id: createId("dec"),
    projectId: input.projectId ?? null,
    content: input.content.trim(),
    rationale: input.rationale?.trim() ?? "",
    createdAt: now,
    updatedAt: now,
  };

  getDb()
    .prepare(
      `INSERT INTO decisions (id, project_id, content, rationale, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      decision.id,
      decision.projectId,
      decision.content,
      decision.rationale,
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
  });

  return decision;
}

export function deleteDecision(id: string): boolean {
  const decision = getDb()
    .prepare("SELECT content FROM decisions WHERE id = ?")
    .get(id) as { content: string } | undefined;
  if (!decision) return false;

  getDb().prepare("DELETE FROM decisions WHERE id = ?").run(id);
  const items = getDb()
    .prepare(
      "SELECT id, content FROM context_items WHERE kind = 'decision'"
    )
    .all() as { id: string; content: string }[];
  for (const item of items) {
    if (item.content.startsWith(decision.content)) {
      getDb().prepare("DELETE FROM context_items WHERE id = ?").run(item.id);
      removeFts(item.id);
    }
  }
  return true;
}

export function listSources(projectId?: string | null): Source[] {
  const db = getDb();
  const rows = projectId
    ? (db
        .prepare(
          "SELECT * FROM sources WHERE project_id = ? ORDER BY created_at DESC"
        )
        .all(projectId) as Record<string, unknown>[])
    : (db
        .prepare("SELECT * FROM sources ORDER BY created_at DESC")
        .all() as Record<string, unknown>[]);
  return rows.map(rowToSource);
}

export function createSource(input: {
  type: SourceType;
  title?: string;
  content: string;
  projectId?: string | null;
}): Source {
  const source: Source = {
    id: createId("src"),
    projectId: input.projectId ?? null,
    type: input.type,
    title: input.title?.trim() || `${input.type} import`,
    content: input.content,
    createdAt: nowIso(),
  };

  getDb()
    .prepare(
      `INSERT INTO sources (id, project_id, type, title, content, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      source.id,
      source.projectId,
      source.type,
      source.title,
      source.content,
      source.createdAt
    );

  return source;
}

export function listContextItems(filters?: {
  projectId?: string | null;
  kind?: ContextKind;
}): ContextItem[] {
  const db = getDb();
  let sql = "SELECT * FROM context_items WHERE 1=1";
  const params: string[] = [];
  if (filters?.projectId) {
    sql += " AND project_id = ?";
    params.push(filters.projectId);
  }
  if (filters?.kind) {
    sql += " AND kind = ?";
    params.push(filters.kind);
  }
  sql += " ORDER BY updated_at DESC";
  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
  return rows.map(rowToContextItem);
}

export function saveContext(content: string, options?: {
  projectId?: string | null;
  title?: string;
  kind?: ContextKind;
  tags?: string[];
}): ContextItem {
  return insertContextItem({
    kind: options?.kind ?? "knowledge",
    projectId: options?.projectId,
    title: options?.title ?? "Saved context",
    content: content.trim(),
    tags: options?.tags ?? ["knowledge"],
  });
}

export function deleteContextItem(id: string): boolean {
  const result = getDb().prepare("DELETE FROM context_items WHERE id = ?").run(id);
  if (result.changes > 0) removeFts(id);
  return result.changes > 0;
}

export function searchContext(
  query: string,
  options?: { projectId?: string | null; limit?: number }
): SearchHit[] {
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
    // bm25 returns lower (more negative) for better matches in SQLite.
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

  return hits
    .filter((h) => h.score > 0.02 || h.matchedOn.includes("keyword"))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function importAndExtract(input: {
  content: string;
  type: SourceType;
  title?: string;
  projectId?: string | null;
  applyExtraction?: boolean;
  useLlm?: boolean;
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
  const source = createSource({
    type: input.type,
    title: input.title,
    content: input.content,
    projectId: input.projectId,
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
      created.preferences.push(createPreference(pref));
    }
    for (const decision of extraction.decisions) {
      created.decisions.push(
        createDecision({ projectId: input.projectId, content: decision })
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
}): { text: string; fragments: PreviewPayload["fragments"]; estimatedTokens: number } {
  const includeProfile = options?.includeProfile !== false;
  const includePreferences = options?.includePreferences !== false;
  const includeDecisions = options?.includeDecisions !== false;
  const fragments: PreviewPayload["fragments"] = [];

  if (includeProfile) {
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
      fragments.push({
        kind: "profile",
        title: "Profile",
        content: parts.join("\n"),
        source: "vault:profile",
      });
    }
  }

  if (includePreferences) {
    for (const pref of listPreferences()) {
      fragments.push({
        kind: "preference",
        title: "Preference",
        content: pref.content,
        source: `vault:preference:${pref.id}`,
      });
    }
  }

  if (includeDecisions) {
    const decisions = listDecisions(options?.projectId);
    for (const decision of decisions) {
      fragments.push({
        kind: "decision",
        title: "Decision",
        content: decision.rationale
          ? `${decision.content}\nRationale: ${decision.rationale}`
          : decision.content,
        source: `vault:decision:${decision.id}`,
      });
    }
  }

  if (options?.projectId) {
    const project = getProject(options.projectId);
    if (project) {
      fragments.push({
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
      fragments.push({
        kind: hit.item.kind,
        title: hit.item.title || hit.item.kind,
        content: hit.item.content,
        source: `vault:item:${hit.item.id}`,
      });
    }
  }

  const sections = fragments.map(
    (f) => `### ${f.title} (${f.kind})\n${f.content}`
  );
  const text = [
    "# Eidothea export",
    "Only the fragments below are intended for sharing with an AI provider.",
    "",
    ...sections,
  ].join("\n");

  return {
    text,
    fragments,
    estimatedTokens: estimateTokens(text),
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
}): PreviewPayload {
  const exported = buildExportText({
    projectId: input.projectId,
    query: input.includeSearchHits === false ? null : input.query,
    includeProfile: input.includeProfile,
    includePreferences: input.includePreferences,
    includeDecisions: input.includeDecisions,
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
    exportText: exported.text,
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

export function wipeAllContext(): void {
  const db = getDb();
  db.exec(`
    DELETE FROM context_fts;
    DELETE FROM context_items;
    DELETE FROM sources;
    DELETE FROM decisions;
    DELETE FROM preferences;
    DELETE FROM projects;
    DELETE FROM profile;
  `);
}

export function getVaultStats() {
  const db = getDb();
  const count = (table: string) =>
    (db.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get() as { c: number }).c;

  const recent = listContextItems().slice(0, 8);
  const projects = listProjects();
  const projectName = new Map(projects.map((p) => [p.id, p.name]));

  return {
    projects: count("projects"),
    preferences: count("preferences"),
    decisions: count("decisions"),
    sources: count("sources"),
    contextItems: count("context_items"),
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
