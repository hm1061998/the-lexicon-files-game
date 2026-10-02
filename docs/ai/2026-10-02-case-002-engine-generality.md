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
| F-6 | Bảng suy luận hiện hai nút "Kiểm tra mâu thuẫn" giống hệt nhau khi hai mâu thuẫn cùng mở; người chơi không biết bấm nút nào. | `ContradictionWorkspace` vẽ một nút cho mỗi contradiction khả dụng và nút nào cũng gửi id của chính nó (giả định một mâu thuẫn). | E2E bắt được (strict-mode locator). Một nút duy nhất; `pickContradiction` gửi contradiction có cặp fact khớp lựa chọn, không khớp thì gửi cái đầu để nhận phản hồi sai thông thường; `selectInvestigationView` trả thêm `factIds`. Test đơn vị `pickContradiction.test.ts`. | Tính tổng quát / UI một-mâu-thuẫn | `apps/game-web/src/deduction/ContradictionWorkspace.tsx`, `apps/game-web/src/deduction/pickContradiction.ts`, `apps/game-web/src/investigation/selectInvestigationView.ts` |
| F-7 | Sau khi xác nhận cả hai mâu thuẫn, `submit_your_conclusion` vẫn `locked`: không thể kết luận vụ án. | Activation/completion của objective chỉ được reconcile sau lựa chọn hội thoại (`reconcileDialogueProgress`) và khi migrate save; `submitContradiction` chỉ `completeObjective`. Case #001 không lộ vì objective kết luận mở sau hội thoại xưng tội. | E2E bắt được. `submitContradiction` gọi `reconcileDialogueProgress` trước khi hoàn thành so sánh (review độc lập phát hiện: fact đến từ evidence sau hội thoại cuối thì objective so sánh còn `locked` và cặp đúng bị báo sai) và sau đó. Test đỏ trước trong `submitContradiction.test.ts`; sự kiện `objectiveActivated` được trả về; hành vi Case #001 không đổi (test cũ và journey #001 xanh). | Tính tổng quát / vòng đời objective | `packages/game-core/src/contradiction/submitContradiction.ts` |

## Không phải sửa

- Task 1: schema scene đã yêu cầu `spawnPoints.default`; tái dùng kiểm tra này, không nới schema scene.
- Task 1: `evidenceTotal` của Case #001 là 5, dù chỉ có 3 evidence definition; catalogue dùng tổng authored theo hợp đồng, không đổi nội dung case.
- Task 1: giữ nguyên Condition/Effect, gameplay engine và save version; không thêm dependency.
- Task 4: `submitContradiction` vẫn ghi `david_contradiction_found` sau một contradiction đúng. Case #002 không đọc flag legacy này ở condition, effect, fact unlock hoặc dialogue, nên đây là state write vô hại cho Case #002 và không cần sửa engine.

- Task 3/8: `listeningTasks: []` và không có `audio`: HUD, evidence modal (không render `.listening-task`), `createPresentationAudio` chạy không lỗi; không có lỗi console suốt hành trình E2E.
- Task 8: không thêm Condition/Effect nào; chỉ dùng `hasEvidence`, `hasFact`, `flag`, `objectiveCompleted`, `all`, `any`, `requiresFacts` có sẵn.
- Task 8: save song song đúng: chơi trọn #002 không đổi save #001 (so sánh `toEqual` trước/sau reload), cả hai chọn qua bộ chọn sau reload.
- Task 8: learning record dùng chung một từ vựng (`client`, `early`, `receipt` giống hệt) không bị coi là hỏng.

## Hành vi giữ nguyên nhưng cần biết khi soạn case (không sửa)

- `completionCondition` của objective chỉ được xét sau lựa chọn hội thoại: objective "xem ít nhất ba hồ sơ" (`review_the_records`) chỉ hoàn thành ở lần chọn hội thoại kế tiếp, không ngay khi nhặt evidence. Đã chấp nhận vì HUD chỉ trễ cho đến khi người chơi nói chuyện; đề xuất `PR-04`: reconcile cả sau `addEvidence`.
- Cờ "câu hỏi đã xong" của cây hội thoại ghi bởi lựa chọn `Continue asking`, không ghi khi đóng hội thoại bằng Esc; câu hỏi cuối bị Esc sẽ không tính vào `*_interviewed`. Cùng mẫu với Case #001.

## Review độc lập (case-solvability-checker)

- Kết luận: giải được; `check-case-flow` closable 6/6 evidence, 2/2 contradiction. Important duy nhất (cặp đúng bị báo sai khi objective so sánh chưa active) đã sửa bằng engine, có test đỏ→xanh (F-7). WARN `delayed-reconcile` của `submit_your_conclusion` là false positive do tài liệu skill cũ; đã cập nhật skill.
- Minor chưa sửa: cờ `*_question_done` chỉ ghi bởi `Continue asking` (`speak_to_everyone` có thể treo nếu người chơi Esc); text fact `label_reprinted_16_44` không nói rõ thay nhãn 14; `briefly`/`responsibility` không có span từ vựng.

## Chi phí thực tế

- Task 1: thêm metadata dùng chung, catalogue, 11 chuỗi UI; cập nhật fixture bị ảnh hưởng và test schema/registry/catalogue. Chi tiết xác minh nằm trong báo cáo thực thi Task 1.
- Task 2–9: chưa thực hiện; chưa tổng kết chi phí toàn PR-03.

## Giới hạn

- Case #001 và Case #002 đã được đăng ký; `sceneRegistry` riêng đã được hợp nhất vào case definition. Bộ chọn case, bỏ `DEFAULT_START` và boot theo case đã xong ở Task 7.
- Learning record qua nhiều case đã có test (Task 6); F-4 đã xử lý ở Task 7; save theo case khi đổi case chưa có E2E (Task 8). Lệch plan: màn chọn case nằm trong `GameCanvas` (`selectedCaseId === null`), không thêm stage `cases` vào `titleModel`, vì picker chỉ cần catalogue và chạy trước khi có save. Picker đã xem tay ở 1280×720 và 390×844 (không tràn ngang), chưa đo bằng Playwright.
- Không khai báo âm thanh cho Case #002 theo quyết định đã duyệt; không mở rộng audio-codegen.
- E2E Case #002 (13 test) và journey/onboarding #001 (16 test) xanh trên Chromium Windows; `learning.spec.ts` và `notebook-people.spec.ts › reuses vocabulary context…` đỏ do từ vựng bản tin (`access`, `confidential`, `report`) — đỏ giống hệt ở `5de9eaf` (trước picker), nên là nợ có sẵn, không do PR-03. Không chạy full E2E toàn repo.
