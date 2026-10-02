# UI shell — báo cáo verification

Ngày: 02/10/2026. Plan: `docs/superpowers/plans/2026-10-02-ui-shell.md`. Spec: `docs/superpowers/specs/2026-10-02-ui-shell-design.md`. Báo cáo này được bổ sung theo từng task.

## Baseline (Task 0, HEAD `c1add40`)

- Danh sách E2E đỏ có sẵn = mục "Task 9 — Danh sách đỏ có sẵn còn lại" của `docs/ai/2026-10-02-ui-foundation-hud-verification.md` (17 test). Đỏ ngoài danh sách đó trong phase này là do phase này gây ra.
- pytest đỏ có sẵn: `tools/art-codegen/test_chair_directions.py` (1 test).
- Chạy lại toàn bộ E2E chỉ ở Task 7 (không sửa file trong lúc chạy).

## Ảnh trước

`docs/ai/playtests/2026-10-02-ui-shell/before/` — 8 màn × 4 kích thước (1920×1080, 1280×720, 760×600, 390×844) bằng `e2e/ui-shell-shots.spec.ts`:
`case-picker`, `title-new`, `title-saved`, `support`, `confirm`, `pause`, `briefing`, `summary`.
Hiện trạng: nền `--lexicon-ink` phẳng, một tờ `PaperPanel` viền 2px với các nút hộp xếp dọc.

## Ảnh sau và so sánh

`docs/ai/playtests/2026-10-02-ui-shell/after/` — cùng 8 màn × 4 kích thước, chụp bằng cùng spec. Ảnh `before/` đã chụp lại từ commit `2d87391` (trước shell) vì ảnh `support` và `briefing` ban đầu bị cũ (xem ruling Task 4).
Sau: mặt bàn gỗ (`DeskBackdrop`), bìa hồ sơ kèm tab chia mục (`FolderCover`, `FolderTabs`), thẻ hồ sơ giấy nghiêng nhẹ, các bước phụ và tạm dừng/briefing trên `ModalSheet`, màn tổng kết là tờ giấy có con dấu CASE CLOSED đỏ (con dấu đỏ duy nhất trong shell).

## Kết quả đo

| Hạng mục | Trước | Sau |
| --- | --- | --- |
| FPS (`main_office` đứng yên, GL phần mềm) | 12,8 | 12,8 (màn shell không chạy Phaser) |
| Texture mới (13 file ở `public/assets/ui/` do code sinh, seed 20261002) | — | 146.551 byte cho phần thêm |

## Lệnh Definition of Done

- `npm run lint`: exit 0. `npm run test`: toàn bộ pass (game-web 692, game-content 277, game-core 59, ui 49). `npm run build`, `npm run typecheck`, `npm run format:check`: đạt. `npm run memory:check`: PASS.
- `python -m pytest tools/art-codegen -q`: 64 pass, 1 đỏ có sẵn (`test_chair_directions`).
- `npm run test:e2e` đầy đủ (sau commit `6ba2bcf`): 220 pass, 37 skipped, 17 đỏ. Cả 17 đều nằm trong danh sách đỏ có sẵn (`feedback-audio`, `feedback-navigation(-review)` ×3, `feedback-ui-controls`, `feedback-viewport` ×5, `hud` ×4, `learning`, `notebook-people`, `settings`); không có test đỏ do phase này.
- Lỗi người dùng báo sau khi dựng xong: thẻ định nghĩa từ vựng trong briefing đè lên văn bản, nút mặc định của trình duyệt. Sửa ở `6ba2bcf` (thẻ nằm trong luồng, nút kiểu mực, thanh cuộn mỏng) kèm E2E `briefing definition card…`.

## Ruling của executor

Xem `Ruling:` trong ledger; tóm tắt: ShellCover nhận prop `title`; luật `.title-card` cũ thu hẹp rồi xóa cùng `title.css`; motion-off dùng `!important` và reset `rotate/translate`; tab compact nâng lên thay vì hạ xuống; How-to giữ là `ModalSheet` (dùng chung với tạm dừng); Esc đóng briefing (hành vi cũ); `ModalSheet` không nghiêng mặc định; `form-controls.css` mở rộng selector; tóm tắt không có nút quay về tiêu đề (ngoài phạm vi chỉ-trình-bày).

## Review độc lập và sửa

Một review toàn nhánh (opus): không Critical, ba Important đã sửa RED→GREEN ở `3896c87`:
1. Nút trong thẻ định nghĩa của màn điều tra bị restyle bởi luật sửa briefing → giới hạn phạm vi `.modal-sheet .vocabulary-popover:not(.investigation-vocabulary-popover)` (test `shellCss.test.ts`).
2. Motion-off và `prefers-reduced-motion` chưa phủ hết tilt (`.support-option`, `.case-card-flag`, `.folder-cover`, `.case-card`, `SaveRecoveryScreen` ngoài `.game-root`) → đã phủ và bọc `SaveRecoveryScreen` (test `shellCss.test.ts`).
3. Bìa hồ sơ có thể bị cắt ở 844×390 → `max-height: 100%` và sheet cuộn; E2E thêm viewport 844×390 kèm kiểm tra biên dọc và màn `settings` (đỏ ở `support` trước khi sửa, xanh sau).
Sau sửa: unit game-web 694 pass; E2E `ui-shell`, `onboarding`, `case-002`, `investigation-pagination`, `investigation-acceptance`: 93 pass. Lượt E2E đầy đủ 220 pass/17 đỏ có sẵn chạy trước ba sửa này.

Minor chưa sửa: `aria-modal` trong `SupportPicker`; `ModalSheet` thiếu tên khi không có heading; `NewCaseConfirm` thiếu `aria-describedby` và Stamp trung tính; thiếu fallback forced-colors cho tab/thẻ; `aria-labelledby` của section đầu màn tổng kết.
