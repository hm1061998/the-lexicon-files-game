---
schema_version: 1
updated_at: 2026-09-29T20:00:00+07:00
phase: phase-10
status: proposed
result_commit: 7ef61fd
active_spec: docs/superpowers/specs/2026-09-29-phase-10-persistence-settings-design.md
active_plan: docs/superpowers/plans/2026-09-29-phase-10-persistence-settings.md
---

## Metadata

- Snapshot duy trì bằng Git; `result_commit` là commit kết quả gần nhất trước lần cập nhật memory này.

## Current Phase

- Phase 10 — Persistence (roadmap §29): Settings riêng + kiểm chứng auto-save. Phase 9 đã hoàn tất.

## Active Goal

- Hoàn tất Case #001: buộc tội theo content/core, không mất tiến độ khi sai, đóng case đúng và hiện báo cáo case cùng chỉ số hồ sơ học tập.

## Current Status

- Phase 9 hoàn tất trên `dev`; verification ledger `docs/ai/2026-09-29-phase-9-case-completion-verification.md` (commit `6782d55`). Người dùng tự merge `main`.
- Phase 8: timeline/contradiction, Archive, save V3 migration, commerce provider trung lập mặc định `free`, notebook và E2E. Hoàn tất/push tại `3c67c11`.
- Phase 7 hoàn tất và push; user nghe audio và xác nhận test OK. Verification: `docs/ai/2026-09-29-phase-7-audio-listening-verification.md`.
- Phase 6 và Phase 5 hoàn tất; xem verification ledger tương ứng trong `docs/ai/`.

## Completed

- Phase 0A–4 đã có trong Git history.
- Phase 5 dialogue/NPC, validation, save V2 và UI/input; push `f4ac2be`.
- Phase 6 learning profile, notebook từ vựng, persistence riêng và recovery; verification `docs/ai/2026-09-28-phase-6-learning-engine-verification.md`.
- Phase 7 audio listening; verification và user audition đã được ghi nhận.
- Phase 8 spec/plan, implementation Task 1–6 và handoff đồng bộ với `origin/dev` tại `3c67c11`.
- Sau Phase 9 (`7ef61fd`): notebook có nút "Xem lại" mở lại modal evidence đã thu (audio/câu hỏi nghe); tương tác lại trong world vẫn không mở modal theo spec Phase 4 (đã bổ sung ghi chú).
- Phase 9: hợp đồng kết luận `0b5303c`, reducer + activation `f0f00ac`, save V4 `7122925`, UI buộc tội `53122bf`, báo cáo CASE CLOSED `568c68a`, E2E hành trình `6f5240b`, fix final review `f6346f2`, verification `6782d55`.

## In Progress

- Không có hạng mục đang mở.

## Active Decisions

- Tuân theo product truth trong docs/01–03 và dependency boundaries trong `docs/architecture/ARCHITECTURE.md`; khi tài liệu mâu thuẫn phải hỏi người dùng.
- Spec và implementation plan viết bằng tiếng Việt theo `AGENTS.md`.
- Dùng npm + Nx; không pnpm/yarn/bun. Không thêm dependency nếu native đủ dùng.
- `game-core`/`learning-engine` là TS thuần; UI gọi domain qua store/event boundary; không hardcode sự thật Case #001 trong React/Phaser.
- Gameplay local-first; không có API/backend cho Phase 9.
- Phase 9: `CaseDefinition.conclusion` optional; objective `activationCondition` do reconcile xử lý; `applyEffects` tự mở fact nên cờ thú nhận kéo theo `david_took_report`.
- Save hiện hành V4, IndexedDB database version 1; hợp đồng lịch sử V1/V2/V3 trong `cases/case-001/save-v*.json`.
- Case đóng: store chặn di chuyển, sổ tay, pause và mọi ghi tiến độ; báo cáo dựng lại từ save + `LanguageProfile` hiện tại.
- Commerce config Phase 8 trung lập, mặc định `free`, không paywall/entitlement client-side; Playwright worker = 1 cho thao tác di chuyển theo frames.
- Deferred minor Phase 9: đọc lại feedback sai khi chọn lại cùng nghi phạm; mã `unknownSuspect` khi case không có conclusion; store trả `ok` khi bỏ qua ghi sau đóng case; warning lint cũ `GameCanvas.tsx` (`initialSceneId`).

## Blockers

- Không có blocker hiện tại.

## Next Actions

- Người dùng review plan Phase 10 (7 task) và chọn Native hoặc Subagent-driven.

## Verification

- Phase 9 final (sau `npx nx reset`, commit `f6346f2`): lint PASS (7 projects, 1 warning cũ); test PASS (7 targets; game-web 203, game-content 93, game-core 49); build PASS (153 modules; chunk-size warning); typecheck, format, E2E (36 tests/1 worker), memory check và `git diff --check` PASS. API/dependency/lockfile không đổi.
- Phase 8 final: lint, test (game-web 173), build, typecheck, format, E2E (36), memory check PASS.
- Backend checks chỉ cần khi sửa `apps/api`.

## Latest Handoff

- Phase 9 đã thực thi Native theo plan `c676982`; rulings và deferred minor ghi trong báo cáo phiên và verification ledger.

## Required Reading

- `AGENTS.md`, `apps/game-web/AGENTS.md`, `docs/ai/README.md`.
- Active spec/plan theo metadata ở đầu file.
- `docs/ai/2026-09-29-phase-9-case-completion-verification.md` cho kết quả gate Phase 9.
- Docs/01–05, `docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md`, `docs/architecture/ARCHITECTURE.md` theo phạm vi phase.
