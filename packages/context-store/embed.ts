/**
 * Local embedding index for MVP (ADR-002 Layer 3).
 * Embeddings are a retrieval index, not the source of truth.
 * Vectors can be regenerated when models change.
 */

const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "with",
  "as",
  "by",
  "from",
  "that",
  "this",
  "it",
  "its",
  "into",
  "about",
  "over",
  "after",
  "before",
  "between",
  "out",
  "up",
  "down",
  "if",
  "then",
  "so",
  "not",
  "no",
  "yes",
  "do",
  "does",
  "did",
  "can",
  "could",
  "should",
  "would",
  "will",
  "just",
  "than",
  "too",
  "very",
  "also",
  "my",
  "your",
  "our",
  "their",
  "me",
  "we",
  "you",
  "they",
  "i",
  "we",
  "has",
  "have",
  "had",
]);

function stem(token: string): string {
  if (token.length > 4 && token.endsWith("ies")) return `${token.slice(0, -3)}y`;
  if (token.length > 3 && token.endsWith("ses")) return token.slice(0, -2);
  if (token.length > 4 && token.endsWith("tions")) return token.slice(0, -1);
  if (token.length > 3 && token.endsWith("s") && !token.endsWith("ss")) {
    return token.slice(0, -1);
  }
  return token;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\-\s_/]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    .map(stem);
}

export type SparseEmbedding = Record<string, number>;

export function embed(text: string): SparseEmbedding {
  const tf = new Map<string, number>();
  const tokens = tokenize(text);
  for (const token of tokens) {
    tf.set(token, (tf.get(token) ?? 0) + 1);
  }
  const out: SparseEmbedding = {};
  const n = Math.max(1, tokens.length);
  for (const [term, count] of tf) {
    out[term] = count / n;
  }
  return out;
}

export function cosineSimilarity(
  a: SparseEmbedding,
  b: SparseEmbedding
): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (const value of Object.values(a)) magA += value * value;
  for (const value of Object.values(b)) magB += value * value;
  if (magA === 0 || magB === 0) return 0;
  for (const [term, value] of Object.entries(a)) {
    const other = b[term];
    if (other) dot += value * other;
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export function serializeEmbedding(embedding: SparseEmbedding): string {
  return JSON.stringify(embedding);
}

export function deserializeEmbedding(raw: string | null): SparseEmbedding {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as SparseEmbedding;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}
