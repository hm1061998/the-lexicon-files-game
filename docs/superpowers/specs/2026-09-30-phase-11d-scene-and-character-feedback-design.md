# Phase 11D — Bố cục scene và phản hồi nhân vật

## Mục tiêu

Điều chỉnh hai scene Case #001 dựa trên phản hồi sau Phase 11C: giảm sàn trống, sắp xếp nội thất theo công năng, đặt vật chứng lên mặt bàn, đưa cửa chuyển cảnh vào tường; bổ sung tên NPC, hướng nhìn khi đối thoại và nhịp thở nhẹ cho nhân vật đứng yên.

Giữ nguyên gameplay và nội dung vụ án, các ID interactable/evidence/NPC, điều kiện và hiệu ứng dialogue, lối đi tới mọi điểm tương tác, kiến trúc 2D trục thẳng của game, palette và quy tắc asset hiện hành. Scene được chỉnh theo scene JSON và renderer dùng chung; không chuyển sang isometric.

## Phạm vi

### 1. Thu gọn và tổ chức lại phòng

- Thiết kế lại `main_office` và `archive` trên kích thước thế giới nhỏ hơn hiện tại (2400×1600), co các `worldBounds`, vị trí, spawn, tường, nội thất, vật chứng và điểm chuyển cảnh tương ứng.
- Gom đồ theo cụm chức năng: bàn làm việc có ghế quay về phía màn hình/terminal; bàn họp có ghế bao quanh; tủ hồ sơ tựa tường; cây và đồ trang trí ở góc; giữ lối đi rõ, không xuyên hoặc chồng collider.
- Mỗi khoảng sàn còn lại phải phục vụ lối đi hoặc tạo khoảng thở có chủ ý. Không đặt ngưỡng số lượng nội thất thay cho đánh giá bố cục.
- Giữ thứ tự layer, world Y là điểm chân/tiếp xúc sàn, depth theo Y và collision footprint theo `docs/art/06`.

### 2. Vật chứng trên bề mặt nội thất

- Bổ sung quan hệ bề mặt có kiểu vào scene asset, tối thiểu gồm asset đỡ (`restsOn`) và offset mặt bàn (`surfaceOffset`) trong tọa độ world tương đối với điểm tiếp xúc sàn của asset đỡ.
- Child asset được đặt và tính depth tại điểm offset; interaction area, marker, outline và bubble anchor dùng cùng vị trí đã phân giải. Collider của bàn không được kế thừa bởi vật chứng.
- Dùng quan hệ này cho `meeting_minutes`, `phone_recording`, `objective_note` và những vật chứng/ghi chú khác mà Case #001 đặt trên bàn theo `docs/03_CASE_001_VERTICAL_SLICE_SPEC.md`.
- ID, hiệu ứng và bán kính tương tác hiện có giữ nguyên, trừ khi điều chỉnh bán kính cần thiết để với tới vật từ mép bàn; mọi đổi bán kính phải còn trong chuẩn art/06.

### 3. Cửa hành lang gắn với tường

- Cửa giữa office và archive nằm trong khoảng mở của tường/partition, có khung gắn tường và tỷ lệ chiều cao xấp xỉ hai lần figure.
- Tường hai phía kết thúc ở mép cửa; collision không bắc qua khoảng mở. Vùng trigger đặt phía trước cửa, spawn từ scene kia đặt ở phía trong và đối xứng theo ngưỡng cửa.
- Cập nhật đồng bộ texture manifest, scene JSON, world bounds và minimap nếu hình học thay đổi.
- Giữ nguyên target scene, spawn ID/transition semantics; E2E phải chuyển office→archive và archive→office.

### 4. Tên NPC

- Render thẻ tên giấy phía trên mỗi NPC trong scene. Tên lấy từ `npcs.json` (`Anna Reed`, `Leo Tran`, `David Cole`), không chép chuỗi vào Phaser/React; không dùng màu đỏ.
- Luôn hiển thị trong scene để nhận diện NPC, font Cambria/serif theo art/06, cỡ chữ tối thiểu 14 px, canh giữa và định vị từ `CHARACTER_FIGURE_HEIGHT`/metadata figure thay vì số offset riêng từng NPC.
- Nhãn nằm trên nhân vật, dưới marker tương tác; bố trí không chồng lên bubble prompt. Tên phải được tạo/hủy cùng lifecycle scene.

### 5. Quay mặt khi đối thoại

- Khi hội thoại NPC bắt đầu thành công, NPC quay về phía người chơi; người chơi cũng quay về phía NPC.
- Chọn một trong bốn hướng NE/SE/SW/NW bằng hàm thuần từ vector giữa hai điểm chân. Nếu bật giảm chuyển động thì đổi hướng ngay; nếu tắt thì chuyển ngắn 120–200 ms qua hướng kế tiếp phù hợp với bộ texture sẵn có.
- Khi hội thoại đóng, hai nhân vật giữ hướng cuối cùng. Tính năng đổi hướng không làm thay đổi flow, objective hoặc case state của dialogue.
- Phát sự kiện có kiểu `dialogue:started` qua event bus cùng `npcId`; Phaser xử lý hướng. Không để React truy cập Phaser internals. Listener/tween được cleanup khi đóng dialogue, đổi scene hoặc shutdown.
- Dùng texture idle bốn hướng đã có; khai báo đầy đủ trong case content và preload đúng theo manifest. Không dùng SE làm hướng giả.

### 6. Nhịp thở nhẹ

- Player và NPC thở khi đứng yên: scale X giữ 1; scale Y dao động nhẹ quanh 1 theo chu kỳ khoảng 2.4 giây, biên độ tối đa 0.8%. NPC lệch pha theo ID để không đồng bộ.
- Không áp dụng khi nhân vật đi bộ; dừng nhịp thở khi `reducedMotion` bật. Hội thoại cũng tạm dừng nhịp thở của hai nhân vật đối thoại.
- Chuyển động chỉ tác động phần hiển thị: điểm chân, vị trí world, collision, shadow, interaction anchor, marker và outline không dịch quá 2 px. Không làm thay đổi footprint vật lý.
- Dùng hàm thuần nhận thời gian, phase offset và cờ reduced-motion; cùng một nguồn thời gian trong `WorldScene.update`, không tạo timer toàn cục.

## Cách tiếp cận

Chỉnh lại scene JSON và asset/texture hiện có trước; chỉ bổ sung asset cửa hoặc màn hình nếu asset hiện tại không biểu đạt được đúng thiết kế. Mở rộng schema scene bằng metadata khai báo quan hệ bề mặt thay vì hardcode ID của Case #001 trong scene class. Tái sử dụng `npcs.json.name` và bốn idle texture mỗi NPC. Dữ liệu dialogue tiếp tục do store/case engine quản lý; bus chỉ báo chuyển trạng thái cho renderer Phaser.

## Tiêu chí chấp nhận

1. Screenshot office và archive cho thấy diện tích nhỏ hơn, nội thất gom thành cụm hợp lý, lối đi rõ; không có prop/collider chồng nhau hoặc lối đi bế tắc.
2. Mọi NPC, interactable, cửa và spawn tới được theo BFS trong `scene-layout.spec.ts`; khoảng đứng cho evidence trên bàn nằm ngoài footprint collider bàn nhưng trong interaction radius.
3. Vật chứng liên quan được vẽ trên mặt bàn tương ứng, depth đúng; marker, highlight và prompt neo vào sprite vật chứng trên bàn. ID/effect evidence giữ nguyên.
4. Cửa nhìn rõ là một phần của tường, có lỗ đi qua; trigger/spawn hai chiều đặt sát hai mặt cửa. E2E chuyển cảnh hai chiều pass.
5. Tên ba NPC khớp `npcs.json`, luôn nằm trên đầu và không chồng prompt ở kích thước viewport hỗ trợ.
6. Bắt đầu đối thoại từ các hướng khác nhau làm NPC và player quay đúng hướng; đóng hội thoại giữ hướng. Kiểm tra giảm chuyển động bỏ tween.
7. Unit test cho đặt vật trên mặt đỡ, tính hướng, và nhịp thở. E2E xác nhận nhịp scale lúc đứng yên, scale bằng 1 khi đi hoặc reduced-motion, dialog dừng nhịp thở, vị trí chân/collider/anchor không trôi quá 2 px.
8. Có ảnh chụp office/archive và kiểm tra trực quan cạnh concept. Báo cáo ghi đúng khác biệt phối cảnh: game vẫn 2D trục thẳng, concept là isometric cắt lớp.
9. Qua gate dự án: `npm run lint`, `npm run test`, `npm run build`; `npm run typecheck`, `npm run format:check`, `npm run memory:check`, Python unittest nếu đổi art-codegen, và Playwright E2E hai lần nếu đụng scene/CSS/Phaser. Không đổi backend.

## Ngoài phạm vi

- Chuyển game sang isometric hoặc dựng lại pipeline asset toàn bộ.
- Thêm tính năng gameplay, đổi logic vụ án/evidence/dialogue, hoặc đổi API/state persistence.
- Sinh ảnh walk sheet hoàn chỉnh mới hay tạo NPC animation mới ngoài hướng idle; sheet đi bộ thật vẫn là tác vụ asset riêng.
- Thay đổi các scene ngoài Case #001.

## Quyết định thiết kế đã chốt

- Sửa scene và tái dùng asset hiện có; chỉ thêm asset nếu cần để thể hiện khung cửa/màn hình đúng.
- Thẻ tên NPC luôn hiện; lấy tên từ content sẵn có.
- Cả NPC lẫn player quay về phía nhau khi dialogue bắt đầu thành công và giữ hướng sau khi đóng.
- Nhịp thở chỉ là scale hiển thị, không chạm body vật lý; dừng khi đi, đối thoại hoặc reduced-motion.

