# Playtest persona chuột — 2026-10-01

HEAD parent cung cấp: 9cff732 / dev. Phiên Chromium fresh context 1280×720, URL http://127.0.0.1:5173/. Chủ yếu click chuột thật qua Playwright; Home/Enter chỉ dùng chọn setting native. Không đọc source gameplay/content/solution/E2E, không debug API/state injection/teleport. Đây AI persona, không dữ liệu người thật. Không đánh giá âm thanh vì không nghe được.

## Trình tự thực tế

1. Vào game thấy objective “Tìm hiểu điều gì đã xảy ra với bản báo cáo”, hồ sơ 0/5; tự nhìn ba NPC và căn phòng.
2. Nhấp Anna từ xa để đi tới, nhấp thêm khi gần để mở lời khai. Hỏi giờ rời phòng (05), có quay lại không (07), người còn trong phòng (13); đóng và mở lại thoại giữa các lần.
3. Mở sổ tay bằng nút dưới màn hình. Evidence và Nhân vật trống (09,10).
4. Bấm Bản đồ: minimap biến mất, thay bằng icon nhỏ (15).
5. Tạm dừng; xem translation/volume/subtitle/reduced-motion. Chọn Cơ bản bằng select và Home/Enter (16,18,19). Resume.
6. Nhấp vùng prop/wall trái (21): không thấy nhân vật đi hay phản hồi. Nhấp sàn trống (22), nhân vật đi, camera theo; nhấp vùng trái tiếp (23), tới phòng họp, có prompt đọc biên bản.
7. Nhấp biên bản (24), nhận Meeting Minutes; hồ sơ 1/5. Bản dịch tiếng Việt hiện theo setting Cơ bản. Sổ tay evidence có Xem lại và đầy đủ text (26).
8. Nhân vật vẫn “Chưa có nhân vật nào được ghi nhận” (27), timeline có mốc từ biên bản và giới thiệu vụ án (28).

Kết thúc khoảng 15 phút có tính overhead công cụ: thu thập 1/5 evidence, nói với 1/3 NPC, không hoàn thành vụ án. Chưa tìm/đi portal, chưa accusation, chưa kiểm tra reload/persistence. Không suy luận kết luận cho các flow chưa chơi.

## Findings

### F1 — P1: Lời khai Anna không xuất hiện trong sổ tay Nhân vật

Loại: nghi lỗi chức năng, cần parent xác minh contract. Repro: fresh game → gặp Anna → hỏi cả ba lựa chọn → đóng thoại → mở sổ tay Nhân vật. Observed: “Chưa có nhân vật nào được ghi nhận”, ngay cả sau nhặt Meeting Minutes. Expected của người chơi: người đã gặp và lời khai đã hỏi được ghi lại hoặc UI nói rõ bước còn thiếu. Impact: không thể dùng notebook để nhớ lời khai, không biết hành động đã lưu hay chưa, cảm giác mất tiến độ. Evidence: 05-anna-time.png, 07-anna-return.png, 13-anna-who.png, 27-people-after-evidence.png. Ưu tiên xác minh/sửa cao nhất; không thay điều tra bằng quiz.

### F2 — P2: Thiếu ngữ cảnh vụ án lúc bắt đầu và hướng dẫn chuột

Loại: UX preference/onboarding, không khẳng định lỗi contract. Repro: mở fresh game. Observed: vào thẳng world; objective chỉ nói bản báo cáo, footer chỉ WASD/E/J/M/Esc. Người chơi chuột phải thử mới hiểu click xa đi tới, click lại tương tác. Expected: một đoạn mở đầu ngắn cho biết vai trò người điều tra/vấn đề đang cần tìm, và dòng hướng dẫn chuột rõ ràng. Impact: hành động mở đầu là hỏi người gần nhất nhưng chưa hiểu đang tìm báo cáo nào hay evidence ở đâu. Evidence: 01-start.png, 02-anna-far.png, 03-anna-near.png. Giữ click-xa-đi/click-lại-tương-tác đã accept; chỉ cải thiện discoverability, không thêm giải đáp vụ án.

### F3 — P3: Click đích không đi được thiếu phản hồi

Loại: UX preference; không khẳng định pathfinding lỗi. Repro: đứng gần Anna → click góc trái prop/wall (x72,y329), đợi3giây. Observed: nhân vật đứng yên, không marker/hint; click sàn (x230,y421) sau đó đi bình thường. Expected: phản hồi ngắn cho biết đích không đi được hoặc marker đích hợp lệ. Impact: người chơi không biết click đã nhận chưa hoặc game đang bị khóa. Evidence: 21-left-room.png và22-left-floor.png. Không thay bằng teleport hay tự tương tác khi xa.

### F4 — P3: Nút Bản đồ thể hiện như mở bản đồ nhưng thực tế ẩn minimap

Loại: UX preference. Repro: minimap đang hiện → click Bản đồ ở footer. Observed: minimap bị ẩn, chỉ còn icon góc phải. Expected: tên/tooltip “Ẩn/hiện bản đồ nhỏ” thể hiện chức năng hiện tại. Impact: thử tìm đường nhưng lại mất công cụ định hướng. Evidence: 15-map.png. Có thể đổi copy; chưa yêu cầu full map mới.

## Điểm tốt quan sát được

- Art, bố cục giấy và tông màu tạo cảm giác điều tra nhất quán; NPC có tên nhìn được.
- Khi vào phạm vi, prompt chữ cụ thể “Nói chuyện với Anna” / “Đọc biên bản cuộc họp” và outline làm rõ đối tượng.
- Evidence acquisition tăng counter ngay, mở nội dung rõ, notebook lưu text và timeline từ evidence; 24-minutes.png,26-notebook-evidence.png,28-timeline.png.
- Translation chỉ đổi trong Pause settings; chọn Cơ bản rồi evidence hiện bản dịch, không phải học bằng flow quiz. 16-settings.png,24-minutes.png.

## Đề xuất ưu tiên

1. Xác minh F1 bằng contract và test: ghi NPC/lời khai khi hỏi, đảm bảo notebook thể hiện dữ kiện người chơi đã biết.
2. Thêm hướng dẫn chuột ngắn/case brief ngắn nếu contract có nội dung phù hợp. Không tự đặt product rule khi docs thiếu.
3. Copy map toggle và phản hồi đích không đi được là cải thiện nhỏ, có thể làm sau.

Ảnh và runner chỉ là scratch artifacts. Không sửa source/tests/memory, không commit/push, không start/stop sharedserver. Runner Node session riêng cần parent stop nếu còn chạy; browser headless profile độc lập.
