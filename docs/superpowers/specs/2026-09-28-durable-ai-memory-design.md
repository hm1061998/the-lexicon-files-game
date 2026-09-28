# Durable AI Memory Design

## 1. Purpose

Create a compact, version-controlled project memory that lets a new AI session or a different coding agent continue work without relying on chat history. The memory must preserve the current phase, approved plan, progress, active decisions, blockers, verification evidence, and next action while keeping startup context small.

This design defines **Phase 0A — Durable AI Memory**. It must be completed and verified before producing the detailed implementation plan for Phase 0B.

## 2. Goals

- Make repository state, not chat history, the handoff source.
- Let an AI identify the current phase, active plan, status, and next action from one compact file.
- Keep the default memory read under 12 KB and approximately 2,500 tokens.
- Preserve historical states through Git history instead of accumulating session files.
- Require human confirmation before pushing analysis, brainstorming, specification, or planning work.
- Keep validation deterministic, offline, fast, and independent of any AI service.

## 3. Non-Goals

- Store full conversations, hidden reasoning, command logs, or diffs.
- Replace product documents, architecture documents, approved specifications, or implementation plans.
- Build a vector database, semantic search service, external memory server, or model-specific integration.
- Invoke an AI model as part of validation or smoke testing.
- Maintain separate handoff files for every session.

## 4. Repository Structure

```text
docs/ai/
├── README.md
└── MEMORY.md
```

### `docs/ai/README.md`

Static operating instructions for coding agents. It defines the startup sequence, update triggers, size rules, Git policy, reconciliation behavior, and validation commands. It should remain below 80 lines unless a future approved design changes that limit.

### `docs/ai/MEMORY.md`

The canonical current-state snapshot and latest handoff. It is overwritten as the project advances. Previous versions remain available through Git history.

The file must remain at or below 12 KB. It contains these sections in this order:

1. Metadata
2. Current Phase
3. Active Goal
4. Current Status
5. Completed
6. In Progress
7. Active Decisions
8. Blockers
9. Next Actions
10. Verification
11. Latest Handoff
12. Required Reading

## 5. Metadata Contract

`MEMORY.md` begins with YAML front matter:

```yaml
---
schema_version: 1
updated_at: 2026-09-28T00:00:00+07:00
phase: phase-0a
status: in_progress
result_commit: d095ecf
active_spec: docs/superpowers/specs/2026-09-28-durable-ai-memory-design.md
active_plan: none
---
```

Allowed status values are:

```text
not_started
proposed
approved
in_progress
blocked
verified
complete
```

`result_commit` points to the repository commit whose state the memory describes. A final memory commit normally follows the implementation/specification commit, avoiding self-reference.

`active_spec` and `active_plan` contain repository-relative paths or the literal value `none`.

## 6. Content Budget

- `Next Actions`: at most 5 items.
- `Active Decisions`: at most 10 items.
- `Verification`: only the latest relevant results, summarized as command plus outcome.
- `Completed`: milestones for the current phase only. Older phases collapse to one summary line with a commit reference.
- `Latest Handoff`: outcome, unfinished work, and the exact next action; no narrative transcript.
- `Required Reading`: only documents needed for the next action.
- Stable decisions move into their authoritative product, architecture, specification, or plan document. Memory retains only a short pointer while they remain relevant.

## 7. Session Lifecycle

### Start

For work that can affect code, plan, progress, or decisions, the agent must:

1. Read the applicable `AGENTS.md` files.
2. Read `docs/ai/README.md`.
3. Read `docs/ai/MEMORY.md`.
4. Read the active spec and plan linked by memory.
5. Inspect Git status, current branch, and recent commits.
6. Reconcile repository evidence with memory before acting.

The agent must prefer repository evidence when memory conflicts with Git, then repair memory before continuing. It must not reconstruct missing facts from chat assumptions.

### During Work

Memory requires an update when any of these change:

- current phase or active plan;
- task or phase status;
- approved scope or implementation direction;
- active technical or product decision;
- blocker;
- verification result;
- result commit;
- next action.

Sessions that make no change to code, plan, progress, decisions, or blockers do not require a memory update.

### End

The latest handoff records:

- session objective and outcome;
- material files changed;
- approved decisions and assumptions;
- verification commands and actual outcomes;
- unfinished work and blockers;
- exact next action;
- result commit and branch;
- required reading for the next agent.

An interrupted session must use `in_progress` or `blocked`; it must not report `complete`.

## 8. Git and Approval Policy

- Implementation already approved by the user: commit code and verification first, then commit the memory update referencing the result commit. Both may be pushed together when the implementation workflow authorizes push.
- Analysis, brainstorming, design specification, or implementation planning: a local commit may be created, but the agent must show the artifact to the user and receive explicit confirmation before push.
- A proposed plan uses status `proposed`. It changes to `approved` only after explicit user approval.
- Memory must not claim `verified` or `complete` without fresh verification evidence.
- Secrets, tokens, personal data, machine-specific credentials, and model-private reasoning must never enter memory.

## 9. Source-of-Truth Boundaries

```text
Product and technical docs
    ↓
Approved design spec
    ↓
Implementation plan for one phase
    ↓
Code and tests
    ↓
MEMORY.md current-state pointer and handoff
```

- `docs/01`–`06` and `docs/architecture/ARCHITECTURE.md` remain authoritative for product and technical rules.
- `docs/superpowers/specs/` stores approved designs.
- `docs/superpowers/plans/` stores detailed plans for one phase at a time.
- `MEMORY.md` points to the active artifacts and records execution state. It must not silently redefine them.
- Durable changes discovered during implementation must update the relevant authoritative document as well as memory.

## 10. Validator

Phase 0A adds a zero-dependency Node.js validator under `tools/ai-memory`. It must run through an npm script backed by an Nx target, following repository package-manager rules.

The validator checks:

- `MEMORY.md` is at most 12 KB;
- YAML metadata includes every required field;
- status is one of the allowed values;
- all required Markdown sections exist once and in the required order;
- `active_spec` and `active_plan` paths exist when not `none`;
- `result_commit` resolves in the local Git repository;
- no unresolved placeholder markers exist;
- `Next Actions` contains at most 5 list items;
- `Active Decisions` contains at most 10 list items.

Validation output is concise: a single success line, or actionable errors with field/section names. Validation performs no network calls and invokes no AI model.

## 11. Lightweight Test Strategy

Tests use the Node.js built-in `node:test` runner and small in-memory or temporary Markdown fixtures. No new testing dependency is added.

Unit tests cover:

- valid memory acceptance;
- missing required section;
- invalid status;
- size limit violation;
- excessive next actions or decisions;
- missing linked spec/plan;
- unresolved result commit;
- placeholder rejection.

The smoke test runs the validator against the real `docs/ai/MEMORY.md` and confirms that it returns the current phase, active plan, and next action. It does not launch another agent or run the application build.

Performance requirements:

- `memory:check` should complete in under 2 seconds on the project development machine.
- Routine sessions run only `memory:check`.
- The full validator unit suite runs when validator behavior or its fixtures change.
- Output stored in memory is summarized as `memory:check PASS` rather than copied verbatim.

## 12. Phase 0A Deliverables

- `docs/ai/README.md`.
- Initial `docs/ai/MEMORY.md`, reconstructed from repository state.
- Root and relevant agent instructions updated to require the memory startup/reconciliation flow.
- Zero-dependency validator and fixtures.
- Nx-backed `memory:check` command.
- Unit tests and deterministic smoke test.
- Documentation links from the repository README.

Phase 0A does not implement gameplay, UI, learning logic, content engines, persistence, or backend behavior.

## 13. Acceptance Criteria

Phase 0A is accepted when:

- a new agent can read `AGENTS.md`, `docs/ai/README.md`, and `MEMORY.md` and identify the current phase, active plan, status, blocker, and next action without chat history;
- memory remains within the 12 KB budget;
- stale or malformed memory produces actionable validator errors;
- valid memory passes the validator and smoke test without network or AI calls;
- validator tests finish within the lightweight runtime target;
- `npm run lint`, `npm run test`, and `npm run build` are executed and their real outcomes are recorded;
- planning/analysis artifacts are not pushed without explicit user confirmation;
- no later implementation phase is included in the Phase 0A plan.

## 14. Phase Boundary

After this design is approved, the next artifact is a detailed implementation plan for Phase 0A only. Phase 0B planning starts only after Phase 0A is implemented, verified, and reflected in memory.
