/** Canonical types for ADR-002 structured memory + retrieval. */

export type SourceType =
  | "conversation"
  | "document"
  | "note"
  | "readme"
  | "import"
  | "manual";

export type MemoryType =
  | "profile"
  | "preference"
  | "project_fact"
  | "decision"
  | "constraint"
  | "goal"
  | "terminology"
  | "open_question";

export type MemoryStatus =
  | "active"
  | "superseded"
  | "archived"
  | "disputed"
  | "deleted";

export type Importance = "low" | "medium" | "high";
export type Confidence = "low" | "medium" | "high";
export type Sensitivity = "normal" | "sensitive" | "restricted";

/** Scope strings: `global`, `work`, `project/<slug>`, `work/<slug>`, etc. */
export type Scope = string;

export interface Source {
  id: string;
  type: SourceType;
  title: string;
  content: string;
  scope: Scope | null;
  createdAt: string;
  /** Optional path/key into object storage for binary originals. */
  objectKey: string | null;
}

export interface Memory {
  id: string;
  type: MemoryType;
  scope: Scope;
  statement: string;
  importance: Importance;
  confidence: Confidence;
  sensitivity: Sensitivity;
  validFrom: string | null;
  validUntil: string | null;
  status: MemoryStatus;
  sourceIds: string[];
  pinned: boolean;
  /** Id of the memory this one superseded, if any. */
  supersedesId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryCandidate {
  type: MemoryType;
  scope: Scope;
  statement: string;
  importance?: Importance;
  confidence?: Confidence;
  sensitivity?: Sensitivity;
  /** Statement of an existing memory this candidate may supersede. */
  supersedesStatement?: string | null;
}

export interface ConflictProposal {
  existing: Memory;
  candidate: MemoryCandidate;
  reason: string;
}

export type ConflictResolution = "update" | "keep_both" | "ignore";

export interface RetrievalRequest {
  query: string;
  /** Preferred scope, e.g. `project/paypace`. */
  scope?: Scope | null;
  /** Soft type boosts / filters. Empty = all types. */
  types?: MemoryType[];
  tokenBudget?: number;
  limit?: number;
  /** Include restricted memories (default false). */
  includeRestricted?: boolean;
}

export interface RankedMemory {
  memory: Memory;
  score: number;
  components: {
    semantic: number;
    scopeMatch: number;
    importance: number;
    recency: number;
    decisionPriority: number;
    pin: number;
    contradictionPenalty: number;
    stalePenalty: number;
  };
}

export interface ContextPackage {
  query: string;
  scope: Scope | null;
  assembledAt: string;
  sections: Array<{
    heading: string;
    memories: Array<{
      id: string;
      type: MemoryType;
      statement: string;
      scope: Scope;
      sourceIds: string[];
    }>;
  }>;
  text: string;
  estimatedTokens: number;
  selectedMemoryIds: string[];
  ranked: RankedMemory[];
}

export interface ExtractionResult {
  candidates: MemoryCandidate[];
  conflicts: ConflictProposal[];
}
