# Sổ tay, bảng suy luận, bảng buộc tội — xác minh (phần 5)

Plan: `docs/superpowers/plans/2026-10-04-ui-investigation-desk.md`. Spec: `docs/superpowers/specs/2026-10-04-ui-investigation-desk-design.md`.

## Baseline (trước phần 5, commit c88bcc2)

- E2E đỏ có sẵn (17): `feedback-audio`, `feedback-navigation(-review)` ×3, `feedback-ui-controls`, `feedback-viewport` ×5, `hud` ×4, `learning`, `notebook-people`, `settings` (xem `2026-10-03-ui-game-feel-verification.md`). Đỏ ngoài danh sách là do phần này gây ra.
- pytest đỏ có sẵn: `tools/art-codegen/test_chair_directions.py`.
- FPS baseline (`main_office` đứng yên, GL phần mềm, `FPS_PROBE=1`): 11,7 / 11,6 / 11,2 (trung bình 11,5). Ngưỡng: không giảm quá 10%.
- Ảnh trước: `docs/ai/playtests/2026-10-04-ui-investigation/before/` (8 màn × 6 viewport = 48 ảnh). Seed đầy đủ (mọi evidence, fact, cờ, từ vựng bật, mục tiêu kết luận active).

## Bảng số trang trước (`Trang n/N`, mỗi `.page-controls` đang hiện, ngăn bởi `|`)

| Màn | 1280x720 | 760x600 | 390x844 | 844x390 |
|---|---|---|---|---|
| notebook-people | 1/1 | 1/1 | 1/1 | 1/2 | 1/1 | 1/3 |
| notebook-evidence | 1/1 | 1/1 | 1/1 | 1/1 | 1/1 | 1/3 |
| notebook-vocabulary | 1/1 | 1/1 | 1/1 | 1/1 | 1/1 | 1/2 |
| notebook-timeline | 1/1 | 1/1 | 1/1 | 1/1 |
| board-clues | 1/3 | 1/2 | 1/1 | 1/2 | 1/2 | 1/6 |
| board-timeline | 1/2 | 1/2 | 1/2 | 1/4 |
| board-compare | 1/3 | 1/3 | 1/2 | 1/6 |
| board-conclusion | 1/1 | 1/1 | 1/1 | 1/2 |

Ghi lại bằng `UI_INVESTIGATION_PAGES_FILE=<file> npm run test:e2e -w @lexicon/game-web -- e2e/ui-investigation-pagecount.spec.ts`.
