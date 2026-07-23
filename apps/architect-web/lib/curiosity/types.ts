export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type OpportunityStatus = 'candidate' | 'queued' | 'recommended' | 'accepted' | 'dismissed' | 'completed' | 'expired';

export interface Opportunity {
  id: string;
  workspaceId: string;
  projectId?: string | null;
  title: string;
  problemStatement: string;
  evidence: string[];
  sourceRefs: string[];
  impactScore: number;
  effortScore: number;
  urgencyScore: number;
  confidence: number;
  reversibility: boolean;
  riskLevel: RiskLevel;
  proposedNextAction?: string | null;
  status: OpportunityStatus;
  reviewAfter?: string | null;
  expiresAt?: string | null;
}

export interface Assumption {
  id: string;
  workspaceId: string;
  projectId?: string | null;
  statement: string;
  confidence: number;
  evidenceFor: string[];
  evidenceAgainst: string[];
  testMethod?: string | null;
  consequenceIfWrong?: string | null;
  status: 'open' | 'testing' | 'verified' | 'rejected' | 'expired';
  reviewAt?: string | null;
}

export interface OpportunityRanking {
  opportunity: Opportunity;
  score: number;
  reason: string;
}
