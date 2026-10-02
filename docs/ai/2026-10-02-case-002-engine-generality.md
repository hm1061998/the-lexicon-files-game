# Case #002 — Báo cáo tính tổng quát của engine

## Mục tiêu

Kiểm chứng PR-03 bằng cách triển khai Case #002 từ content và ghi lại mọi thay đổi engine bắt buộc. Báo cáo này đang được bổ sung theo Task 1–9; chưa kết luận engine đã hỗ trợ trọn vẹn nhiều case.

## Thay đổi engine bắt buộc

| Mã | Symptom | Nguyên nhân gốc | Thay đổi | Phân loại | File |
| --- | --- | --- | --- | --- | --- |
| F-1 | Learning record của case khác bị coi là hỏng, backup và reset; nguy cơ mất tiến độ từ. | `parseLearningRecord` kiểm tra từ/context theo catalogue một case. | Chưa xử lý; Task 6 thêm test đỏ và catalogue đa case. | Tính tổng quát / bảo toàn dữ liệu | `apps/game-web/src/persistence/learningMigration.ts` |
| F-2 | Trùng tree id giữa hai case có thể gộp tiến độ từ. | Context `dialogue:<treeId>:<nodeId>:text` không chứa `caseId`. | Chưa xử lý; Task 6 chặn trùng bằng validator, Case #002 dùng `*_delivery`. | Tính tổng quát / định danh | `packages/game-content/src/schema/caseDefinition.ts`, `packages/game-content/src/validation/validateRegisteredContent.ts` |
| F-3 | Không thể dùng nhạc/sfx chung mà bỏ voice khi có `case.audio`. | Validator bắt audio ở mọi node NPC; audio-codegen gắn cứng Case #001. | Chưa xử lý; quyết định đã duyệt: Case #002 không khai báo `audio`, không nhạc/voice. | Giới hạn pipeline / ngoài phạm vi | `packages/game-content/src/schema/caseDefinition.ts`, `tools/audio-codegen` |
| F-4 | GameCanvas vẫn tải một case lúc mount và điểm bắt đầu vẫn gắn cứng. | `DEFAULT_START` và luồng boot của `GameCanvas` chưa nhận case người chơi chọn. Task 4 đã loại `sceneRegistry` riêng và `caseRegistry` đã đăng ký cả hai case. | Task 4: `loadCaseDefinition('case-002')` hợp lệ, `REGISTERED_CASE_IDS` có `case-001`/`case-002`, và `loadSceneDefinition` đọc `definition.scenes`. Còn Task 7: bỏ `DEFAULT_START`, thêm case selector và boot theo `definition.startSceneId`. | Tính tổng quát / khởi động và chọn case | `apps/game-web/src/game/GameCanvas.tsx`, `packages/game-content/src/loader/loadScene.ts`, `packages/game-content/src/loader/loadCaseDefinition.ts` |

## Không phải sửa

- Task 1: schema scene đã yêu cầu `spawnPoints.default`; tái dùng kiểm tra này, không nới schema scene.
- Task 1: `evidenceTotal` của Case #001 là 5, dù chỉ có 3 evidence definition; catalogue dùng tổng authored theo hợp đồng, không đổi nội dung case.
- Task 1: giữ nguyên Condition/Effect, gameplay engine và save version; không thêm dependency.
- Task 4: `submitContradiction` vẫn ghi `david_contradiction_found` sau một contradiction đúng. Case #002 không đọc flag legacy này ở condition, effect, fact unlock hoặc dialogue, nên đây là state write vô hại cho Case #002 và không cần sửa engine.

## Chi phí thực tế

- Task 1: thêm metadata dùng chung, catalogue, 11 chuỗi UI; cập nhật fixture bị ảnh hưởng và test schema/registry/catalogue. Chi tiết xác minh nằm trong báo cáo thực thi Task 1.
- Task 2–9: chưa thực hiện; chưa tổng kết chi phí toàn PR-03.

## Giới hạn

- Case #001 và Case #002 đã được đăng ký; `sceneRegistry` riêng đã được hợp nhất vào case definition. Bộ chọn case, bỏ `DEFAULT_START` và boot theo case vẫn thuộc Task 7.
- Chưa xác minh việc bảo toàn learning record/save qua đổi case; F-1/F-2/F-4 vẫn còn việc.
- Không khai báo âm thanh cho Case #002 theo quyết định đã duyệt; không mở rộng audio-codegen.
- Chưa chạy acceptance E2E cho Case #002; chưa đánh dấu PR-03 hoàn tất.
