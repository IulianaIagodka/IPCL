import {
  createMemory,
  findConflictingMemories,
  listMemories,
  supersedeMemory,
} from "./memories";
import type {
  ConflictProposal,
  ConflictResolution,
  Importance,
  Memory,
  MemoryCandidate,
  MemoryType,
} from "./types";

const HIGH_RISK_TYPES = new Set<MemoryType>([
  "decision",
  "constraint",
  "profile",
]);

/**
 * Detect possible conflicts without silently replacing active memories.
 */
export function detectConflicts(
  candidates: MemoryCandidate[]
): ConflictProposal[] {
  const proposals: ConflictProposal[] = [];

  for (const candidate of candidates) {
    const seen = new Set<string>();
    const matches = [
      ...findConflictingMemories(candidate.statement, candidate.scope, 0.28),
      ...listMemories({
        scope: candidate.scope,
        status: "active",
        type: candidate.type,
      }),
    ];

    for (const existing of matches) {
      if (seen.has(existing.id)) continue;
      seen.add(existing.id);
      if (normalize(existing.statement) === normalize(candidate.statement)) {
        continue;
      }
      const sameType = existing.type === candidate.type;
      const overlapping = lexicalOverlap(existing, candidate);
      const topicShift =
        sameType && sharesTopicCue(existing.statement, candidate.statement);

      if (sameType && (overlapping || topicShift)) {
        proposals.push({
          existing,
          candidate,
          reason: `Possible update to ${existing.type} memory in scope ${existing.scope}`,
        });
        break;
      }
    }
  }

  return proposals;
}

const TOPIC_CUES = [
  "launch",
  "pricing",
  "subscription",
  "billing",
  "database",
  "hosting",
  "auth",
  "mvp",
  "ios",
  "android",
];

function sharesTopicCue(a: string, b: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  return TOPIC_CUES.some((cue) => na.includes(cue) && nb.includes(cue));
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function lexicalOverlap(existing: Memory, candidate: MemoryCandidate): boolean {
  const a = new Set(
    normalize(existing.statement)
      .split(" ")
      .filter((w) => w.length > 3)
  );
  const b = normalize(candidate.statement)
    .split(" ")
    .filter((w) => w.length > 3);
  if (!a.size || !b.length) return false;
  const hits = b.filter((w) => a.has(w)).length;
  return hits / b.length >= 0.35;
}

export function requiresConfirmation(proposal: ConflictProposal): boolean {
  const importance: Importance =
    proposal.existing.importance ?? proposal.candidate.importance ?? "medium";
  if (importance === "high") return true;
  if (HIGH_RISK_TYPES.has(proposal.existing.type)) return true;
  if (proposal.existing.sensitivity !== "normal") return true;
  return false;
}

/**
 * Apply an explicit conflict resolution. AI output never auto-resolves this.
 */
export function resolveConflict(
  proposal: ConflictProposal,
  resolution: ConflictResolution,
  sourceIds: string[] = []
): { created: Memory | null; superseded: Memory | null; skipped: boolean } {
  if (resolution === "ignore") {
    return { created: null, superseded: null, skipped: true };
  }

  if (resolution === "keep_both") {
    const created = createMemory({
      type: proposal.candidate.type,
      scope: proposal.candidate.scope,
      statement: proposal.candidate.statement,
      importance: proposal.candidate.importance,
      confidence: proposal.candidate.confidence,
      sensitivity: proposal.candidate.sensitivity,
      sourceIds,
    });
    return { created, superseded: null, skipped: false };
  }

  const { old, next } = supersedeMemory(proposal.existing.id, {
    statement: proposal.candidate.statement,
    sourceIds: sourceIds.length ? sourceIds : proposal.existing.sourceIds,
    importance: proposal.candidate.importance,
    confidence: proposal.candidate.confidence,
    sensitivity: proposal.candidate.sensitivity,
  });
  return { created: next, superseded: old, skipped: false };
}
