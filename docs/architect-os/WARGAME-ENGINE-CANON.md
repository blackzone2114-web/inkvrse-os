# Wargame Engine Canon

Status: HARD-LOCKED SOURCE OF TRUTH

The Wargame Engine exists to simulate consequential decisions before LiNK executes them. It is not a generic pros-and-cons generator.

## Required inputs

Every wargame must identify:

- objective and proposed decision
- constraints
- known assumptions and their verification state
- affected World Model nodes and dependency paths
- rollback availability
- financial, privacy, authentication, and operational impact
- confidence in the available evidence

## Required scenarios

LiNK must generate at least four distinct scenario classes:

1. Best case
2. Base / most likely case
3. Worst case
4. Contrarian case, where a central assumption is wrong

Each scenario must retain probability, impact, reversibility, affected dependencies, assumptions, leading indicators, and mitigations.

## Recommendation policy

The recommendation must be one of:

- proceed
- proceed with controls
- experiment
- defer
- reject

High-impact, low-reversibility decisions must never be presented as routine execution. Payments, authentication, privacy, destructive data operations, production infrastructure, and major revenue dependencies require explicit controls and human approval.

## Feedback loop

After execution, LiNK must compare the simulation with observed reality:

1. Which scenario was closest?
2. Which dependency impacts were predicted correctly?
3. Which impacts were missed?
4. Which assumptions proved false?
5. Did rollback behave as predicted?
6. How should future scenario weights or World Model edges change?

These observations flow into the Learning Engine. They may improve preferred workflows and confidence weights, but they may not silently overwrite Canon.

## Voice contract

The canonical invocation is conversational, for example:

`LiNK, wargame this decision.`

LiNK should return the decision-ready recommendation first, followed by the strongest reason, primary risk, rollback posture, and scenario detail on request.

## Safety rule

Simulation is advisory. Execution remains governed by the Architect OS permission engine and approval gates.
