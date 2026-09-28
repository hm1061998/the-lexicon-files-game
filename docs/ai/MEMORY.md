---
schema_version: 1
updated_at: 2026-09-29T06:56:57+07:00
phase: phase-7
status: proposed
result_commit: 8b4571a
active_spec: docs/superpowers/specs/2026-09-29-phase-7-audio-listening-design.md
active_plan: none
---

## Metadata

- Schema version 1; snapshot duy trì bằng Git.

## Current Phase

- Phase 7 — Audio / Listening (roadmap §26) đang ở cổng review written spec. Người dùng đã đồng ý dùng recording tạo tĩnh bằng Kokoro, execution inline và yêu cầu push implementation lên dev khi hoàn tất.

## Active Goal

- Chờ người dùng review/duyệt Phase 7 spec trước khi lập implementation plan. Chưa sửa product code, chưa tạo asset audio.

## Current Status

- Working branch `dev` has local design commit `8b4571a`; `origin/dev` remains `9177cfa`. The design commit has not been pushed pending the required user review of the written spec.
- Phase 6 remains complete and pushed to `origin/dev` at `520ee4d`; the memory reconciliation commit `9177cfa` is on both local and remote dev.

## Completed

- Phase 0A, 0B, 1, 2: xem Git history.
- Phase 3 tại `200399b`; Phase 4 tại `7d4405a`, remote checkpoint `2595afd`.
- Phase 5 complete tại `30fb676`: ba NPC/dialogue, runner/progress, validation/build gate, save schema 2 migration, accessible UI/input/focus, physical double-click review fix. Push origin/dev thành công tới `f4ac2be`; xem `docs/ai/2026-09-28-phase-5-dialogue-verification.md`.
- Phase 6: catalogue 20 lemmas, UTF-16 content spans/validation, pure seen-only reducer, separate IndexedDB profile/recovery/autosave, accessible inline inspection, Beginner/Learning/Immersion modes, tutorial, encountered-only notebook, E2E reload/recovery. Case truth, evidenceTotal 5, case save schema 2/database 1, API và dependencies không đổi.
- Independent review: không có Critical; năm Important findings đã sửa (preserve stage, strict encounter/context count, popup focus/ARIA/content, notebook metadata/modes/inline evidence, E2E recovery/hidden-context/keyboard coverage). Review ledger: `docs/ai/2026-09-28-phase-6-learning-engine-verification.md`.

## In Progress

- Phase 7 design spec is written, self-reviewed for placeholders/consistency/scope, and committed locally. Waiting for user review; no implementation plan exists yet.

## Active Decisions

- Product/case truth theo docs/01–03; phase theo roadmap; dependency boundaries theo ARCHITECTURE.md. Không tự sửa rule khi thiếu/mâu thuẫn.
- npm + Nx bắt buộc; local runtime `.superpowers/runtime/npm-10.9.7/bin`, `C:/Windows/System32` trên PATH; `NX_DAEMON=false` khi checks. Không thêm dependency/đổi lockfile.
- Gameplay local-first; core engines TS thuần; learning reducer không nằm trong Phaser. Backend ngoài scope Phase 6.
- Case save schema 2/database 1 giữ evidence/facts/objectives/flags; learning profile/settings ở DB riêng.
- Phase 5 ba NPC/Main Office/ph_npc prototype đã duyệt; conditional David chỉ fixture trước Phase 8. Không làm detector/accusation trong Phase 6.
- Meeting Minutes vẫn evidence collectible mẫu duy nhất, evidenceTotal=5. Catalogue 20 từ không tự đồng nghĩa encountered=20.
- Phase 6 phương án A/seen-only: chỉ unique vocabulary/context pair tăng encounter; inspection/translation không promote stage; giữ stage cao hơn nếu profile tương lai đã đạt.
- Phase 7 proposed scope: one authored Case #001 Leo phone recording (20:29), Howler playback/replay, three existing listening support modes, data-driven task effects, local-only counters, no runtime TTS/API or microphone. Kokoro asset voice preset requires provenance/license review; model license alone is insufficient.
- Playwright workers=1 do movement theo frames.

## Blockers

- User written-spec review is the current workflow gate. Git metadata initially denied writes; approved elevated git staging/commit succeeded. No technical blocker known.

## Next Actions

- User reviews/approves `docs/superpowers/specs/2026-09-29-phase-7-audio-listening-design.md`.
- If approved, invoke writing-plans and create Phase 7 plan; wait for plan approval and execution-method confirmation as required by that skill.
- Implement inline, generate/verify the recording asset and provenance, run all repo gates, update verification and memory, then integrate/push to dev per user request.

## Verification

- Phase 7 spec: placeholder scan PASS; length under 12 KB; `git diff --check` PASS before commit. No product tests run because product code is unchanged. Spec commit: `8b4571a`.
- Phase 6 final: `npm run lint` PASS (7 Nx projects); `npm run test` PASS (25 files / 136 tests); `npm run build` PASS (134 modules; chunk warning: JS 1,761.37 kB, gzip 423.69 kB); `npm run typecheck` PASS; `npm run format:check` PASS; `npm run test:e2e` PASS (31 tests, 1 worker); `npm run memory:check` PASS; `npm run memory:test` PASS (30); `git diff --check` PASS.
- Backend checks not run because `apps/api` unchanged. `npm ci` earlier reported 7 existing audit advisories (3 moderate, 3 high, 1 critical); no dependency was changed.
- Phase 5 historical verification: lint 7 projects; 204 Vitest + 30 memory tests; build 122 modules with >500 kB warning; E2E 29/29; formatting/memory/whitespace pass.

## Latest Handoff

- Phase 7 spec is committed locally at `8b4571a`; this memory snapshot records that result. Do not push the design until the user approves it. The user earlier authorized pushing completed implementation to dev.
- Phase 6 is integrated and pushed: local/remote `dev` at `520ee4d` (then memory reconciliation `9177cfa`). Verification/review: `docs/ai/2026-09-28-phase-6-learning-engine-verification.md`.
- Phase 5 is already pushed through `f4ac2be`. Minor evidence focus restoration Phase 4 remains deferred; dialogue has separate restoration verified.

## Required Reading

- `AGENTS.md`, `apps/game-web/AGENTS.md`, `docs/ai/README.md`.
- `docs/superpowers/specs/2026-09-29-phase-7-audio-listening-design.md`.
- `docs/02_ENGLISH_LEARNING_SYSTEM_DESIGN.md` §§4–7, 11–12, 24–26, 29–31; `docs/03_CASE_001_VERTICAL_SLICE_SPEC.md` §15; `docs/04_CODEX_IMPLEMENTATION_ROADMAP.md` §25.
- `docs/architecture/ARCHITECTURE.md`; `docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md`.
- Phase 5 spec/plan and `docs/ai/2026-09-28-phase-5-dialogue-verification.md` for behavior/save/input.
