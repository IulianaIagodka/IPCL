import { cosineSimilarity, embed } from "./embed";
import { getMemoryEmbedding, listMemories } from "./memories";
import type {
  Memory,
  MemoryType,
  RankedMemory,
  RetrievalRequest,
  Scope,
} from "./types";

const IMPORTANCE_WEIGHT: Record<string, number> = {
  low: 0.1,
  medium: 0.25,
  high: 0.45,
};

const DECISION_TYPES = new Set<MemoryType>([
  "decision",
  "constraint",
  "terminology",
]);

/**
 * MVP retrieval (ADR-002):
 * 1. determine scope
 * 2. embed query
 * 3. retrieve candidates
 * 4. metadata filter
 * 5. rerank
 */
export function retrieveMemories(request: RetrievalRequest): RankedMemory[] {
  const limit = request.limit ?? 20;
  const scope = request.scope ?? null;
  const queryEmbedding = embed(request.query);

  const candidates = collectCandidates(scope, request.includeRestricted === true);
  const filtered = metadataFilter(candidates, request);

  const ranked = filtered
    .map((memory) => rankMemory(memory, request.query, queryEmbedding, scope))
    .filter((r) => {
      // Require some semantic signal unless pinned / high-importance decision in scope
      if (r.memory.pinned) return true;
      if (
        r.components.semantic >= 0.12 ||
        (r.components.scopeMatch >= 0.5 &&
          r.components.decisionPriority >= 0.3 &&
          r.memory.importance === "high")
      ) {
        return r.score > 0.2;
      }
      return r.components.semantic >= 0.08 && r.score > 0.35;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return ranked;
}

function collectCandidates(
  scope: Scope | null,
  includeRestricted: boolean
): Memory[] {
  const active = listMemories({ status: "active" });
  return active.filter((m) => {
    if (!includeRestricted && m.sensitivity === "restricted") return false;
    if (!scope) return true;
    // Prefer scope match but keep global profile/preferences available
    if (m.scope === scope) return true;
    if (m.scope === "global") return true;
    if (scope.startsWith("project/") && m.scope === "work") return false;
    return false;
  });
}

function metadataFilter(
  memories: Memory[],
  request: RetrievalRequest
): Memory[] {
  let result = memories;

  if (request.types?.length) {
    const allowed = new Set(request.types);
    // Keep global profile/preferences even when type-filtered for project tasks
    result = result.filter(
      (m) =>
        allowed.has(m.type) ||
        m.type === "profile" ||
        m.type === "preference" ||
        m.pinned
    );
  }

  const now = Date.now();
  result = result.filter((m) => {
    if (m.validUntil && Date.parse(m.validUntil) < now) return false;
    return true;
  });

  return result;
}

function rankMemory(
  memory: Memory,
  query: string,
  queryEmbedding: ReturnType<typeof embed>,
  preferredScope: Scope | null
): RankedMemory {
  const embedding = getMemoryEmbedding(memory.id);
  const semantic = cosineSimilarity(queryEmbedding, embedding);

  const scopeMatch = scoreScopeMatch(memory.scope, preferredScope);
  const importance = IMPORTANCE_WEIGHT[memory.importance] ?? 0.2;
  const recency = scoreRecency(memory.updatedAt);
  const decisionQuery =
    /\b(decision|pricing|price|subscription|architecture|constraint|choose|chose|model|monetization)\b/i.test(
      query
    );
  const decisionPriority = DECISION_TYPES.has(memory.type)
    ? decisionQuery
      ? 0.55
      : 0.2
    : decisionQuery && memory.importance === "low"
      ? -0.25
      : 0;
  const pin = memory.pinned ? 0.4 : 0;
  const contradictionPenalty = memory.status === "disputed" ? 0.5 : 0;
  const stalePenalty = scoreStale(memory);
  const noisePenalty =
    memory.importance === "low" && semantic < 0.25 ? 0.35 : 0;

  const score =
    semantic * 1.35 +
    scopeMatch +
    importance +
    recency +
    decisionPriority +
    pin -
    contradictionPenalty -
    stalePenalty -
    noisePenalty;

  return {
    memory,
    score,
    components: {
      semantic,
      scopeMatch,
      importance,
      recency,
      decisionPriority,
      pin,
      contradictionPenalty,
      stalePenalty,
    },
  };
}

function scoreScopeMatch(memoryScope: Scope, preferred: Scope | null): number {
  if (!preferred) return 0;
  if (memoryScope === preferred) return 0.55;
  if (memoryScope === "global") return 0.15;
  if (
    preferred.startsWith("project/") &&
    memoryScope.startsWith("project/") &&
    memoryScope !== preferred
  ) {
    return -0.4; // other projects are noise
  }
  return 0;
}

function scoreRecency(updatedAt: string): number {
  const ageMs = Date.now() - Date.parse(updatedAt);
  const day = 86_400_000;
  if (Number.isNaN(ageMs)) return 0;
  if (ageMs < day) return 0.2;
  if (ageMs < 7 * day) return 0.12;
  if (ageMs < 30 * day) return 0.05;
  return 0;
}

function scoreStale(memory: Memory): number {
  if (memory.status === "superseded") return 1;
  if (memory.validUntil) {
    const until = Date.parse(memory.validUntil);
    if (!Number.isNaN(until) && until < Date.now()) return 0.8;
  }
  return 0;
}

export function inferScopeFromQuery(
  query: string,
  knownProjectScopes: Scope[]
): Scope | null {
  const lower = query.toLowerCase();
  for (const scope of knownProjectScopes) {
    const slug = scope.split("/").pop() ?? scope;
    if (lower.includes(slug.toLowerCase())) return scope;
  }
  return null;
}
