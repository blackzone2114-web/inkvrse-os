export type DesignGuardrailInput = {
  target: "architect_os" | "external_project";
  existingDesignSystemDetected: boolean;
  requestedRedesign: boolean;
  usesCanonicalLinkAsset: boolean;
  introducesUnapprovedPalette: boolean;
  introducesGenericDashboardPattern: boolean;
};

export type DesignGuardrailResult = {
  allowed: boolean;
  violations: string[];
};

export function enforceDesignGuardrail(input: DesignGuardrailInput): DesignGuardrailResult {
  const violations: string[] = [];

  if (input.target === "architect_os") {
    if (!input.usesCanonicalLinkAsset) {
      violations.push("Architect OS must use the approved canonical LiNK asset unchanged.");
    }

    if (input.introducesUnapprovedPalette) {
      violations.push("Architect OS palette is locked to the existing black-and-gold canon.");
    }
  }

  if (input.target === "external_project" && input.existingDesignSystemDetected && !input.requestedRedesign) {
    if (input.introducesUnapprovedPalette) {
      violations.push("Preserve the detected project design system unless a redesign is explicitly requested.");
    }
  }

  if (input.introducesGenericDashboardPattern) {
    violations.push("Reject generic dashboard composition when it weakens the established visual hierarchy.");
  }

  return {
    allowed: violations.length === 0,
    violations,
  };
}
