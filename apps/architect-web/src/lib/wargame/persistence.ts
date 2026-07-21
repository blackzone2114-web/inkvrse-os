import type { SupabaseClient } from "@supabase/supabase-js";
import type { WargameResult } from "./types";

export type PersistWargameArgs = {
  supabase: SupabaseClient;
  workspaceId: string;
  projectId?: string | null;
  userId: string;
  result: WargameResult;
};

export async function persistWargameRun({
  supabase,
  workspaceId,
  projectId = null,
  userId,
  result,
}: PersistWargameArgs): Promise<string> {
  const { input, recommendation, reviewRequired, scenarios } = result;

  const { data: run, error: runError } = await supabase
    .from("wargame_runs")
    .insert({
      workspace_id: workspaceId,
      project_id: projectId,
      created_by: userId,
      objective: input.objective,
      decision: input.decision,
      constraints: input.constraints,
      assumptions: input.assumptions,
      affected_node_ids: input.affectedNodeIds,
      rollback_available: input.rollbackAvailable,
      financial_impact: input.financialImpact,
      privacy_impact: input.privacyImpact,
      auth_impact: input.authImpact,
      operational_impact: input.operationalImpact,
      confidence: input.confidence,
      recommendation_action: recommendation.action,
      recommendation_confidence: recommendation.confidence,
      recommendation_rationale: recommendation.rationale,
      required_controls: recommendation.requiredControls,
      stop_conditions: recommendation.stopConditions,
      review_required: reviewRequired,
    })
    .select("id")
    .single();

  if (runError || !run) {
    throw new Error(`Failed to persist wargame run: ${runError?.message ?? "unknown error"}`);
  }

  if (scenarios.length > 0) {
    const { error: scenarioError } = await supabase.from("wargame_scenarios").insert(
      scenarios.map((scenario) => ({
        wargame_run_id: run.id,
        scenario_key: scenario.id,
        kind: scenario.kind,
        title: scenario.title,
        narrative: scenario.narrative,
        probability: scenario.probability,
        impact: scenario.impact,
        reversibility: scenario.reversibility,
        assumptions: scenario.assumptions,
        affected_node_ids: scenario.affectedNodeIds,
        leading_indicators: scenario.leadingIndicators,
        mitigations: scenario.mitigations,
      })),
    );

    if (scenarioError) {
      throw new Error(`Failed to persist wargame scenarios: ${scenarioError.message}`);
    }
  }

  return run.id as string;
}

export async function recordWargameDecision(args: {
  supabase: SupabaseClient;
  runId: string;
  userId: string;
  chosenAction: string;
}) {
  const { error } = await args.supabase
    .from("wargame_runs")
    .update({
      chosen_action: args.chosenAction,
      chosen_by: args.userId,
      chosen_at: new Date().toISOString(),
    })
    .eq("id", args.runId);

  if (error) {
    throw new Error(`Failed to record wargame decision: ${error.message}`);
  }
}

export async function recordWargameOutcome(args: {
  supabase: SupabaseClient;
  runId: string;
  userId: string;
  observedSummary: string;
  closestScenarioKey?: string | null;
  successScore: number;
  rollbackUsed: boolean;
  rollbackSuccessful?: boolean | null;
  predictedImpacts: string[];
  observedImpacts: string[];
  missedDependencies: string[];
  falseAssumptions: string[];
  predictionAccuracy: number;
  notes?: string | null;
}) {
  const { error } = await args.supabase.from("wargame_outcomes").insert({
    wargame_run_id: args.runId,
    recorded_by: args.userId,
    observed_summary: args.observedSummary,
    closest_scenario_key: args.closestScenarioKey ?? null,
    success_score: args.successScore,
    rollback_used: args.rollbackUsed,
    rollback_successful: args.rollbackSuccessful ?? null,
    predicted_impacts: args.predictedImpacts,
    observed_impacts: args.observedImpacts,
    missed_dependencies: args.missedDependencies,
    false_assumptions: args.falseAssumptions,
    prediction_accuracy: args.predictionAccuracy,
    notes: args.notes ?? null,
  });

  if (error) {
    throw new Error(`Failed to record wargame outcome: ${error.message}`);
  }
}
