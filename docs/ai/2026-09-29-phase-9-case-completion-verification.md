# Phase 9 Hoàn tất vụ án — Xác minh

Ngày: 2026-09-29 (Asia/Saigon)
Trạng thái: hoàn tất; implementation, final review và toàn bộ gate tự động đã PASS.

## Đã bàn giao

- Hợp đồng kết luận trong content (`case.json.conclusion`: Anna, Leo, David; đáp án David; objective `submit_your_conclusion`) với Zod strict và kiểm tra tham chiếu (danh sách rỗng, trùng, NPC lạ, đáp án ngoài danh sách, objective không tồn tại). `ObjectiveDefinition.activationCondition` được parse và kiểm tra tham chiếu.
- Objective "Submit your conclusion" khóa ban đầu; `reconcileDialogueProgress` kích hoạt khi `david_confession_read` và fact `david_took_report` đều có. Đã tìm ra mâu thuẫn nhưng chưa thú nhận thì vẫn khóa.
- Reducer thuần `submitAccusation` trong `game-core`: sai trả nguyên state đầu vào, không event, cho phép thử lại; đúng hoàn tất objective và đặt `case_closed`; nộp lại đúng sau khi đóng là idempotent; nghi phạm khác sau khi đóng bị từ chối (`caseAlreadyClosed`); nghi phạm lạ (`unknownSuspect`); objective chưa active (`objectiveNotActive`).
- Save V4: V1/V2/V3 di trú qua hợp đồng lịch sử (`save-v3.json` mới), thêm objective mặc định, reconcile, backup raw trước khi ghi; V3 giữ scene, timeline và contradiction. IndexedDB database version vẫn `1`.
- Tab "Kết luận" trong sổ tay chỉ hiện khi objective active và case chưa đóng; nút chọn nghi phạm có `aria-pressed`; feedback sai nguyên văn `The evidence doesn't fully support this conclusion. Review the timeline.` trong vùng `role="status"`.
- Màn hình CASE CLOSED (dialog `aria-modal`, nhận focus) dựng từ save và `LanguageProfile` hiện tại, hiển thị lại sau reload; chỉ số học tập ghi nhãn "toàn hồ sơ". Listening accuracy không có dữ liệu hiển thị "Chưa có dữ liệu".
- Sau khi đóng case: di chuyển/E, sổ tay (J), pause (Esc) và mọi ghi tiến độ điều tra bị chặn ở store; sổ tay tự đóng khi buộc tội đúng.

## Final review

- Reviewer độc lập (opus) trên toàn branch `f08e9a9..6f5240b`: 0 Critical, 2 Important, 3 Minor.
- Important đã sửa trong `f6346f2`: (1) J/Esc/ghi tiến độ còn hoạt động dưới lớp CASE CLOSED; (2) sổ tay còn mở với tab kết luận rỗng. Test mới RED → GREEN.
- Minor để lại: chọn lại cùng nghi phạm sai có thể không được trình đọc màn hình đọc lại; case không có conclusion trả `unknownSuspect`; store vẫn trả kết quả `ok` khi bỏ qua ghi sau đóng case.

## Kết quả gate (sau `npx nx reset`, commit `f6346f2`)

| Lệnh | Kết quả |
| --- | --- |
| `npm run lint` | PASS (exit 0) — 7 project; 1 warning có từ trước (`GameCanvas.tsx` react-hooks/exhaustive-deps cho `initialSceneId`), không phát sinh trong phase này. |
| `npm run test` | PASS (exit 0) — 7 target; `@lexicon/game-web` 203 test, `@lexicon/game-content` 93, `@lexicon/game-core` 49, cùng các package còn lại. |
| `npm run build` | PASS (exit 0) — 153 modules; cảnh báo chunk > 500 kB (bundle JS 1.839,52 kB, gzip 444,71 kB) như các phase trước. |
| `npm run typecheck` | PASS (exit 0) |
| `npm run format:check` | PASS (exit 0) — All matched files use Prettier code style! |
| `npm run test:e2e` | PASS (exit 0) — 36 passed (1 worker, 2,9 phút), gồm hành trình Main Office → Archive → timeline/mâu thuẫn → thú nhận → buộc tội sai (save không đổi) → buộc tội David → báo cáo → reload. |
| `npm run memory:check` | PASS (exit 0) |
| `git diff --check` | PASS (exit 0) |

## Kiểm tra phạm vi

- Không sửa `apps/api`; không thêm dependency; `package-lock.json` không đổi → không cần backend checks.
- `evidenceTotal` vẫn `5`.
- Không có ID/copy Case #001 trong `apps/game-web/src` ngoài test; nghi phạm lấy từ content, chuỗi từ `ui/vi.json`.
- Nhãn CASE CLOSED dùng viền mực; không dùng màu đỏ mới.
