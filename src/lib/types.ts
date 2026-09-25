export type SourceType = "conversation" | "document" | "note" | "readme";

export type ContextKind =
  | "profile"
  | "project"
  | "decision"
  | "preference"
  | "knowledge"
  | "note";

/** ADR-003 data classification. */
export type DataClassification = "NORMAL" | "SENSITIVE" | "RESTRICTED";

export type IntegrationAccessMode = "READ_ONLY" | "READ_WRITE";

export type IntegrationScope =
  | "profile:read"
  | "preferences:read"
  | "projects:read"
  | "decisions:read"
  | "context:search"
  | "context:write"
  | "memory:create"
  | "memory:update"
  | `project:${string}:read`;

export type AuditAction =
  | "account_created"
  | "account_deleted"
  | "integration_connected"
  | "integration_permission_expanded"
  | "integration_revoked"
  | "credential_rotated"
  | "context_search"
  | "sensitive_context_accessed"
  | "context_preview"
  | "bulk_export"
  | "memory_write"
  | "candidate_memory_created"
  | "candidate_memory_approved"
  | "candidate_memory_rejected"
  | "vault_wiped";

export interface UserAccount {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  ownerId: string;
  displayName: string;
  role: string;
  expertise: string[];
  communicationPreferences: string;
  recurringInstructions: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  technologyStack: string[];
  targetUsers: string;
  architecture: string;
  constraints: string;
  createdAt: string;
  updatedAt: string;
}

export interface Preference {
  id: string;
  ownerId: string;
  content: string;
  tags: string[];
  classification: DataClassification;
  createdAt: string;
  updatedAt: string;
}

export interface Decision {
  id: string;
  ownerId: string;
  projectId: string | null;
  content: string;
  rationale: string;
  classification: DataClassification;
  createdAt: string;
  updatedAt: string;
}

export interface Source {
  id: string;
  ownerId: string;
  projectId: string | null;
  type: SourceType;
  title: string;
  content: string;
  classification: DataClassification;
  createdAt: string;
}

export interface ContextItem {
  id: string;
  ownerId: string;
  kind: ContextKind;
  projectId: string | null;
  sourceId: string | null;
  title: string;
  content: string;
  tags: string[];
  classification: DataClassification;
  createdAt: string;
  updatedAt: string;
}

export interface SearchHit {
  item: ContextItem;
  score: number;
  matchedOn: string[];
}

export interface ExtractionResult {
  profileUpdates: Partial<
    Pick<
      Profile,
      | "role"
      | "expertise"
      | "communicationPreferences"
      | "recurringInstructions"
      | "displayName"
    >
  >;
  preferences: string[];
  decisions: string[];
  knowledge: Array<{ title: string; content: string; tags: string[] }>;
  notes: string[];
}

export interface PreviewPayload {
  destination: string;
  query: string | null;
  projectId: string | null;
  includeProfile: boolean;
  includePreferences: boolean;
  includeDecisions: boolean;
  includeSearchHits: boolean;
  fragments: Array<{
    kind: ContextKind | "profile" | "preference" | "decision";
    title: string;
    content: string;
    source: string;
    classification: DataClassification;
  }>;
  estimatedTokens: number;
  exportText: string;
  includesSensitive: boolean;
  requiresSensitiveAck: boolean;
}

export interface Integration {
  id: string;
  ownerId: string;
  name: string;
  provider: string;
  accessMode: IntegrationAccessMode;
  scopes: IntegrationScope[];
  /** null = all projects */
  allowedProjectIds: string[] | null;
  allowedClassifications: DataClassification[];
  tokenHint: string;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityEvent {
  id: string;
  kind: "share" | "import" | "integration" | "permission" | "system";
  summary: string;
  detail: string;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  action: AuditAction;
  actorType: "user" | "integration" | "system";
  actorId: string | null;
  ownerId: string | null;
  scope: string | null;
  memoryIds: string[];
  memoryCount: number;
  includedSensitive: boolean;
  destination: string | null;
  requestId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface CandidateMemory {
  id: string;
  ownerId: string;
  integrationId: string | null;
  kind: "knowledge" | "decision" | "preference" | "note";
  projectId: string | null;
  title: string;
  content: string;
  rationale: string;
  classification: DataClassification;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  resolvedAt: string | null;
}

/** ADR-004 control-plane readiness (safe for client imports). */
export type ControlPlaneNextStep =
  | "setup_account"
  | "complete_profile"
  | "create_project"
  | "connect_integration"
  | "ready";

export interface ControlPlaneStatus {
  setupRequired: boolean;
  authenticated: boolean;
  ownerId: string | null;
  displayName: string | null;
  steps: {
    account: boolean;
    profile: boolean;
    project: boolean;
    integration: boolean;
  };
  nextStep: ControlPlaneNextStep;
  stats: {
    projects: number;
    preferences: number;
    decisions: number;
    sources: number;
    contextItems: number;
    hasProfile: boolean;
  } | null;
}
