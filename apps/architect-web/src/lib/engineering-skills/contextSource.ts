export type DocumentationSource = {
  provider: "context7" | "primary_web" | "local_docs";
  library: string;
  version?: string;
  retrievedAt: string;
  reference: string;
  confidence: number;
};

export type DocumentationDecision = {
  acceptable: boolean;
  reason: string;
};

export function evaluateDocumentationSource(source: DocumentationSource): DocumentationDecision {
  if (source.confidence < 0.75) {
    return { acceptable: false, reason: "Documentation confidence is below the execution threshold." };
  }

  if (!source.reference.trim()) {
    return { acceptable: false, reason: "Documentation evidence requires a traceable reference." };
  }

  const ageMs = Date.now() - new Date(source.retrievedAt).getTime();
  const maxAgeMs = 1000 * 60 * 60 * 24 * 30;

  if (!Number.isFinite(ageMs) || ageMs < 0) {
    return { acceptable: false, reason: "Documentation retrieval timestamp is invalid." };
  }

  if (ageMs > maxAgeMs) {
    return { acceptable: false, reason: "Documentation evidence is stale and must be refreshed." };
  }

  return {
    acceptable: true,
    reason: source.provider === "context7"
      ? "Current Context7 documentation evidence is acceptable."
      : "Current primary documentation evidence is acceptable; Context7 was not used.",
  };
}
