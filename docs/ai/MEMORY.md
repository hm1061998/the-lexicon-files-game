---
schema_version: 1
updated_at: 2026-09-30T16:30:00+07:00
phase: phase-11e
status: in_progress
result_commit: bcab0e5
active_spec: docs/superpowers/specs/2026-09-30-phase-11e-controls-visual-ux-design.md
active_plan: docs/superpowers/plans/2026-09-30-phase-11e-controls-visual-ux.md
---

## Metadata

- Phase 11D Tasks 1–8 completed on local `dev` in `94ce745`; memory handoff `a54c32d`. Phase 11E plan is approved; the user chose Native execution. Implementation is underway locally; do not push unless requested.

## Current Phase

- Phase 11D is complete. Phase 11E spec and plan were approved; plan is committed locally in `676e6fb` + refinement `05a8485`. User chose Native execution. Task 1 completed in `b3fa09d`; Task 2 completed in `bcab0e5`. Tasks 3–6 remain. Phase 12 remains Testing & Performance in the roadmap and has not started.

## Active Goal

- Implement approved Phase 11E plan task-by-task using Native. Last completed goal: migrate Case #001 to 2D dimetric 2:1, improve office/archive and NPC presentation, add full walk sheets, reconcile docs and verify.

## Current Status

- Phase 11D Tasks 1–5 migrated projection/runtime/content/scene; Task 6 added dialogue-facing NPC/player, names and initial breathing; Task 7 added real 8×4 walk sheets for player, Anna, Leo and David; Task 8 reconciled docs and completed visual review/full direct-runner verification.
- Verification details, screenshot verdicts and limitations: `docs/ai/2026-09-30-phase-11d-verification.md`. Screenshots are in ignored `.superpowers/sdd/2026-09-30-phase-11d-isometric-dimetric/`.
- Phase 11E spec: `docs/superpowers/specs/2026-09-30-phase-11e-controls-visual-ux-design.md`; user approved each design section. Plan: `docs/superpowers/plans/2026-09-30-phase-11e-controls-visual-ux.md` (latest refinement `bcab0e5`), user approved and chose Native. Task 1 screen-relative WASD/facing is committed in `b3fa09d`; Task 2 office/archive wall composition is committed in `bcab0e5`. The plan also improves evidence-modal internal scrolling/UI consistency and smooths idle breathing for player and NPCs.
- Remaining observations included in Phase 11E scope: office/archive density and wall/floor seams; evidence modal usability at 1280×720 and 760×600; current breathing feels jerky and runtime only applies it to NPCs although the old spec requested player and NPC.
- Root `npm` executable is unavailable in this environment; Nx npm-script targets cannot launch. Equivalent installed Vitest, TypeScript, ESLint, Vite, Prettier, Python, Playwright and memory runners passed. Vite reports the existing ~1.9 MB JS chunk warning.

## Completed

- Phase 0A–11, Phase 11B and Phase 11C history remains in prior Git commits and older verification ledgers.
- Phase 11D plan/spec were approved and authored in Vietnamese. Local commits include Tasks 6 (`cb3446a`), 7 (`bb5038b`) and Task 8 (`94ce745`); Tasks 1–5 are summarized in the plan/SDD ledger and Git history.

## In Progress

- Phase 11E Tasks 3–6 remain; Tasks 1–2 are complete.

## Active Decisions

- Phase 11D projector: `x=originX+(u-v)×64`, `y=originY+(u+v)×32−elevationPx`; `u+=SE`, `v+=SW`; W=NW, D=NE, S=SE, A=SW. Game is 2D dimetric 2:1, not a 3D world.
- User chose native inline implementation for Phase 11D. User owns merging `dev` into `main`; do not merge or push unless explicitly requested for the current work.
- Phase 11E controls use screen-relative W/A/S/D with the same dimetric projector; cardinal sprite-row ties resolve consistently.
- Phase 11E visual direction preserves the current paper/sepia art style. Scope is targeted scene and UI polish, not a full restyle. WASD moves relative to screen while the world stays dimetric. Breathing will be slow/soft for idle player/NPC, with feet/collision/world state unaffected.
- Specs and implementation plans under `docs/superpowers/` must be in Vietnamese.
- Product truth remains docs/01–03 and `docs/architecture/ARCHITECTURE.md`; if requirements conflict, clarify before changing behavior.
- Monorepo uses npm + Nx; no pnpm/yarn/bun. `game-core`/`learning-engine` remain framework-free; Case #001 content stays in `packages/game-content`; Phaser/React communicate through typed event bus/store; scene listeners clean up at shutdown.
- Game remains investigation-first/local-first. No energy/lives/timer pressure, wrong-answer punishment, ads, AI NPC, multiplayer or other MVP exclusions.
- Art manifests are in `packages/game-content`; walk sheets are 8×4, 160×160 frames, 10 fps, alpha, rows NE/SE/SW/NW. Python tooling uses ignored `.venv-art-codegen`; incoming source images are not committed.
- Commercialization setting remains behind the approved neutral configuration gateway; default remains free.

## Blockers

- None. Native implementation of Phase 11E is underway.

## Next Actions

- Start Task 3: keep the evidence modal header visible while its content scrolls internally.
- Continue Tasks 4–6 in plan order. Keep Phase 12 Testing & Performance separate.

## Verification

- Phase 11D commit `94ce745`: game-web 432/432, game-content 128/128, game-core 49/49, learning-engine 12/12, shared-types 1/1, UI 18/18; TypeScript, ESLint, Prettier, Vite build and Python 35/35 pass.
- E2E: world 29/29 twice; scene-layout 24/24 twice with `--repeat-each=2`; temporary screenshot test passed and was removed. Nx/npm entry points remain unverified because `npm` is absent from PATH.
- Phase 11E baseline direct Vitest: 85 files, 640 tests passed. Root npm executable is absent from PATH; Nx/npm entry points remain unverified and direct local runners are used. Task 1: focused unit tests 37/37, `tsc -b` pass, scoped ESLint/Prettier pass, world E2E 29/29, scene-layout E2E 12/12 on final run (one earlier transient failure was rerun successfully). Task 2: game-content Vitest 128/128; scene-layout E2E 16/16. Repeated scene-layout run was 31/32 because the existing office waypoint driver intermittently timed out at `objective_note`; isolated rerun passed 2/2. Scoped ESLint, Prettier and `git diff --check` passed. Screenshots reviewed at 1280×720 in ignored `.superpowers/sdd/2026-09-30-phase-11e-controls-visual-ux/`. Backend unchanged.

## Latest Handoff

- Phase 11D complete locally at `94ce745`; no push. Phase 11E spec `ca89b59` and plan latest version approved; Native selected. Task 1 commit `b3fa09d`, Task 2 commit `bcab0e5`, both local on `dev`; Task 3 is next. Do not push unless explicitly requested. Phase 11D ledger: `docs/ai/2026-09-30-phase-11d-verification.md`.

## Required Reading

- `AGENTS.md`, `apps/game-web/AGENTS.md`, `docs/ai/README.md`, active spec/plan linked in metadata.
- For art or world-coordinate work: `docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md`, `docs/art/07_AI_ASSET_PROMPT_PACK.md`, `docs/concept/README.md`.
