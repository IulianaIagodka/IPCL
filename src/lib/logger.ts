/**
 * Sanitized application logging (ADR-003).
 * Never log raw prompts, tokens, secrets, or full documents.
 */

const SENSITIVE_KEY =
  /(password|token|secret|authorization|api[_-]?key|refresh|cookie|content|prompt|document)/i;

export function sanitizeForLog(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[truncated]";
  if (value == null) return value;
  if (typeof value === "string") {
    if (value.length > 120) return `${value.slice(0, 40)}…[${value.length} chars]`;
    return value;
  }
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return { count: value.length };
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEY.test(k)) {
      out[k] = "[redacted]";
    } else {
      out[k] = sanitizeForLog(v, depth + 1);
    }
  }
  return out;
}

export function logInfo(message: string, meta?: Record<string, unknown>) {
  if (meta) {
    console.info(message, sanitizeForLog(meta));
  } else {
    console.info(message);
  }
}

export function logError(message: string, meta?: Record<string, unknown>) {
  if (meta) {
    console.error(message, sanitizeForLog(meta));
  } else {
    console.error(message);
  }
}
