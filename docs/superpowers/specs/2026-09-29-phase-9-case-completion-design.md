# Phase 9 — Hoàn tất vụ án

**Trạng thái:** Đã được người dùng duyệt
**Ngày:** 2026-09-29  
**Lộ trình:** `docs/04_CODEX_IMPLEMENTATION_ROADMAP.md` §28  
**Tài liệu sản phẩm:** `docs/01_GAME_DESIGN_DOCUMENT.md` §21; `docs/02_ENGLISH_LEARNING_SYSTEM_DESIGN.md` §34; `docs/03_CASE_001_VERTICAL_SLICE_SPEC.md` §§9, 13–14, 20; `docs/architecture/ARCHITECTURE.md`

## 1. Mục tiêu và hiểu biết đã thống nhất

Hoàn thành luồng kết luận của Case #001 sau khi người chơi điều tra đủ bằng chứng, đối chiếu đúng mâu thuẫn và đọc lời thú nhận của David. Người chơi có thể chọn nghi phạm, nhận phản hồi để thử lại nếu kết luận sai, đóng case khi chọn đúng và xem báo cáo tiến độ điều tra cùng tổng kết học tập.

Thiết kế đã thống nhất trong trao đổi:

- Luật kết luận được khai báo trong nội dung case và xử lý bằng chuyển trạng thái thuần trong `game-core`; React chỉ trình bày và gửi lựa chọn.
- Case #001 có ba lựa chọn: Anna Reed, Leo Tran và David Cole. David là đáp án đúng theo sự thật hiện có của case.
- Chọn sai không game over, không xóa, trừ hoặc đặt lại tiến độ. Phản hồi dùng đúng nội dung riêng của Case #001: `The evidence doesn't fully support this conclusion. Review the timeline.`
- Chọn đúng hoàn tất objective, ghi nhận trạng thái đóng case trong save và mở báo cáo.
- Báo cáo kết hợp chỉ số của case với các chỉ số tổng hợp hiện có trong hồ sơ học tập. Chỉ số hồ sơ phải được ghi nhãn rõ là tổng thể, không riêng Case #001.
- Spec và plan của phase này được viết bằng tiếng Việt theo `AGENTS.md`.

## 2. Phạm vi

- Bổ sung hợp đồng kết luận cho `CaseDefinition`, kiểm tra schema và tham chiếu nghi phạm.
- Thêm điều kiện kích hoạt objective và objective “Submit your conclusion” cho Case #001.
- Thêm reducer thuần để nộp buộc tội, xác thực nghi phạm, giữ state khi sai và đóng case khi đúng.
- Thêm tab Kết luận trong sổ tay khi objective đã được mở khóa.
- Thêm màn hình CASE CLOSED với báo cáo được dựng từ state case và hồ sơ học tập hiện tại.
- Nâng save schema từ V3 lên V4 và di trú save V1/V2/V3, giữ tiến độ cũ và mở objective nếu save đã thỏa điều kiện.
- Thêm unit, component, migration và E2E test cho luồng kết luận, báo cáo và khôi phục sau reload.

## 3. Luồng kết luận

### 3.1 Điều kiện mở

Objective “Submit your conclusion” ban đầu bị khóa. Objective chỉ được kích hoạt khi người chơi đã hoàn tất challenge hội thoại David và fact `david_took_report` được mở khóa. Khai báo điều kiện này bằng dữ liệu case; bộ máy tiến độ reconcile objective khi các điều kiện được thỏa mãn. Không mở buộc tội chỉ vì người chơi đã tìm thấy mâu thuẫn nếu chưa đọc lời thú nhận.

### 3.2 Chọn nghi phạm

Tab Kết luận của sổ tay chỉ khả dụng khi objective kết luận đang active và case chưa đóng. Danh sách lựa chọn lấy từ hợp đồng kết luận của case, không hardcode tên hay ID Case #001 trong React hoặc Phaser.

Lời gọi buộc tội phải kiểm tra:

- Case có hợp đồng kết luận hợp lệ.
- ID nghi phạm tồn tại trong danh sách được khai báo.
- Objective kết luận đang active và case chưa đóng.

Khi người chơi chọn sai, reducer trả kết quả `correct: false` với nguyên state đầu vào. Giao diện giữ phần Kết luận mở và hiển thị `The evidence doesn't fully support this conclusion. Review the timeline.` Người chơi có thể quay lại timeline/chứng cứ rồi thử lại; không tăng bộ đếm phạt, không trừ tiến độ và không khóa lựa chọn.

Khi người chơi chọn đúng, reducer hoàn tất objective, đặt cờ `case_closed` và trả sự kiện miền tương ứng. Nộp lại kết luận đúng sau khi case đã đóng là idempotent; reducer không tạo thêm tiến độ hoặc sự kiện. Nộp một lựa chọn khác sau khi case đóng bị từ chối mà không đổi state.

## 4. Hợp đồng nội dung và kiến trúc

- `CaseDefinition` khai báo danh sách NPC có thể bị buộc tội và đúng một NPC đáp án. Schema nghiêm ngặt từ chối danh sách rỗng, ID trùng, NPC không tồn tại hoặc đáp án đúng không thuộc danh sách.
- `ObjectiveDefinition` hỗ trợ `activationCondition` theo condition union hiện có. Validator kiểm tra tham chiếu fact/flag; `reconcileDialogueProgress` kích hoạt objective bị khóa khi điều kiện đạt, đồng thời giữ hành vi hoàn tất objective hiện có.
- `game-core` sở hữu reducer buộc tội và kiểu kết quả/lỗi. Reducer không import React, Phaser, Zustand, DOM hoặc persistence.
- Zustand bọc reducer và chỉ cập nhật `caseState` khi reducer báo kết quả hợp lệ. Wrong accusation giữ state và chỉ đổi feedback giao diện.
- Giao diện hiển thị nghi phạm theo nội dung case, gửi ID đã chọn qua store và không tự so sánh với đáp án đúng.
- `case_closed` và trạng thái objective hoàn tất nằm trong `GameState` đã lưu. Trạng thái mở/đóng màn hình, lựa chọn đang focus và feedback sai là UI state tạm thời.
- Không thêm backend hoặc thay đổi hệ thống commerce trung lập của Phase 8.

## 5. Save và di trú

- Tăng save schema hiện hành từ V3 lên V4 vì case contract bổ sung objective mới và validator save hiện yêu cầu đầy đủ objective IDs.
- V4 giữ nguyên tập trường `GameState` hiện có; dùng `flags.case_closed` và `objectiveStatuses.submit_your_conclusion` để lưu trạng thái kết thúc.
- Thêm hợp đồng lịch sử V3 đúng với nội dung Phase 8. Khi đọc V3, xác thực record bằng hợp đồng cũ, sao lưu raw save, ghép objective mới từ state khởi tạo và chạy reconcile để khôi phục objective kết luận nếu cờ/lời thú nhận trong save đã thỏa điều kiện.
- V1 và V2 tiếp tục được di trú lên V4, giữ nguyên các trường tiến độ đã có; không bỏ qua bước sao lưu trước khi ghi đè record đã di trú.
- IndexedDB database version tiếp tục là `1`. Nếu backup hoặc ghi save di trú thất bại, giữ record nguồn và trả lỗi theo cơ chế recovery hiện có.

## 6. Báo cáo cuối case

Màn hình CASE CLOSED được hiển thị sau kết luận đúng và được dựng lại từ save khi tải một case đã đóng. Phần báo cáo case chỉ dùng tiến độ Case #001; phần tổng kết học tập dùng `LanguageProfile` hiện tại và ghi rõ số liệu là tổng hợp toàn hồ sơ.

| Chỉ số | Nguồn và cách tính |
|---|---|
| Evidence Found | Số evidence ID đã thu thập / `evidenceTotal` của case. |
| Key Contradiction | Trạng thái mâu thuẫn chính từ `contradictionIds`; không suy luận từ việc tìm fact riêng lẻ. |
| People Interviewed | Số cờ hoàn tất hội thoại NPC của case đang là `true` / tổng NPC có dialogue tree. |
| Listening Task | Trạng thái completion flag của task thuộc case. |
| Vocabulary Encountered — toàn hồ sơ | Số mục từ có `encounterCount > 0` trong `LanguageProfile.vocabulary`; hiển thị giá trị thực, không hardcode mục tiêu 20. |
| Vocabulary Mastered — toàn hồ sơ | Số mục từ có stage `mastered` trong hồ sơ hiện tại. |
| Listening Accuracy — toàn hồ sơ | `correctAnswers / (correctAnswers + incorrectAnswers)`; nếu chưa có câu trả lời thì hiển thị trạng thái chưa có dữ liệu thay vì 0%. |
| Hints Used — toàn hồ sơ | `LanguageProfile.assistance.hints`. |

Các chỉ số hồ sơ học tập không được sao chép vào save case hoặc mô tả như chỉ số chỉ riêng Case #001. Không hiển thị điểm quiz, XP hoặc phần thưởng mới trong phase này.

## 7. Giao diện và khả năng tiếp cận

- Thêm tab Kết luận vào sổ tay điều tra; ẩn hoặc vô hiệu hóa tab trước khi objective active và sau khi case đóng.
- Dùng nút có tên truy cập được để chọn nghi phạm; lựa chọn và submit hoạt động bằng bàn phím, focus luôn nhìn thấy được.
- Phản hồi buộc tội sai và báo cáo đóng case dùng vùng thông báo có `role="status"`/`aria-live` phù hợp, không chỉ dựa vào màu sắc.
- Khi case đóng, thay luồng điều tra bằng báo cáo cuối case. Khi reload save đã đóng, hiển thị lại báo cáo từ state đã lưu và hồ sơ học tập hiện tại.
- Bổ sung chuỗi giao diện vào `packages/game-content/ui/vi.json` và schema liên quan. Giữ nguyên nội dung tiếng Anh được chỉ định chính xác trong Case #001.
- Tuân theo palette, typography và giới hạn màu đỏ trong `docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md` và `AGENTS.md`.

## 8. Ngoài phạm vi

- Tạo nghi phạm, sự thật, chứng cứ, hội thoại hoặc case mới.
- Kết luận nhiều giai đoạn, buộc tội một phần, game over, reset/penalty khi chọn sai.
- XP, điểm quiz, huy hiệu, phần thưởng, mở khóa case tiếp theo hoặc chế độ chơi lại.
- Thanh toán, entitlement, paywall, API, lưu đám mây, analytics từ xa hoặc thay đổi commerce provider.
- Thay đổi quy tắc học tập, schema hồ sơ học tập hoặc cách tính các bộ đếm learning hiện có.
- Thiết kế lại tổng thể sổ tay, scene, HUD hoặc hệ thống save ngoài migration cần cho objective mới.

## 9. Tiêu chí chấp nhận và xác minh

- Nội dung Case #001 cung cấp đúng ba lựa chọn; objective chỉ mở sau challenge David và fact `david_took_report`.
- Chọn sai hiển thị đúng câu `The evidence doesn't fully support this conclusion. Review the timeline.`; state case/save không đổi và có thể thử lại.
- Chọn đúng David đóng case, hoàn tất objective và hiển thị báo cáo với số liệu đúng theo nguồn đã định nghĩa.
- Sai không thể tạo game over hoặc reset bất kỳ tiến độ nào; gọi lại kết quả đóng case không nhân đôi sự kiện/tiến độ.
- Save V1/V2/V3 được di trú an toàn lên V4; save V3 có tiến độ trước objective mới vẫn giữ nguyên và mở objective khi đã có lời thú nhận.
- Reload case đã đóng tiếp tục hiển thị CASE CLOSED và báo cáo lấy từ hồ sơ học tập hiện tại.
- Kiểm thử unit cho schema/tham chiếu, reducer đúng/sai/lỗi/idempotency, điều kiện objective và các phép tính báo cáo; component/E2E bao phủ bàn phím, focus và luồng điều tra đến reload báo cáo.
- Trước khi báo phase hoàn tất, chạy và lưu output của `npm run lint`, `npm run test`, `npm run build`, `npm run typecheck`, `npm run format:check`, `npm run test:e2e`, `npm run memory:check` và `git diff --check`.
- Backend checks chỉ cần khi có thay đổi trong `apps/api`.

## 10. Quyết định đã chốt

1. Dùng hợp đồng kết luận trong case content và reducer thuần `game-core`.
2. Chọn sai không đổi state; feedback theo câu riêng của Case #001.
3. Báo cáo kết hợp tiến độ case với chỉ số học tập tổng hợp của hồ sơ hiện tại, có nhãn phạm vi.
4. Dùng notebook làm lối vào buộc tội; case đóng thì hiển thị báo cáo cuối case.
5. Nâng save schema lên V4, giữ IndexedDB database version 1 và di trú các schema được hỗ trợ.
