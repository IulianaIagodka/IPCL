/**
 * ADR-002 retrieval benchmark:
 * User has many memories; ask about Paypace pricing.
 * Expect monthly/yearly + AI usage; reject lifetime + unrelated projects.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { resetDbForTests } from "../src/db.js";
import { createContextStore } from "../src/store.js";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ipcl-bench-"));
process.env.IPCL_DATA_DIR = tempDir;
resetDbForTests(path.join(tempDir, "bench.sqlite"));

const store = createContextStore();
const paypace = store.createProject({ name: "Paypace" });
const other = store.createProject({ name: "Signoff" });

store.saveMemory({
  type: "profile",
  scope: "global",
  statement: "Technical Product Owner",
  importance: "high",
});

store.saveMemory({
  type: "preference",
  scope: "global",
  statement: "Avoid explaining basic software engineering concepts unless requested.",
});

// Noise memories
for (let i = 0; i < 40; i++) {
  store.saveMemory({
    type: "project_fact",
    scope: other.scope,
    statement: `Signoff note ${i}: unrelated workflow detail about approvals.`,
    importance: "low",
  });
  store.saveMemory({
    type: "project_fact",
    scope: paypace.scope,
    statement: `Paypace design preference ${i}: card density and spacing notes.`,
    importance: "low",
  });
}

store.saveMemory({
  type: "decision",
  scope: paypace.scope,
  statement: "Paypace uses lifetime pricing.",
  importance: "high",
  status: "superseded",
});

const monthly = store.saveMemory({
  type: "decision",
  scope: paypace.scope,
  statement: "Paypace offers monthly and yearly subscriptions.",
  importance: "high",
});

const aiUsage = store.saveMemory({
  type: "decision",
  scope: paypace.scope,
  statement: "AI receipt processing may have separate usage limits.",
  importance: "high",
});

store.saveMemory({
  type: "project_fact",
  scope: paypace.scope,
  statement: "Paypace is a personal budgeting product.",
});

store.saveMemory({
  type: "terminology",
  scope: paypace.scope,
  statement: "Pace means recommended daily spending, not account balance.",
});

store.saveMemory({
  type: "decision",
  scope: other.scope,
  statement: "Signoff uses seat-based pricing.",
  importance: "high",
});

const pack = store.assemble({
  query: "What pricing model did we choose for Paypace?",
  scope: paypace.scope,
  tokenBudget: 3000,
});

const text = pack.text.toLowerCase();
const selected = new Set(pack.selectedMemoryIds);

const expectPresent = [
  ["monthly/yearly decision", selected.has(monthly.id) || text.includes("monthly")],
  ["AI usage decision", selected.has(aiUsage.id) || text.includes("ai receipt")],
];

const expectAbsent = [
  ["lifetime pricing", text.includes("lifetime")],
  ["signoff pricing", text.includes("seat-based")],
];

let failed = 0;
console.log("ADR-002 retrieval benchmark\n");
console.log(pack.text);
console.log("---");
console.log(`tokens≈${pack.estimatedTokens} selected=${pack.selectedMemoryIds.length}`);

for (const [label, ok] of expectPresent) {
  console.log(`${ok ? "PASS" : "FAIL"} expected present: ${label}`);
  if (!ok) failed += 1;
}
for (const [label, bad] of expectAbsent) {
  console.log(`${!bad ? "PASS" : "FAIL"} expected absent: ${label}`);
  if (bad) failed += 1;
}

if (failed > 0) {
  console.error(`\nBenchmark failed with ${failed} check(s).`);
  process.exit(1);
}
console.log("\nBenchmark passed.");
