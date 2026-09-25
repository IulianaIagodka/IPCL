/**
 * IPCL Context Store — ADR-002 implementation facade.
 *
 * Layers:
 *   RAW SOURCE → MEMORY EXTRACTION → STRUCTURED MEMORY → SEMANTIC INDEX
 *
 * Critical rules enforced here:
 * - Memories are temporal (supersede, never silent overwrite for conflicts)
 * - AI output ≠ memory (only explicit save / extraction / approved suggestion)
 * - Embeddings are an index, not the source of truth
 * - Context packages are ephemeral
 */

import { assembleContext } from "./assemble.js";
import {
  detectConflicts,
  requiresConfirmation,
  resolveConflict,
} from "./conflicts.js";
import { extractMemoriesFromText } from "./extract.js";
import {
  archiveMemory,
  createMemory,
  deleteMemory,
  getMemory,
  listMemories,
  pinMemory,
  supersedeMemory,
  updateMemory,
} from "./memories.js";
import { createProject, getProjectBySlug, listProjects } from "./projects.js";
import { inferScopeFromQuery, retrieveMemories } from "./retrieve.js";
import { createSource, getSource, listSources } from "./sources.js";
import type {
  ConflictProposal,
  ConflictResolution,
  ContextPackage,
  Memory,
  MemoryCandidate,
  RetrievalRequest,
  Scope,
  Source,
  SourceType,
} from "./types.js";

export interface ImportResult {
  source: Source;
  candidates: MemoryCandidate[];
  conflicts: ConflictProposal[];
  created: Memory[];
  pendingConflicts: ConflictProposal[];
}

export class ContextStore {
  createSource(input: {
    type: SourceType;
    title?: string;
    content: string;
    scope?: Scope | null;
  }): Source {
    return createSource(input);
  }

  getSource(id: string): Source | null {
    return getSource(id);
  }

  listSources(options?: { scope?: Scope | null }): Source[] {
    return listSources(options);
  }

  createProject(input: { name: string; description?: string; slug?: string }) {
    return createProject(input);
  }

  listProjects() {
    return listProjects();
  }

  /**
   * Explicit user save — allowed path into memory.
   * Never call this on raw model completions.
   */
  saveMemory(input: Parameters<typeof createMemory>[0]): Memory {
    return createMemory(input);
  }

  getMemory(id: string): Memory | null {
    return getMemory(id);
  }

  listMemories(
    options?: Parameters<typeof listMemories>[0]
  ): Memory[] {
    return listMemories(options);
  }

  updateMemory(
    id: string,
    updates: Parameters<typeof updateMemory>[1]
  ): Memory {
    return updateMemory(id, updates);
  }

  supersedeMemory(
    oldId: string,
    input: Parameters<typeof supersedeMemory>[1]
  ) {
    return supersedeMemory(oldId, input);
  }

  archiveMemory(id: string): Memory {
    return archiveMemory(id);
  }

  deleteMemory(id: string): Memory {
    return deleteMemory(id);
  }

  pinMemory(id: string, pinned = true): Memory {
    return pinMemory(id, pinned);
  }

  /**
   * Import a raw source and extract candidate memories.
   * High-risk conflicts are left pending for explicit confirmation.
   * Low-risk non-conflicting candidates are saved automatically.
   */
  importSource(input: {
    type: SourceType;
    title?: string;
    content: string;
    scope?: Scope | null;
    /** When false, only extract — do not write memories. */
    apply?: boolean;
    /** Auto-resolve low-risk conflicts by superseding. Default false. */
    autoResolveLowRisk?: boolean;
  }): ImportResult {
    const scope = input.scope ?? "global";
    const source = createSource({
      type: input.type,
      title: input.title,
      content: input.content,
      scope,
    });

    const extraction = extractMemoriesFromText(input.content, {
      scope,
      title: input.title,
    });

    const created: Memory[] = [];
    const pendingConflicts: ConflictProposal[] = [];

    if (input.apply === false) {
      return {
        source,
        candidates: extraction.candidates,
        conflicts: extraction.conflicts,
        created,
        pendingConflicts: extraction.conflicts,
      };
    }

    const conflictedStatements = new Set(
      extraction.conflicts.map((c) => c.candidate.statement)
    );

    for (const conflict of extraction.conflicts) {
      if (requiresConfirmation(conflict) || !input.autoResolveLowRisk) {
        pendingConflicts.push(conflict);
        continue;
      }
      const result = resolveConflict(conflict, "update", [source.id]);
      if (result.created) created.push(result.created);
    }

    for (const candidate of extraction.candidates) {
      if (conflictedStatements.has(candidate.statement)) continue;
      created.push(
        createMemory({
          type: candidate.type,
          scope: candidate.scope,
          statement: candidate.statement,
          importance: candidate.importance,
          confidence: candidate.confidence,
          sensitivity: candidate.sensitivity,
          sourceIds: [source.id],
        })
      );
    }

    return {
      source,
      candidates: extraction.candidates,
      conflicts: extraction.conflicts,
      created,
      pendingConflicts,
    };
  }

  resolveConflict(
    proposal: ConflictProposal,
    resolution: ConflictResolution,
    sourceIds?: string[]
  ) {
    return resolveConflict(proposal, resolution, sourceIds);
  }

  detectConflicts(candidates: MemoryCandidate[]): ConflictProposal[] {
    return detectConflicts(candidates);
  }

  retrieve(request: RetrievalRequest) {
    const scope =
      request.scope ??
      inferScopeFromQuery(
        request.query,
        listProjects().map((p) => p.scope)
      );
    return retrieveMemories({ ...request, scope });
  }

  /**
   * Build an ephemeral context package for one AI call.
   * Must not be written back as memory.
   */
  assemble(request: RetrievalRequest): ContextPackage {
    const scope =
      request.scope ??
      inferScopeFromQuery(
        request.query,
        listProjects().map((p) => p.scope)
      ) ??
      null;

    // If caller passed a project name like "paypace", normalize via projects table
    let normalized = scope;
    if (scope && !scope.includes("/")) {
      const project = getProjectBySlug(scope);
      normalized = project?.scope ?? `project/${scope}`;
    }

    return assembleContext({ ...request, scope: normalized });
  }
}

export function createContextStore(): ContextStore {
  return new ContextStore();
}
