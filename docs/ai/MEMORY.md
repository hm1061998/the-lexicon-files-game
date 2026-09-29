---
schema_version: 1
updated_at: 2026-09-29T10:03:47+07:00
phase: phase-7
status: in_progress
result_commit: 1f3462b
active_spec: docs/superpowers/specs/2026-09-29-phase-7-audio-listening-design.md
active_plan: docs/superpowers/plans/2026-09-29-phase-7-audio-listening.md
---

## Metadata

- Schema version 1; snapshot duy trì bằng Git.

## Current Phase

- Phase 7 — Audio / Listening (roadmap §26): scope được user chấp thuận gồm recording Kokoro tĩnh, hotspot prototype Main Office và implementation inline. Spec/plan tiếng Việt đã được tích hợp; source và verification implementation đang ở local `dev`.

## Active Goal

- Hoàn tất Phase 7 bằng cách lấy human listen-through cho WAV, xử lý nếu có vấn đề phát âm/chất lượng, rồi cập nhật verification và memory status. Không push implementation khi chưa có yêu cầu rõ.

## Current Status

- Branch `dev`: `HEAD=1f3462b`, local `origin/dev` ref=`bfb0bda`, năm commit local ahead. Các commit content/core/audio/UI/E2E là `7125f05`, `7a40426`, `7586275`, `06e8b60`, `1f3462b`. Implementation chưa được push.
- Phase 7 functionality và automated verification hoàn tất; còn human audition để xác minh phát âm “outside”, độ rõ và âm thanh thừa. Verification: `docs/ai/2026-09-29-phase-7-audio-listening-verification.md`.
- Phase 6 remains complete and pushed to `origin/dev` at `520ee4d`; Phase 5 remains complete through `f4ac2be`.

## Completed

- Phase 0A, 0B, 1, 2: xem Git history.
- Phase 3 tại `200399b`; Phase 4 tại `7d4405a`, remote checkpoint `2595afd`.
- Phase 5 complete tại `30fb676`: ba NPC/dialogue, runner/progress, validation/build gate, save schema 2 migration, accessible UI/input/focus, physical double-click review fix. Push origin/dev thành công tới `f4ac2be`; xem `docs/ai/2026-09-28-phase-5-dialogue-verification.md`.
- Phase 6: catalogue 20 lemmas, UTF-16 content spans/validation, pure seen-only reducer, separate IndexedDB profile/recovery/autosave, accessible inline inspection, Beginner/Learning/Immersion modes, tutorial, encountered-only notebook, E2E reload/recovery. Case truth, evidenceTotal 5, case save schema 2/database 1, API và dependencies không đổi.
- Independent review: không có Critical; năm Important findings đã sửa (preserve stage, strict encounter/context count, popup focus/ARIA/content, notebook metadata/modes/inline evidence, E2E recovery/hidden-context/keyboard coverage). Review ledger: `docs/ai/2026-09-28-phase-6-learning-engine-verification.md`.
- Phase 7: authored audio evidence/listening task, pure answer transition and completion flag, Kokoro WAV/provenance, Howler playback/retry/cleanup, mode-aware accessible evidence panel, V1 learning telemetry migration, and 35 E2E tests. `evidenceTotal=5`, no backend/runtime TTS/dependency change. Awaiting human audition only.

## In Progress

- Human listen-through of `apps/game-web/public/audio/case-001/leo-phone-recording.wav`; after feedback, update the verification ledger and mark Phase 7 complete if accepted.

## Active Decisions

- Product/case truth theo docs/01–03; phase theo roadmap; dependency boundaries theo ARCHITECTURE.md. Không tự sửa rule khi thiếu/mâu thuẫn.
- npm + Nx bắt buộc; local runtime `.superpowers/runtime/npm-10.9.7/bin`, `C:/Windows/System32` trên PATH; `NX_DAEMON=false` khi checks. Không thêm dependency/đổi lockfile.
- Gameplay local-first; core engines TS thuần; learning reducer không nằm trong Phaser. Backend ngoài scope Phase 6.
- Case save schema 2/database 1 giữ evidence/facts/objectives/flags; learning profile/settings ở DB riêng.
- Phase 5 ba NPC/Main Office/ph_npc prototype đã duyệt; conditional David chỉ fixture trước Phase 8. Không làm detector/accusation trong Phase 6.
- Meeting Minutes vẫn evidence collectible mẫu duy nhất, evidenceTotal=5. Catalogue 20 từ không tự đồng nghĩa encountered=20.
- Phase 6 phương án A/seen-only: chỉ unique vocabulary/context pair tăng encounter; inspection/translation không promote stage; giữ stage cao hơn nếu profile tương lai đã đạt.
- Phase 7 scope: một phone recording Leo (20:29), Howler playback/replay, three existing listening modes, data-driven effects, local counters + aggregate time-to-fact, no runtime TTS/API/microphone. Hotspot Main Office `(1200, 1280)`; no Archive scene. Provenance pins model/voice revisions and records upstream repo-level Apache-2.0 metadata plus the absence of separate voice-specific terms. Human auditory review remains pending.
- Playwright workers=1 do movement theo frames.

## Blockers

- No technical blocker. Phase sign-off awaits a human listening check of pronunciation, clarity, and unwanted sounds.

## Next Actions

- User auditions the committed WAV and reports any pronunciation/quality issue.
- If accepted, update the plan/verification and set Phase 7 complete in a follow-up memory commit.

## Verification

- Phase 7: lint PASS (7 Nx projects); uncached unit/content tests PASS (7 targets; game-web 27 files/148 tests, game-content 10 files/72 tests); build PASS (141 modules; 1,809.14 kB JS / 437.53 kB gzip chunk warning); typecheck PASS; format PASS; full E2E PASS (35 tests, 1 worker); memory:check and diff check PASS. Human audio audition pending.
- Phase 6 final: `npm run lint` PASS (7 Nx projects); `npm run test` PASS (25 files / 136 tests); `npm run build` PASS (134 modules; chunk warning: JS 1,761.37 kB, gzip 423.69 kB); `npm run typecheck` PASS; `npm run format:check` PASS; `npm run test:e2e` PASS (31 tests, 1 worker); `npm run memory:check` PASS; `npm run memory:test` PASS (30); `git diff --check` PASS.
- Backend checks not run because `apps/api` unchanged. `npm ci` earlier reported 7 existing audit advisories (3 moderate, 3 high, 1 critical); no dependency was changed.
- Phase 5 historical verification: lint 7 projects; 204 Vitest + 30 memory tests; build 122 modules with >500 kB warning; E2E 29/29; formatting/memory/whitespace pass.

## Latest Handoff

- Phase 7 implementation and automated gates are local on `dev` through result commit `1f3462b`; verification ledger: `docs/ai/2026-09-29-phase-7-audio-listening-verification.md`. Audio is 4.2 s, 201,644 bytes, mono 24 kHz PCM16; model/voice revisions and checksums are in `.provenance.json`. Human audition is the sole remaining phase sign-off; implementation has not been pushed.
- Phase 6 is integrated and pushed: local/remote `dev` at `520ee4d` (then memory reconciliation `9177cfa`). Verification/review: `docs/ai/2026-09-28-phase-6-learning-engine-verification.md`.
- Phase 5 is already pushed through `f4ac2be`. Minor evidence focus restoration Phase 4 remains deferred; dialogue has separate restoration verified.

## Required Reading

- `AGENTS.md`, `apps/game-web/AGENTS.md`, `docs/ai/README.md`.
- `docs/superpowers/specs/2026-09-29-phase-7-audio-listening-design.md`.
- `docs/02_ENGLISH_LEARNING_SYSTEM_DESIGN.md` §§4–7, 11–12, 24–26, 29–31; `docs/03_CASE_001_VERTICAL_SLICE_SPEC.md` §15; `docs/04_CODEX_IMPLEMENTATION_ROADMAP.md` §25.
- `docs/architecture/ARCHITECTURE.md`; `docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md`.
- Phase 5 spec/plan and `docs/ai/2026-09-28-phase-5-dialogue-verification.md` for behavior/save/input.
