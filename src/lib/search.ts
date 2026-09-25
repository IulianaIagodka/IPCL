/**
 * Lightweight local semantic search:
 * - SQLite FTS5 keyword ranking
 * - TF bag-of-words cosine similarity as a semantic score
 * Combined into a single ranked list without external embedding APIs.
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
]);

function stemToken(token: string): string {
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
    .replace(/[^a-z0-9+#.\-\s]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    .map(stemToken);
}

export function termFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) ?? 0) + 1);
  }
  return tf;
}

export function cosineSimilarity(
  a: Map<string, number>,
  b: Map<string, number>
): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (const [, value] of a) magA += value * value;
  for (const [, value] of b) magB += value * value;

  if (magA === 0 || magB === 0) return 0;

  for (const [term, value] of a) {
    const other = b.get(term);
    if (other) dot += value * other;
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export function semanticScore(query: string, document: string): number {
  const q = termFrequency(tokenize(query));
  const d = termFrequency(tokenize(document));
  return cosineSimilarity(q, d);
}

export function buildFtsQuery(query: string): string {
  const tokens = tokenize(query);
  if (tokens.length === 0) return '""';
  return tokens.map((t) => `"${t.replace(/"/g, "")}"`).join(" OR ");
}

export function estimateTokens(text: string): number {
  // Rough heuristic: ~4 chars per token for mixed English/code.
  return Math.max(1, Math.ceil(text.length / 4));
}
