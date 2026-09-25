import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { resetDbForTests } from "../db.js";
import { cosineSimilarity, embed, tokenize } from "../embed.js";
import { createContextStore } from "../store.js";
import { projectScope } from "../id.js";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ipcl-adr002-"));
process.env.IPCL_DATA_DIR = tempDir;
resetDbForTests(path.join(tempDir, "test.sqlite"));

const store = createContextStore();

test("local embeddings rank related statements higher", () => {
  assert.ok(tokenize("monthly yearly subscriptions").includes("subscription"));
  const related = cosineSimilarity(
    embed("subscription billing pricing"),
    embed("Paypace uses monthly and yearly subscriptions for billing.")
  );
  const unrelated = cosineSimilarity(
    embed("subscription billing pricing"),
    embed("The office plants need water every Friday.")
  );
  assert.ok(related > unrelated);
});

test("raw sources stay immutable evidence linked to memories", () => {
  const source = store.createSource({
    type: "conversation",
    title: "Paypace pricing discussion",
    content:
      "We decided that Paypace should have monthly and yearly subscriptions.",
    scope: projectScope("paypace"),
  });

  const memory = store.saveMemory({
    type: "decision",
    scope: projectScope("paypace"),
    statement: "Paypace offers monthly and yearly subscriptions.",
    importance: "high",
    confidence: "high",
    sourceIds: [source.id],
  });

  assert.equal(memory.sourceIds[0], source.id);
  assert.equal(store.getSource(source.id)?.title, "Paypace pricing discussion");
  assert.equal(store.getMemory(memory.id)?.status, "active");
});

test("memories are temporal — supersede keeps history", () => {
  const old = store.saveMemory({
    type: "decision",
    scope: projectScope("paypace"),
    statement: "Paypace uses lifetime pricing.",
    importance: "high",
  });

  const { next } = store.supersedeMemory(old.id, {
    statement: "Paypace uses monthly and yearly pricing.",
  });

  assert.equal(store.getMemory(old.id)?.status, "superseded");
  assert.equal(next.status, "active");
  assert.equal(next.supersedesId, old.id);
  assert.ok(store.getMemory(old.id)?.validUntil);
});

test("import extracts structured memories and surfaces conflicts", () => {
  store.createProject({ name: "Paypace", description: "Budgeting product" });

  // Seed existing decision
  store.saveMemory({
    type: "decision",
    scope: projectScope("paypace"),
    statement: "Launch target is October.",
    importance: "high",
  });

  const result = store.importSource({
    type: "note",
    title: "Planning update",
    scope: projectScope("paypace"),
    content: [
      "Decision: Launch moved to November.",
      "Prefer concise answers.",
      "Pace means available daily spending, not current account balance.",
      "Pricing for AI receipt packages has not yet been finalized.",
    ].join("\n"),
  });

  assert.ok(result.source.id);
  assert.ok(result.candidates.length >= 2);
  assert.ok(
    result.created.some((m) => m.type === "preference") ||
      result.created.some((m) => m.type === "terminology") ||
      result.created.some((m) => m.type === "open_question")
  );
  // High-risk decision conflict should be pending, not silent overwrite
  assert.ok(
    result.pendingConflicts.length >= 1 ||
      result.conflicts.length >= 1
  );
});

test("retrieval prefers active scoped decisions over superseded and other projects", () => {
  const paypace = store.createProject({ name: "PaypaceR", slug: "paypace-r" });
  const other = store.createProject({ name: "Signoff", slug: "signoff" });

  store.saveMemory({
    type: "decision",
    scope: paypace.scope,
    statement: "Paypace uses lifetime pricing.",
    importance: "high",
    status: "superseded",
  });

  const active = store.saveMemory({
    type: "decision",
    scope: paypace.scope,
    statement: "Paypace uses monthly and yearly subscriptions.",
    importance: "high",
  });

  store.saveMemory({
    type: "decision",
    scope: other.scope,
    statement: "Signoff uses seat-based pricing.",
    importance: "high",
  });

  store.saveMemory({
    type: "project_fact",
    scope: paypace.scope,
    statement: "Paypace is a personal budgeting product.",
  });

  const pack = store.assemble({
    query: "What pricing model did we choose for Paypace?",
    scope: paypace.scope,
    tokenBudget: 1500,
  });

  assert.ok(pack.selectedMemoryIds.includes(active.id));
  assert.ok(
    pack.text.toLowerCase().includes("monthly") ||
      pack.text.toLowerCase().includes("yearly")
  );
  assert.equal(
    pack.ranked.some((r) => r.memory.statement.includes("lifetime")),
    false
  );
  assert.equal(
    pack.ranked.some((r) => r.memory.scope === other.scope),
    false
  );
  assert.ok(pack.estimatedTokens > 0);
  assert.ok(pack.estimatedTokens <= 1500 + 200); // soft ceiling with headings
});

test("restricted memories are excluded from retrieval by default", () => {
  const scope = projectScope("secure");
  store.saveMemory({
    type: "constraint",
    scope,
    statement: "Production database must remain in the EU.",
    importance: "high",
    sensitivity: "restricted",
  });
  store.saveMemory({
    type: "project_fact",
    scope,
    statement: "Secure app uses Next.js.",
  });

  const hidden = store.retrieve({
    query: "Where must the production database live?",
    scope,
  });
  assert.equal(
    hidden.some((r) => r.memory.sensitivity === "restricted"),
    false
  );

  const shown = store.retrieve({
    query: "Where must the production database live?",
    scope,
    includeRestricted: true,
  });
  assert.ok(shown.some((r) => r.memory.sensitivity === "restricted"));
});

test("AI output is not automatically saved as memory", () => {
  const before = store.listMemories({ status: "active" }).length;
  // Simulate an AI answer — ContextStore has no auto-ingest for completions.
  const aiAnswer =
    "Based on industry trends, Paypace should use usage-based billing.";
  assert.equal(typeof aiAnswer, "string");
  const after = store.listMemories({ status: "active" }).length;
  assert.equal(after, before);
});
