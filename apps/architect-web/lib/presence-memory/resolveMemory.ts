import {
  MEMORY_AUTHORITY_RANK,
  type PresenceMemoryRecord,
} from "./types";

export function resolveCurrentMemory(
  records: PresenceMemoryRecord[],
  now = new Date(),
): PresenceMemoryRecord[] {
  const active = records.filter((record) => {
    if (record.status !== "active") return false;
    if (!record.validUntil) return true;
    return new Date(record.validUntil).getTime() > now.getTime();
  });

  const resolved = new Map<string, PresenceMemoryRecord>();

  for (const candidate of active) {
    const key = `${candidate.workspaceId}:${candidate.subject}:${candidate.predicate}`;
    const current = resolved.get(key);

    if (!current || compareMemory(candidate, current) > 0) {
      resolved.set(key, candidate);
    }
  }

  return [...resolved.values()];
}

function compareMemory(
  left: PresenceMemoryRecord,
  right: PresenceMemoryRecord,
): number {
  const authorityDelta =
    MEMORY_AUTHORITY_RANK[left.authority] -
    MEMORY_AUTHORITY_RANK[right.authority];

  if (authorityDelta !== 0) return authorityDelta;

  const confidenceDelta = left.confidence - right.confidence;
  if (confidenceDelta !== 0) return confidenceDelta;

  return (
    new Date(left.updatedAt).getTime() -
    new Date(right.updatedAt).getTime()
  );
}
