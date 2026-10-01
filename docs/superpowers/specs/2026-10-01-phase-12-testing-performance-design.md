# Phase 12 — Testing & Performance: thiết kế

Ngày: 2026-10-01. Trạng thái: **chờ người dùng duyệt**. Nguồn: roadmap mục 31 (`docs/04_CODEX_IMPLEMENTATION_ROADMAP.md`).

## 1. Mục tiêu và phạm vi

Hardening MVP bằng cách lấp khoảng trống test và audit hiệu năng, theo hướng "đo trước, sửa theo số liệu" (hướng A đã chọn).

Trong phạm vi:

- Unit test cho các module lõi còn thiếu test riêng.
- E2E chia theo từng bước hành trình của roadmap.
- Đo hiệu năng và leak, chỉ sửa điểm vượt ngưỡng.

Ngoài phạm vi:

- Nợ Phase 11 (người dùng chốt làm sau Phase 12): regression 5 lỗi review điều hướng, chẩn đoán test resize lệch ~18px, full E2E xanh liên tục, nghiệm thu nhạc/hình, xác minh Node 22.
- Backend/.NET, tính năng gameplay mới, thay đổi asset đã duyệt, mọi mục "Out of scope MVP".
- Không đổi product rule trong docs.

## 2. Tiêu chí xong

1. `game-core` và `learning-engine` đạt ngưỡng coverage ghi trong plan (chốt theo baseline đo thật, không đoán trước).
2. Mỗi bước E2E trong roadmap có test riêng.
3. Có báo cáo hiệu năng với số đo và kết luận từng mục (đạt / đã sửa / không cần).
4. `npm run lint`, `npm run test`, `npm run build`, full E2E đều xanh; output được dán vào báo cáo cuối.

## 3. Unit test và coverage

- Thêm devDependency `@vitest/coverage-v8` đúng phiên bản vitest 2.1.9 (`npm install -D -w`). Lý do: vitest không đo coverage native; cần để đo trước khi viết test. Đây là dependency duy nhất của phase.
- Đo baseline coverage cho `game-core` và `learning-engine`, rồi đặt ngưỡng theo baseline trong plan.
- Test mới theo TDD cho module chưa có test riêng:
  - `game-core`: `condition`, `objective`, `effect`, `evidence`, `fact`, `save`.
  - `learning-engine`: `hints`, `review`, `progress`, `profile`, `telemetry`.
- Giữ bất biến: Condition/Effect là discriminated union, không `eval`; `game-core`/`learning-engine` không import React/Phaser/Zustand/DOM/IndexedDB.
- Test lộ lỗi sản phẩm → sửa theo `systematic-debugging` (tìm root cause trước), không đổi product rule.

## 4. E2E

- Tách hành trình thành các test độc lập theo roadmap: bắt đầu case → thu thập bằng chứng → nói chuyện NPC → tìm security log → tìm mâu thuẫn → buộc tội David → hoàn thành case → reload/lưu.
- Dùng chung helper dựng trạng thái nền; dùng debug API hiện có (`teleportLogical`, `logicalPlayer`, `nearby`…), không dựa vào wall-clock.
- Không nới tolerance để ép pass. Giữ chạy một worker.

## 5. Hiệu năng

- Một E2E đo trong Chromium: kích thước và thời gian tải asset, số texture trong cache, JS heap (`performance.memory`) sau N lượt chuyển cảnh Office↔Archive và mở/đóng modal.
- Tiêu chí leak: heap, số texture và số listener không tăng đơn điệu sau N lượt. So sánh tương đối (trước/sau cùng một lần chạy), không dùng số tuyệt đối vì Windows nhiễu. Ngưỡng cụ thể chốt sau lần đo đầu tiên, ghi trong plan.
- Kiểm tra cleanup scene: listener và game object bị hủy khi shutdown/destroy (mở rộng test hiện có ở `assetManifest.test.ts`).
- Atlas, lazy load, nén asset (hiện `public` ≈ 19 MB) chỉ làm nếu số đo vượt ngưỡng; nếu đạt thì ghi "không cần" kèm bằng chứng.
- Kết quả ghi vào báo cáo ngắn trong `docs/superpowers/specs/` theo mẫu các file `*-verification.md` hiện có.

## 6. Rủi ro

- Heap nhiễu giữa các lần chạy → chạy lặp, so sánh tương đối, nêu rõ độ nhiễu trong báo cáo.
- Test mới lộ lỗi lớn → dừng, báo người dùng, không tự mở rộng phạm vi.
- Thêm coverage tool có thể làm `npm run test` chậm → chỉ bật coverage ở target riêng, không đưa vào `test` mặc định nếu chậm đáng kể.

## 7. Thứ tự thực hiện (để làm plan)

1. Đo baseline coverage + chốt ngưỡng.
2. Unit test còn thiếu (game-core rồi learning-engine).
3. Tách E2E hành trình.
4. Đo hiệu năng/leak, rồi sửa điểm vượt ngưỡng (nếu có).
5. Báo cáo, `lint/test/build`/full E2E, cập nhật `docs/ai/MEMORY.md`.
