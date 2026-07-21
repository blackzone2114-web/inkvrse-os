import type { ImpactAnalysis, ImpactNode, WorldEntity, WorldRelation } from './types';

const IMPACTFUL_RELATIONS = new Set([
  'depends_on',
  'powers',
  'blocks',
  'affects',
  'constrains',
  'enables',
  'funds',
  'feeds',
  'uses',
  'produces',
]);

export function analyzeImpact(args: {
  sourceEntityId: string;
  proposedChange: string;
  entities: WorldEntity[];
  relations: WorldRelation[];
  maxDepth?: number;
}): ImpactAnalysis {
  const { sourceEntityId, proposedChange, entities, relations, maxDepth = 4 } = args;
  const entityById = new Map(entities.map((entity) => [entity.id, entity]));
  const outgoing = new Map<string, WorldRelation[]>();

  for (const relation of relations) {
    if (!IMPACTFUL_RELATIONS.has(relation.relationType)) continue;
    const current = outgoing.get(relation.fromEntityId) ?? [];
    current.push(relation);
    outgoing.set(relation.fromEntityId, current);
  }

  const directImpacts: ImpactNode[] = [];
  const downstreamImpacts: ImpactNode[] = [];
  const visited = new Set<string>([sourceEntityId]);
  const queue: Array<{ entityId: string; depth: number; inheritedScore: number }> = [
    { entityId: sourceEntityId, depth: 0, inheritedScore: 1 },
  ];

  while (queue.length) {
    const current = queue.shift()!;
    if (current.depth >= maxDepth) continue;

    for (const relation of outgoing.get(current.entityId) ?? []) {
      const target = entityById.get(relation.toEntityId);
      if (!target) continue;

      const score = Number((current.inheritedScore * relation.weight * relation.confidence * target.confidence).toFixed(3));
      const node: ImpactNode = {
        entityId: target.id,
        entityName: target.name,
        depth: current.depth + 1,
        score,
        viaRelation: relation.relationType,
      };

      if (node.depth === 1) directImpacts.push(node);
      else downstreamImpacts.push(node);

      if (!visited.has(target.id)) {
        visited.add(target.id);
        queue.push({ entityId: target.id, depth: node.depth, inheritedScore: score });
      }
    }
  }

  directImpacts.sort((a, b) => b.score - a.score);
  downstreamImpacts.sort((a, b) => b.score - a.score || a.depth - b.depth);

  const combined = [...directImpacts, ...downstreamImpacts];
  const highImpact = combined.filter((node) => node.score >= 0.65).length;
  const confidence = combined.length
    ? Math.max(0.1, Math.min(1, combined.reduce((sum, node) => sum + Math.min(1, node.score), 0) / combined.length))
    : 0.5;

  const recommendation = highImpact > 0
    ? `Wargame before execution: ${highImpact} high-impact downstream dependenc${highImpact === 1 ? 'y' : 'ies'} detected.`
    : combined.length > 0
      ? 'Proceed with verification checkpoints because downstream dependencies exist.'
      : 'No modeled downstream dependency was found. Treat this as incomplete evidence, not proof of isolation.';

  return {
    sourceEntityId,
    proposedChange,
    directImpacts,
    downstreamImpacts,
    risks: highImpact > 0 ? ['High-impact downstream dependency chain detected'] : [],
    assumptions: combined.length === 0 ? ['World Model may be incomplete for this entity'] : [],
    confidence: Number(confidence.toFixed(3)),
    recommendation,
  };
}
