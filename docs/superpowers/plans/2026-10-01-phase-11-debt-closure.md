# Nợ Phase 11 — Implementation Plan

> **For agentic workers:** dùng `executing-plans`, Native inline theo lựa chọn đã lưu. Người dùng chấp nhận Phase 12 và yêu cầu giải quyết nợ Phase 11 ngày 2026-10-01; không chờ duyệt lại phạm vi sửa lỗi đã chốt.

**Goal:** Đóng nợ kỹ thuật điều hướng Phase 11 và cung cấp artifact nghiệm thu hình/nhạc.

**Architecture:** Giữ collision/projection/input Phaser và typed bus hiện tại; bổ sung regression unit/browser, chỉ sửa root cause đã đo. Debug chỉ đọc hoặc điều khiển test hiện có, không trở thành gameplay API.

**Tech Stack:** TypeScript strict, Phaser, React, Vitest, Playwright, npm + Nx, Windows.

**Spec:** `docs/superpowers/specs/2026-10-01-phase-11e-navigation-portals-design.md`; nợ được ghi trong memory và `2026-10-01-phase-12-verification.md`.

## Global Constraints

- Tiếp tục dev tại chỗ, không dependency/backend mới; giữ debug.log không stage, không push.
- Chỉ nợ Phase 11; các Minor Phase 12 không mở rộng vào lượt này.
- Click xa đi tới, click lại tương tác; không auto trigger. Collision body0.36, speed220 projected px/s.
- E2E một worker; không chỉnh runtime trong lúc E2E chạy. Không nới tolerance để ép pass.
- Acceptance nhạc/hình Phase 11 được người dùng xác nhận riêng, sau acceptance Phase 12.

## Review Focus

- Resize camera/canvas và điểm click phải cùng hệ tọa độ.
- Minimap drawing/legend/padding không click xuyên.
- Held key/repeat sau modal, form arrow và scene cleanup.
- Alpha thực của wall texture khác sprite bounding rectangle.
- Passage hẹp lệch grid và tốc độ route qua nhiều waypoint ở30/60/120FPS.

## Task 1 — Regression các sửa review và chẩn đoán resize

- [x] Đọc Git để bỏ các lỗi handoff cũ đã sửa trước Phase12; rerun navigation/input/pointer unit group.
- [x] Thêm E2E `feedback-navigation-review.spec.ts`: map surface/legend/padding, held Arrow pause/resume/repeat và native form controls; wall transparent/opaque pixels.
- [x] Đo click resize thực bằng pointer/camera tại event, chỉ sửa runtime nếu tái hiện được lỗi; ghi rõ trường hợp không tái hiện; dùng `feedback-navigation.spec.ts` hiện có làm regression.
- [x] Sửa tối thiểu root cause, chạy GREEN unit + browser regression. Thêm coverage authored geometry từ mọi spawn, corridor và speed nếu unit hiện có chưa đủ.
- [x] Commit kết quả có kiểm tra.

## Task 2 — Node22 và artifact nghiệm thu

- [x] Tìm runtime Node22 local; nếu thiếu tải binary official vào scratch, kiểm checksum và chỉ dùng cho verification (không đổi cài đặt hệ thống).
- [x] Chạy lint/test/build/typecheck trên Node22; log Node/npm versions thực.
- [x] Chụp cổng Office/Archive desktop/compact và nhạc hiện tại để user xem/nghe; hỏi chấp nhận khi artifact sẵn. Không đánh dấu subjective complete nếu chưa có trả lời.

## Task 3 — Đóng kỹ thuật, giữ bằng chứng

- [x] Full E2E trên Node22 một worker; chỉ rerun khi fail/change justify, nếu lỗi flake chẩn đoán trước sửa.
- [x] Kiểm tra cuối lint/test/build/typecheck/format/memory, review độc lập whole delta theo skill, sửa Important/Critical nếu có.
- [x] Báo cáo tiếng Việt gồm output, file thay đổi, test mới, limitations và trạng thái acceptance. Commit result rồi memory riêng; ghi Phase12 đã accepted, nợ Phase11 kỹ thuật verified hoặc còn blocker cụ thể.
