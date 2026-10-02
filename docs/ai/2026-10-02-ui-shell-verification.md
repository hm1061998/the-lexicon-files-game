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
