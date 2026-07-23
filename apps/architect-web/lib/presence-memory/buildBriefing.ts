import type { CommandBriefing, OperationalEvent } from "./types";

const severityRank: Record<OperationalEvent["severity"], number> = {
  critical: 4,
  warning: 3,
  attention: 2,
  info: 1,
};

export function buildCommandBriefing(input: {
  greeting: string;
  events: OperationalEvent[];
  blockedProjects: CommandBriefing["blockedProjects"];
  generatedAt?: Date;
}): CommandBriefing {
  const unresolved = input.events
    .filter((event) => !event.resolvedAt)
    .sort((left, right) => {
      const severityDelta = severityRank[right.severity] - severityRank[left.severity];
      if (severityDelta !== 0) return severityDelta;
      return new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime();
    });

  const approvals = unresolved.filter((event) => event.requiresApproval);
  const changes = unresolved.filter((event) => !event.requiresApproval).slice(0, 5);
  const priority = unresolved[0] ?? null;

  const nextAction = approvals[0]?.title
    ?? input.blockedProjects[0]?.blockedReason
    ?? priority?.title
    ?? "No urgent action. Continue the active project.";

  return {
    greeting: input.greeting,
    priority,
    approvals,
    changes,
    blockedProjects: input.blockedProjects,
    nextAction,
    generatedAt: (input.generatedAt ?? new Date()).toISOString(),
  };
}
