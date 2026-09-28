---
schema_version: 1
updated_at: 2026-09-28T16:49:07+07:00
phase: phase-4
status: in_progress
result_commit: fcb534f
active_spec: docs/superpowers/specs/2026-09-28-phase-4-evidence-notebook-design.md
active_plan: docs/superpowers/plans/2026-09-28-phase-4-evidence-notebook.md
---

## Metadata

- Schema version 1; snapshot được duy trì bằng Git.

## Current Phase

- Phase 4 — Evidence + Notebook (roadmap §23).

## Active Goal

- Thực thi Phase 4 inline trên nhánh `dev` hiện tại theo plan đã duyệt; push sau khi hoàn tất và verification đạt.

## Current Status

- Spec và plan Phase 4 viết bằng tiếng Việt, được người dùng duyệt và commit tại `fcb534f`.
- Implementation chưa bắt đầu; workspace sạch trước checkpoint, bắt đầu từ Task 1 trong plan.
- Lần thực thi dùng checkout hiện tại theo yêu cầu người dùng, không tạo worktree.

## Completed

- Phase 0A, 0B, 1 và 2 hoàn thành (xem Git history).
- Phase 3 hoàn thành tại `200399b`: shared contracts, content loader, pure reducer, app bridge/store/HUD, verification và review fix.

## In Progress

- Phase 4 implementation trên `dev`; Task 1 chưa bắt đầu.

## Active Decisions

- Phase 4 chỉ dùng evidence `meeting_minutes` hiện có làm mẫu end-to-end; giữ `evidenceTotal: 5` và không thêm corpus khác.
- Evidence IDs nằm trong `game-core.GameState`; Zustand chỉ projection state nghiệp vụ và giữ UI transient riêng.
- Một save hiện hành cho Case #001 ở IndexedDB qua `idb`; schema version, backup dữ liệu lỗi, không ghi đè bằng save mới nếu chưa xác nhận.
- Nạp save trước khi mount Phaser; autosave khi `caseState` đổi, không lưu UI-only state.
- EvidenceModal mở khi evidence mới được thêm; `J` mở notebook mặc định tab Evidence; People/Vocabulary chỉ là khung.
- Modal/notebook khóa input; Escape đóng overlay trước khi pause; shortcut bỏ qua trường nhập liệu.
- Phaser chỉ phát typed event; content JSON/Zod là nguồn UI copy và effect.
- Spec/plan cần duyệt luôn viết bằng tiếng Việt.
- Dùng npm + Nx; không thêm dependency; không sửa backend trong phase này.

## Blockers

- Chưa có blocker đã xác nhận.

## Next Actions

- Hoàn thành Task 1: thêm tương tác content cho `meeting_minutes` và test loader.
- Tiếp tục lần lượt Tasks 2–6 theo active plan; giữ TDD và chạy verification từng task.
- Cập nhật ledger dưới `.superpowers/sdd/2026-09-28-phase-4-evidence-notebook/` sau mỗi task/decision.
- Chạy DoD Phase 4, review toàn nhánh, cập nhật memory rồi push `dev` theo yêu cầu.

## Verification

- Phase 4 chưa có verification implementation; spec/plan commit `fcb534f` là checkpoint hiện tại.
- Phase 3 verification/review đã pass tại `200399b`; xem lịch sử phiên bản trước của memory và Git history.

## Latest Handoff

- Branch `dev` hiện ở `fcb534f`, một commit ahead of `origin/dev`; chỉ có spec/plan Phase 4 được commit, code chưa bắt đầu. Tiếp tục Task 1.

## Required Reading

- `AGENTS.md`
- `apps/game-web/AGENTS.md`
- `docs/superpowers/specs/2026-09-28-phase-4-evidence-notebook-design.md`
- `docs/superpowers/plans/2026-09-28-phase-4-evidence-notebook.md`
