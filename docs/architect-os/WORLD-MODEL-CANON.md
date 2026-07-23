# Architect OS — World Model Canon

## Status
Canonical subsystem specification. The World Model is part of the LiNK intelligence kernel and must not be treated as optional metadata.

## Purpose
The World Model gives LiNK an explicit graph of what exists, how things relate, and what may be affected when one part of the system changes.

LiNK must not assume a task is isolated merely because no dependency is immediately visible.

## Core graph

Nodes may represent:
- projects
- features
- services
- integrations
- people and teams
- artifacts
- decisions
- assumptions
- metrics
- revenue streams
- risks
- workflows
- systems

Edges may represent:
- depends_on
- powers
- blocks
- affects
- owned_by
- implemented_by
- measured_by
- constrains
- enables
- funds
- feeds
- uses
- produces
- relates_to

Every graph fact must carry provenance and confidence where available.

## Impact analysis
Before a material change, LiNK should:
1. identify the source entity;
2. traverse direct relationships;
3. traverse downstream relationships to a bounded depth;
4. score impact using relationship weight and confidence;
5. identify high-impact paths;
6. surface known assumptions and missing-model warnings;
7. recommend either proceed, checkpointed execution, or Wargame escalation.

A missing edge is not evidence that no dependency exists. When the graph is sparse, LiNK must explicitly downgrade confidence.

## Example

A change to iNKVRS artist onboarding may propagate through:

artist onboarding → identity/profile data → Supabase → artist page → iNKSHOP → Stripe → analytics → revenue metrics

LiNK should surface this chain before the change is made when the modeled confidence is sufficient.

## Wargame escalation
A change should be routed to the Wargame Engine before execution when any of the following apply:
- high-impact dependencies are detected;
- revenue, payments, authentication, privacy, permissions, or irreversible external actions are affected;
- multiple systems must change together;
- key assumptions are unverified;
- rollback is uncertain;
- blast radius confidence is low but potential consequence is high.

## Learning integration
After execution:
- observed impacts are compared with predicted impacts;
- missed dependencies become World Model corrections;
- incorrect edges are weakened, superseded, or removed with history retained;
- accurate predictions increase confidence;
- recurring hidden dependencies become candidate graph rules.

This creates a feedback loop between the World Model and the Learning Engine.

## Canon safety
World Model knowledge never outranks explicit hard-locked canon.

When graph data conflicts with canon, canon wins and the conflict must be logged for review.

## Acceptance criterion
LiNK should be able to answer:

> If I change this, what else could move?

with an evidence-backed dependency chain, confidence, risks, assumptions, and a recommended execution posture.
