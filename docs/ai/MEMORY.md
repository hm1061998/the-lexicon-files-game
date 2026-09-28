---
schema_version: 1
updated_at: 2026-09-28T17:44:00+07:00
phase: phase-4
status: in_progress
result_commit: 7d4405a
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

- Spec và plan Phase 4 viết bằng tiếng Việt, được duyệt tại `fcb534f`; implementation Tasks 1–6 đã commit tại `7d4405a`.
- Review độc lập không thấy Critical; hai Important đã sửa test-first; còn một Minor về focus restoration được hoãn.
- Lần thực thi dùng checkout `dev` theo yêu cầu người dùng, không tạo worktree. Còn push các commit đã duyệt lên `origin/dev`.

## Completed

- Phase 0A, 0B, 1 và 2 hoàn thành (xem Git history).
- Phase 3 hoàn thành tại `200399b`: shared contracts, content loader, pure reducer, app bridge/store/HUD, verification và review fix.
- Phase 4 Evidence + Notebook hoàn thành implementation tại `7d4405a`: evidence tương tác, modal/notebook, IndexedDB backup/recovery, bootstrap/autosave và E2E reload.

## In Progress

- Delivery Phase 4: implementation đã verified và commit trên `dev`; cần push lên `origin/dev` theo chỉ thị.

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
- Environment không có `npm` trên PATH; verification chạy bằng local Node/Vitest/Playwright/ESLint/TypeScript/Vite CLIs và Nx memory check.

## Blockers

- Chưa có blocker đã xác nhận.

## Next Actions

- Push commit `7d4405a` và các commit Phase 4 trước đó lên `origin/dev`.
- Sau khi push thành công, cập nhật status/handoff thành complete nếu không còn việc Phase 4.

## Verification

- Phase 4 final: Vitest 158/158; Playwright E2E 21/21; ESLint pass; `tsc -b` pass; Prettier pass; Vite production build pass (bundle >500 kB warning); `git diff --check` pass.
- Root `npm run ...` scripts không chạy vì `npm` không có trong PATH; local Node CLIs thực hiện kiểm tra tương đương. `node node_modules/nx/bin/nx.js run ai-memory:check` pass trước cập nhật checkpoint này.
- Phase 3 verification/review đã pass tại `200399b`; xem lịch sử phiên bản trước của memory và Git history.

## Latest Handoff

- Branch `dev` hiện ở `7d4405a`, ba commit ahead of `origin/dev` (`fcb534f`, `35ce7b6`, `7d4405a`); code và docs Phase 4 đã committed, verified và reviewed. Push theo yêu cầu đã giao; sau đó lưu status cuối.

## Required Reading

- `AGENTS.md`
- `apps/game-web/AGENTS.md`
- `docs/superpowers/specs/2026-09-28-phase-4-evidence-notebook-design.md`
- `docs/superpowers/plans/2026-09-28-phase-4-evidence-notebook.md`
