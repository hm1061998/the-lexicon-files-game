---
schema_version: 1
updated_at: 2026-09-29T10:47:06+07:00
phase: phase-8
status: in_progress
result_commit: 43f51d2
active_spec: docs/superpowers/specs/2026-09-29-phase-8-timeline-contradiction-design.md
active_plan: none
---

## Metadata

- Schema version 1; snapshot duy trì bằng Git.

## Current Phase

- Phase 8 — Timeline + Contradiction (roadmap §27): draft spec đã commit local, user duyệt hướng data-driven và Archive scene tối thiểu. Đang chờ user review spec trước khi tạo implementation plan.

## Active Goal

- Hoàn thiện Phase 8 theo spec được user duyệt. Hiện mới có design draft; không viết implementation plan/code trước khi user duyệt spec.

## Current Status

- Branch `dev`: Phase 7 implementation/handoff pushed and verified at `44e06ff`; Phase 8 spec commit `43f51d2` is local and not pushed. No product code changed in Phase 8.
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
- Phase 8 scope approved in conversation: data-driven timeline/contradiction flow, minimal Archive scene and route from Main Office; written design committed at `43f51d2` and awaits user review.

## In Progress

- None. Phase 7 is complete; await the user's instruction before starting another phase.

## Active Decisions

- Product/case truth theo docs/01–03; phase theo roadmap; dependency boundaries theo ARCHITECTURE.md. Không tự sửa rule khi thiếu/mâu thuẫn.
- npm + Nx bắt buộc; local runtime `.superpowers/runtime/npm-10.9.7/bin`, `C:/Windows/System32` trên PATH; `NX_DAEMON=false` khi checks. Không thêm dependency/đổi lockfile.
- Gameplay local-first; core engines TS thuần; learning reducer không nằm trong Phaser. Backend ngoài scope Phase 6.
- Case save schema 2/database 1 giữ evidence/facts/objectives/flags; learning profile/settings ở DB riêng.
- Phase 5 ba NPC/Main Office/ph_npc prototype đã duyệt; conditional David chỉ fixture trước Phase 8. Không làm detector/accusation trong Phase 6.
- Meeting Minutes vẫn evidence collectible mẫu duy nhất, evidenceTotal=5. Catalogue 20 từ không tự đồng nghĩa encountered=20.
- Phase 6 phương án A/seen-only: chỉ unique vocabulary/context pair tăng encounter; inspection/translation không promote stage; giữ stage cao hơn nếu profile tương lai đã đạt.
- Phase 7 scope: một phone recording Leo (20:29), Howler playback/replay, three existing listening modes, data-driven effects, local counters + aggregate time-to-fact, no runtime TTS/API/microphone. Hotspot Main Office `(1200, 1280)`; no Archive scene. Provenance pins model/voice revisions and records upstream repo-level Apache-2.0 metadata plus the absence of separate voice-specific terms. User auditory review accepted.
- Phase 8 design draft: user selected a minimal Archive scene and route to preserve Security Access Log placement; spec proposes authored timeline slots, discovered-facts-only contradiction, scene ID save/migration, no Phase 9 accusation. Await full-spec approval before plan.
- Playwright workers=1 do movement theo frames.

## Blockers

- None.

## Next Actions

- User reviews `docs/superpowers/specs/2026-09-29-phase-8-timeline-contradiction-design.md`; after approval, write and review the Phase 8 implementation plan.

## Verification

- Phase 8 design: source documents and current contracts reconciled; placeholder/contradiction self-review PASS; `npm run format:check` PASS; `git diff --check` PASS. Written spec awaits user approval; no implementation gates apply yet.
- Phase 7: lint PASS (7 Nx projects); uncached unit/content tests PASS (7 targets; game-web 27 files/148 tests, game-content 10 files/72 tests); build PASS (141 modules; 1,809.14 kB JS / 437.53 kB gzip chunk warning); typecheck PASS; format PASS; full E2E PASS (35 tests, 1 worker); user audio audition accepted; push to `origin/dev` verified at `44e06ff`.
- Phase 6 final: `npm run lint` PASS (7 Nx projects); `npm run test` PASS (25 files / 136 tests); `npm run build` PASS (134 modules; chunk warning: JS 1,761.37 kB, gzip 423.69 kB); `npm run typecheck` PASS; `npm run format:check` PASS; `npm run test:e2e` PASS (31 tests, 1 worker); `npm run memory:check` PASS; `npm run memory:test` PASS (30); `git diff --check` PASS.
- Backend checks not run because `apps/api` unchanged. `npm ci` earlier reported 7 existing audit advisories (3 moderate, 3 high, 1 critical); no dependency was changed.
- Phase 5 historical verification: lint 7 projects; 204 Vitest + 30 memory tests; build 122 modules with >500 kB warning; E2E 29/29; formatting/memory/whitespace pass.

## Latest Handoff

- Phase 8 design draft is local at `43f51d2`; user approved the proposed scope, including a minimal Archive scene and route, but has not reviewed the written spec. Wait for written-spec approval before invoking `writing-plans`; no code/plan/push yet.
- Phase 7 is complete and pushed to `origin/dev` through `44e06ff`; user approved the audio audition. Verification ledger: `docs/ai/2026-09-29-phase-7-audio-listening-verification.md`. Audio is 4.2 s, 201,644 bytes, mono 24 kHz PCM16; model/voice revisions and checksums are in `.provenance.json`.
- Phase 6 is integrated and pushed: local/remote `dev` at `520ee4d` (then memory reconciliation `9177cfa`). Verification/review: `docs/ai/2026-09-28-phase-6-learning-engine-verification.md`.
- Phase 5 is already pushed through `f4ac2be`. Minor evidence focus restoration Phase 4 remains deferred; dialogue has separate restoration verified.

## Required Reading

- `AGENTS.md`, `apps/game-web/AGENTS.md`, `docs/ai/README.md`.
- `docs/superpowers/specs/2026-09-29-phase-7-audio-listening-design.md`.
- `docs/02_ENGLISH_LEARNING_SYSTEM_DESIGN.md` §§4–7, 11–12, 24–26, 29–31; `docs/03_CASE_001_VERTICAL_SLICE_SPEC.md` §15; `docs/04_CODEX_IMPLEMENTATION_ROADMAP.md` §25.
- `docs/architecture/ARCHITECTURE.md`; `docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md`.
- Phase 5 spec/plan and `docs/ai/2026-09-28-phase-5-dialogue-verification.md` for behavior/save/input.
