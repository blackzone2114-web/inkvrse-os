export type MemoryAuthority = "canon" | "verified" | "inferred" | "suggested";
export type MemoryStatus = "active" | "superseded" | "archived" | "deleted";
export type EventSeverity = "info" | "attention" | "warning" | "critical";

export interface PresenceMemoryRecord {
  id: string;
  workspaceId: string;
  projectId?: string | null;
  subject: string;
  predicate: string;
  objectText: string;
  authority: MemoryAuthority;
  status: MemoryStatus;
  confidence: number;
  sourceType: string;
  sourceRef?: string | null;
  validFrom: string;
  validUntil?: string | null;
  updatedAt: string;
}

export interface OperationalEvent {
  id: string;
  workspaceId: string;
  projectId?: string | null;
  eventType: string;
  title: string;
  summary?: string | null;
  severity: EventSeverity;
  requiresApproval: boolean;
  resolvedAt?: string | null;
  sourceTool?: string | null;
  occurredAt: string;
}

export interface CommandBriefing {
  greeting: string;
  priority: OperationalEvent | null;
  approvals: OperationalEvent[];
  changes: OperationalEvent[];
  blockedProjects: Array<{
    id: string;
    name: string;
    blockedReason: string;
  }>;
  nextAction: string;
  generatedAt: string;
}

export const MEMORY_AUTHORITY_RANK: Record<MemoryAuthority, number> = {
  canon: 4,
  verified: 3,
  inferred: 2,
  suggested: 1,
};
