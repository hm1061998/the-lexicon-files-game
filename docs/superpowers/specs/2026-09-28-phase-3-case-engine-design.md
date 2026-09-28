# Phase 3 — Case Engine Design

Status: approach approved by the user on 2026-09-28; awaiting spec review. Implements roadmap `docs/04_CODEX_IMPLEMENTATION_ROADMAP.md` §22. Architectural boundaries follow `docs/architecture/ARCHITECTURE.md` §§1–4 and root `AGENTS.md`.

## 1. Goal and acceptance

Build the content-driven foundation for Case #001 and a framework-free case engine that can initialize case state, activate and complete objectives, evaluate conditions, and unlock facts. Case data must remain outside React and Phaser.

Acceptance:

- `game-content` loads and validates a complete case definition from registered JSON files, including references between case, scene, evidence, fact, and objective records.
- `game-core` receives the validated definition as an argument and produces state transitions and domain events without importing content JSON or UI/runtime frameworks.
- Objective state and facts exposed to the HUD come from the game state/reducer path rather than being duplicated as initial-only React store values.
- Unit tests cover valid and invalid content, condition evaluation, objective transitions, fact unlocking, and framework-free imports.
- Case #001 content stays deliberately small: its current initial objective plus one representative evidence/fact pair and the existing Main Office scene reference. This is contract/test content, not the complete vertical-slice content set.

## 2. Package boundaries

Use the existing dependency direction:

```text
shared-types  ←  game-content (Zod + JSON)
      ↑                 
  game-core              
      ↑                  
 apps/game-web (bridge/store/HUD)
```

- `packages/shared-types` owns framework-free contracts for case, evidence, fact, objective, condition, effect, game state, and domain events.
- `packages/game-content` owns Zod schemas, cross-file/reference validation, the registered Case #001 JSON, and a loader that assembles a `CaseDefinition`.
- `packages/game-core` owns pure condition evaluation and state transitions. It accepts `CaseDefinition`; it does not import `game-content`, JSON, React, Phaser, Zustand, DOM, or IndexedDB.
- `apps/game-web` handles `interaction:triggered`, invokes the core transition path, and mirrors the resulting state into the existing per-mount Zustand store. Phaser continues to emit typed bus events only; it does not own case logic.

## 3. Data contracts and validation

Define readonly shared types for:

- `CaseDefinition`: the Phase 3 subset of the data-driven case contract: identity/title, scenes, evidence/fact/objective definitions, and `initialObjectiveId`. Broader case fields such as NPC dialogue, contradictions, and conclusion are added with their roadmap phases.
- `EvidenceDefinition`: ID, case ID, name, category, description, and related fact IDs; optional asset/NPC/vocabulary metadata remains optional per the game design document.
- `FactDefinition`: ID, text, source evidence IDs, and a `Condition` unlock rule.
- `ObjectiveDefinition`: ID and display text. Runtime status is held in `GameState` (`locked`, `active`, or `completed`); transitions are driven by effects, not content callbacks.
- `Condition`: the roadmap discriminated union `hasEvidence`, `hasFact`, `objectiveCompleted`, `flag`, `all`, and `any`.
- `Effect`: the roadmap discriminated union `addEvidence`, `unlockFact`, `setFlag`, `activateObjective`, and `completeObjective`.

`game-content` parses each file with strict Zod schemas and then validates cross-file references: case IDs, initial objective, evidence/fact/objective IDs, fact source evidence IDs, scene IDs, and IDs embedded in conditions/effects. Invalid content raises `ContentValidationError` with source and readable field paths. It must not silently drop invalid records.

The loader returns one assembled `CaseDefinition` for the engine. It does not expose imported JSON objects or make the engine responsible for file lookup.

## 4. State and engine behavior

`createCaseState(definition)` returns a fresh `GameState` with the initial objective active, other objectives locked, and evidence, facts, and flags empty. State collections are represented with serializable arrays/records rather than mutable global state.

Pure engine operations follow `(state, input) → { state, events }`:

- `evaluateCondition(state, condition)` recursively evaluates the full condition union; empty `all` is true and empty `any` is false.
- `applyEffects(state, effects)` applies the effect union in order, then checks fact unlock conditions against the resulting state. Repeating an already-satisfied effect is idempotent.
- Objective activation only affects known, non-completed objectives. Completing an objective requires it to be active. Invalid IDs or invalid transitions produce a typed failure result without partially mutating state.
- Facts unlock once, when their condition becomes true; the result includes a domain event so consumers can update HUD/notebook projections later.
- `addEvidence` is a core state effect so the declared Phase 3 Effect union is executable; this phase does not add the player-facing collection modal/notebook or wire every evidence interactable. Those remain Phase 4 work.

Domain events are returned with the transition and do not directly access the event bus. The app bridge may publish them after committing state. No time, random value, browser storage, or Phaser object is read by the engine.

## 5. App integration

Replace the HUD store's independent initial objective/evidence values with a projection of the initialized case state. Keep the store per `GameCanvas` mount. Add declarative effects to the objective note's interaction content; an app-side handler resolves those effects when it receives `interaction:triggered` and calls `game-core`. Phaser continues to emit only the interactable ID and remains unaware of case definitions/effects.

For this phase, Case #001's objective note demonstrates the objective/effect path and the sample evidence/fact pair demonstrates loading and unlock behavior in unit tests. The scene JSON remains a scene definition assembled into the loaded case definition by the content loader. No React evidence modal, notebook, persistence, dialogue UI, or full investigation progression is included.

## 6. Error handling

- Content parse/reference errors use `ContentValidationError` and remain developer-readable through the existing startup error surface.
- Engine inputs reference-checked against the loaded definition fail explicitly and leave state unchanged.
- Repeated unlock/add operations remain idempotent and do not duplicate IDs or domain events.
- Unknown condition/effect variants are prevented by strict schemas and exhaustive TypeScript switches; no `eval` or string-dispatched functions.

## 7. Testing

Vitest coverage belongs to the corresponding package:

- `shared-types`: compile/use contract and stable public exports.
- `game-content`: each valid fixture, malformed fields, and broken cross-file references (especially unknown initial objective, missing evidence source, and unknown condition/effect IDs).
- `game-core`: fresh initialization, all/any/leaf conditions, ordered effects, activation/completion rules, fact unlock after condition becomes true, idempotency, and unchanged state on invalid transition.
- `game-web`: interaction event invokes the app handler, state projection updates HUD values, and the Phaser canvas remains mounted while store state changes.
- Framework-free import check remains in `game-core`.

The phase DoD follows root `AGENTS.md`: run `npm run lint`, `npm run test`, and `npm run build`; also `npm run format:check`, `npm run test:e2e`, and `npm run memory:check` as established by the preceding phase. Record actual outputs in the plan/handoff. Do not claim a check passed unless it was run.

## 8. Scope boundary

Included: shared data contracts, content schemas/loader, pure case state/condition/effect/objective/fact behavior, minimal Case #001 fixture content, and app bridge/store projection needed for the objective event path.

Deferred: complete Case #001 evidence/fact/objective corpus, evidence modal/notebook, full interactable-to-evidence authoring, dialogue runner, learning engine, contradictions, timeline, save/persistence, and backend/API integration.
