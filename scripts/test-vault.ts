/**
 * Unit tests for vault + search (ADR-001 MVP).
 * Run: npm test
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { resetDbForTests } from "../src/lib/db";
import {
  buildPreview,
  createDecision,
  createPreference,
  createProject,
  getProfile,
  importAndExtract,
  saveContext,
  searchContext,
  updateProfile,
} from "../src/lib/vault";
import { cosineSimilarity, semanticScore, tokenize } from "../src/lib/search";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "eidothea-test-"));
process.env.EIDOTHEA_DATA_DIR = tempDir;
resetDbForTests(path.join(tempDir, "test.sqlite"));

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
  assert.ok(preview.exportText.includes("Eidothea export"));
});
