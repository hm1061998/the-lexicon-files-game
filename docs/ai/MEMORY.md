---
schema_version: 1
updated_at: 2026-09-29T11:24:21+07:00
phase: phase-8
status: in_progress
result_commit: 04f77e0
active_spec: docs/superpowers/specs/2026-09-29-phase-8-timeline-contradiction-design.md
active_plan: none
---

## Metadata

- Schema version 1; snapshot duy trì bằng Git.

## Current Phase

- Phase 8 — Timeline + Contradiction (roadmap §27): spec tiếng Việt đã được user duyệt; implementation plan tiếng Việt tại `docs/superpowers/plans/2026-09-29-phase-8-timeline-contradiction.md`, commit `550e792`. Chờ user review plan trước khi triển khai.

## Active Goal

- Hoàn thiện Phase 8 theo spec sau khi user duyệt bản cập nhật commerce. Plan baseline đã push nhưng cần cập nhật sau khi spec revision được duyệt; chưa viết code.

## Current Status

- Branch `dev`: Phase 7 implementation/handoff pushed and verified at `44e06ff`; Phase 8 baseline spec/plan/memory are on `origin/dev` through `fcea8c3`. Spec revision adding the commerce seam is local at `04f77e0`, pending review; no product code changed.
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
- Phase 8 baseline spec was approved and its Vietnamese plan at `550e792` was pushed through `fcea8c3`. Commerce-seam spec revision `04f77e0` is pending user review; plan must be regenerated after that approval.

## In Progress

- Phase 8: bổ sung cổng cấu hình commerce trung lập vào spec tại `04f77e0`; chờ user duyệt bản spec cập nhật, sau đó mới sửa plan. Chưa có code.

## Active Decisions

- Product/case truth theo docs/01–03; phase theo roadmap; dependency boundaries theo ARCHITECTURE.md. Spec và implementation plan viết bằng tiếng Việt theo `AGENTS.md` (commit `3d6752d`). Không tự sửa rule khi thiếu/mâu thuẫn.
- npm + Nx bắt buộc; local runtime `.superpowers/runtime/npm-10.9.7/bin`, `C:/Windows/System32` trên PATH; `NX_DAEMON=false` khi checks. Không thêm dependency/đổi lockfile.
- Gameplay local-first; core engines TS thuần; learning reducer không nằm trong Phaser. Backend ngoài scope Phase 6.
- Case save schema 2/database 1 giữ evidence/facts/objectives/flags; learning profile/settings ở DB riêng.
- Phase 5 ba NPC/Main Office/ph_npc prototype đã duyệt; conditional David chỉ fixture trước Phase 8. Không làm detector/accusation trong Phase 6.
- Meeting Minutes vẫn evidence collectible mẫu duy nhất, evidenceTotal=5. Catalogue 20 từ không tự đồng nghĩa encountered=20.
- Phase 6 phương án A/seen-only: chỉ unique vocabulary/context pair tăng encounter; inspection/translation không promote stage; giữ stage cao hơn nếu profile tương lai đã đạt.
- Phase 7 scope: một phone recording Leo (20:29), Howler playback/replay, three existing listening modes, data-driven effects, local counters + aggregate time-to-fact, no runtime TTS/API/microphone. Hotspot Main Office `(1200, 1280)`; no Archive scene. Provenance pins model/voice revisions and records upstream repo-level Apache-2.0 metadata plus the absence of separate voice-specific terms. User auditory review accepted.
- Phase 8: user approved the base spec and the design direction for a provider-neutral commerce config seam (`free` default, no pricing/payment/backend); the updated written spec is pending approval. Accusation remains Phase 9.
- Playwright workers=1 do movement theo frames.

## Blockers

- None.

## Next Actions

- User reviews the updated Phase 8 spec; after approval, regenerate and review the plan, then confirm execution approach before code work starts.

## Verification

- Phase 8 spec revision: added the approved provider-neutral commerce config boundary; default mode is free, failures fall back to free, and no client-side access locking/backend/payment is added. Prettier check PASS; `memory:check` PASS; `git diff --check` PASS. Revised spec awaits user approval.
- Phase 7: lint PASS (7 Nx projects); uncached unit/content tests PASS (7 targets; game-web 27 files/148 tests, game-content 10 files/72 tests); build PASS (141 modules; 1,809.14 kB JS / 437.53 kB gzip chunk warning); typecheck PASS; format PASS; full E2E PASS (35 tests, 1 worker); user audio audition accepted; push to `origin/dev` verified at `44e06ff`.
- Phase 6 final: `npm run lint` PASS (7 Nx projects); `npm run test` PASS (25 files / 136 tests); `npm run build` PASS (134 modules; chunk warning: JS 1,761.37 kB, gzip 423.69 kB); `npm run typecheck` PASS; `npm run format:check` PASS; `npm run test:e2e` PASS (31 tests, 1 worker); `npm run memory:check` PASS; `npm run memory:test` PASS (30); `git diff --check` PASS.
- Backend checks not run because `apps/api` unchanged. `npm ci` earlier reported 7 existing audit advisories (3 moderate, 3 high, 1 critical); no dependency was changed.
- Phase 5 historical verification: lint 7 projects; 204 Vitest + 30 memory tests; build 122 modules with >500 kB warning; E2E 29/29; formatting/memory/whitespace pass.

## Latest Handoff

- Spec commerce-seam revision is local at `04f77e0` and awaits user approval. The prior plan is pushed but will be revised after the spec review; do not push this revision yet. No implementation code exists.
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
