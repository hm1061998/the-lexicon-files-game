# Sổ tay Nhân vật — hồ sơ và lời khai đã ghi nhận

**Trạng thái:** Người dùng đồng ý đi tiếp ngày2026-10-01 qua phản hồi “duyệt plan” sau khi nhận spec. Hướng/spec đã dùng để lập plan cụ thể; người dùng đã duyệt file plan và yêu cầu triển khai trong phiên tiếp nối cùng ngày. Đã triển khai inline trên dev và verification cuối đạt; xem docs/ai/2026-10-01-notebook-people-verification.md.

## 1. Mục tiêu và phạm vi

Giải quyết feedback tabNhân vật vẫn trống sau khi hỏi NPC: người chơi xem được ai đã ghi nhận lời khai, đang hỏi dở hay đã phỏng vấn xong, và đọc lại đúng phần đã biết để điều tra. Không biến sổ tay thành đáp án hoặc hệ thống quiz.

Phạm vi:

- Hồ sơ tên/vai trò và trạng thái phỏng vấn từ content/state hiện có.
- Lời khai tham chiếu node dialogue gốc, chỉ mở theo điều kiện ghi nhận rõ ràng trong content.
- UI giấy/sepia, keyboard/mouse, desktop/compact theo viewport fix.
- Translation/vocabulary theo mode đã lưu trong Settings.
- Schema/content validation và regression cho partial progress, reload, conditional branch và save cũ.

Không thêm NPC/scene, portrait, audio phát lại trong notebook, history thời gian thực, facts mới, đáp án mới, onboarding hay sửa tìm đường. Không thêm backend/dependency/save version hoặc mảng transcript/visitedNPC trong engine/store/persistence.

## 2. Nguồn và ràng buộc

- AGENTS.md và apps/game-web/AGENTS.md; docs01 mục19, docs03 mục notebook realtime; docs02 learning, art06 palette, ARCHITECTURE state boundaries.
- Phân tích: `docs/ai/2026-10-01-notebook-people-analysis.md`; feedback: `docs/ai/2026-10-01-player-playtest-feedback.md`.
- Bản viewport đã push tới2b97bc8; giữ fix và regression đó. Tiếp tục inline trên dev theo lựa chọn đã lưu.
- GameState.flags là nguồn tiến độ đã được persist. Không thêm state bản sao cho việc render People.
- Ghi nhận vẫn diễn ra ở thời điểm content hiện tại: flag node effects khi vào node, flag choice effects khi chọn Tiếp tục hỏi. Không đánh dấu phỏng vấn hoàn tất chỉ vì mở rồi đóng hội thoại.

## 3. Contract metadata nội dung

Thêm optional `notebookStatements` vào DialogueTree:

```typescript
interface NotebookStatementDefinition {
  readonly nodeId: string;
  readonly recordedCondition: Condition;
}
// DialogueTree:
readonly notebookStatements?: readonly NotebookStatementDefinition[] | undefined;
```

Mảng là thứ tự trình bày do content sở hữu. Không chứa bản sao text/translation/vocabulary; từng entry tham chiếu một node trong chính tree. Tree không có metadata tiếp tục load/chạy dialogue bình thường và không tự sinh transcript trong People.

`recordedCondition` dùng Condition interpreter hiện tại, nhưng validator chỉ cho phép positive flag(value:true), all/any không rỗng chứa các positive flag. Flag phải có writer setFlag(true) trong node/choice effects của chính tree. Không dùng completionFlag, flag contradiction, phủ định hay current node.condition thay cho dấu ghi nhận statement. Tránh điều kiện như “đã có mâu thuẫn” mở lời khai chưa đọc.

Validation bắt buộc:

- nodeId tồn tại trong tree; speakerId phải trùng npcId của tree cho các statement gói này.
- Không duplicate nodeId trong metadata; chuỗi ID không rỗng.
- recordedCondition có cấu trúc/flag source hợp lệ như trên, không tham chiếu tree khác/flag không writer hoặc completionFlag.
- Load content sai phải trả lỗi path đọc được; không bỏ qua statement lỗi để chạy im lặng.
- Không thay validation/audio/hash của node gốc; text/audio không đổi trong gói này.

Shared-types export contract, game-content Zod/validator kiểm tra metadata, game-web chỉ tiêu thụ dữ liệu đã validate. Không import React/Phaser vào engine thuần.

## 4. Ghi nhận Case001 và nhánh điều kiện

Metadata nằm trong dialogues.json; ID ở bảng này là nội dung authored, không được hardcode trong UI/selector.

| Tree/node | recordedCondition |
| --- | --- |
| Anna entry | any anna_q1_read/anna_q2_read/anna_q3_read |
| Anna answer1/2/3 | flag tương ứng anna_q1/2/3_read |
| Leo entry | any leo_q1_read/leo_q2_read/leo_q3_read |
| Leo answer1/2/3 | flag tương ứng leo_q1/2/3_read |
| David entry | david_statement_read |
| David answer1/2 | david_q1/2_read |
| David answer3 | david_answer3_recorded mới |
| David answer3_unlocked | david_answer3_unlocked_recorded mới |
| David collect_folder | david_folder_statement_read |
| David confession | david_confession_read |

Các điều kiện trong bảng đều value:true. Intro Anna/Leo chỉ được ghi sau ít nhất một câu hỏi đã ghi nhận, vì engine chưa lưu việc chỉ nhìn entry; content không tự tạo visited flag cho lần mở/đóng.

Hai node David answer3/answer3_unlocked hiện dùng chung david_q3_read. Bổ sung một setFlag(true) riêng vào choice Tiếp tục hỏi của từng node, cùng thời điểm ghi david_q3_read; giữ flag cũ và completionCondition cũ để không thay completion/objective/facts. Đây là thêm khóa authored trong mapflags hiện có, không thêm engine field hay schemaVersion save mới.

Không dùng current node.condition để ẩn transcript lịch sử: nếu người chơi từng ghi nhận hai câu trả lời khác nhau trước/sau mâu thuẫn, cả hai vẫn xem lại được. Các nhánh chưa thực sự ghi nhận không hiện dù contradiction/completionFlag đã true.

### Save cũ

Flags Anna/Leo và các flag David đã tách sẵn tiếp tục mở đúng statement. Với save trước hai khóa mới, david_q3_read không chứng minh đã đọc nhánh nào: không backfill hoặc đoán từ contradiction hiện tại. Hai statement đó chỉ hiện sau khi người chơi hỏi lại và ghi nhận từng nhánh còn tiếp cận được. Giữ trạng thái phỏng vấn xong/objectives/facts/evidence và mọi progress cũ; không reset hoặc ép replay để chơi tiếp.

Giới hạn được chấp nhận trong thiết kế này: không khôi phục được transcript nhánh David cũ vốn chưa được lưu riêng. Không mất transcript đã hiển thị trước đây vì tabPeople trước gói này luôn trống.

## 5. Selector và UI

Selector thuần trong game-web nhận CaseDefinition và GameState, trả view data cho hồ sơ:

- Mỗi NPC nối đúng dialogueTreeId/npcId; chọn statements có recordedCondition đạt.
- Chỉ hiện hồ sơ có ít nhất một statement ghi nhận. Không đưa NPC chưa ghi nhận vào list chỉ vì npcs.json có tên.
- Tên/vai trò từ NPCDefinition, lời khai từ node gốc, thứ tự theo NPC content và metadata. Không sort theo giờ gặp vì state không lưu giờ gặp.
- Trạng thái hoàn tất chỉ từ flags[tree.completionFlag]===true; nếu chưa hoàn tất thì “Đang phỏng vấn”. Status không unlock transcript khác.
- Không mutation khi mở People, không applyEffect/đổi objective hoặc tạo fact từ việc xem lại.

Tab Nhân vật dùng list hồ sơ giấy, tiêu đề tên/vai trò, badge/trạng thái chữ, danh sách lời khai. Không dùng đỏ làm status trang trí; chỉ semantic clue/contradiction theo artguardrail. Không đánh giá NPC có tội/vô tội hoặc cung cấp nút dẫn thẳng lời giải.

UIStrings thêm label heading lời khai và hai trạng thái, nội dung ở game-content và Zod UI schema; không hardcode UI copy/CaseID trong React. Empty state hiện có dùng khi chưa có hồ sơ. Không cần thanh phần trăm hoặc số câu hỏi tổng thể vì metadata có conditional branches.

Panel tận dụng scroll/layout đã sửa. Tabs/header/Đóng/focused control phải dùng được ở1280×720 và760×600; danh sách dài cuộn nội bộ, không cuộn canvas/document. Kiểm tra tabConclusion xuất hiện cùng People để không che control cuối do bề ngang.

## 6. Translation và vocabulary

Render lời khai qua VocabularyText hiện có với text/translationVi/spans/catalogue gốc. Mode lấy từ Settings; không thêm control đổi mode trong People.

- Beginner: bản dịch chỉ hiện nếu node có translationVi, không tự dịch phần content thiếu translation.
- Learning: giữ click/Enter mở nghĩa và reveal translation theo component hiện tại.
- Immersion: theo behavior hiện có, không thêm bản dịch ngoài mode.
- Context ID dùng đúng `dialogue:${tree.id}:${node.id}:text`, không tạo context notebook mới hoặc inflate encounterCount khi đọc lại. Learning reducers/bus hiện có tiếp nhận encounter/inspect/reveal; không logic learning trong Phaser.
- Metadata không được mở trước node đã ghi nhận; việc mount VocabularyText cho nhánh ẩn cũng bị cấm để không ghi encounter/spoiler ngầm.

## 7. Test và Definition of Done

TDD cho metadata validation/selector/logic. Tối thiểu:

1. Case không metadata vẫn load; metadata lỗi duplicate/missing node/wrong speaker/unknown flag/flag tree khác/completionFlag/false/empty group bị reject với path.
2. Freshstate không hồ sơ; flag không liên quan không mở hồ sơ.
3. Một câu hỏi Anna ghi nhận → hồ sơ Anna + intro/câu đã biết, không các câu còn lại; progress chưa complete.
4. Đủ câu hỏi → statuscomplete, không làm lộ statement conditional chưa ghi nhận.
5. Hai nhánh David: đọc nhánh thường rồi unlockcontradiction không lộ câu mới; đọc nhánh mới giữ được cả hai. Folder/confession chỉ hiện theo own recordedflag.
6. Save cũ có q3read/contradiction/completion nhưng thiếu hai flag mới không đoán nhánh; progress nguyên trạng, replay ghi flag đúng.
7. Xem People không mutate game progress; source node text được dùng, không hardcode IDs/text. Context học idempotent khi xem lại.
8. Browser fresh → Anna → câu hỏi → Tiếp tục → People → reload giữ đúng lời khai; chỉ mở/đóng chưa ghi nhận không giả progress. Partial/complete và branch secrecy có test.
9. Desktop/compact/keyboard/mouse, focus/Close/inner scroll sau list dài và Conclusion tab. Settings mode áp dụng, không selector dịch trong gameplay.

Chạy/dán output npm run lint/test/build; typecheck/format/memory, test validation/unit/learning và E2E group liên quan. Không backend nên không dotnet. Không đánh dấu complete nếu chỉ mocktab hoặc chưa chạy browser/logic checks.

## 8. Trình tự sau duyệt

Người dùng review spec này. Sau duyệt, lập plan tiếng Việt cho contract/content/selector/UI/regression/verification và chốt thực thi inline theo lựa chọn đã lưu. Không triển khai trước gate spec/plan; không tự gộp onboarding hoặc các đề xuất playtest còn lại. Spec mới chưa push trước xác nhận theo AI memory protocol.
