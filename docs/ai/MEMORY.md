---
schema_version: 1
updated_at: 2026-09-28T18:56:42+07:00
phase: phase-5
status: proposed
result_commit: 6890b4e
active_spec: docs/superpowers/specs/2026-09-28-phase-5-dialogue-design.md
active_plan: none
---

## Metadata

- Schema version 1; snapshot được duy trì bằng Git.

## Current Phase

- Phase 5 — Dialogue (roadmap §24), đang đề xuất thiết kế; chưa bắt đầu implementation.

## Active Goal

- Tiếp tục từ Phase 4 theo yêu cầu đọc memory và làm tiếp; chuẩn bị spec Phase 5 tiếng Việt để review, rồi mới lập plan và triển khai.

## Current Status

- Git đầu phiên: checkout dev sạch, HEAD 2595afd, khớp origin/dev. Phase 4 đã push; dòng memory cũ “còn push” là stale.
- Bản nháp spec Phase 5 commit tại 6890b4e; chưa duyệt, chưa có plan, chưa sửa code game và chưa push tài liệu đề xuất.
- Content chỉ có Main Office và Anna placeholder; dialogues JSON trống, loader/types chưa có NPC/dialogue. Save version 1 kiểm tra đúng tập objective keys nên objective mới cần migration.

## Completed

- Phase 0A, 0B, 1, 2 hoàn thành; xem Git history.
- Phase 3 hoàn thành tại 200399b: contracts, loader, pure reducer, bridge/store/HUD và review fix.
- Phase 4 hoàn thành tại 7d4405a: evidence mẫu, modal/notebook, IndexedDB backup/recovery, bootstrap/autosave và E2E reload; đồng bộ remote tới checkpoint 2595afd.

## In Progress

- Brainstorming Phase 5: đã khảo sát docs/code/concept và viết bản nháp spec; chờ review phạm vi trước writing-plans.

## Active Decisions

- Product/case truth và copy theo docs/01–03; phase theo roadmap; dependency boundaries theo ARCHITECTURE.md.
- Spec/plan cần duyệt viết bằng tiếng Việt; không coi bản nháp là phạm vi implementation đã được duyệt.
- npm + Nx là workflow bắt buộc; không thay package manager.
- Core state là nguồn evidence/facts/objectives/flags; UI transient không nằm trong save.
- Phase 4 chỉ có meeting_minutes làm mẫu end-to-end, evidenceTotal vẫn 5; People/Vocabulary đang là khung.
- Gameplay local-first; không sửa backend hoặc thực hiện phase sau ngoài phạm vi được duyệt.
- Ba NPC trong Main Office prototype và conditional David bằng fixture là đề xuất Phase 5, chưa phải quyết định đã duyệt.

## Blockers

- Chưa có blocker implementation đã xác nhận; đang ở bước review spec.
- Môi trường hiện tại: Node v24.19.0; npm/npx không có trên PATH, không tìm thấy local Prettier ở node_modules/prettier/bin/prettier.cjs. Cần xác định runtime/dependencies trước verification implementation.

## Next Actions

- Người dùng review spec Phase 5, đặc biệt phương án A: ba NPC trong Main Office prototype và giới hạn conditional dialogue trước Phase 8.
- Khi spec được duyệt, dùng writing-plans viết plan tiếng Việt rồi trình duyệt và chọn cách thực thi.
- Xác định npm/runtime/dependencies khi bắt đầu implementation; chạy lệnh DoD thật và báo mọi lệnh bị chặn.
- Chỉ push spec/plan sau khi người dùng xác nhận theo docs/ai/README.md.

## Verification

- Phiên này chỉ thay tài liệu: Git whitespace check không có lỗi; memory CLI chạy trực tiếp bằng node tools/ai-memory/src/cli.mjs PASS sau cập nhật. Không chạy lint/test/build game, không tuyên bố implementation Phase 5 hoàn tất.
- Prettier không chạy được: MODULE_NOT_FOUND cho node_modules/prettier/bin/prettier.cjs. npm/npx không có trên PATH.
- Phase 4 verification lịch sử: Vitest 158/158, Playwright 21/21, ESLint/tsc/Prettier/Vite build pass; bundle warning >500 kB. Chưa chạy lại trong phiên này; root npm scripts khi đó cũng không chạy được.

## Latest Handoff

- Spec Phase 5 đề xuất local tại 6890b4e, chưa duyệt/chưa push. Không triển khai từ draft; bước kế tiếp review spec rồi writing-plans. Phase 4 còn một Minor focus restoration đã hoãn; spec Phase 5 đề xuất focus handling cho dialogue.

## Required Reading

- AGENTS.md, apps/game-web/AGENTS.md, docs/ai/README.md.
- docs/superpowers/specs/2026-09-28-phase-5-dialogue-design.md.
- docs/03_CASE_001_VERTICAL_SLICE_SPEC.md §7, §9–§12; docs/04_CODEX_IMPLEMENTATION_ROADMAP.md §24.
- Spec và plan Phase 4 để giữ behavior/persistence đã có.
