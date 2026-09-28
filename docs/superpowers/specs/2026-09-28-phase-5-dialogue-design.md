# Phase 5 — Dialogue

Trạng thái: **đề xuất, chưa được duyệt**. Tiếp tục sau Phase 4 tại `7d4405a`; checkout khảo sát là `dev`, HEAD `2595afd`. Phạm vi theo roadmap §24; nội dung Case #001 theo `docs/03_CASE_001_VERTICAL_SLICE_SPEC.md` §7, §9–§12. Đây là bản thiết kế để người dùng review trước khi viết plan và code.

## 1. Mục tiêu

Người chơi đến gần NPC, nhấn E, đọc lời khai tiếng Anh và chọn câu hỏi để điều tra. Ba cây Anna/Leo/David chạy từ JSON, có condition/effect và lưu tiến độ nghiệp vụ sau reload. Hội thoại không trở thành bài quiz và không tiết lộ truth trước khi người chơi đủ điều kiện.

Hiện trạng đã đối chiếu với Git:

- Case chỉ có `main_office`; Anna đã có NPC placeholder và interaction, chưa có hiệu ứng hội thoại.
- `dialogues.json` đang là `{}` và chưa được loader đọc; `CaseDefinition` chưa có NPC/dialogue contracts.
- Condition/effect interpreter thuần đã có trong game-core; `flags` đã nằm trong GameState/save.
- Bridge đang giải interaction thành effects; store đã có input lock, evidence/notebook UI và autosave theo thay đổi `caseState`.
- Save schema version 1 kiểm tra đúng tập objective keys. Thêm objective cần migration rõ ràng để save Phase 4 không bị coi là hỏng.

## 2. Phương án và phạm vi cần duyệt

**Đề xuất A:** thêm ba NPC tương tác trong scene Main Office prototype hiện tại; làm runner, content, UI và persistence đầy đủ cho dialogue. Kiểm thử điều kiện contradiction bằng fixture ở core/integration/E2E, chưa thêm cách mở contradiction trong gameplay. Cách này giữ một phase tập trung và cả ba NPC đều chơi được, nhưng vị trí tạm của Leo/David cần người dùng xác nhận vì Case spec chưa chốt vị trí hai NPC này.

**Phương án B:** dựng thêm Meeting Room/Archive và scene transition để đặt NPC ở nhiều phòng. Thế giới gần vertical slice hơn nhưng đưa thêm một hệ thống ngoài dialogue vào phase, tăng phạm vi và verification.

**Phương án C:** chỉ Anna tương tác trong world, Leo/David chạy qua test fixtures. Thay đổi nhỏ hơn nhưng chưa đáp ứng acceptance ba cây dialogue chơi được; không đề xuất dùng làm kết quả hoàn tất Phase 5.

Các phần dưới mô tả **phương án A để review**, chưa coi vị trí NPC hay ranh giới kiểm thử là quyết định đã duyệt. Không sửa product rule, số lượng năm evidence hoặc timeline/truth của Case #001.

## 3. Content và contract

- Thêm NPC definitions trong game-content: ID, tên, role và dialogue tree ID. Scene interaction tham chiếu `npcId`; bridge tra tree từ definition, không dựa vào tên/ID hardcode trong React/Phaser.
- `DialogueTree` gồm ID, NPC owner, entry node và danh sách nodes. Node có ID, speaker (NPC hoặc investigator), text, condition tùy chọn, effects và choices; node kết thúc được đánh dấu rõ.
- Choice có ID, text, target node, condition tùy chọn và effects. Không dùng eval hay callback trong JSON. Các condition dùng union hiện có; nhiều điều kiện dùng `all`/`any`.
- Entry node không có condition. Điều kiện của choice và target node phải được kiểm tra trước khi chuyển; lựa chọn không hợp lệ không đổi session hoặc GameState.
- Loader/Zod kiểm tra duplicate NPC/tree/node/choice IDs trong phạm vi tương ứng; speaker/owner/entry/next node; NPC reference ở scene; condition/effect references. Node IDs là local trong tree. Lỗi phải chỉ rõ file và đường dẫn field; build validation đọc cả dialogues/NPC content.
- Giữ nguyên lời khai, câu hỏi và câu trả lời trong Case spec §10–§12. Không bổ sung tình tiết điều tra mới.
- Lời khai không thêm vào năm evidence collectibles. Nếu cần fact nguồn hội thoại, mở rộng FactDefinition với nguồn dialogue được validate; fact phải có ít nhất một nguồn evidence hoặc dialogue hợp lệ. Không giả lập evidence ID để vượt validator.

## 4. Runner và trạng thái nghiệp vụ

- DialogueRunner đặt trong `packages/game-core/src/dialogue`, nhận definition, GameState và session qua tham số; không import content JSON, React, Phaser, Zustand, DOM hoặc IndexedDB.
- Session gồm tree/NPC/current node; đây là state hội thoại đang mở, tách khỏi GameState persisted. Không tạo mutable singleton.
- API pure cho bắt đầu, lấy choices khả dụng, chọn choice và kết thúc. Transition trả session mới, GameState, events hoặc lỗi typed. Effects dùng interpreter hiện có; effect lỗi rollback cả session và nghiệp vụ của thao tác đó.
- Node effects chạy khi vào node; choice effects chạy khi chọn choice. Không chạy effect khi React render, tra choices hoặc khi đóng sớm. Thao tác UI lặp không được tự đánh dấu interview hoàn tất.
- Khi đã đọc response, người chơi có nút tiếp tục về menu câu hỏi. Node kết thúc nhánh đặt flag hoàn tất nhánh tương ứng. Đã đọc cả ba nhánh ban đầu của một NPC mới đặt flag interview của NPC đó.
- Sau khi cả ba interview ban đầu hoàn tất, objective `Talk to Anna, Leo, and David` hoàn thành. Đóng bằng Escape/nút đóng giữ effects đã thực hiện nhưng không hoàn thành các nhánh chưa đọc. Mở lại bắt đầu ở menu/entry; những flag đã đạt vẫn giữ nguyên.
- Objective hội thoại có thể active từ đầu prototype để việc nói chuyện không phụ thuộc ghi chú Phase 3; objective cũ giữ trạng thái và behavior hiện tại. Điều kiện hoàn tất được diễn giải trong core từ content, không hardcode tên NPC/flag ở store.
- Đọc lại câu trả lời được phép; các flags/facts đã có không phát event hay autosave trùng. Nếu objective đã complete, content/runner không phát lại effect completeObjective gây lỗi.

## 5. David và điều kiện contradiction

- Trước contradiction, câu hỏi xác nhận nhận câu trả lời `Yes. I'm certain.`; không hiện challenge hoặc confession.
- Một flag nghiệp vụ `david_contradiction_found` là đầu vào do Phase 8 sẽ đặt sau khi validator xác nhận hai facts. Thiếu flag được coi là false trong contract dialogue, không đổi semantics chung của condition interpreter mà không có test.
- Khi flag true, câu hỏi xác nhận dẫn tới `...I may have gone in for a moment.`; choice challenge xuất hiện theo Case spec §12.
- Challenge đi theo thứ tự security log → lời giải thích về folder → câu hỏi `Which folder?` → confession. Facts `david_collected_folder` và `david_took_report` chỉ unlock ở node đã đọc tương ứng, không unlock khi mở David hoặc chỉ đặt flag contradiction.
- Phase 5 author và kiểm thử cả hai nhánh bằng state fixture. E2E nhánh hậu contradiction dùng save fixture có flag hợp lệ; không thêm nút debug hay cách người chơi tự bật flag trong bản game.
- Không thực hiện contradiction detection/timeline của Phase 8 hoặc accusation/conclusion UI của Phase 9. Vì gameplay chưa tạo được flag, báo rõ giới hạn acceptance này khi bàn giao.

## 6. Bridge, store và React

- Phaser tiếp tục emit `interaction:triggered`; bridge giải NPC reference rồi dispatch startDialogue vào store. Không đưa dialogue logic vào WorldScene.
- Store bọc runner và giữ session transient; core GameState tiếp tục là nguồn flags/facts/objectives. Các interaction gửi khi input đang locked không được mở thêm overlay hoặc áp dụng effects.
- `inputLocked` phản ánh pause/evidence/notebook/dialogue. Dialogue không chồng lên overlay khác; J/E không mở notebook hay tương tác world trong lúc dialogue active. Escape đóng dialogue trước khi mở pause; bỏ qua input/textarea/contenteditable theo rule hiện có.
- React DialogueView hiện speaker, role, text và các câu hỏi có condition đã thỏa. Tên/copy/ID lấy từ content; UI labels lấy từ UI strings JSON.
- Dùng panel giấy, font/tokens của dự án, cỡ chữ ít nhất 14 px; màu đỏ chỉ cho selected investigation node, không nhuộm các button thông thường. Placeholder NPC được ghi nhận là prototype, chưa tạo portrait/art mới.
- Các choices dùng button native, thao tác Tab/Shift+Tab/Enter/Space, focus trap, focus visible. Chuyển node đặt focus vào nội dung/choice hợp lý; đóng trả focus về trigger còn tồn tại hoặc game container focusable. Tránh đọc screen reader lặp toàn bộ lịch sử.
- Canvas không remount khi đổi node. Cleanup bus, keyboard, store subscription và focus handler khi unmount/shutdown.
- People tab vẫn là khung của Phase 4; không mở rộng thành hồ sơ NPC trong phase này.

## 7. Persistence và lỗi

- Flags/facts/objective transitions autosave qua cơ chế `connectAutosave` đã có. Session/current node, focus và overlay không lưu; reload đóng dialogue và giữ tiến độ đã ghi.
- Save schema version 2 hỗ trợ objective hội thoại mới; migration version 1 phải validate theo contract legacy Phase 4 trước khi bổ sung objective status mới và giữ nguyên evidence/fact/flags/objective cũ. Không tự reset progress của objective cũ.
- Sau migration, reconcile objective hội thoại theo flags đã có qua core transition; không đánh dấu interview nếu save cũ chưa có flags đó.
- Backup raw save trước khi ghi bản migrated; nếu backup/validation/migration/ghi thất bại, không ghi đè save gốc. Dữ liệu không hỗ trợ vẫn theo recovery confirmation flow Phase 4.
- Save đang có schema 2 phải chứa đúng objective keys hiện tại. Không nới validation cho arbitrary objective IDs để che lỗi content.
- Runner lỗi giữ node và state trước thao tác, hiển thị thông báo developer-readable qua app. Không đóng game hoặc âm thầm bỏ choice. Logs development dùng `[Dialogue]` và hạn chế production.

## 8. Verification và nghiệm thu

- Core unit tests: start/choice/end, node/choice conditions, effect order/rollback, duplicate/idempotent flags/facts, early close/reopen, ba interview flags và objective completion, David trước/sau contradiction và confession không unlock sớm.
- Content tests: ba trees đúng câu thoại authoritative, refs/duplicate/target lỗi, nguồn fact dialogue hợp lệ, NPC interaction mappings; build phải fail khi dialogue invalid.
- App tests: bridge NPC → runner/store/view; input lock và overlay exclusivity; focus/keyboard/Escape; transient state không autosave; nghiệp vụ đổi mới autosave.
- Persistence tests: schema 1 → 2 bảo toàn Phase 4 progress, round-trip flags/facts/objectives, save hỏng/version lạ và backup/write failures không overwrite.
- E2E: phỏng vấn cả ba NPC từ world, đóng/mở/reload giữ progress, canvas một instance, khóa/mở lại movement, conditional David bằng fixture và không có runtime console error.
- Khi implementation kết thúc, chạy và dán output `npm run lint`, `npm run test`, `npm run build`, cùng format/E2E/memory checks. Backend không thay đổi.
- Hiện npm/npx chưa có trên PATH; lúc implementation cần xác định npm runtime cục bộ hoặc báo rõ lệnh bắt buộc không chạy được. Không dùng package manager khác và không thay output npm bằng tuyên bố PASS từ công cụ khác.

## 9. Bước tiếp theo

Người dùng review phạm vi phương án A, vị trí NPC prototype và giới hạn conditional dialogue trước Phase 8. Sau khi spec được duyệt mới dùng writing-plans để lập plan tiếng Việt và trình chọn cách thực thi. Bản spec này chưa cho phép triển khai code hoặc push.
