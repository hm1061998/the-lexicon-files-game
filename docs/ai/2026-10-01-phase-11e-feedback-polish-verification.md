# Phase 11E feedback polish — verification

Date: 2026-10-01. Scope: approved feedback polish plan Tasks 3–11; Tasks 1–2 were already committed as `1520cab` and `50fc6d0`. Branch `dev`; no push/merge.

## Delivered

- Mounted labels to content-authored wall/floor planes with cleanup; paired Office/Archive doors and arrivals; direction-specific chair assets oriented toward their desks.
- Viewport and background sizing, movement-based minimap updates, compact HUD launchers, player/target-safe interaction prompt placement, world evidence/door cues, and one-shot evidence eligibility.
- Local prerecorded voice for all 15 NPC dialogue nodes, 7 SFX assets, footstep cadence, successful-action cues, replay/lifecycle handling, and audio provenance.
- New supplemental design draft for later feedback is `docs/superpowers/specs/2026-10-01-phase-11e-camera-audio-ui-addendum.md`; it is not part of this implementation result.

## Verification

Commands run from repo root unless stated otherwise; each returned exit code 0.

```text
npm run lint
NX   Successfully ran target lint for 7 projects

npm run test
NX   Successfully ran target test for 7 projects
@lexicon/game-web Vitest: 68 files, 468 tests passed
AI memory validator tests: 30 passed

npm run build
NX   Successfully ran target build for project @lexicon/game-web
Vite built successfully; emitted the existing large-chunk advisory (main JS 1,934.35 kB minified / 470.31 kB gzip)

npm run typecheck
tsc -b — exit 0

npm run format:check
All matched files use Prettier code style!

npm run test:e2e -- --workers=1 --reporter=line
108 passed (8.8m)

npm run test:e2e -- apps/game-web/e2e/feedback-viewport.spec.ts apps/game-web/e2e/hud.spec.ts apps/game-web/e2e/scene-layout.spec.ts apps/game-web/e2e/feedback-evidence-prompt.spec.ts apps/game-web/e2e/feedback-labels.spec.ts apps/game-web/e2e/feedback-world-cues.spec.ts apps/game-web/e2e/feedback-audio.spec.ts --workers=1 --reporter=line
58 passed (3.1m)

npm run test:e2e -- apps/game-web/e2e/feedback-evidence-prompt.spec.ts apps/game-web/e2e/hud.spec.ts --workers=1 --reporter=line
28 passed (1.9m)

npm run test:e2e -- apps/game-web/e2e/world.spec.ts apps/game-web/e2e/hud.spec.ts apps/game-web/e2e/scene-layout.spec.ts apps/game-web/e2e/feedback-minimap.spec.ts apps/game-web/e2e/feedback-audio.spec.ts --repeat-each=3 --workers=1 --reporter=line
The first 3× run executed 237 cases: 236 passed; one HUD assertion failed only on its third repeat because it assumed a second, overlapping evidence prompt would always open immediately after E. The assertion was corrected to wait for the valid new prompt and check that the already-collected item is no longer named.

npm exec -- nx run @lexicon/game-web:test:e2e -- apps/game-web/e2e/hud.spec.ts --grep=collecting --repeat-each=3 --workers=1 --reporter=line
3 passed (24.3s) after the correction. The other 236 cases had passed in all three rounds; the only failed case was rerun three times and passed each time.

.venv-art-codegen\Scripts\python.exe -m unittest discover -s tools/art-codegen -p 'test_*.py' -v
Ran 44 tests — OK

.venv-audio-codegen\Scripts\python.exe -m unittest discover -s tools/audio-codegen -p 'test_*.py' -v
Ran 5 tests — OK
.venv-audio-codegen\Scripts\python.exe tools/audio-codegen/validate_assets.py
Audio assets validated.

git diff --check
exit 0 (only Git's LF→CRLF advisory on tracked files)
```

`npm run format:check` first identified three recently edited files; they were formatted and the rerun passed. A focused eligibility assertion confirmed a collected item no longer remains the active interaction; where another evidence item overlaps the same radius, the prompt correctly moves to that still-available item. The 3× stability run exposed and removed an order-sensitive test expectation, then the affected scenario passed 3/3.

Screenshots saved in `.superpowers/sdd/2026-09-30-phase-11e-feedback-polish/`: `office-1280x720.png`, `archive-1280x720.png`, `compact-760x600.png`, and `interaction-prompt.png`. These are technical review evidence; human visual/audio acceptance is still open.

## Review and remaining acceptance

A fresh external review returned actionable findings before hitting its tool usage limit, so it did not provide a final verdict. Addressed findings: replay now unloads/recreates failed or active Howl instances; door cue/voice stop use the transition event; Archive's obsolete west opening is closed; compact prompt falls back to the safe zone; map launcher no longer overlaps case progress; panel controls are at least 44px; compact type is at least 14px; long boot/recovery errors can scroll. Added browser and unit coverage, then full E2E passed.

The implemented audio has not been auditioned by the user. Do not mark the phase fully accepted until the user reviews the screenshots and the voice/footstep samples. The newly reported closer camera, camera follow, NPC tag redesign, ambience music, more natural footsteps, and dialogue/notebook control redesign are recorded in the separate addendum and are not silently folded into the approved plan.
