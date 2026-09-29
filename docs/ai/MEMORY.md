---
schema_version: 1
updated_at: 2026-09-29T07:00:35+07:00
phase: phase-7
status: proposed
result_commit: ccae148
active_spec: docs/superpowers/specs/2026-09-29-phase-7-audio-listening-design.md
active_plan: none
---

## Metadata

- Schema version 1; snapshot duy trì bằng Git.

## Current Phase

- Phase 7 — Audio / Listening (roadmap §26) đang chờ review spec tiếng Việt. Người dùng đã đồng ý dùng recording tạo tĩnh bằng Kokoro, execution inline và yêu cầu push implementation lên dev khi hoàn tất. Spec và plan phải viết bằng tiếng Việt.

## Active Goal

- Chờ người dùng review/duyệt Phase 7 spec trước khi lập implementation plan. Chưa sửa product code, chưa tạo asset audio.

## Current Status

- Working branch `dev` có ba commit local từ lúc remote ở `9177cfa`, gồm spec tiếng Việt mới nhất `ccae148`; `origin/dev` vẫn ở `9177cfa`. Chưa push khi spec còn chờ user review.
- Phase 6 remains complete and pushed to `origin/dev` at `520ee4d`; the memory reconciliation commit `9177cfa` is on both local and remote dev.

## Completed

- Phase 0A, 0B, 1, 2: xem Git history.
- Phase 3 tại `200399b`; Phase 4 tại `7d4405a`, remote checkpoint `2595afd`.
- Phase 5 complete tại `30fb676`: ba NPC/dialogue, runner/progress, validation/build gate, save schema 2 migration, accessible UI/input/focus, physical double-click review fix. Push origin/dev thành công tới `f4ac2be`; xem `docs/ai/2026-09-28-phase-5-dialogue-verification.md`.
- Phase 6: catalogue 20 lemmas, UTF-16 content spans/validation, pure seen-only reducer, separate IndexedDB profile/recovery/autosave, accessible inline inspection, Beginner/Learning/Immersion modes, tutorial, encountered-only notebook, E2E reload/recovery. Case truth, evidenceTotal 5, case save schema 2/database 1, API và dependencies không đổi.
- Independent review: không có Critical; năm Important findings đã sửa (preserve stage, strict encounter/context count, popup focus/ARIA/content, notebook metadata/modes/inline evidence, E2E recovery/hidden-context/keyboard coverage). Review ledger: `docs/ai/2026-09-28-phase-6-learning-engine-verification.md`.

## In Progress

- Phase 7 design spec đã chuyển hoàn toàn sang tiếng Việt, self-review placeholder/consistency/scope và commit local. Đang chờ user review; chưa có implementation plan.

## Active Decisions

- Product/case truth theo docs/01–03; phase theo roadmap; dependency boundaries theo ARCHITECTURE.md. Không tự sửa rule khi thiếu/mâu thuẫn.
- npm + Nx bắt buộc; local runtime `.superpowers/runtime/npm-10.9.7/bin`, `C:/Windows/System32` trên PATH; `NX_DAEMON=false` khi checks. Không thêm dependency/đổi lockfile.
- Gameplay local-first; core engines TS thuần; learning reducer không nằm trong Phaser. Backend ngoài scope Phase 6.
- Case save schema 2/database 1 giữ evidence/facts/objectives/flags; learning profile/settings ở DB riêng.
- Phase 5 ba NPC/Main Office/ph_npc prototype đã duyệt; conditional David chỉ fixture trước Phase 8. Không làm detector/accusation trong Phase 6.
- Meeting Minutes vẫn evidence collectible mẫu duy nhất, evidenceTotal=5. Catalogue 20 từ không tự đồng nghĩa encountered=20.
- Phase 6 phương án A/seen-only: chỉ unique vocabulary/context pair tăng encounter; inspection/translation không promote stage; giữ stage cao hơn nếu profile tương lai đã đạt.
- Phase 7 phạm vi đề xuất: một phone recording Case #001 của Leo (20:29), playback/replay qua Howler, ba listening mode hiện có, data-driven task effects, counter cục bộ, không TTS/API runtime hay microphone. Preset voice Kokoro cần rà soát provenance/license; license model đơn lẻ chưa đủ.
- Playwright workers=1 do movement theo frames.

## Blockers

- User written-spec review is the current workflow gate. Git metadata initially denied writes; approved elevated git staging/commit succeeded. No technical blocker known.

## Next Actions

- User review/duyệt spec tiếng Việt `docs/superpowers/specs/2026-09-29-phase-7-audio-listening-design.md`.
- Nếu được duyệt, dùng writing-plans để viết Phase 7 plan bằng tiếng Việt; chờ user duyệt plan trước khi thực thi.
- Implement inline, generate/verify the recording asset and provenance, run all repo gates, update verification and memory, then integrate/push to dev per user request.

## Verification

- Phase 7 spec tiếng Việt: placeholder scan PASS; `git diff --check` PASS; Prettier check PASS. Không chạy product tests vì không sửa code. Bản dịch spec commit: `ccae148`.
- Phase 6 final: `npm run lint` PASS (7 Nx projects); `npm run test` PASS (25 files / 136 tests); `npm run build` PASS (134 modules; chunk warning: JS 1,761.37 kB, gzip 423.69 kB); `npm run typecheck` PASS; `npm run format:check` PASS; `npm run test:e2e` PASS (31 tests, 1 worker); `npm run memory:check` PASS; `npm run memory:test` PASS (30); `git diff --check` PASS.
- Backend checks not run because `apps/api` unchanged. `npm ci` earlier reported 7 existing audit advisories (3 moderate, 3 high, 1 critical); no dependency was changed.
- Phase 5 historical verification: lint 7 projects; 204 Vitest + 30 memory tests; build 122 modules with >500 kB warning; E2E 29/29; formatting/memory/whitespace pass.

## Latest Handoff

- Phase 7 spec tiếng Việt commit local tại `ccae148`; snapshot memory kế tiếp ghi nhận kết quả này. Chưa push design khi chưa được user duyệt. User đã cho phép push implementation hoàn tất lên dev.
- Phase 6 is integrated and pushed: local/remote `dev` at `520ee4d` (then memory reconciliation `9177cfa`). Verification/review: `docs/ai/2026-09-28-phase-6-learning-engine-verification.md`.
- Phase 5 is already pushed through `f4ac2be`. Minor evidence focus restoration Phase 4 remains deferred; dialogue has separate restoration verified.

## Required Reading

- `AGENTS.md`, `apps/game-web/AGENTS.md`, `docs/ai/README.md`.
- `docs/superpowers/specs/2026-09-29-phase-7-audio-listening-design.md`.
- `docs/02_ENGLISH_LEARNING_SYSTEM_DESIGN.md` §§4–7, 11–12, 24–26, 29–31; `docs/03_CASE_001_VERTICAL_SLICE_SPEC.md` §15; `docs/04_CODEX_IMPLEMENTATION_ROADMAP.md` §25.
- `docs/architecture/ARCHITECTURE.md`; `docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md`.
- Phase 5 spec/plan and `docs/ai/2026-09-28-phase-5-dialogue-verification.md` for behavior/save/input.
