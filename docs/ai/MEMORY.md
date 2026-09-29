---
schema_version: 1
updated_at: 2026-09-29T12:09:59+07:00
phase: phase-8
status: in_progress
result_commit: 648e958
active_spec: docs/superpowers/specs/2026-09-29-phase-8-timeline-contradiction-design.md
active_plan: docs/superpowers/plans/2026-09-29-phase-8-timeline-contradiction.md
---

## Metadata

- Schema version 1; snapshot duy trì bằng Git.

## Current Phase

- Phase 8 — Timeline + Contradiction (roadmap §27): spec và plan tiếng Việt đã được user duyệt, docs push qua `b7823c6`; triển khai theo plan. Task 1 content/schema/Archive complete tại `3411ee9`; Task 2 core reducers complete tại `648e958`; tiếp tục Task 3.

## Active Goal

- Hoàn thiện Phase 8 theo spec và plan đã duyệt, gồm timeline/contradiction, Archive và provider commerce trung lập mặc định `free`.

## Current Status

- Branch `dev` has Phase 8 implementation commits `3411ee9` (Task 1) and `648e958` (Task 2), plus memory handoffs; these code commits are local and not pushed. Phase 8 spec/plan remain approved and on origin through `b7823c6` (later memory approval record through `8f55078`).
- Phase 7 complete: functionality, user audio audition, and automated verification passed. Verification: `docs/ai/2026-09-29-phase-7-audio-listening-verification.md`.
- Phase 6 remains complete and pushed to `origin/dev` at `520ee4d`; Phase 5 remains complete through `f4ac2be`.

## Completed

- Phase 0A, 0B, 1, 2: xem Git history.
- Phase 3 tại `200399b`; Phase 4 tại `7d4405a`, remote checkpoint `2595afd`.
- Phase 5 complete tại `30fb676`: ba NPC/dialogue, runner/progress, validation/build gate, save schema 2 migration, accessible UI/input/focus, physical double-click review fix. Push origin/dev thành công tới `f4ac2be`; xem `docs/ai/2026-09-28-phase-5-dialogue-verification.md`.
- Phase 6: catalogue 20 lemmas, UTF-16 content spans/validation, pure seen-only reducer, separate IndexedDB profile/recovery/autosave, accessible inline inspection, Beginner/Learning/Immersion modes, tutorial, encountered-only notebook, E2E reload/recovery. Case truth, evidenceTotal 5, case save schema 2/database 1, API và dependencies không đổi.
- Independent review: không có Critical; năm Important findings đã sửa (preserve stage, strict encounter/context count, popup focus/ARIA/content, notebook metadata/modes/inline evidence, E2E recovery/hidden-context/keyboard coverage). Review ledger: `docs/ai/2026-09-28-phase-6-learning-engine-verification.md`.
- Phase 7: authored audio evidence/listening task, pure answer transition and completion flag, Kokoro WAV/provenance, Howler playback/retry/cleanup, mode-aware accessible evidence panel, V1 learning telemetry migration, and 35 E2E tests. `evidenceTotal=5`, no backend/runtime TTS/dependency change. User audition accepted.
- Phase 7 sign-off: user listened to the recording and confirmed “test ok” on 2026-09-29; plan and verification record the approval. Implementation and handoff pushed to `origin/dev` through `7c29114`.
- Phase 8 spec/plan and commerce seam were pushed through `b7823c6`; approval/handoff memory is pushed through `8f55078`.

## In Progress

- Phase 8 Task 1 complete: shared timeline/contradiction/spawn/transition types, strict content schemas and cross-reference checks, Case #001 events/facts/evidence/objectives, Archive placeholder/door/terminal, localized UI strings. Commit `3411ee9`; 82/82 `game-content` tests pass.
- Phase 8 Task 2 complete: pure timeline placement and contradiction submission transitions, typed validation errors, idempotency and authored flag/objective completion. Commit `648e958`; 37/37 `game-core` tests pass. Task 3 next.

## Active Decisions

- Product/case truth theo docs/01–03; phase theo roadmap; dependency boundaries theo ARCHITECTURE.md. Spec và implementation plan viết bằng tiếng Việt theo `AGENTS.md` (commit `3d6752d`). Không tự sửa rule khi thiếu/mâu thuẫn.
- npm + Nx bắt buộc; local runtime `.superpowers/runtime/npm-10.9.7/bin`, `C:/Windows/System32` trên PATH; `NX_DAEMON=false` khi checks. Không thêm dependency/đổi lockfile.
- Gameplay local-first; core engines TS thuần; learning reducer không nằm trong Phaser. Backend ngoài scope Phase 6.
- Case save schema 2/database 1 giữ evidence/facts/objectives/flags; learning profile/settings ở DB riêng.
- Phase 5 ba NPC/Main Office/ph_npc prototype đã duyệt; conditional David chỉ fixture trước Phase 8. Không làm detector/accusation trong Phase 6.
- Meeting Minutes vẫn evidence collectible mẫu duy nhất, evidenceTotal=5. Catalogue 20 từ không tự đồng nghĩa encountered=20.
- Phase 6 phương án A/seen-only: chỉ unique vocabulary/context pair tăng encounter; inspection/translation không promote stage; giữ stage cao hơn nếu profile tương lai đã đạt.
- Phase 7 scope: một phone recording Leo (20:29), Howler playback/replay, three existing listening modes, data-driven effects, local counters + aggregate time-to-fact, no runtime TTS/API/microphone. Hotspot Main Office `(1200, 1280)`; no Archive scene. Provenance pins model/voice revisions and records upstream repo-level Apache-2.0 metadata plus the absence of separate voice-specific terms. User auditory review accepted.
- Phase 8: user approved spec with provider-neutral commerce config (`free` default, versioned app-boundary provider, invalid/error fallback to `free`, no client-side content locks, commerce backend/payments out of scope). Revised plan adds provider/bootstrap tests; accusation remains Phase 9.
- Playwright workers=1 do movement theo frames.

## Blockers

- None.

## Next Actions

- Continue approved plan at Task 3: implement schema V3 scene/spawn persistence and Archive navigation.

## Verification

- Phase 8 Task 2 complete: `npx nx test @lexicon/game-core --skip-nx-cache` PASS (6 files, 37 tests); targeted Prettier and `git diff --check` PASS. RED confirmed absent reducer APIs; a failure exposed and fixed contradiction availability validation order. Task 2 local commit `648e958`, not pushed.
- Phase 8 Task 1 complete: `npx nx test @lexicon/game-content --skip-nx-cache` PASS (10 files, 82 tests); `git diff --check` and targeted Prettier PASS. RED was observed for missing schema/content and missing NPC cross-reference validation. Baseline `npm run test` PASS (7 targets); npm had to be added from `C:\nvm4w\nodejs` to PATH for Nx child scripts. Task 1 local commit `3411ee9`, not pushed.
- Phase 7: lint PASS (7 Nx projects); uncached unit/content tests PASS (7 targets; game-web 27 files/148 tests, game-content 10 files/72 tests); build PASS (141 modules; 1,809.14 kB JS / 437.53 kB gzip chunk warning); typecheck PASS; format PASS; full E2E PASS (35 tests, 1 worker); user audio audition accepted; push to `origin/dev` verified at `44e06ff`.
- Phase 6 final: `npm run lint` PASS (7 Nx projects); `npm run test` PASS (25 files / 136 tests); `npm run build` PASS (134 modules; chunk warning: JS 1,761.37 kB, gzip 423.69 kB); `npm run typecheck` PASS; `npm run format:check` PASS; `npm run test:e2e` PASS (31 tests, 1 worker); `npm run memory:check` PASS; `npm run memory:test` PASS (30); `git diff --check` PASS.
- Backend checks not run because `apps/api` unchanged. `npm ci` earlier reported 7 existing audit advisories (3 moderate, 3 high, 1 critical); no dependency was changed.
- Phase 5 historical verification: lint 7 projects; 204 Vitest + 30 memory tests; build 122 modules with >500 kB warning; E2E 29/29; formatting/memory/whitespace pass.

## Latest Handoff

- Task 1 and Task 2 implementation are committed locally at `3411ee9` and `648e958`; `game-content` is 82/82 and `game-core` is 37/37. Continue with Task 3; no code push has been requested.
- Quy định dự án mới: mọi spec và implementation plan phải viết bằng tiếng Việt; đã ghi vào `AGENTS.md` tại `3d6752d`.
- User approved the Phase 8 spec and requested plan creation plus push to `dev`; spec, plan, and synchronized memory are on `origin/dev` through `38f0a7d`. Plan review and execution method remain pending; no code yet.
- Phase 7 is complete and pushed to `origin/dev` through `44e06ff`; user approved the audio audition. Verification ledger: `docs/ai/2026-09-29-phase-7-audio-listening-verification.md`. Audio is 4.2 s, 201,644 bytes, mono 24 kHz PCM16; model/voice revisions and checksums are in `.provenance.json`.
- Phase 6 is integrated and pushed: local/remote `dev` at `520ee4d` (then memory reconciliation `9177cfa`). Verification/review: `docs/ai/2026-09-28-phase-6-learning-engine-verification.md`.
- Phase 5 is already pushed through `f4ac2be`. Minor evidence focus restoration Phase 4 remains deferred; dialogue has separate restoration verified.

## Required Reading

- `AGENTS.md`, `apps/game-web/AGENTS.md`, `docs/ai/README.md`.
- `docs/superpowers/specs/2026-09-29-phase-7-audio-listening-design.md`.
- `docs/02_ENGLISH_LEARNING_SYSTEM_DESIGN.md` §§4–7, 11–12, 24–26, 29–31; `docs/03_CASE_001_VERTICAL_SLICE_SPEC.md` §15; `docs/04_CODEX_IMPLEMENTATION_ROADMAP.md` §25.
- `docs/architecture/ARCHITECTURE.md`; `docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md`.
- Phase 5 spec/plan and `docs/ai/2026-09-28-phase-5-dialogue-verification.md` for behavior/save/input.
