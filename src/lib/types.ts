export type SourceType = "conversation" | "document" | "note" | "readme";

export type ContextKind =
  | "profile"
  | "project"
  | "decision"
  | "preference"
  | "knowledge"
  | "note";

export interface Profile {
  id: string;
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
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Decision {
  id: string;
  projectId: string | null;
  content: string;
  rationale: string;
  createdAt: string;
  updatedAt: string;
}

export interface Source {
  id: string;
  projectId: string | null;
  type: SourceType;
  title: string;
  content: string;
  createdAt: string;
}

export interface ContextItem {
  id: string;
  kind: ContextKind;
  projectId: string | null;
  sourceId: string | null;
  title: string;
  content: string;
  tags: string[];
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
  }>;
  estimatedTokens: number;
  exportText: string;
}
