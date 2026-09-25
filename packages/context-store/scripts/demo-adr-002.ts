/**
 * Small end-to-end demo of ADR-002 layers.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { resetDbForTests } from "../db.js";
import { createContextStore } from "../store.js";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ipcl-demo-"));
process.env.IPCL_DATA_DIR = tempDir;
resetDbForTests(path.join(tempDir, "demo.sqlite"));

const store = createContextStore();
const project = store.createProject({
  name: "Paypace",
  description: "Personal budgeting product",
});

const imported = store.importSource({
  type: "conversation",
  title: "Paypace pricing discussion",
  scope: project.scope,
  content: [
    "We originally wanted a lifetime subscription, but we've decided to use monthly and yearly plans instead.",
    "Decision: Receipt scanning will use AI.",
    "Constraint: The MVP must work without requiring users to install a browser extension.",
    "Pace means available daily spending, not current account balance.",
    "Prefer concise answers with concrete examples.",
  ].join("\n"),
});

console.log("Source:", imported.source.id, imported.source.title);
console.log(
  "Created memories:",
  imported.created.map((m) => `${m.type}: ${m.statement}`)
);
console.log(
  "Pending conflicts:",
  imported.pendingConflicts.map(
    (c) => `${c.existing.statement} → ${c.candidate.statement}`
  )
);

// Explicit confirmation path for a supersession
const lifetime = store.saveMemory({
  type: "decision",
  scope: project.scope,
  statement: "Paypace uses lifetime pricing.",
  importance: "high",
  sourceIds: [imported.source.id],
});
store.supersedeMemory(lifetime.id, {
  statement: "Paypace uses monthly and yearly subscriptions.",
  sourceIds: [imported.source.id],
});

const pack = store.assemble({
  query: "Review the pricing architecture for Paypace.",
  scope: project.scope,
  tokenBudget: 1200,
});

console.log("\n" + pack.text);
console.log(`Ephemeral package tokens≈${pack.estimatedTokens}`);
console.log(`Data dir: ${tempDir}`);
