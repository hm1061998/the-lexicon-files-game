# Phase 4 — Evidence & Notebook

Trạng thái: bản thiết kế chờ người dùng duyệt. Triển khai roadmap `docs/04_CODEX_IMPLEMENTATION_ROADMAP.md` §23. Các product rule trong Game Design Document, Vertical Slice Spec, Architecture và `AGENTS.md` là authoritative.

## 1. Mục tiêu và tiêu chí nghiệm thu

Hoàn thiện một vòng lặp investigation tối thiểu: người chơi thu thập một evidence đại diện, đọc nội dung, xem lại trong notebook và tiếp tục thấy evidence sau khi tải lại game.

Tiêu chí nghiệm thu:

- Tương tác với evidence mới gọi transition của `game-core`; evidence được thêm đúng một lần và notebook phản ánh state từ core.
- Thu thập evidence mở `EvidenceModal` với tên và mô tả lấy từ content; đóng modal không làm mất evidence.
- Nhấn `J` mở/đóng notebook ở tab Evidence; People và Vocabulary có tab với trạng thái khung/empty state, chưa triển khai nội dung ngoài phạm vi Phase 4.
- Thu thập evidence kích hoạt autosave IndexedDB. Khi khởi động lại, state nghiệp vụ đã lưu được nạp trước khi world tương tác được.
- Có test cho thêm evidence, lặp tương tác, mở/đóng modal và notebook, lưu/khôi phục state, lỗi persistence và việc khóa/mở lại input game.

## 2. Phạm vi content và trải nghiệm

- Chỉ dùng một evidence đại diện trong Case #001 để chứng minh end-to-end. Không mở rộng đủ năm evidence trong vertical slice ở phase này.
- Nội dung và ID evidence hiển thị lấy từ `packages/game-content` (JSON được Zod validate); không hardcode copy của Case #001 trong React hoặc Phaser.
- Khi evidence chưa có được tương tác, app gọi transition core để thêm evidence. Transition idempotent: tương tác lặp không tạo ID hoặc domain event trùng, không mở lại modal.
- Khi evidence được thêm mới, app mở modal chi tiết, đồng thời state notebook được cập nhật qua projection từ game state. Người chơi có thể đóng modal rồi mở notebook để xem lại evidence.
- Notebook dùng phím `J`, mặc định mở tab Evidence. People và Vocabulary chỉ là tab khung với thông báo chưa có nội dung.
- Modal và notebook phải thao tác được bằng bàn phím; modal giữ focus bằng focus trap, đóng được bằng nút đóng hoặc `Escape`. Modal khóa movement/gameplay input; đóng modal giải phóng khóa. Shortcut không kích hoạt khi focus nằm trong `input`, `textarea` hoặc `contenteditable`.

## 3. State, bridge và persistence

- `game-core` tiếp tục là nguồn chân lý cho state nghiệp vụ, bao gồm evidence IDs. Logic thu thập dùng reducer/transition hiện có hoặc mở rộng contract core nếu cần; không sao chép luật gameplay vào Zustand.
- Zustand giữ projection của core state và state giao diện tạm thời như evidence đang hiển thị, notebook đang mở, tab đang chọn và input lock. UI transient không được lưu vào save game.
- Phaser chỉ phát typed interaction event qua event bus; bridge/store thực hiện transition core, cập nhật projection và xử lý domain event. React không gọi Phaser internals, Phaser không chứa learning/persistence logic.
- Dùng IndexedDB qua adapter thuộc `apps/game-web/src/persistence/`, với schema save có version. Phase 4 chỉ cần một save hiện hành cho Case #001; chưa làm UI quản lý save slots.
- Khởi tạo game bất đồng bộ theo thứ tự: đọc/kiểm tra save → khôi phục `GameState` tương thích hoặc tạo state mới khi chưa có save → mount world. Không để người chơi tương tác trước khi hoàn tất bootstrap.
- Autosave sau transition nghiệp vụ thành công làm thay đổi state, tối thiểu gồm evidence mới; mở/đóng modal, mở notebook hoặc đổi tab không kích hoạt lưu.
- Save lỗi/không đọc được phải có thông báo developer-readable, không âm thầm thay state bằng state mới và ghi đè dữ liệu. Tuân theo quy tắc khu vực: backup dữ liệu save lỗi, thử migration được hỗ trợ; nếu không thể khôi phục/migrate thì chỉ tạo save mới sau khi người dùng xác nhận.
- IndexedDB không khả dụng hoặc thao tác lưu thất bại phải được thể hiện rõ; lỗi lưu không làm mất state đang chạy trong bộ nhớ.

## 4. Ngoài phạm vi

- Hoàn tất cả năm evidence, toàn bộ People/Vocabulary content hoặc các tab Case/Timeline/Notes/Phrases.
- Dialogue runner, learning interactions, contradiction, accusation, case conclusion, backend/API, cloud sync, nhiều save slot và UI quản lý save.
- Thay đổi product rule hoặc sửa/viết lại game-core ngoài contract transition tối thiểu cần thiết cho thu thập evidence.

## 5. Kiểm thử và Definition of Done

- Unit test core xác nhận add evidence mới, idempotency khi thêm trùng và domain event không trùng.
- Test persistence xác nhận serialize/deserialize giữ đúng state nghiệp vụ; xử lý database unavailable, dữ liệu sai schema/version và không overwrite save lỗi trước xác nhận.
- Test app xác nhận interaction → core/store projection → modal/notebook → autosave; modal khóa movement và `Escape`/nút đóng giải phóng khóa; canvas không remount khi state UI đổi.
- E2E xác nhận thu evidence mẫu, notebook hiển thị evidence, tải lại vẫn giữ evidence; keyboard shortcut tuân theo focus và modal behavior.
- Chạy và ghi output thực tế của `npm run lint`, `npm run test`, `npm run build`, `npm run format:check`, `npm run test:e2e` và `npm run memory:check`. Chỉ báo hoàn thành khi các lệnh bắt buộc chạy được và kết quả được ghi nhận; backend không đổi nên không cần .NET verification.

## 6. Câu hỏi triển khai cần xác nhận trong plan

- Cách đưa dữ liệu save đã khôi phục vào `createGameStore`/`GameCanvas` mà không remount canvas ngoài thời điểm bootstrap.
- Ranh giới migration/version của save adapter và cách backup save lỗi phù hợp schema MVP.
- Chọn domain event làm trigger autosave hay so sánh state transition tại bridge; bảo đảm không lưu cho thao tác UI thuần.
- Phân lớp component/modal/notebook và test seam tương ứng với cấu trúc UI hiện có.
