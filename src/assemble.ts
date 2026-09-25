import { estimateTokens, nowIso } from "./id.js";
import { memoryTypeLabel } from "./extract.js";
import type {
  ContextPackage,
  MemoryType,
  RankedMemory,
  RetrievalRequest,
  Scope,
} from "./types.js";
import { retrieveMemories } from "./retrieve.js";

const DEFAULT_BUDGET = 3000;

const SECTION_ORDER: MemoryType[] = [
  "profile",
  "preference",
  "project_fact",
  "decision",
  "constraint",
  "goal",
  "terminology",
  "open_question",
];

/**
 * Assemble an ephemeral context package for one AI interaction.
 * This package must NOT become a new memory automatically.
 */
export function assembleContext(request: RetrievalRequest): ContextPackage {
  const budget = request.tokenBudget ?? DEFAULT_BUDGET;
  const ranked = retrieveMemories({
    ...request,
    limit: request.limit ?? 40,
  });

  const selected = selectWithinBudget(ranked, budget, request.scope ?? null);
  const sections = groupSections(selected);

  const text = renderPackage(request.query, request.scope ?? null, sections);
  const estimatedTokens = estimateTokens(text);

  return {
    query: request.query,
    scope: request.scope ?? null,
    assembledAt: nowIso(),
    sections,
    text,
    estimatedTokens,
    selectedMemoryIds: selected.map((r) => r.memory.id),
    ranked: selected,
  };
}

function selectWithinBudget(
  ranked: RankedMemory[],
  budget: number,
  preferredScope: Scope | null
): RankedMemory[] {
  // Dynamic allocation inspired by ADR-002:
  // ~15% global profile/preferences, ~70% task/project, ~15% decisions
  // Fill decision-ish memories first so important context is not crowded out.
  const globalBudget = Math.floor(budget * 0.15);
  const projectBudget = Math.floor(budget * 0.7);
  const decisionBudget = budget - globalBudget - projectBudget;

  const isGlobal = (item: RankedMemory) =>
    item.memory.scope === "global" ||
    item.memory.type === "profile" ||
    item.memory.type === "preference";

  const isDecisionish = (item: RankedMemory) =>
    item.memory.type === "decision" ||
    item.memory.type === "constraint" ||
    item.memory.type === "open_question" ||
    item.memory.type === "terminology";

  const ordered = [
    ...ranked.filter(isDecisionish),
    ...ranked.filter(isGlobal),
    ...ranked.filter((r) => !isDecisionish(r) && !isGlobal(r)),
  ];

  const selected: RankedMemory[] = [];
  const seen = new Set<string>();
  let globalUsed = 0;
  let projectUsed = 0;
  let decisionUsed = 0;

  for (const item of ordered) {
    if (seen.has(item.memory.id)) continue;
    const cost = estimateTokens(item.memory.statement) + 8;

    if (isGlobal(item)) {
      if (globalUsed + cost > globalBudget && selected.length > 0) continue;
      globalUsed += cost;
    } else if (isDecisionish(item)) {
      if (decisionUsed + cost > decisionBudget) {
        if (projectUsed + cost > projectBudget) continue;
        projectUsed += cost;
      } else {
        decisionUsed += cost;
      }
    } else {
      if (
        preferredScope &&
        item.memory.scope !== preferredScope &&
        item.memory.scope !== "global"
      ) {
        continue;
      }
      // Prefer higher-semantic project facts; skip low-signal noise early
      if (item.components.semantic < 0.15 && item.memory.importance === "low") {
        continue;
      }
      if (projectUsed + cost > projectBudget && selected.length > 2) continue;
      projectUsed += cost;
    }

    selected.push(item);
    seen.add(item.memory.id);
    const total = globalUsed + projectUsed + decisionUsed;
    if (total >= budget) break;
  }

  return selected;
}

function groupSections(ranked: RankedMemory[]): ContextPackage["sections"] {
  const byType = new Map<MemoryType, RankedMemory[]>();
  for (const item of ranked) {
    const list = byType.get(item.memory.type) ?? [];
    list.push(item);
    byType.set(item.memory.type, list);
  }

  const sections: ContextPackage["sections"] = [];
  for (const type of SECTION_ORDER) {
    const items = byType.get(type);
    if (!items?.length) continue;
    sections.push({
      heading: memoryTypeLabel(type),
      memories: items.map((r) => ({
        id: r.memory.id,
        type: r.memory.type,
        statement: r.memory.statement,
        scope: r.memory.scope,
        sourceIds: r.memory.sourceIds,
      })),
    });
  }
  return sections;
}

function renderPackage(
  query: string,
  scope: Scope | null,
  sections: ContextPackage["sections"]
): string {
  const title = scope
    ? `PROJECT CONTEXT: ${scope.replace(/^project\//, "").toUpperCase()}`
    : "CONTEXT PACKAGE";

  const lines: string[] = [title, ""];
  if (query) {
    lines.push(`Query: ${query}`, "");
  }

  for (const section of sections) {
    lines.push(section.heading);
    for (const memory of section.memories) {
      lines.push(`- ${memory.statement}`);
    }
    lines.push("");
  }

  return lines.join("\n").trim() + "\n";
}
