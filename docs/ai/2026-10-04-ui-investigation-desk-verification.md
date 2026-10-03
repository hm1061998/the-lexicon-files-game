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

## Kết quả sau (phần 5)

Ảnh sau: `docs/ai/playtests/2026-10-04-ui-investigation/after/` (8 màn × 6 viewport = 48 ảnh); mockup đã duyệt: `docs/superpowers/mockups/2026-10-04-{notebook,board,accusation,board-timeline,board-compare}.png`.

### Thay đổi so với plan (theo yêu cầu người dùng trong lúc làm, đã duyệt mockup)

- **Bảng suy luận không phân trang**: thẻ manh mối, thẻ nghi phạm, khay sự kiện và lưới dữ kiện là hàng/lưới vuốt (cảm ứng) hoặc kéo chuột, không thanh cuộn (`SwipeRow`); các bài đọc (hồ sơ vụ việc, chi tiết thẻ, kết quả) cuộn dọc không thanh. Đây là ngoại lệ có chủ đích với quy tắc không cuộn của 02/10, chỉ cho bảng suy luận (`expectNoInvestigationScroll` bỏ qua `.swipe-row`).
- **Dòng thời gian**: dây có đinh theo từng mốc giờ, khay sự kiện chưa xếp, nút "Đặt sự kiện". **Đối chiếu**: lưới thẻ ghim, khung A/B, kết quả là giấy nhớ. Dây nối manh mối đi từ đinh này sang đinh kia.
- **Thẻ từ vựng** là một tờ giấy ghim (không phân trang) cho cả sổ tay và bảng.
- **Sổ tay là một cặp trang liền mạch**: mục lục và chi tiết là một bài đọc chạy từ trang trái sang trang phải (`SpreadReader`, dùng `useMeasuredPages`, engine không đổi), một thanh lật cho cả cặp, hiệu ứng lật quét cả hai trang, vuốt ngang để lật. Tab Dòng thời gian có mục lục và chi tiết như ba tab kia. Màn hẹp hoặc thấp: một trang.
- Toàn game `user-select: none` (trừ ô nhập).

### Đã chạy

- `npm run lint`, `test` (1245), `build`, `typecheck`, `prettier --check .`: xanh. `memory:check`: xanh. pytest: 70 pass, 1 đỏ có sẵn (`test_chair_directions`); `node --test build_peaks`: 6/6.
- E2E đầy đủ: 335 pass, 165 skipped (opt-in), 21 đỏ = 17 đỏ có sẵn + 4 spec giả định chi tiết vật chứng mở sẵn (đã sửa, chạy lại xanh).
- FPS (`main_office` đứng yên): trước 11,7 / 11,6 / 11,2; sau 11,3 / 11,1 / 11,3 — trong ngưỡng 10%.
- Số trang: bảng suy luận không còn trang; sổ tay đo theo cặp trang nên bảng số trang cũ không còn so được (ghi nhận trong ledger).

### Review độc lập (opus, toàn nhánh)

1 Critical + 5 Important đã sửa; các Minor ghi trong ledger:
- Critical: kéo chuột dọc trong `SwipeRow` dùng sai trục (nuốt click vào dữ kiện/sự kiện). Sửa bằng `swipeOrigin`/`swipeScrollFor` (test đỏ→xanh) và E2E hồi quy.
- Important: kéo thả nhả ngoài hàng không kết thúc; chữ tràn trang phải của sổ chưa được dự trữ chiều cao; `touch-action` cho vuốt lật trang trên cảm ứng; vuốt lật trang không được mở nhầm hàng dưới con trỏ; kết quả đối chiếu cuộn vào tầm nhìn.
- Ruling: đinh ghim đỏ sẫm và dây đỏ trên bảng theo mockup đã duyệt (xem ledger).

### Hạn chế còn lại

- Chưa kiểm tra bằng thiết bị cảm ứng thật (vuốt lật trang được kiểm bằng chuột và theo CSS `touch-action`).
- Minor chưa sửa: xem ledger (đổi 1 trang/2 trang khi xoay màn hình có thể lùi một trang; ô giờ bị tắt khi chưa chọn sự kiện; hai tiếng giấy mỗi lần lật bằng nút; v.v.).
