import type {
  ConflictProposal,
  ExtractionResult,
  MemoryCandidate,
  MemoryType,
  Scope,
} from "./types.js";
import { detectConflicts } from "./conflicts.js";

/**
 * Extract candidate memories from user-provided source text.
 * Prefers facts expressed by the user — never treats AI answers as memory.
 */
export function extractMemoriesFromText(
  content: string,
  options?: {
    scope?: Scope;
    title?: string;
  }
): ExtractionResult {
  const scope = options?.scope ?? "global";
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const candidates: MemoryCandidate[] = [];

  for (const line of lines) {
    const cleaned = cleanBullet(line);
    if (cleaned.length < 8) continue;

    const typed = classifyLine(cleaned, scope);
    if (typed) candidates.push(typed);
  }

  // Paragraph-level project facts when no line matched
  if (!candidates.length && content.trim().length > 40) {
    candidates.push({
      type: "project_fact",
      scope,
      statement: content.trim().slice(0, 400),
      importance: "medium",
      confidence: "medium",
      supersedesStatement: null,
    });
  }

  // Detect supersession hints in prose
  for (const candidate of candidates) {
    const supersedes = detectSupersedesHint(content, candidate.statement);
    if (supersedes) candidate.supersedesStatement = supersedes;
  }

  const conflicts: ConflictProposal[] = detectConflicts(candidates);

  return { candidates, conflicts };
}

function cleanBullet(line: string): string {
  return line.replace(/^[-*•\d.)\s]+/, "").trim();
}

function classifyLine(line: string, scope: Scope): MemoryCandidate | null {
  const lower = line.toLowerCase();

  if (/^(i am|i'm|role:|my role)\b/.test(lower)) {
    return {
      type: "profile",
      scope: "global",
      statement: line.replace(/^(i am|i'm|role:|my role)\s*/i, "").trim() || line,
      importance: "high",
      confidence: "high",
    };
  }

  if (
    /^(prefer|always|never|avoid|don't|do not|please|be concise|communicate)\b/i.test(
      line
    ) ||
    /\bpreference\b/i.test(line)
  ) {
    return {
      type: "preference",
      scope: "global",
      statement: line,
      importance: "medium",
      confidence: "high",
    };
  }

  if (
    /^(decided|decision|we (will|chose|chose to|use|using|adopted)|agreed)\b/i.test(
      line
    ) ||
    /\bdecision\b/i.test(line) ||
    /\bwe('ve| have) decided\b/i.test(line) ||
    /\blaunch moved\b/i.test(line) ||
    /\b(monthly|yearly|lifetime)\s+(and\s+)?(yearly\s+)?(plans?|subscriptions?|pricing)\b/i.test(
      line
    )
  ) {
    return {
      type: "decision",
      scope,
      statement: normalizeDecision(line),
      importance: "high",
      confidence: "high",
    };
  }

  if (
    /\b(must|cannot|can't|constraint|limited to|without requiring)\b/i.test(
      line
    )
  ) {
    return {
      type: "constraint",
      scope,
      statement: line.replace(/^(constraint)[:\s-]*/i, "").trim() || line,
      importance: "high",
      confidence: "medium",
    };
  }

  if (/^(goal|we want|target|launch|ship)\b/i.test(line) || /\bgoal\b/i.test(line)) {
    return {
      type: "goal",
      scope,
      statement: line,
      importance: "medium",
      confidence: "medium",
    };
  }

  if (
    /\bmeans\b/i.test(line) ||
    /^["“].+["”]\s*=/.test(line) ||
    /\bterminology\b/i.test(line)
  ) {
    return {
      type: "terminology",
      scope,
      statement: line,
      importance: "medium",
      confidence: "high",
    };
  }

  if (
    /\b(not yet|unresolved|open question|tbd|undecided|has not yet)\b/i.test(
      line
    )
  ) {
    return {
      type: "open_question",
      scope,
      statement: line,
      importance: "medium",
      confidence: "medium",
    };
  }

  if (
    /\b(is a|offers|uses|focuses|product|project)\b/i.test(line) &&
    line.length > 20
  ) {
    return {
      type: "project_fact",
      scope,
      statement: line,
      importance: "medium",
      confidence: "medium",
    };
  }

  return null;
}

function normalizeDecision(line: string): string {
  // Prefer the clause after "but we've decided..." when present
  const butDecided = line.match(
    /\bbut\s+(?:we('ve| have)?\s+)?decided\s+to\s+(.+)$/i
  );
  if (butDecided?.[2]) {
    const decided = butDecided[2].trim().replace(/\.$/, "");
    return decided.charAt(0).toUpperCase() + decided.slice(1) + ".";
  }

  return (
    line
      .replace(/^(decision|decided|we('ve| have)? decided)[:\s-]*/i, "")
      .trim() || line
  );
}

function detectSupersedesHint(
  content: string,
  newStatement: string
): string | null {
  const match = content.match(
    /originally\s+(?:wanted|planned|used)\s+(.+?)(?:,|\s+but\b)/i
  );
  if (!match) return null;
  const oldIdea = match[1].trim();
  if (!oldIdea || normalizeLoose(oldIdea) === normalizeLoose(newStatement)) {
    return null;
  }
  return oldIdea;
}

function normalizeLoose(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function memoryTypeLabel(type: MemoryType): string {
  switch (type) {
    case "project_fact":
      return "Product";
    case "open_question":
      return "Open questions";
    case "decision":
      return "Current decisions";
    case "constraint":
      return "Technical constraints";
    case "terminology":
      return "Relevant terminology";
    case "preference":
      return "Preferences";
    case "profile":
      return "Profile";
    case "goal":
      return "Goals";
    default:
      return type;
  }
}
