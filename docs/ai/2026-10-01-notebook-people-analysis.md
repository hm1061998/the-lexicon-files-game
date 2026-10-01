# Bước tiếp theo sau viewport: sổ tay Nhân vật

Ngày2026-10-01, người dùng yêu cầu tiếp tục công việc và push lên dev. Đã push kết quả playtest/viewport/memory tới2b97bc8; phân tích dưới đây là hướng cải thiện mới, chưa triển khai hoặc duyệt spec/plan.

## Bằng chứng hiện tại

- NotebookPanel render notebookEmptyPeople vô điều kiện, dù progress hội thoại đã có trong GameState.flags.
- GameState không có danh sách NPC đã gặp hoặc transcript; chỉ flags/facts/evidence/objectives/timeline/contradictions. Không thêm bản transcript vào React/store/IndexedDB để nhân đôi state.
- DialogueTree có npcId/completionFlag/completionCondition; node có text/translation/vocabulary/condition/effects, nhưng không có metadata cho việc xem lại lời khai đã ghi nhận.
- Một số flag câu trả lời chỉ được ghi khi bấm Tiếp tục hỏi; những flag khác được ghi khi vào node. Chỉ dùng cách ghi nhận hiện tại, không âm thầm đổi lúc unlock.
- Fact.sourceDialogueIds chỉ phủ một số lời khai, chưa đủ cho hồ sơ Anna/Leo. Không dùng facts đơn lẻ rồi tuyên bố tabPeople đầy đủ.

## Các hướng

1. Chỉ hiển thị tên/vai trò NPC phỏng vấn xong và facts đã mở: ít thay đổi, nhưng người hỏi dở vẫn thấy trống, chưa giải quyết việc xem lại lời khai Anna.
2. Metadata nội dung liên kết node lời khai với điều kiện đã ghi nhận, dùng flags/facts hiện có: tên/vai trò, trạng thái hỏi dở/xong, xem lại lời khai đã biết. Không cần save version mới hoặc thêm engine state. Đây là hướng đề xuất.
3. Thêm visitedNPC/transcript vào engine/save: ghi được mọi lần gặp ngay, nhưng mở rộng persistence/migration và state contract, chưa cần cho feedback hiện tại.

## Hướng đề xuất để người dùng duyệt

- Mỗi hồ sơ dùng tên/vai trò từ NPC content. Hiện NPC khi ít nhất một lời khai thuộc NPC đã được ghi nhận theo condition hiện có; chỉ mở rồi đóng hội thoại chưa ghi lời khai không thêm hồ sơ giả.
- Mỗi tree có metadata optional tham chiếu nodeId và unlockCondition cho sổ tay; schema/content validator kiểm node thuộc đúng tree, condition/flags tham chiếu hợp lệ. Không đoán bằng suffix _read, không hardcode Case001 IDs trong UI.
- Chỉ render node đáp ứng metadata condition: text/translation/vocabulary lấy từ node gốc, không sao chép text hoặc lộ nhánh chưa mở. Nhánh điều kiện David không được lộ từ completionFlag chung; dùng điều kiện riêng cho từng statement.
- NPC có một phần lời khai được ghi nhận vẫn xuất hiện; completionFlag chỉ đổi trạng thái phỏng vấn hoàn tất. Các statement đã ghi nhận và hồ sơ tồn tại sau reload nhờ state hiện có.
- Translation đọc Settings hiện tại, vocabulary chỉ mở khi thao tác; không thêm translation selector trong notebook.
- UI giấy/sepia, thao tác bàn phím/chuột và compact theo viewport fix. Không thêm NPC mới, ảnh/avatar, cơ chế quiz hoặc thay đáp án.

## Phạm vi và kiểm chứng dự kiến

Thay metadata contract shared-types/game-content và NotebookPanel/selector thuần; typed Condition interpreter hiện tại giữ nguồn luật. Vì thay content interface giữa packages, chọn nhánh architectural theo brainstorming: duyệt hướng → spec tiếng Việt → duyệt spec → plan tiếng Việt và duyệt trước triển khai. Đây không phải plan đã được duyệt.

Test trước code: empty/fresh, một lời khai ghi nhận, hỏi dở/xong, chỉ mở rồi đóng không giả progress, branch chưa unlock không lộ, flags không liên quan không mở hồ sơ, invalid metadata bị validation lỗi. Browser: hỏiAnna→Tiếp tục→NotebookPeople→reload giữ lời khai, desktop/compact/focus và translation Settings. Root lint/test/build/typecheck/format/memory theo quy định.

**Trạng thái:** Hướng đề xuất đang chờ duyệt; không có code mới cho People, không push phân tích mới trước xác nhận của người dùng.
