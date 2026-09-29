# Phase 10 Persistence (Settings) — Xác minh

Ngày: 2026-09-29 (Asia/Saigon)
Trạng thái: hoàn tất; implementation (subagent-driven), final review và toàn bộ gate tự động PASS.

## Đã bàn giao

- `SettingsV1` (Zod strict): chế độ dịch, âm lượng 0–100 (mặc định 80), phụ đề `auto|on|off`, giảm chuyển động (mặc định theo `prefers-reduced-motion`). Database `lexicon-settings` v1; record hỏng → backup + mặc định; database lỗi → memory-only, không chặn gameplay.
- Hồ sơ học tập V2 bỏ `translationMode`; V1 được backup trước khi ghi. Chế độ dịch cũ được chuyển sang Settings, bền vững qua crash/StrictMode nhờ `legacyTranslationMode` nhớ trong repository và `findLegacyTranslationMode()` quét backup V1 mới nhất.
- Settings store per-mount + autosave tuần tự; menu Tạm dừng có thanh trượt âm lượng, lựa chọn phụ đề, ô giảm chuyển động (font ≥ 14px); chuỗi UI tiếng Việt trong `vi.json`.
- Áp dụng: âm lượng qua Howler master volume; phụ đề qua hàm thuần `resolveTranscriptVisibility` (9 tổ hợp); giảm chuyển động qua `MotionSource` (Phaser không import Zustand) và CSS scoped theo root.
- `isTypingTarget` chỉ coi ô nhập văn bản là "đang gõ" nên Esc vẫn đóng pause khi focus ở thanh trượt/checkbox.
- Test auto-save theo từng trigger (evidence, objective, flag, scene, contradiction; UI-only = 0; disconnect) và 3 E2E: reload giữ settings + tiến độ, di trú learning V1 (Immersion), settings hỏng tự khôi phục.

## Final review

- Reviewer độc lập (opus): 1 Critical (`npm run lint` lỗi ở `connectAutosave.test.ts:133`), 0 Important, vài Minor. Re-grade: Esc không đóng pause khi focus ở slider/checkbox → Important.
- Cả hai đã sửa trong `e222ce4`; RED của `isTypingTarget` được xác nhận bằng cách chạy test mới trên code cũ (fail) và code mới (pass).
- Minor để lại: marker tương tác chưa từng nổi (tween bị `updateNearby` ghi đè vị trí mỗi frame, có từ Phase 1) nên giảm chuyển động chưa có hiệu ứng nhìn thấy trên marker; on+Learning hiện transcript hai lần; `subtitleUses` tính theo lần mount panel; thiếu test hành vi cho hook âm lượng và StrictMode boot; backup trùng khi `put` lỗi sau backup; check "player không di chuyển" trong E2E yếu vì game đang pause.

## Kết quả gate (sau `npx nx reset`)

| Lệnh | Kết quả |
| --- | --- |
| `npm run lint` | PASS (exit 0) — 0 lỗi; 1 warning có từ trước (`GameCanvas.tsx` exhaustive-deps `initialSceneId`) |
| `npm run test` | PASS (exit 0) — game-web 266, game-content 94, game-core 49 và các package còn lại |
| `npm run build` | PASS (exit 0) — 162 modules; cảnh báo chunk > 500 kB như trước |
| `npm run typecheck` | PASS (exit 0) |
| `npm run format:check` | PASS (exit 0) |
| `npm run test:e2e` | PASS (exit 0) — 40 passed |
| `npm run memory:check` | PASS (exit 0) |
| `git diff --check` | PASS (exit 0) |

## Phạm vi

- Không sửa `apps/api`, không đổi dependency/lockfile; database `lexicon-game-saves` và `lexicon-learning` giữ version 1; save case V4 không đổi.
- Lần chạy E2E đầu của Task 4 báo một test fail (không rõ tên) rồi rerun 37/37; các lần chạy đầy đủ sau đó (40/40, hai lần) không tái hiện.
