# Phase 11D — Chuyển Case #001 sang isometric dimetric 2:1

## Mục tiêu

Chuyển toàn bộ phần game đang chơi được của Case #001 (office và archive) từ bố cục tọa độ trục thẳng sang scene isometric dimetric 2:1. Đồng thời giải quyết các phản hồi scene/NPC: thu gọn và tổ chức phòng, đặt vật chứng lên bàn, tích hợp cửa vào tường, hiện tên và quay hướng NPC, thêm nhịp thở và walk sheet hoàn chỉnh.

Giữ nguyên engine Phaser, React HUD, typed event bus, Zustand, lưu trữ, nội dung vụ án, ID evidence/interactable/NPC, dialogue flow, objective và effects. Không thêm dependency hay đổi product rules. Kiến trúc game-core/learning-engine giữ thuần TS. Các scene mới trong Case #001 phải tuân thủ cùng hợp đồng; chưa chuyển content ngoài Case #001.

## Mô hình không gian dimetric

- Scene content lưu vị trí nền theo tọa độ logic liên tục `(u,v)` trên hai trục của mặt sàn isometric, không lưu vị trí chiếu màn hình. Scene ghi tỉ lệ chiếu `2:1` (ô chuẩn tham chiếu 128×64 px) và bounds logic.
- Dùng một hàm thuần cho phép chiếu: `screenX = originX + (u - v) × 64`; `screenY = originY + (u + v) × 32 - elevationPx`. `u` tăng theo hướng SE, `v` tăng theo hướng NE; bốn trục còn lại là hướng ngược lại. `elevationPx` chỉ nâng hình ảnh khỏi mặt sàn; depth/collision vẫn dựa trên điểm chạm sàn.
- Tọa độ của player, NPC, prop, tường, spawn, label, collision, điểm tương tác và vị trí player trên minimap dùng chung hệ logic. Mọi điểm hiển thị (sprite, marker, tên, prompt anchor, bóng và outline) đi qua cùng projector; React tiếp tục nhận event đã được chuyển sang CSS pixel.
- Phép chiếu: `x=originX+(u-v)×64`, `y=originY+(u+v)×32−elevationPx`; do đó `u+=SE`, `v+=SW`. Di chuyển bàn phím: `W=−u/NW`, `D=−v/NE`, `S=+u/SE`, `A=+v/SW`; tổ hợp chuẩn hóa tốc độ. Hướng animation lấy từ vector logic và ánh xạ sang NE/SE/SW/NW.
- Collision và kiểm tra đường đi chạy trong tọa độ logic bằng geometry thuần TypeScript, không áp rectangle screen-space của Arcade Physics lên mặt sàn đã chiếu. Collider content diễn tả footprint logic; hình ảnh được chiếu riêng. Tường/partition chạy dọc các trục logic, cửa để lại gap vật lý.
- Depth sorting dùng screen Y chiếu của điểm chân/floor contact, cộng depth bias; sprite cao không làm đổi điểm chạm sàn. Tie-break rõ ràng cho nhân vật/vật tương tác đứng cùng depth.
- Camera bounds tính từ các góc worldBounds đã chiếu. Anchor tương tác chiếu từ world logic qua camera sang CSS px đúng một lần. Minimap biểu diễn cùng hình học logic thành sơ đồ diamond; vị trí player, partition, label và marker không được trộn hệ tọa độ.

## Phạm vi scene và vật chứng

### 1. Thu gọn, dựng lại và sắp xếp phòng

- Dựng lại `main_office` và `archive` ở kích thước logic nhỏ hơn scene hiện tại 2400×1600 px. Chuyển mọi asset, collision, spawn, label, camera bounds, minimap và trigger sang logical coordinates; không scale cục bộ để giữ tọa độ cũ.
- Kết hợp khu làm việc (bàn, ghế quay về màn hình/terminal), khu họp (bàn và ghế bao quanh), tủ hồ sơ sát tường, cây/đồ trang trí ở góc và lối đi rõ. Không chồng collider/prop, không để khoảng trống lớn vô chủ.
- Nền, tường/partition, cửa và prop chỉ tái dùng nếu qua kiểm tra đồng nhất camera/perspective 2:1; tạo lại asset scene khi nguồn cũ không khớp. Giữ palette, nét, layer và quy tắc asset trong `docs/art/06`.

### 2. Vật chứng trên bàn

- Scene asset khai báo asset đỡ `restsOn` và `surfaceOffset` có tọa độ mặt sàn logic cùng độ nâng ảnh (`elevationPx`). Tọa độ render/interact của child được phân giải từ điểm đỡ; không hardcode quan hệ Case #001 trong Phaser.
- Dùng cho `meeting_minutes`, `phone_recording`, `objective_note` và vật chứng/ghi chú đặt trên bàn theo `docs/03_CASE_001_VERTICAL_SLICE_SPEC.md`. Child được vẽ đúng trên mặt bàn; collider không kế thừa collider bàn.
- Interaction radius được tính sau phép chiếu trong đơn vị px hiển thị. Marker, outline, prompt anchor, minimap và E-key resolve tới cùng vị trí chiếu của vật chứng. ID/effect giữ nguyên; bán kính chỉ đổi khi cần để tương tác được từ mép bàn.

### 3. Cửa nối hai scene

- Cửa office/archive là khung cửa isometric gắn vào khoảng mở của tường, cao xấp xỉ hai lần figure. Collider tường chừa gap; trigger đặt trước ngưỡng và spawn bên kia đặt phía trong, hai phía đối xứng.
- Giữ nguyên target scene, spawn IDs và transition semantics; chuyển cảnh hai chiều phải hoạt động. Cập nhật texture manifest, room labels, minimap và asset provenance.

## Nhân vật

### 4. Tên và quay hướng NPC

- Thẻ tên giấy luôn hiện phía trên từng NPC; nội dung lấy từ `npcs.json.name`, font Cambria/serif ≥14 px, màu mực (không đỏ), dưới marker và không đè prompt. Vị trí neo vào figure height/metadata; cleanup cùng scene.
- Khi dialogue bắt đầu thành công, NPC và player quay về phía nhau theo vector logic đã chiếu; dùng bốn idle texture NE/SE/SW/NW đã có, khai báo và preload trong content. Chuyển hướng ngắn 120–200 ms; khi giảm chuyển động thì đổi ngay. Đóng dialogue giữ hướng cuối; dialogue/objective/case state không đổi.
- Phát `dialogue:started` có kiểu cùng `npcId` qua event bus; Phaser cập nhật hình ảnh, React không truy cập Phaser. Dọn listener/tween khi dialogue đóng, scene đổi hoặc shutdown.

### 5. Nhịp thở

- Player và NPC thở khi đứng yên: `scaleX=1`, `scaleY` dao động quanh 1 tối đa 0.8%, chu kỳ khoảng 2.4 giây; NPC lệch pha theo ID.
- Dừng khi đi, khi nhân vật đang đối thoại hoặc `reducedMotion` bật. Chỉ tác động visual layer; không đổi tọa độ logic, collider, bóng, depth anchor, interaction, marker, tên hay outline quá 2 px. Không tạo timer/global mutable state.
- Có hàm thuần nhận thời gian, phase offset, walking/dialogue/reduced flags; cập nhật bằng clock của `WorldScene`.

### 6. Walk sheet hoàn chỉnh cho player và NPC

- Thay sheet thủ tục player bằng walk sheet hoàn chỉnh mới; tạo walk sheet hoàn chỉnh cho Anna, Leo và David để mỗi NPC có animation ngoài idle.
- Mỗi sheet là lưới 8×4 (NE, SE, SW, NW; 8 frame/hướng), 10 fps, cell 160×160, tổng 1280×640 RGBA/alpha trong suốt; figure cao khoảng 100 px, chân theo chuẩn 88% của `docs/art/07`. Giữ outfit/nhận diện, camera, scale, nét và palette từ idle turnaround; chu kỳ bước lặp 8→1 liền, tay/chân chuyển động rõ, không có mảnh rời, viền magenta hoặc chân trượt.
- Asset là ảnh hoàn chỉnh, không biến dạng procedural từ idle. Tích hợp đủ cả bốn vào `characterSheets`/`sharedTextures`; player walk giữ hoạt động. NPC có thể phát walk khi animation API yêu cầu, không thêm AI hoặc tự di chuyển. Dialogue facing vẫn hiển thị đúng idle hướng và không bị walk ghi đè.
- Ghi provenance từng file; xem contact sheet và preview loop. Xóa sheet thủ tục cũ sau khi asset mới được kiểm tra và dùng.

## Cập nhật hợp đồng tài liệu

- Cập nhật `docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md` §3, §16–17, §30–32, §51–55 và scene model để phản ánh logical-to-screen dimetric projection, collision, depth, interaction và dữ liệu độ cao.
- Cập nhật `docs/architecture/ARCHITECTURE.md` về ranh giới: game-content lưu logical coordinates; pure spatial helpers chiếu/toạ độ và collision; Phaser render/nhận event; React chỉ nhận typed events/store state.
- Cập nhật scene schema/types, migration/validation cho JSON hiện tại và tài liệu asset prompts. Không thay đổi API/backend hoặc state persistence.

## Tiêu chí chấp nhận

1. Unit test projector xác nhận trục u/v chiếu đúng NE/SE/SW/NW, inverse projection giữ vị trí trong sai số <0.01 logical unit; anchors, labels, camera và minimap không chiếu hai lần.
2. Unit test logical collision/di chuyển: tường theo hai trục isometric, chặn player đúng footprint, gap cửa đi qua được, tốc độ nhất quán theo screen-space và input focus vẫn bỏ qua phím tắt.
3. BFS `scene-layout.spec.ts` cho từng scene kiểm tra spawn, mọi NPC/interactable, cửa, các điểm tiếp cận bàn và path hai chiều qua cửa; không overlap footprint bất hợp lý.
4. Office/archive screenshots cho thấy rõ sàn diamond, tường/nội thất cùng góc chiếu dimetric 2:1, cụm nội thất hợp lý, lối đi rõ; đối chiếu trực quan cạnh concept.
5. Vật chứng hiện trên mặt bàn, ở đúng depth; E prompt/outline/marker gắn cùng tọa độ chiếu; ID/effect không đổi.
6. Cửa nằm trên tường có opening; E2E chuyển office↔archive cả hai chiều, spawn đúng cửa.
7. Tên NPC, dialogue facing (bao gồm giảm chuyển động), nhịp thở và giới hạn visual-only pass unit/E2E; label/prompt không chồng nhau ở viewport hỗ trợ.
8. Player và ba NPC dùng sheet mới; content/manifest xác nhận 4 hướng đủ 8 frame và frame dimensions; xem đủ bốn sheet, kiểm loop 8→1 và runtime player walk/NPC walk asset.
9. Qua `npm run lint`, `npm run test`, `npm run build`, `npm run typecheck`, `npm run format:check`, `npm run memory:check`; Python unittest nếu chạm tool art; Playwright E2E hai lần vì đổi Phaser/scene. Backend không đổi.
10. Verification ledger ghi screenshot, gate output, giới hạn còn lại và mọi tài liệu kiến trúc được cập nhật. Không tuyên bố đạt concept nếu chưa kiểm ảnh.

## Ngoài phạm vi

- Chuyển sang 3D realtime hoặc thay Phaser bằng engine khác.
- Đổi gameplay, nội dung Case #001, truth, evidence IDs/effects, dialogue semantics, backend/API, commerce hay persistence.
- Thêm AI/pathfinding cho NPC; NPC walk sheet chỉ là khả năng animation.
- Chuyển content ngoài Case #001 hoặc làm phase kế tiếp chưa được yêu cầu.

## Quyết định đã chốt

- Đồ họa game chuyển sang isometric dimetric 2:1 bằng logical plane và phép chiếu 2D thống nhất.
- WASD ánh xạ `W=NW`, `D=NE`, `S=SE`, `A=SW`; collision giải trong logical plane, không dùng AABB screen-space.
- Phạm vi gồm toàn bộ scene chơi được của Case #001 hiện tại; HUD/store/event bus và logic game giữ nguyên.
- Thẻ tên luôn hiện; NPC/player quay về nhau khi dialogue bắt đầu và giữ hướng sau khi đóng.
- Nhịp thở visual-only, dừng khi di chuyển, dialogue hoặc reduced motion.
- Thay walk sheet player và tạo sheet cho ba NPC; contract 8×4/10 fps.
