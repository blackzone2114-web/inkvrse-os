export type WorldEntityType =
  | 'project'
  | 'feature'
  | 'service'
  | 'integration'
  | 'person'
  | 'team'
  | 'artifact'
  | 'decision'
  | 'assumption'
  | 'metric'
  | 'revenue_stream'
  | 'risk'
  | 'workflow'
  | 'system';

export type WorldRelationType =
  | 'depends_on'
  | 'powers'
  | 'blocks'
  | 'affects'
  | 'owned_by'
  | 'implemented_by'
  | 'measured_by'
  | 'constrains'
  | 'enables'
  | 'funds'
  | 'feeds'
  | 'uses'
  | 'produces'
  | 'relates_to';

export interface WorldEntity {
  id: string;
  workspaceId: string;
  projectId?: string | null;
  entityType: WorldEntityType;
  name: string;
  slug: string;
  description?: string | null;
  state: Record<string, unknown>;
  confidence: number;
  sourceRef?: string | null;
}

export interface WorldRelation {
  id: string;
  workspaceId: string;
  fromEntityId: string;
  toEntityId: string;
  relationType: WorldRelationType;
  weight: number;
  confidence: number;
  rationale?: string | null;
  sourceRef?: string | null;
}

export interface ImpactNode {
  entityId: string;
  entityName: string;
  depth: number;
  score: number;
  viaRelation: WorldRelationType;
}

export interface ImpactAnalysis {
  sourceEntityId: string;
  proposedChange: string;
  directImpacts: ImpactNode[];
  downstreamImpacts: ImpactNode[];
  risks: string[];
  assumptions: string[];
  confidence: number;
  recommendation: string;
}
