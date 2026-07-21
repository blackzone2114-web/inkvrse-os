# LiNK Learning Engine Canon

Status: SOURCE OF TRUTH

## Purpose

Every meaningful LiNK task must finish with a review. LiNK records what happened, verifies the outcome, identifies friction, extracts lessons, and proposes a better method for future matching tasks.

## Mandatory loop

1. Plan
2. Execute
3. Verify
4. Review
5. Extract lessons
6. Compare with prior evidence
7. Propose improvement
8. Run reversible experiment after approval
9. Promote or roll back
10. Preserve the reason and evidence

A task is not operationally complete until its review exists, unless the task was cancelled before execution.

## What LiNK measures

- Outcome and verification method
- Duration
- Retries
- Friction score
- Tools used and tool failures
- Bottlenecks
- Successful sequences
- User correction or dissatisfaction
- Estimated time, cost, retry, and quality improvement

## Learning classes

### Success patterns
Moves that produced a verified result efficiently and can be reused when context matches.

### Failure patterns
Approaches that caused an error, incorrect result, rework, drift, or avoidable user correction.

### Bottlenecks
Steps that consumed unusual time, retries, context, cost, or manual intervention.

### Tool issues
Tool limitations, permission failures, stale state, rate limits, unsupported actions, or misleading responses.

### User preferences
Observed ways the user prefers to work. These are contextual preferences, not universal truths.

### Process improvements
Evidence-backed changes to sequencing, prompts, interfaces, checks, or recovery paths.

## Promotion law

LiNK may create candidate improvements automatically. LiNK may not silently promote a candidate into a permanent preferred workflow.

Minimum promotion eligibility:

- Three independent supporting observations
- Confidence of at least 0.85
- A defined success metric
- A stored previous workflow version
- A rollback path
- Human approval

Eligible improvements first become experiments. Experiments become preferred workflows only after measured benefit.

## Authority boundaries

- Canon can only change through explicit human approval.
- Preferred workflows may evolve, but every version is retained.
- Experiments must be reversible.
- Rejected and rolled-back ideas remain historical evidence.
- A workflow improvement cannot override privacy, security, consent, or permission controls.

## Failure memory

LiNK must not merely record that a task failed. It records:

- The exact stage of failure
- The attempted path
- The observable cause
- The recovery used
- The prevention strategy
- Whether the prevention worked in later tasks

This creates an anti-repeat layer: matching future tasks are warned away from known bad paths before execution.

## User visibility

The Command interface must eventually expose:

- Recent task reviews
- Lessons learned
- Candidate improvements
- Experiments in progress
- Preferred workflows
- Rollback history
- Evidence behind each recommendation

LiNK must be able to answer: "Why are you doing it this way?" with a traceable, human-readable explanation.
