# Intro + onboarding Case #001 — báo cáo kiểm chứng

Ngày 02/10/2026. Spec: `docs/superpowers/specs/2026-10-02-intro-onboarding-design.md`. Plan: `docs/superpowers/plans/2026-10-02-intro-onboarding.md`. Ledger: `.superpowers/sdd/2026-10-02-intro-onboarding/progress.md` (không commit).

## Tóm tắt

Đã làm đủ 8 task code và phần E2E của task 9: màn hình tiêu đề (Continue / Vụ án mới / Cách điều tra / Cài đặt), bộ chọn mức hỗ trợ, xác nhận Vụ án mới có backup, briefing memo khóa input, bốn gợi ý theo ngữ cảnh, trang "Cách điều tra" (cả ở tiêu đề lẫn trong Pause), learning record V3 với cờ `onboardingSeen`, và dòng briefing trong "Hồ sơ vụ việc" của bảng suy luận.

## Commit

`c648d4f` content + chuỗi UI · `85a3477` learning V3 · `718f585` `startNewCase` · `e11c5d2` SettingsFields + how-to · `ab1d789` tiêu đề/support/confirm · `d8ee5d0` briefing memo · `023e7e3` coach note · `435567b` briefing ở case file · `a3225e1` ngưỡng di chuyển theo hệ tọa độ + giao diện giấy · `9c22d33` how-to dạng văn bản thường (sửa lỗi giật do bộ đọc chia trang không có khung kích thước, người dùng báo). Commit E2E/tài liệu ở các commit sau.

## Kết quả đã chạy

- `nx run-many -t lint test` (7 project): PASS; game-web 101 file / 608 test.
- `nx run-many -t build`: PASS. `tsc -b`: 0 lỗi. `prettier --check apps packages`: sạch.
- `e2e/onboarding.spec.ts` (Chromium Linux, một worker): 8/8 PASS — người chơi mới đi hết tiêu đề → hỗ trợ → briefing → Esc → gợi ý move/interact/notebook, reload không lặp; Vụ án mới giữ từ vựng, backup tăng đúng 1; người chơi cũ V2 không thấy gợi ý và được nâng V3; tiêu đề/briefing/gợi ý vừa khung ở 1280×720, 760×600, 390×844; briefing hiện trong hồ sơ vụ việc; how-to mở từ Pause và Esc chỉ đóng trang how-to.
- Helper `openWorld`/`reopenWorld` trong `e2e/journeyHelpers.ts` đi qua tiêu đề bằng thao tác UI thật; các spec cũ đã chuyển sang dùng. `feedback-audio` được sửa vì thao tác đầu tiên trong game giờ là cử chỉ bắt đầu nhạc.

## Chưa hoàn tất / trung thực về giới hạn

- **Chưa chạy xong toàn bộ E2E.** Lượt 185 test dừng ở khoảng 77/185 (đang ở `investigation-acceptance`) với 17 test fail. Đối chiếu với baseline (`08e115f`, chạy riêng): `hud` (strict-mode locator), `feedback-ui-controls`, `feedback-viewport` letterbox và hai test resize của `feedback-navigation(-review)` **đã fail sẵn** trước thay đổi. Hai test `feedback-navigation(-review)` còn lại (click sàn, góc tường trong suốt) và `feedback-audio` pass ở baseline nhưng fail trong lượt full; cần chạy riêng lại sau khi sửa để biết là do onboarding hay do chạy liên tiếp/tải CPU. Các spec `dialogue`, `journey`, `timeline`, `notebook-*`, `learning`, `settings`, `listening`, `world`, `performance`, `viewport-focus` chưa có kết quả trong lượt này.
- Môi trường: Chromium Linux trong sandbox, không phải Chromium Windows như các báo cáo trước.
- Ảnh ba viewport được sinh ra nhưng chưa lưu vào repo; ảnh chụp trước khi chỉnh khung giấy và vị trí gợi ý trên màn hình hẹp.
- Test component của title/briefing/coach chỉ render tĩnh (không có testing-library); luồng tương tác nằm ở E2E. Bài học: trang how-to lọt lỗi giật vì chỉ test tĩnh — nên thêm E2E mở how-to từ màn hình tiêu đề.
- Autosave hồ sơ học tập mở lại IndexedDB cho mỗi lần ghi nên hàng đợi lưu chậm khi sổ tay phát sinh nhiều encounter (đã có từ trước, spec phải chờ tới 20 giây). Ghi nhận cho phase sau, chưa sửa.
- Chưa có reviewer độc lập cho cả nhánh.
