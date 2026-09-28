---
schema_version: 1
updated_at: 2026-09-28T22:52:15+07:00
phase: phase-6
status: in_progress
result_commit: 1740877
active_spec: docs/superpowers/specs/2026-09-28-phase-6-learning-engine-design.md
active_plan: docs/superpowers/plans/2026-09-28-phase-6-learning-engine.md
---

## Metadata

- Schema version 1; snapshot duy trì bằng Git.

## Current Phase

- Phase 6 — Learning Engine (roadmap §25): written spec phương án A và plan đã được duyệt; triển khai inline đang chạy trong managed worktree.

## Active Goal

- Thêm learning theo ngữ cảnh trong evidence/dialogue hiện có: click-to-learn, translation modes, vocabulary notebook và profile giữ sau reload. Chờ duyệt spec trước writing-plans/code.

## Current Status

- Người dùng yêu cầu “tiếp tục” sau push Phase 5. Git đầu phiên dev sạch tại f4ac2be, khớp origin/dev. Spec Phase 6 commit local 297eb98, plan commit local 1740877; chưa push.
- learning-engine/src/index.ts export rỗng; vocabulary.json là {}; loader chưa đọc vocabulary; notebook Vocabulary empty state; learning profile/settings chưa lưu.
- Spec đề xuất phương án A đủ 20 catalogue words của docs/03 §15, annotations trong evidence description/dialogue node text, modes Beginner/Learning/Immersion, profile/recovery riêng với case save.
- Điểm chờ duyệt: gameplay hiện chỉ unknown→seen; tra từ không là bằng chứng recognized/mastered. Từ chưa xuất hiện trong prototype không được tự thêm notebook.
- Không sửa product code, dependency hoặc product rules; chưa lập plan implementation.

## Completed

- Phase 0A, 0B, 1, 2: xem Git history.
- Phase 3 tại 200399b; Phase 4 tại 7d4405a, remote checkpoint 2595afd.
- Phase 5 complete tại 30fb676: ba NPC/dialogue, runner/progress, validation/build gate, save schema 2 migration, accessible UI/input/focus, physical double-click review fix. Push origin/dev thành công tới f4ac2be gồm memory; xem docs/ai/2026-09-28-phase-5-dialogue-verification.md.
- Phase 6 đã đọc docs/02, Case #001 vocabulary targets, roadmap §25 và architecture; spec phương án A tại 297eb98 đã được người dùng duyệt. Plan sáu tasks/TDD tại 1740877 đã tự rà format/paths/review focus và được người dùng duyệt cùng lựa chọn inline.

## In Progress

- Writing-plans hoàn tất cho scope Phase 6 đã duyệt; plan đã duyệt, đang triển khai inline trong managed worktree.

## Active Decisions

- Product/case truth theo docs/01–03; phase theo roadmap; dependency boundaries theo ARCHITECTURE.md. Không tự sửa rule khi thiếu/mâu thuẫn.
- Spec/plan bằng tiếng Việt; spec approval cho phép writing-plans, plan cần review và chọn execution trước code.
- npm + Nx bắt buộc; runtime local .superpowers/runtime/npm-10.9.7/bin + C:/Windows/System32 trong PATH; NX_DAEMON=false khi checks. Không thêm dependency/đổi lockfile.
- Gameplay local-first; core engines TS thuần; learning không đặt trong Phaser. Backend ngoài scope Phase 6.
- GameState/save schema 2 giữ evidence/facts/objectives/flags; session UI transient. Phase 6 đề xuất profile/settings repository riêng để không thay case save.
- Phase 5 ba NPC/Main Office/ph_npc prototype đã duyệt; conditional David chỉ fixture trước Phase 8. Không làm detector/accusation trong Phase 6.
- Meeting Minutes vẫn evidence collectible mẫu duy nhất, evidenceTotal=5. Catalogue 20 từ không tự đồng nghĩa encountered=20.
- Phase 6 phương án A/seen-only, dedupe context, authored spans/translations và learning database riêng hiện là đề xuất trong spec, chưa quyết định triển khai.
- Playwright workers=1 do movement theo frames; bản sửa Phase 5 đã pass whole suite.

## Blockers

- Không có blocker kỹ thuật đã xác nhận. Scope/stage policy Phase 6 chờ duyệt written spec; chưa phải lỗi implementation.

## Next Actions

- Tiếp tục Task 1 theo plan; cập nhật ledger sau mỗi task và chạy DoD ở Task 6.
- Chỉ push draft tài liệu Phase 6 sau khi được xác nhận; push dev Phase 5 đã hoàn thành.

## Verification

- Phiên Phase 6 chỉ thay tài liệu: Prettier check spec/plan PASS; memory check PASS sau cập nhật snapshot. Baseline worktree: `npm ci` added 336 packages from lockfile; `npm run test` PASS 127/127. npm reported 7 existing dependency advisories (3 moderate, 3 high, 1 critical). Task 1 tests chưa chạy.
- Phase 5 verification lịch sử ở bản sửa cuối: lint7 projects PASS, 204 Vitest +30 memory tests, build122 modules PASS (bundle warning >500 kB), E2E29/29 (1.9m), format/memory/whitespace PASS. Không chạy lại các suite này trong phiên brainstorming.

## Latest Handoff

- Spec A tại 297eb98 đã được duyệt; plan tại 1740877 local, chờ review/execution choice, chưa push. Scope A: catalogue20, contextual inspect/modes/notebook/profile; actual stages tối đa seen khi chưa assessment. Chờ written-spec approval rồi plan, không coi “tiếp tục” là duyệt artifact chưa tồn tại.
- Phase 5 đã push tới f4ac2be. Minor evidence focus restoration Phase 4 vẫn hoãn; dialogue có restoration riêng đã verify.

## Required Reading

- AGENTS.md, apps/game-web/AGENTS.md, docs/ai/README.md.
- docs/superpowers/specs/2026-09-28-phase-6-learning-engine-design.md.
- docs/02_ENGLISH_LEARNING_SYSTEM_DESIGN.md §§4–7, 11–12, 24–26, 29–31; docs/03_CASE_001_VERTICAL_SLICE_SPEC.md §15; docs/04_CODEX_IMPLEMENTATION_ROADMAP.md §25.
- docs/architecture/ARCHITECTURE.md; docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md.
- Phase 5 spec/plan và docs/ai/2026-09-28-phase-5-dialogue-verification.md để giữ behavior/save/input.
