# UI dialogue + evidence — báo cáo verification

Ngày: 03/10/2026. Plan: `docs/superpowers/plans/2026-10-03-ui-dialogue-evidence.md`. Spec: `docs/superpowers/specs/2026-10-03-ui-dialogue-evidence-design.md`. Báo cáo được bổ sung theo từng task.

## Baseline (Task 0, HEAD `42083ab`)

- Danh sách E2E đỏ có sẵn = 17 test trong `docs/ai/2026-10-02-ui-shell-verification.md` (mục Lệnh Definition of Done). Đỏ ngoài danh sách đó là do phase này gây ra.
- pytest đỏ có sẵn: `tools/art-codegen/test_chair_directions.py`. FPS baseline 12,8 (báo cáo shell).

## Ảnh trước

`docs/ai/playtests/2026-10-03-ui-dialogue-evidence/before/` — 4 màn × 4 kích thước (1920×1080, 1280×720, 760×600, 390×844) bằng `e2e/ui-dialogue-evidence-shots.spec.ts` (`UI_DIALOGUE_SHOTS_DIR`): `dialogue`, `evidence`, `listening`, `vocab-in-dialogue` (lời đầu của Anna, có từ vựng).
Hiện trạng: `PaperPanel` viền 2px, lựa chọn và nút là hộp be; từ vựng nội dòng cũng bị khung hộp (luật `.dialogue-panel button` lan sang `.vocabulary-word`); thẻ định nghĩa nổi absolute chồng lên các lựa chọn.

## Ảnh sau và so sánh

`docs/ai/playtests/2026-10-03-ui-dialogue-evidence/after/` — cùng 4 màn × 4 kích thước, cùng spec chụp ảnh.
Sau: hội thoại là tờ lời khai torn có kẹp giấy, lựa chọn là tờ ghi chú nghiêng ±0,5° (thẳng lại khi hover/focus), từ vựng nội dòng hết bị khung hộp; vật chứng là thẻ `ModalSheet` có ảnh dán nghiêng khung trắng, nhãn "CHỨNG CỨ" đỏ đậm; bài nghe là phiếu trong thẻ; thẻ định nghĩa nằm trong luồng văn bản, không che lựa chọn.

## Kết quả đo

| Hạng mục | Trước | Sau |
| --- | --- | --- |
| FPS (`main_office` đứng yên, GL phần mềm, 3 lượt) | 12,8 | 12,2 (12,2 / 12,0 / 12,4); nằm trong nhiễu máy, không đụng Phaser |

## Lệnh Definition of Done

- `npm run lint`: exit 0; `npm run test`: pass (game-web 704, content 277, core 59, ui 49, 18 và 1 ở project khác); `npm run build`, `typecheck`, `prettier --check .`: đạt; `memory:check`: PASS.
- `python -m pytest tools/art-codegen -q`: 64 pass, 1 đỏ có sẵn (`test_chair_directions`).
- `npm run test:e2e` đầy đủ (trước khi sửa review): 256 pass, 57 skipped, 17 đỏ — đúng 17 test đỏ có sẵn, không có đỏ do phase này. Sau sửa review: `ui-dialogue-evidence`, `dialogue`, `viewport-focus` xanh; `feedback-ui-controls` đỏ có sẵn.
- E2E mới `ui-dialogue-evidence.spec.ts`: 23 test (vừa khung và mục tiêu ≥44px ở 4 viewport kể cả 844×390, luật đỏ, thẻ từ vựng không che lựa chọn, giảm chuyển động qua OS).

## Ruling của executor

- Kẹp giấy trên tờ lời khai: phần cuộn chuyển sang `div[role=dialog]` bên trong để kẹp không bị cắt (review Important).
- Nhãn "Vật chứng" dùng đỏ đậm `#743026` thay `#A4412D` vì chữ nhỏ cần ≥4,5:1 trên giấy (5,7:1 so với 3,7:1); vẫn nằm trong đỏ cho phép của AGENTS §6.
- Nút đóng vật chứng đặt `position: absolute` góc trên phải nhưng đứng đầu thứ tự Tab, để `autoFocus` và focus trap giữ nguyên.
- Bài nghe giữ markup, chỉ đổi CSS (phiếu giấy, nút viền mực) thay vì thay bằng `InkButton`, để không đổi test và luồng telemetry.

## Review độc lập

Một review toàn nhánh (opus): không Critical; hai Important đã sửa RED→GREEN (độ tương phản nhãn đỏ; kẹp giấy bị cắt) với test CSS trong `evidenceCss.test.ts` và `dialogueCss.test.ts`.
Minor chưa sửa: màu nền ghi chú/phiếu bị texture đục che nên không hiện (chỉ viền và bóng phân biệt); CSS thẻ từ vựng lặp giữa `.modal-sheet` và `.dialogue-panel` (có thể gộp bằng `:is`); vài luật cân specificity bằng thứ tự nạp CSS (`.evidence-modal` vs `.modal-sheet`, focus ring); nút đóng vật chứng cuộn mất khi cuộn thẻ rất dài; lề phải 56px của tiêu đề chỉ vừa nhãn tiếng Việt hiện tại; thiếu ảnh 844×390 và test 760×240; chưa có fallback forced-colors cho nút đóng không viền; có thể có tràn ngang dưới 1px do tilt trong `.dialogue-panel`.
