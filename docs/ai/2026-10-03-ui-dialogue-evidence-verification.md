# UI dialogue + evidence — báo cáo verification

Ngày: 03/10/2026. Plan: `docs/superpowers/plans/2026-10-03-ui-dialogue-evidence.md`. Spec: `docs/superpowers/specs/2026-10-03-ui-dialogue-evidence-design.md`. Báo cáo được bổ sung theo từng task.

## Baseline (Task 0, HEAD `42083ab`)

- Danh sách E2E đỏ có sẵn = 17 test trong `docs/ai/2026-10-02-ui-shell-verification.md` (mục Lệnh Definition of Done). Đỏ ngoài danh sách đó là do phase này gây ra.
- pytest đỏ có sẵn: `tools/art-codegen/test_chair_directions.py`. FPS baseline 12,8 (báo cáo shell).

## Ảnh trước

`docs/ai/playtests/2026-10-03-ui-dialogue-evidence/before/` — 4 màn × 4 kích thước (1920×1080, 1280×720, 760×600, 390×844) bằng `e2e/ui-dialogue-evidence-shots.spec.ts` (`UI_DIALOGUE_SHOTS_DIR`): `dialogue`, `evidence`, `listening`, `vocab-in-dialogue` (lời đầu của Anna, có từ vựng).
Hiện trạng: `PaperPanel` viền 2px, lựa chọn và nút là hộp be; từ vựng nội dòng cũng bị khung hộp (luật `.dialogue-panel button` lan sang `.vocabulary-word`); thẻ định nghĩa nổi absolute chồng lên các lựa chọn.
