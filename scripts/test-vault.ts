/**
 * Vault + ADR-003 security tests.
 * Run: npm test
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { resetDbForTests } from "../src/lib/db";
import { resetMasterKeyCache } from "../src/lib/crypto";
import { ensureTestOwner } from "../src/lib/auth";
import { createIntegration, resolveIntegrationToken } from "../src/lib/integrations";
import { PolicyDeniedError } from "../src/lib/policy";
import { runWithPrincipal, setFallbackOwnerId } from "../src/lib/request-context";
import {
  buildPreview,
  createDecision,
  createPreference,
  createProject,
  getProfile,
  importAndExtract,
  proposeCandidateMemory,
  resolveCandidateMemory,
  saveContext,
  searchContext,
  updateContextClassification,
  updateProfile,
} from "../src/lib/vault";
import { cosineSimilarity, semanticScore, tokenize } from "../src/lib/search";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ipcl-test-"));
process.env.IPCL_DATA_DIR = tempDir;
process.env.IPCL_MASTER_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
resetMasterKeyCache();
resetDbForTests(path.join(tempDir, "test.sqlite"));
const { user } = ensureTestOwner();
setFallbackOwnerId(user.id);

test("tokenize and semantic similarity rank related text higher", () => {
  assert.ok(tokenize("Avoid basic concepts").includes("avoid"));
  const related = semanticScore(
    "subscription billing",
    "Paypace uses monthly and yearly subscriptions for billing."
  );
  const unrelated = semanticScore(
    "subscription billing",
    "The office plants need water every Friday."
  );
  assert.ok(related > unrelated);
  assert.equal(
    cosineSimilarity(new Map([["a", 1]]), new Map([["b", 1]])),
    0
  );
});

test("profile, project, decisions and preferences form searchable vault", () => {
  updateProfile({
    displayName: "Iuliana",
    role: "Product engineer",
    expertise: ["TypeScript", "MCP"],
    communicationPreferences: "Be direct.",
    recurringInstructions:
      "Avoid explaining basic software engineering concepts unless asked.",
  });

  const profile = getProfile();
  assert.equal(profile.displayName, "Iuliana");
  assert.ok(profile.expertise.includes("MCP"));

  const project = createProject({
    name: "Paypace",
    description: "Subscription billing for SaaS",
    technologyStack: ["Next.js", "SQLite"],
    targetUsers: "Indie founders",
  });

  createDecision({
    projectId: project.id,
    content: "Paypace uses monthly and yearly subscriptions.",
  });
  createPreference("Prefer concise answers with concrete examples.");
  saveContext("MCP is the primary integration path for Cursor and Claude.", {
    projectId: project.id,
    title: "Integration",
    tags: ["mcp", "integration"],
  });

  const hits = searchContext("subscription decisions for Paypace", {
    projectId: project.id,
    limit: 5,
  });
  assert.ok(hits.length > 0);
  assert.ok(
    hits.some((h) => h.item.content.toLowerCase().includes("subscription"))
  );
});

test("import extracts reusable context entities", async () => {
  const result = await importAndExtract({
    content: [
      "I am a product engineer.",
      "Prefer concise answers.",
      "Decision: We will use SQLite for the local vault.",
      "Architecture uses Next.js and an MCP server.",
    ].join("\n"),
    type: "note",
    title: "Kickoff notes",
    useLlm: false,
  });

  assert.ok(result.source.id);
  assert.ok(
    result.created.preferences.length +
      result.created.decisions.length +
      result.created.items.length >
      0
  );
});

test("preview shows exactly which fragments would be shared", () => {
  const project = createProject({
    name: "Previewable",
    description: "For preview tests",
  });
  createDecision({
    projectId: project.id,
    content: "Keep vault local-first.",
  });

  const preview = buildPreview({
    destination: "Claude",
    projectId: project.id,
    query: "local vault",
    includeProfile: true,
    includePreferences: true,
    includeDecisions: true,
    includeSearchHits: true,
  });

  assert.equal(preview.destination, "Claude");
  assert.ok(preview.fragments.length > 0);
  assert.ok(preview.estimatedTokens > 0);
  assert.ok(preview.exportText.includes("Context Vault export"));
  assert.equal(preview.includesSensitive, false);
});

test("RESTRICTED memories are excluded from normal retrieval", () => {
  const item = saveContext("root password is hunter2-example", {
    title: "Secret note",
    tags: ["secret"],
    classification: "RESTRICTED",
  });
  assert.equal(item.classification, "RESTRICTED");

  const hits = searchContext("hunter2 password secret");
  assert.ok(!hits.some((h) => h.item.id === item.id));
});

test("SENSITIVE preview requires acknowledgment before export text", () => {
  const sensitive = saveContext("Salary band is confidential internal data.", {
    title: "Compensation",
    classification: "SENSITIVE",
  });
  assert.equal(sensitive.classification, "SENSITIVE");

  const blocked = buildPreview({
    destination: "ChatGPT",
    query: "salary compensation",
    includeProfile: false,
    includePreferences: false,
    includeDecisions: false,
    includeSearchHits: true,
    acknowledgeSensitive: false,
  });
  assert.equal(blocked.includesSensitive, true);
  assert.equal(blocked.requiresSensitiveAck, true);
  assert.ok(blocked.exportText.includes("Acknowledge sensitive"));

  const allowed = buildPreview({
    destination: "ChatGPT",
    query: "salary compensation",
    includeProfile: false,
    includePreferences: false,
    includeDecisions: false,
    includeSearchHits: true,
    acknowledgeSensitive: true,
  });
  assert.equal(allowed.requiresSensitiveAck, false);
  assert.ok(allowed.exportText.includes("Salary band"));
});

test("read-only integration cannot write; write integration creates candidates", () => {
  const project = createProject({ name: "Scoped App" });
  const readOnly = createIntegration({
    ownerId: user.id,
    name: "Claude Desktop",
    provider: "claude",
    accessMode: "READ_ONLY",
    allowedProjectIds: [project.id],
    allowedClassifications: ["NORMAL"],
  });

  const readPrincipal = resolveIntegrationToken(readOnly.token);
  assert.ok(readPrincipal);
  assert.equal(readPrincipal?.kind, "integration");

  assert.throws(
    () =>
      runWithPrincipal(readPrincipal!, () =>
        proposeCandidateMemory({
          kind: "knowledge",
          content: "should fail",
          projectId: project.id,
        })
      ),
    (err: unknown) => err instanceof PolicyDeniedError
  );

  const readWrite = createIntegration({
    ownerId: user.id,
    name: "Cursor",
    provider: "cursor",
    accessMode: "READ_WRITE",
    scopes: [
      "profile:read",
      "preferences:read",
      "projects:read",
      "decisions:read",
      "context:search",
      "context:write",
      "memory:create",
    ],
    allowedProjectIds: [project.id],
  });
  const writePrincipal = resolveIntegrationToken(readWrite.token)!;
  const candidate = runWithPrincipal(writePrincipal, () =>
    proposeCandidateMemory({
      kind: "decision",
      content: "Use Postgres later",
      projectId: project.id,
      rationale: "Scale",
    })
  );
  assert.equal(candidate.status, "pending");

  const approved = resolveCandidateMemory(candidate.id, "approved");
  assert.equal(approved?.status, "approved");
});

test("integration project scope cannot expand into other projects", () => {
  const allowed = createProject({ name: "Allowed" });
  const denied = createProject({ name: "Denied" });
  saveContext("Allowed project secret architecture", {
    projectId: allowed.id,
    title: "Allowed knowledge",
  });
  saveContext("Denied project payroll process", {
    projectId: denied.id,
    title: "Denied knowledge",
  });

  const { token } = createIntegration({
    ownerId: user.id,
    name: "Narrow Cursor",
    provider: "cursor",
    allowedProjectIds: [allowed.id],
  });
  const principal = resolveIntegrationToken(token)!;

  const hits = runWithPrincipal(principal, () =>
    searchContext("payroll architecture", { limit: 20 })
  );
  assert.ok(hits.every((h) => h.item.projectId === allowed.id || h.item.projectId == null));
  assert.ok(!hits.some((h) => h.item.projectId === denied.id));
});

test("classification update to RESTRICTED removes item from search", () => {
  const item = saveContext("temporary public note about roadmap", {
    title: "Roadmap",
  });
  assert.ok(searchContext("roadmap").some((h) => h.item.id === item.id));
  updateContextClassification(item.id, "RESTRICTED");
  assert.ok(!searchContext("roadmap").some((h) => h.item.id === item.id));
});

test("ADR-004 control plane status and MCP config builder", async () => {
  const { getControlPlaneStatus, buildMcpClientConfig } = await import(
    "../src/service"
  );
  const status = getControlPlaneStatus({
    kind: "user",
    userId: user.id,
    email: user.email,
    sessionId: "test-session",
  });
  assert.equal(status.authenticated, true);
  assert.equal(status.steps.account, true);
  assert.ok(status.steps.profile);
  assert.ok(status.steps.project);
  assert.ok(
    status.nextStep === "connect_integration" || status.nextStep === "ready"
  );

  const config = buildMcpClientConfig({
    token: "test-token-value",
    cwd: "/tmp/ipcl",
  });
  assert.equal(
    config.mcpServers["ipcl-context-vault"].env.IPCL_INTEGRATION_TOKEN,
    "test-token-value"
  );
  assert.equal(config.mcpServers["ipcl-context-vault"].cwd, "/tmp/ipcl");
});
