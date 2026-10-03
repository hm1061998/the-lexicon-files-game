# UI phần 4b (cảm giác game) — báo cáo verification

Ngày: 03/10/2026. Plan: `docs/superpowers/plans/2026-10-03-ui-game-feel.md`. Spec: `docs/superpowers/specs/2026-10-03-ui-game-feel-design.md`. Báo cáo được bổ sung theo từng task.

## Baseline (Task 0, HEAD `859c447`)

- `npm run lint`: 0 lỗi. `npm run test`: game-web 708, content 277, core 59, ui 49 đều pass.
- E2E đầy đủ: dùng kết quả lần chạy cuối trước phase này (code không đổi từ đó, chỉ thêm tài liệu): 256 pass, 61 skipped, 17 đỏ có sẵn (`feedback-audio`, `feedback-navigation(-review)` ×3, `feedback-ui-controls`, `feedback-viewport` ×5, `hud` ×4, `learning`, `notebook-people`, `settings`). Đỏ ngoài danh sách đó là do phase này gây ra.
- pytest đỏ có sẵn: `tools/art-codegen/test_chair_directions.py`.
- FPS baseline (`main_office` đứng yên, GL phần mềm, ba lượt probe): 10,8 / 11,5 / 11,5 (trung bình 11,3). Ngưỡng cho phép: không giảm quá 10%.

## Ảnh trước

`docs/ai/playtests/2026-10-03-ui-game-feel/before/` — `dialogue`, `listening`, `evidence`, `title`, `pause` × 4 kích thước (1920×1080, 1280×720, 760×600, 390×844) bằng `e2e/ui-game-feel-shots.spec.ts` (`UI_SHOTS_DIR`, `UI_SHOTS_PHASE=before`). `dialogue-log` chỉ chụp ở ảnh sau.

## Task 3b — âm thanh CC0 (chờ người dùng)

`assets/_incoming/audio/` chưa tồn tại (03/10/2026). Cần người dùng tải Kenney Interface Sounds và Kenney RPG Audio (CC0) vào `assets/_incoming/audio/kenney-interface-sounds/` và `kenney-rpg-audio/` (tuỳ chọn một tiếng băng chạy CC0 vào `oga-tape/` kèm URL nguồn). Cho đến lúc đó `UI_SOUND_FILES` rỗng: dịch vụ âm thanh UI (Task 3a) đã nối nhưng game im lặng, không lỗi. Task này chưa hoàn tất.
