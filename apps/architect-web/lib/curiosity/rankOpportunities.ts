import type { Opportunity, OpportunityRanking } from './types';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function scoreOpportunity(opportunity: Opportunity): number {
  const impact = clamp(opportunity.impactScore, 0, 100);
  const effort = Math.max(clamp(opportunity.effortScore, 0, 100), 10);
  const urgency = clamp(opportunity.urgencyScore, 0, 100);
  const confidence = clamp(opportunity.confidence, 0, 1);
  const reversibilityFactor = opportunity.reversibility ? 1.1 : 0.85;
  const riskPenalty = opportunity.riskLevel === 'critical' ? 0.55 : opportunity.riskLevel === 'high' ? 0.75 : 1;

  return (impact * confidence * urgency * reversibilityFactor * riskPenalty) / effort;
}

export function rankOpportunities(opportunities: Opportunity[], availableMinutes?: number): OpportunityRanking[] {
  return opportunities
    .filter((item) => item.status === 'queued' || item.status === 'recommended' || item.status === 'candidate')
    .map((opportunity) => {
      const score = scoreOpportunity(opportunity);
      const feasible = availableMinutes == null || opportunity.effortScore <= availableMinutes;
      return {
        opportunity,
        score: feasible ? score : score * 0.35,
        reason: feasible
          ? `High-value candidate based on impact ${opportunity.impactScore}, confidence ${Math.round(opportunity.confidence * 100)}%, urgency ${opportunity.urgencyScore}, and effort ${opportunity.effortScore}.`
          : `Potentially valuable, but likely exceeds the available time window.`,
      };
    })
    .sort((a, b) => b.score - a.score);
}
