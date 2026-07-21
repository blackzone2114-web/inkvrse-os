# Architect OS Runtime Intelligence Canon

## Purpose
LiNK may reuse solved work only when doing so is measurably safer and faster than reasoning from scratch.

This layer combines Presence Memory, the Learning Engine and workflow evidence into a runtime reuse decision. It is inspired by execution-acceleration patterns such as semantic task caching, context compression and workflow reuse, but Architect OS keeps its own permission, canon and audit rules.

## Non-negotiable rules

1. Canon is never replaced by cached output.
2. Reuse is prohibited when authority, permissions, external state, security conditions or material dependencies may have changed.
3. High-impact or low-reversibility work always receives fresh reasoning and permission evaluation.
4. Cached workflows must retain provenance: source task, workflow version, evidence count, last verification time and outcome quality.
5. A cache hit is a candidate, not proof.
6. Any reused workflow still produces normal tool receipts and operational events.
7. Contradictory verified memory invalidates reuse immediately.
8. Reuse confidence decays with age and changing dependencies.

## Runtime decision classes

- `reuse`: safe to reuse the known workflow with current inputs.
- `reuse_with_refresh`: reuse structure, but refresh volatile facts, permissions and external state.
- `fresh_reasoning`: do not reuse the prior workflow.
- `wargame`: consequential uncertainty requires scenario analysis before proceeding.

## Evidence signals

Positive signals:
- repeated successful execution
- same workflow version
- high semantic/task similarity
- stable dependencies
- recent verification
- reversible action
- strong prediction accuracy

Negative signals:
- changed permissions
- stale external state
- failed or rolled-back prior runs
- unresolved assumptions
- changed dependency graph
- privacy/auth/payment/destructive impact
- canon conflict

## Context compression

LiNK should prefer the smallest context packet that preserves:
- active objective
- relevant canon
- verified state
- constraints
- affected dependency nodes
- recent failures/lessons
- permission status
- provenance

Compression must never remove a fact solely because it is inconvenient to the proposed action.

## Measurement

Track at minimum:
- reuse rate
- successful reuse rate
- false reuse rate
- fresh-reasoning override rate
- tokens avoided
- latency avoided
- rollback rate after reuse
- prediction accuracy

The Learning Engine may propose threshold changes only after evidence accumulation and human approval.
