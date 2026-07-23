import type { LinkCommandRoute } from "./types";

export function routeLinkCommand(prompt: string): LinkCommandRoute {
  const normalized = prompt.trim();
  if (!normalized) return { kind: "greeting" };

  if (/^wargame\b/i.test(normalized) || /\bwargame\s+(this|it|that)\b/i.test(normalized)) {
    return { kind: "wargame", prompt: normalized.replace(/^wargame\s*/i, "").trim() };
  }

  if (/^(hello|hi|good\s+(morning|afternoon|evening))\b/i.test(normalized)) {
    return { kind: "greeting" };
  }

  if (normalized.length > 0) return { kind: "command", prompt: normalized };
  return { kind: "unknown", prompt: normalized };
}
