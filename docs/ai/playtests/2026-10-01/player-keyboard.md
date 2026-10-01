# Playtest: keyboard, compact 760×600

Ngày: 2026-10-01. UI http://127.0.0.1:5173/. Fresh Chromium context, headless, save độc lập. Khoảng 15 phút. Persona AI: người học tiếng Anh ưu tiên bàn phím; đây không phải nghiên cứu với người dùng thật. Không truy cập gameplay state/API/content hoặc lời giải. Khi đọc apps/game-web/AGENTS.md đã vô tình gặp tên đáp án ở dòng mô tả E2E; không dùng thông tin đó và không thực hiện accusation.

## Hành trình thật

1. Vào thẳng văn phòng, thấy 0/5 hồ sơ, J/M/Esc và ba NPC. Chưa biết mục tiêu vì phần mục tiêu thu thành icon ◎.
2. ArrowLeft + ArrowDown khoảng 350 ms, E mở Anna. Tab tới các control; Enter trên từ `left` mở nghĩa tiếng Anh; Escape đóng tooltip, giữ hội thoại.
3. Tab/Enter hỏi `Did you return later?` và `What time did you leave?`. Đọc câu trả lời trực tiếp trong UI. Không đánh giá chất lượng âm thanh vì headless không nghe được.
4. Escape đóng dialogue; J mở notebook. Chưa có evidence. M mở bản đồ nhỏ. Escape mở pause, thấy chế độ dịch, âm lượng, phụ đề, giảm chuyển động; Tab đi qua các control.
5. Đi tới diamond trên bàn phòng họp bằng các đoạn ArrowLeft/Up/Down/Right. Bị cản ở cạnh bàn/tường và chưa tìm được điểm đứng tương tác. Sau đó dùng chuột click diamond, đợi rồi click lại; vẫn chưa lấy evidence. Không kết luận lỗi pathfinding/collider từ trải nghiệm này.
6. Tab từ world, Enter mở mục tiêu, lúc đó mới đọc được `Tìm hiểu điều gì đã xảy ra với bản báo cáo`.
7. Đã thử đổi chế độ qua select bằng Tab/ArrowUp/Enter. Chưa xác minh ngữ cảnh text sau đổi. Kết thúc 0/5; chưa tới portal/accusation hoặc đóng case.

## Findings

### K1 — Bug P1: focus cuộn cả game-root, cắt header/close và lưu offset khi đổi UI

Reproduction quan sát: fresh 760×600 → ArrowLeft+ArrowDown ~350 ms → E mở Anna → Tab tới từ `left` → Enter mở tooltip → Escape tooltip → hỏi thêm bằng Tab/Enter → Escape dialogue → J notebook.

Expected: hội thoại/notebook cuộn nội dung bên trong nếu cần; header/Đóng, HUD và canvas giữ vị trí viewport.

Observed: screenshot02 tên NPC/header ở ngoài top. Sau đóng dialogue, notebook header và Đóng hoàn toàn ngoài viewport, thế giới/HUD dịch lên, dải trống xuất hiện dưới cùng. Offset còn tồn tại khi mở minimap/pause. Escape vẫn thoát được. Tab về objective control đưa world về vị trí bình thường.

DOM geometry tại notebook: window.scrollY=0; body clientHeight/scrollHeight=600/600; `.game-root` clientHeight=600, scrollHeight=686, scrollTop=86, overflow=hidden; `.notebook-overlay` y=-86 height=600; `.paper-panel.notebook-panel` y=-70 height=612, scrollTop=0; button Đóng top=-48 bottom=-4. Đây là cuộn game-root, không phải nội dung notebook.

Impact: mất tên người nói và control đóng bằng chuột, canvas/HUD dịch chuyển làm tìm đường và đọc mục tiêu khó hơn. Ưu tiên sửa trước thay đổi gameplay.

Evidence: 02-dialogue-word.png, 04-notebook.png, 05-map.png, 06-settings.png, đối chiếu 01-start.png và 13-objectives.png.

### K2 — Preference / UX friction P2: mục tiêu đầu tiên quá kín khi bắt đầu

Reproduction: fresh vào game, chưa mở icon ◎; đi hỏi NPC và xem notebook/map. Mục tiêu chỉ được thấy sau Tab+Enter mở icon về cuối lượt.

Expected với persona mới: nhận biết mình đang điều tra sự việc nào và bước khám phá rộng đầu tiên ngay trong world UI.

Observed: HUD chỉ có icon ◎ và 0/5, NPC tên, J/M/Esc; không có briefing hiển thị lúc đầu. Khi mở mới biết chuyện bản báo cáo. Việc khám phá ban đầu dựa vào diamond/NPC hơn là câu hỏi điều tra.

Impact: thời gian đầu có cảm giác tìm control thay vì suy luận. Đề xuất hiển thị objective đầu tiên lúc start hoặc một cue ngắn; giữ investigation-first, không thêm checklist quiz.

Evidence: 01-start.png, 13-objectives.png. Không coi việc collapsed HUD tự thân là bug.

### K3 — Preference / friction chưa xác minh bug P2: tìm điểm đứng quanh bàn khó với bàn phím

Reproduction: đứng bên phải phòng họp, thấy diamond trên bàn; ArrowLeft đi tới cạnh phòng → Up/Left và Right/Down/Left thử vòng cạnh → E nhiều lần khi nghĩ đã gần. Không xuất hiện prompt evidence và vẫn 0/5. Click diamond từ xa, chờ, click lại cũng chưa lấy được trong lượt này.

Expected: người chơi có thể đọc được chỗ đứng tiếp cận diamond từ cấu trúc phòng và nhận biết vì sao chưa trong khoảng tương tác.

Observed: có nhiều vật cản gần bàn, sprite/diamond nhỏ ở compact viewport; chưa thấy phản hồi hữu ích khi E ngoài range. Tôi đã chuyển qua chuột tại bước click diamond vì chưa định vị được lối vào bằng bàn phím.

Impact: ngắt nhịp điều tra, 0 evidence sau gần 15 phút. Đề xuất parent tái hiện độc lập sau sửa K1 vì offset màn hình có thể góp phần; tránh kết luận collider lỗi từ một lượt.

Evidence: 08-evidence.png, 09-room.png, 10-entry.png, 11-evidence-modal.png (thực tế chưa mở modal), 12-click-path.png.

## Điểm tốt

- E mở NPC, Tab/Enter chọn lời hỏi và vocabulary dùng được; Escape đóng riêng tooltip trước dialogue.
- Vocabulary là nghĩa và ví dụ theo click/Enter, không tự mở. Giúp đọc tiếng Anh trong ngữ cảnh lời khai.
- Pause Settings gọn, có translation mode, subtitle, giảm chuyển động; control select và range đi được bằng Tab.
- Minimap phân biệt vị trí người chơi và diamond; không tự giải evidence.

## Ưu tiên

1. Sửa viewport/focus scroll K1, kiểm tra 760×600 bằng keyboard và mouse.
2. Cân nhắc objective đầu tiên hiển thị/cue lúc bắt đầu.
3. Chơi lại tiếp cận bàn sau fix viewport trước khi thay collider/pathfinding. Giữ click xa đi tới, click lại tương tác đã được chấp nhận; không thay cổng đồng/nhạc từ lượt chưa tới portal.
