---
schema_version: 1
updated_at: 2026-09-30T15:40:00+07:00
phase: phase-11e
status: in_progress
result_commit: 05a8485
active_spec: docs/superpowers/specs/2026-09-30-phase-11e-controls-visual-ux-design.md
active_plan: docs/superpowers/plans/2026-09-30-phase-11e-controls-visual-ux.md
---

## Metadata

- Phase 11D Tasks 1–8 completed on local `dev` in `94ce745`; memory handoff `a54c32d`. Phase 11E Vietnamese design spec is committed in `ca89b59`; this memory update is the next commit. No Phase 11E plan or implementation exists yet; branch is not pushed.

## Current Phase

- Phase 11D is complete. Phase 11E spec and plan were approved; plan is committed locally in `676e6fb` + refinement `05a8485`. Waiting for execution-method choice. No Phase 11E implementation has started. Phase 12 remains Testing & Performance in the roadmap and has not started.

## Active Goal

- Complete design/review/plan gate for Phase 11E, then implement after plan approval. Last completed goal: migrate Case #001 to 2D dimetric 2:1, improve office/archive and NPC presentation, add full walk sheets, reconcile docs and verify.

## Current Status

- Phase 11D Tasks 1–5 migrated projection/runtime/content/scene; Task 6 added dialogue-facing NPC/player, names and initial breathing; Task 7 added real 8×4 walk sheets for player, Anna, Leo and David; Task 8 reconciled docs and completed visual review/full direct-runner verification.
- Verification details, screenshot verdicts and limitations: `docs/ai/2026-09-30-phase-11d-verification.md`. Screenshots are in ignored `.superpowers/sdd/2026-09-30-phase-11d-isometric-dimetric/`.
- Phase 11E spec: `docs/superpowers/specs/2026-09-30-phase-11e-controls-visual-ux-design.md`; user approved each design section. Plan: `docs/superpowers/plans/2026-09-30-phase-11e-controls-visual-ux.md` (latest commit `05a8485`), not yet approved. Spec asks to retain dimetric 2:1, map W/A/S/D to screen up/left/down/right, modularize office/archive composition, improve evidence-modal internal scrolling/UI consistency, and smooth idle breathing for player and NPCs.
- Remaining observations included in Phase 11E scope: office/archive density and wall/floor seams; evidence modal usability at 1280×720 and 760×600; current breathing feels jerky and runtime only applies it to NPCs although the old spec requested player and NPC.
- Root `npm` executable is unavailable in this environment; Nx npm-script targets cannot launch. Equivalent installed Vitest, TypeScript, ESLint, Vite, Prettier, Python, Playwright and memory runners passed. Vite reports the existing ~1.9 MB JS chunk warning.

## Completed

- Phase 0A–11, Phase 11B and Phase 11C history remains in prior Git commits and older verification ledgers.
- Phase 11D plan/spec were approved and authored in Vietnamese. Local commits include Tasks 6 (`cb3446a`), 7 (`bb5038b`) and Task 8 (`94ce745`); Tasks 1–5 are summarized in the plan/SDD ledger and Git history.

## In Progress

- None.

## Active Decisions

- Phase 11D projector: `x=originX+(u-v)×64`, `y=originY+(u+v)×32−elevationPx`; `u+=SE`, `v+=SW`; W=NW, D=NE, S=SE, A=SW. Game is 2D dimetric 2:1, not a 3D world.
- User chose native inline implementation for Phase 11D. User owns merging `dev` into `main`; do not merge or push unless explicitly requested for the current work.
- Phase 11E visual direction preserves the current paper/sepia art style. Scope is targeted scene and UI polish, not a full restyle. WASD moves relative to screen while the world stays dimetric. Breathing will be slow/soft for idle player/NPC, with feet/collision/world state unaffected.
- Specs and implementation plans under `docs/superpowers/` must be in Vietnamese.
- Product truth remains docs/01–03 and `docs/architecture/ARCHITECTURE.md`; if requirements conflict, clarify before changing behavior.
- Monorepo uses npm + Nx; no pnpm/yarn/bun. `game-core`/`learning-engine` remain framework-free; Case #001 content stays in `packages/game-content`; Phaser/React communicate through typed event bus/store; scene listeners clean up at shutdown.
- Game remains investigation-first/local-first. No energy/lives/timer pressure, wrong-answer punishment, ads, AI NPC, multiplayer or other MVP exclusions.
- Art manifests are in `packages/game-content`; walk sheets are 8×4, 160×160 frames, 10 fps, alpha, rows NE/SE/SW/NW. Python tooling uses ignored `.venv-art-codegen`; incoming source images are not committed.
- Commercialization setting remains behind the approved neutral configuration gateway; default remains free.

## Blockers

- Phase 11E plan approved by user; waiting for choice of execution method before code changes.

## Next Actions

- Choose native or subagent-driven execution for the approved plan `docs/superpowers/plans/2026-09-30-phase-11e-controls-visual-ux.md`.
- Implement only after the Phase 11E plan is approved. Keep Phase 12 Testing & Performance separate.

## Verification

- Phase 11D commit `94ce745`: game-web 432/432, game-content 128/128, game-core 49/49, learning-engine 12/12, shared-types 1/1, UI 18/18; TypeScript, ESLint, Prettier, Vite build and Python 35/35 pass.
- E2E: world 29/29 twice; scene-layout 24/24 twice with `--repeat-each=2`; temporary screenshot test passed and was removed. Nx/npm entry points remain unverified because `npm` is absent from PATH.
- AI memory tests 30/30 passed; memory check passed before Phase 11E scope update. Phase 11E spec `git diff --check` passed. Backend unchanged.

## Latest Handoff

- Phase 11D complete locally at `94ce745`; no push. Phase 11E spec `ca89b59` and plan latest commit `05a8485` approved; waiting for execution method. Phase 11D ledger: `docs/ai/2026-09-30-phase-11d-verification.md`.

## Required Reading

- `AGENTS.md`, `apps/game-web/AGENTS.md`, `docs/ai/README.md`, active spec/plan linked in metadata.
- For art or world-coordinate work: `docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md`, `docs/art/07_AI_ASSET_PROMPT_PACK.md`, `docs/concept/README.md`.
