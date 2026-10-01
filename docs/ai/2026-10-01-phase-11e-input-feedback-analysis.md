# Phase 11E — phản hồi camera, minimap và điều khiển

Trạng thái: phân tích và đề xuất, chưa duyệt thiết kế mới, chưa sửa production code.

## Yêu cầu người dùng

1. Zoom sâu hơn.
2. Chỉ chọn chế độ dịch trong Settings; bỏ controls đổi mode trong lúc chơi.
3. Minimap thể hiện rõ vị trí nhân vật.
4. Phím mũi tên dùng song song WASD.
5. Chuột dùng song song bàn phím để di chuyển và tương tác.
6. Cổng chuyển scene lấy ý tưởng từ ảnh bục teleport tròn, vòng năng lượng và cột ánh sáng người dùng cung cấp. Hướng palette/hiệu ứng đang chờ làm rõ.

Đã làm rõ với người dùng: click NPC/chứng cứ/cửa từ xa để đi tới; khi đã tới gần, click lần nữa để tương tác. Không tự tương tác khi hoàn tất đường đi.

## Bằng chứng minimap

Probe browser read-only tại viewport 1280×720:

```text
circle r = 0.56 SVG units
visible diameter = 0.12255859375 CSS px
viewBox = 64 180 1792 896
position before D = cx 1036.8, cy 589.6
position after D = cx 1080.8, cy 589.6
```

`minimapModel.ts` lấy radius từ `scene.worldBounds.width` (16 logical units) nhưng viewBox đã là projected screen space (1792 units). Vị trí cập nhật đúng; dấu player quá nhỏ để nhìn rõ. Marker evidence/NPC cũng dùng cùng phép tính sai đơn vị. Thiết kế sửa cần tính theo projected bounds / kích thước hiển thị, có regression cho đường kính nhìn thấy.

## Đề xuất để người dùng duyệt

- Zoom khởi điểm 1.8× desktop / 1.6× compact; vẫn follow/clamp theo scene, kiểm ảnh trước khi chốt. Không thay vị trí logical hoặc collision.
- Controls chọn chế độ dịch chỉ tồn tại trong Settings/Pause; dialogue, notebook, evidence và vocabulary giữ việc đọc/render mode đã lưu. UI mở Settings/Pause phải click được để hoàn thành flow chỉ dùng chuột.
- Dấu player rõ khoảng 8–10 CSS px, có viền sáng và chú giải; marker mục tiêu phân biệt được và không che dấu player. Dùng vị trí Phaser publish qua event bus/store hiện có.
- Arrow Up/Down/Left/Right cùng mapping theo màn hình như W/S/A/D, chuẩn hóa diagonal/same-direction để không tăng tốc khi giữ hai loại phím. Bỏ qua input/textarea/contenteditable; chặn scroll khi phím dùng để chơi.
- Click sàn để đi đến vị trí reachable; click mục tiêu xa để đi vào interaction radius, dừng và chờ click lần nữa. Khi đang trong radius, click tương tác một lần qua event bus hiện có.
- Pathfinding A* thuần TypeScript trong tầng presentation/game systems, dùng footprint/solids/bounds hiện có; movement cuối vẫn qua collision resolver. Không thêm dependency, không đưa logic học vào Phaser.
- Click mới thay đường đi, bàn phím hủy đường chuột, modal/pause/transition hủy navigation. Click HUD/modal không truyền xuống world. Đích ngoài bounds, trong vật cản hoặc không tới được không xuyên tường và không teleport.
- Kiểm unit cho navigation/input/minimap và E2E cho mouse-only play, phương thức input xen kẽ, tương tác hai bước, viewport/zoom, Settings-only translation và cleanup.

## Handoff

## Bổ sung tham chiếu cổng chuyển scene

- Ảnh người dùng cung cấp ngày 2026-10-01: bục tròn với các vòng đồng tâm nằm trên sàn, vòng năng lượng xoay và tia sáng dựng đứng. Đây là nguồn ý tưởng hình dáng/hiệu ứng; chưa phải asset game đã tạo.
- Art/06 và `apps/game-web/AGENTS.md` hiện yêu cầu muted sepia, không neon/bloom mạnh. Đã hỏi người dùng chọn giữ xanh hologram như ảnh hay chuyển sang bục đồng/ánh vàng nhẹ. Chưa suy ra lựa chọn từ option mặc định.
- Các transition hiện tại: `hallway_door` ở Office → Archive/from_office; `PLACEHOLDER_archive_door` ở Archive → Office/from_archive. Visual mới cần điểm đặt trên sàn phía trong scene, fit toàn bộ bục và lối tiếp cận; không đặt tâm bục trên tọa độ door frame ở mép world.
- Giữ chuyển cảnh hai chiều và ID public khi thiết kế visual mới. Cổng không tự kích hoạt khi bước vào; dùng E hoặc click tương tác lần hai, phù hợp quyết định mouse input đã chốt. Chưa sửa geometry/content/renderer.

## Trạng thái bàn giao

Git baseline: `679b4de`, chỉ có hai debug.log untracked. Chưa sửa game; probe nằm trong ignored runtime directory. Cần duyệt hướng thiết kế trước khi viết spec tiếng Việt, sau đó duyệt spec/plan theo workflow. Giữ Phase 11E mở, không bắt đầu Phase 12.
