# Case #002 — Báo cáo tính tổng quát của engine

## Mục tiêu

Kiểm chứng PR-03 bằng cách triển khai Case #002 từ content và ghi lại mọi thay đổi engine bắt buộc. Báo cáo này đang được bổ sung theo Task 1–9; chưa kết luận engine đã hỗ trợ trọn vẹn nhiều case.

## Thay đổi engine bắt buộc

| Mã | Symptom | Nguyên nhân gốc | Thay đổi | Phân loại | File |
| --- | --- | --- | --- | --- | --- |
| F-1 | Learning record của case khác bị coi là hỏng, backup và reset; nguy cơ mất tiến độ từ. | `parseLearningRecord` kiểm tra từ/context theo catalogue một case. | Task 6: `parseLearningRecord` vốn nhận danh sách id nên không đổi; lỗi nằm ở nơi gọi truyền catalogue một case. Thêm `loadAllVocabulary()` (hợp mọi case) và test: record có từ case khác `loaded` với catalogue hợp nhất, còn `confirmation-required` với catalogue một case hoặc từ không thuộc case nào. `learning-engine` không đổi (test bảo toàn tiến độ từ ngoài catalogue xanh ngay). Việc đổi `GameCanvas` sang `loadAllVocabulary()` làm ở Task 7. | Tính tổng quát / bảo toàn dữ liệu | `apps/game-web/src/persistence/learningMigration.ts` |
| F-2 | Trùng tree id giữa hai case có thể gộp tiến độ từ. | Context `dialogue:<treeId>:<nodeId>:text` không chứa `caseId`. | Task 6: `loadAllVocabulary()` ném `ContentValidationError` khi cùng `context.id` xuất hiện ở hai case; Case #002 dùng `*_delivery`. Không đổi định dạng context id (tránh đổi save). | Tính tổng quát / định danh | `packages/game-content/src/schema/caseDefinition.ts`, `packages/game-content/src/validation/validateRegisteredContent.ts` |
| F-3 | Không thể dùng nhạc/sfx chung mà bỏ voice khi có `case.audio`. | Validator bắt audio ở mọi node NPC; audio-codegen gắn cứng Case #001. | Chưa xử lý; quyết định đã duyệt: Case #002 không khai báo `audio`, không nhạc/voice. | Giới hạn pipeline / ngoài phạm vi | `packages/game-content/src/schema/caseDefinition.ts`, `tools/audio-codegen` |
| F-4 | GameCanvas vẫn tải một case lúc mount và điểm bắt đầu vẫn gắn cứng. | `DEFAULT_START` và luồng boot của `GameCanvas` chưa nhận case người chơi chọn. Task 4 đã loại `sceneRegistry` riêng và `caseRegistry` đã đăng ký cả hai case. | Task 4: `loadCaseDefinition('case-002')` hợp lệ, `REGISTERED_CASE_IDS` có cả hai case, `loadSceneDefinition` đọc `definition.scenes`. Task 7: bỏ `DEFAULT_START`; `loadGameBootstrap` và `GameCanvas` dùng `definition.startSceneId`; tách `GameCanvas` thành lớp vỏ (UI string, catalogue, learning/settings toàn cục với `loadAllVocabulary()`, bộ chọn case) và `CaseFlow` (save, title, game của một case, remount theo `key=caseId`). Save hỏng của một case chỉ chặn case đó, không chặn bộ chọn. | Tính tổng quát / khởi động và chọn case | `apps/game-web/src/game/GameCanvas.tsx`, `packages/game-content/src/loader/loadScene.ts`, `packages/game-content/src/loader/loadCaseDefinition.ts` |
| F-5 | `loadAllVocabulary()` ném lỗi: từ `receipt` được định nghĩa khác nhau ở case-001 và case-002. | Hai case tự định nghĩa cùng `vocabularyId` với nội dung khác; tiến độ từ là toàn cục nên phải là một định nghĩa. | Sửa content: `receipt` của case-002 dùng nguyên văn mục của case-001 (validator mới bắt được, không phải sửa engine). | Content / nhất quán từ vựng | `packages/game-content/cases/case-002/vocabulary.json` |

## Không phải sửa

- Task 1: schema scene đã yêu cầu `spawnPoints.default`; tái dùng kiểm tra này, không nới schema scene.
- Task 1: `evidenceTotal` của Case #001 là 5, dù chỉ có 3 evidence definition; catalogue dùng tổng authored theo hợp đồng, không đổi nội dung case.
- Task 1: giữ nguyên Condition/Effect, gameplay engine và save version; không thêm dependency.
- Task 4: `submitContradiction` vẫn ghi `david_contradiction_found` sau một contradiction đúng. Case #002 không đọc flag legacy này ở condition, effect, fact unlock hoặc dialogue, nên đây là state write vô hại cho Case #002 và không cần sửa engine.

## Chi phí thực tế

- Task 1: thêm metadata dùng chung, catalogue, 11 chuỗi UI; cập nhật fixture bị ảnh hưởng và test schema/registry/catalogue. Chi tiết xác minh nằm trong báo cáo thực thi Task 1.
- Task 2–9: chưa thực hiện; chưa tổng kết chi phí toàn PR-03.

## Giới hạn

- Case #001 và Case #002 đã được đăng ký; `sceneRegistry` riêng đã được hợp nhất vào case definition. Bộ chọn case, bỏ `DEFAULT_START` và boot theo case đã xong ở Task 7.
- Learning record qua nhiều case đã có test (Task 6); F-4 đã xử lý ở Task 7; save theo case khi đổi case chưa có E2E (Task 8). Lệch plan: màn chọn case nằm trong `GameCanvas` (`selectedCaseId === null`), không thêm stage `cases` vào `titleModel`, vì picker chỉ cần catalogue và chạy trước khi có save. Picker đã xem tay ở 1280×720 và 390×844 (không tràn ngang), chưa đo bằng Playwright.
- Không khai báo âm thanh cho Case #002 theo quyết định đã duyệt; không mở rộng audio-codegen.
- Chưa chạy acceptance E2E cho Case #002; chưa đánh dấu PR-03 hoàn tất.
