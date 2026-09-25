import type { ExtractionResult } from "./types";

/**
 * Rule-based / AI-assisted extraction.
 * Uses heuristics by default; optionally calls an LLM when API keys exist.
 */
export async function extractContextFromText(
  content: string,
  options?: { title?: string; useLlm?: boolean }
): Promise<ExtractionResult> {
  const useLlm = options?.useLlm !== false;
  if (useLlm && (process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY)) {
    try {
      const llmResult = await extractWithLlm(content);
      if (llmResult) return llmResult;
    } catch {
      // Fall through to heuristics.
    }
  }
  return extractWithHeuristics(content, options?.title);
}

function extractWithHeuristics(
  content: string,
  title?: string
): ExtractionResult {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const preferences: string[] = [];
  const decisions: string[] = [];
  const knowledge: ExtractionResult["knowledge"] = [];
  const notes: string[] = [];
  const profileUpdates: ExtractionResult["profileUpdates"] = {};
  const expertise: string[] = [];

  const preferencePatterns =
    /^(prefer|always|never|avoid|don't|do not|please|when writing|communicate|be concise|use)/i;
  const decisionPatterns =
    /^(decided|decision|we (will|chose|chose to|use|using|adopted)|agreed|won't|will not|instead of)/i;
  const rolePatterns = /^(i am|i'm|role:|my role|i work as|i'm a|i am a)\b/i;
  const stackPatterns =
    /\b(typescript|javascript|python|react|next\.?js|node|rust|go|kotlin|swift|postgres|sqlite|aws|gcp|azure|docker|kubernetes)\b/gi;

  for (const line of lines) {
    if (rolePatterns.test(line)) {
      profileUpdates.role = line.replace(rolePatterns, "").replace(/^[:\s-]+/, "").trim() || line;
      continue;
    }
    if (/^(expertise|skills|experienced in|i know)\b/i.test(line)) {
      const parts = line
        .replace(/^(expertise|skills|experienced in|i know)[:\s-]*/i, "")
        .split(/,| and /)
        .map((p) => p.trim())
        .filter(Boolean);
      expertise.push(...parts);
      continue;
    }
    if (preferencePatterns.test(line) || /preference/i.test(line)) {
      preferences.push(cleanBullet(line));
      continue;
    }
    if (decisionPatterns.test(line) || /decision/i.test(line)) {
      decisions.push(cleanBullet(line));
      continue;
    }

    const stacks = line.match(stackPatterns);
    if (stacks) {
      expertise.push(...stacks.map((s) => s.toLowerCase()));
    }

    if (line.length > 40) {
      notes.push(line);
    }
  }

  if (expertise.length) {
    profileUpdates.expertise = [...new Set(expertise)];
  }

  // Chunk remaining prose into knowledge fragments.
  const paragraphs = content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 60);

  for (const paragraph of paragraphs.slice(0, 8)) {
    if (
      preferences.some((p) => paragraph.includes(p)) ||
      decisions.some((d) => paragraph.includes(d))
    ) {
      continue;
    }
    const firstLine = paragraph.split("\n")[0].slice(0, 80);
    knowledge.push({
      title: title || firstLine,
      content: paragraph,
      tags: inferTags(paragraph),
    });
  }

  if (!knowledge.length && content.trim()) {
    knowledge.push({
      title: title || "Imported note",
      content: content.trim(),
      tags: inferTags(content),
    });
  }

  return {
    profileUpdates,
    preferences: [...new Set(preferences)],
    decisions: [...new Set(decisions)],
    knowledge,
    notes: notes.slice(0, 10),
  };
}

function cleanBullet(line: string): string {
  return line.replace(/^[-*•\d.)\s]+/, "").trim();
}

function inferTags(text: string): string[] {
  const tags: string[] = [];
  const lower = text.toLowerCase();
  if (/\b(api|mcp|endpoint)\b/.test(lower)) tags.push("api");
  if (/\b(privacy|security|credential)\b/.test(lower)) tags.push("privacy");
  if (/\b(billing|subscription|pricing)\b/.test(lower)) tags.push("billing");
  if (/\b(architecture|stack|frontend|backend)\b/.test(lower)) tags.push("architecture");
  if (/\b(preference|tone|style)\b/.test(lower)) tags.push("style");
  return tags;
}

async function extractWithLlm(content: string): Promise<ExtractionResult | null> {
  const system = `Extract reusable AI context from the user's text.
Return ONLY valid JSON with this shape:
{
  "profileUpdates": { "displayName"?: string, "role"?: string, "expertise"?: string[], "communicationPreferences"?: string, "recurringInstructions"?: string },
  "preferences": string[],
  "decisions": string[],
  "knowledge": [{ "title": string, "content": string, "tags": string[] }],
  "notes": string[]
}
Only include durable context, not ephemeral chat fluff.`;

  if (process.env.OPENAI_API_KEY) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: content.slice(0, 12000) },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) return null;
    return normalizeExtraction(JSON.parse(text));
  }

  if (process.env.ANTHROPIC_API_KEY) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest",
        max_tokens: 2000,
        temperature: 0.2,
        system,
        messages: [{ role: "user", content: content.slice(0, 12000) }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data.content?.find((c: { type: string }) => c.type === "text")?.text;
    if (!text) return null;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return normalizeExtraction(JSON.parse(jsonMatch[0]));
  }

  return null;
}

function normalizeExtraction(raw: Partial<ExtractionResult>): ExtractionResult {
  return {
    profileUpdates: raw.profileUpdates ?? {},
    preferences: Array.isArray(raw.preferences) ? raw.preferences.map(String) : [],
    decisions: Array.isArray(raw.decisions) ? raw.decisions.map(String) : [],
    knowledge: Array.isArray(raw.knowledge)
      ? raw.knowledge.map((k) => ({
          title: String(k.title || "Knowledge"),
          content: String(k.content || ""),
          tags: Array.isArray(k.tags) ? k.tags.map(String) : [],
        }))
      : [],
    notes: Array.isArray(raw.notes) ? raw.notes.map(String) : [],
  };
}
