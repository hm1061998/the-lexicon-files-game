---
schema_version: 1
updated_at: 2026-10-01T15:00:00+07:00
phase: phase-12
status: not_started
result_commit: a031ec3
active_spec: none
active_plan: none
---

## Metadata

- Người dùng chốt Phase 11 (kể cả 11E) vào 2026-10-01 và yêu cầu bắt đầu Phase 12. Các việc tồn đọng của Phase 11 làm sau Phase 12.
- Phase 12 = Testing & Performance (roadmap mục 31). Workflow: brainstorming → spec tiếng Việt → plan → thực thi. Chưa có spec/plan được duyệt.

## Current Phase

- Phase 12 — Testing & Performance: not_started (đang chuẩn bị brainstorming). Phase 11 đã đóng với danh sách hoãn bên dưới.

## Active Goal

- Hardening MVP: unit/E2E theo roadmap mục 31, hiệu năng (atlas, lazy assets, không leak, cleanup scene).

## Current Status

- Phase 0A–11E hoàn tất ở mức người dùng chốt. Branch dev, result a031ec3, chưa push.
- Full E2E gần nhất 122/123; lỗi duy nhất (oracle tốc độ phím) đã nới và pass khi chạy riêng. Chưa có lượt full xanh sau sửa cuối.

## Completed

- Phase11E navigation: zoom/camera, minimap, HUD chuột 44px, A* + click-to-move, mũi tên, cổng đồng Office/Archive, nhạc Mystical Piano + footsteps CC0.
- Sửa cuối Phase 11: bubble tương tác thêm vị trí phía trên mục tiêu; dời ghế khỏi bục cổng Office (+ regression geometry); delay 250ms fallback prompt; cập nhật E2E oracle cũ.

## In Progress

- Chưa có. Bước tiếp theo là brainstorming Phase 12.

## Active Decisions

- Native inline trên dev, npm + Nx, không dependency/backend mới nếu không cần.
- Hoãn sang sau Phase 12 (nợ Phase 11): (1) browser regression cho 5 lỗi review: minimap chặn click, giữ mũi tên khi pause/resume/native repeat/form control, alpha tường, tốc độ route; (2) chẩn đoán test resize lệch ~18px thỉnh thoảng; (3) full E2E xanh liên tục; (4) người dùng nghe/xem chấp nhận nhạc, bước chân, cổng đồng; (5) Node 22 chưa xác minh tươi.
- Giữ nguyên hai file debug.log untracked, không stage (dùng `git add` theo đường dẫn cụ thể).
- Git cần `-c safe.directory=F:/work/the-lexicon-files-game`; PATH thêm `.superpowers/runtime/npm-shim`, `NX_DAEMON=false`.

## Blockers

- Không có.

## Next Actions

1. Brainstorming Phase 12 với người dùng, viết spec tiếng Việt vào docs/superpowers/specs/2026-10-01-phase-12-testing-performance-design.md.
2. Sau khi spec được duyệt: writing-plans rồi thực thi. Không đụng nợ Phase 11 trừ khi spec Phase 12 gộp vào.

## Verification

- Trên a031ec3-trước-sửa-cuối: lint 7 project, test, build, format, tsc -b pass; frontend 499 test; E2E 122/123 (xem .superpowers/sdd/2026-10-01-phase-11e-navigation-portals/e2e-run5.log, ignored). Không có thay đổi backend.

## Latest Handoff

- Chi tiết Phase 11E: docs/ai/2026-10-01-phase-11e-navigation-portals-handoff.md (một phần lỗi trong đó đã được sửa). Memory này thay thế các mục cũ.

## Required Reading

- AGENTS.md, apps/game-web/AGENTS.md, docs/ai/README.md, docs/04_CODEX_IMPLEMENTATION_ROADMAP.md (mục 31), docs/architecture/ARCHITECTURE.md.
