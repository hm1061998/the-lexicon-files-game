# Phase 11E — Thiết kế lại model và art tĩnh Office/Archive

## 1. Bối cảnh và mục tiêu

Task 2 của Phase 11E đã được triển khai nhưng chưa đạt yêu cầu: hình ảnh cảnh, tường và đồ vật vẫn thiếu nhất quán; người chơi không đi từ vị trí xuất hiện tới cửa để chuyển ra hành lang. Kiểm tra E2E bổ sung đã tái hiện nhân vật dừng trước khi tới vùng tương tác cửa. Kiểm tra bố cục trước đây chủ yếu kiểm tra lưới và chuyển cảnh bằng cách đặt nhân vật trực tiếp gần cửa nên chưa phát hiện lỗi đi lại thực tế.

Phạm vi được duyệt là thiết kế lại **model vật thể và art tĩnh của Main Office + Archive** trong game 2D dimetric 2:1. Mục tiêu là để ảnh, vị trí neo, footprint, collision, tương tác, che khuất và lối đi cùng mô tả một bố cục hợp lý. Không đổi sang 3D.

## 2. Phạm vi và ranh giới

### Trong phạm vi

- Mở rộng hợp đồng scene asset để mô tả độc lập điểm neo sàn, footprint, collision, điểm tương tác, điểm neo hình ảnh/độ cao và thứ tự che khuất.
- Biểu diễn tường theo đoạn logic; lối cửa là khoảng mở rõ ràng giữa các đoạn tường. Cửa tương tác đặt tại khoảng mở và nối tới transition/spawn hiện có.
- Di trú đồng bộ các vật thể tĩnh trong `main_office` và `archive` sang model mới.
- Làm lại bộ art môi trường tĩnh của hai scene: module sàn, tường, khung/cánh cửa và props nền trong suốt cùng camera dimetric.
- Giữ ID scene, asset, interactable, texture key cần tương thích, evidence, dialogue, objective, transition target/spawn, luật điều tra và nội dung gameplay hiện có. Có thể đổi placement, kích thước, footprint, collision, texture file và thành phần module để bố cục chạy được.
- Cập nhật prompt pack, provenance và tài liệu hợp đồng art/model để quy trình sau dùng đúng camera, anchor, tỷ lệ và model.

### Ngoài phạm vi

- Không thay đổi player/NPC art, animation, breathing, WASD, UI/HUD, evidence, nội dung Case #001, learning, persistence, API hoặc cấu hình thương mại.
- Không sửa scene ngoài Main Office và Archive.
- Không thêm pathfinding, AI cho NPC, physics package, hoặc renderer 3D.
- Không ghép toàn bộ phòng thành một ảnh phẳng; giữ các lớp cần thiết cho depth sorting và foreground occlusion.
- Không đổi palette/art direction đã chốt tại `docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md`.

## 3. Model scene asset

Mỗi vật thể tĩnh được mô tả bằng các dữ liệu có trách nhiệm riêng:

- **Floor anchor:** vị trí logic `(u,v)` nơi vật chạm sàn hoặc tọa độ neo của segment.
- **Footprint:** vùng chiếm chỗ trên mặt phẳng logic, độc lập với kích thước bitmap.
- **Collision:** vùng cản di chuyển trên logical plane; không suy ra từ alpha hoặc bounds ảnh.
- **Interaction point/radius:** vị trí và vùng có thể thao tác; có thể khác anchor sàn.
- **Visual pivot/elevation:** điểm neo ảnh và độ nâng thị giác; không làm dịch collision, depth nền hay vùng tương tác.
- **Depth/occlusion:** lớp sắp xếp theo vị trí sàn chiếu, có bias được khai báo khi cần.

Hình chữ nhật footprint/collision là lựa chọn mặc định cho furniture. Tường là segment có hình học logic rõ ràng, không dùng một collider kín chạy xuyên qua cửa. Mỗi đoạn tường có endpoint nhất quán với trục `(u,v)`. Khoảng mở cửa không có collider tường; door interactable và transition được đặt trong hoặc sát tâm khoảng mở. Nội dung đặt trên mặt bàn vẫn tham chiếu surface/parent hiện có để không nhận collision sàn ngoài ý muốn.

Schema mới phải được validate ở ranh giới `packages/game-content`; resolver/runtime dựng hình, collision và interaction từ model chung. React không đọc Phaser internals; game content không chuyển vào hardcode trong scene class. Không để scene Office/Archive chứa đồng thời asset tĩnh cũ và asset tĩnh mới sau migration.

## 4. Art và pipeline

Giữ 2D dimetric 2:1, ô tham chiếu `128×64`, camera orthographic dimetric theo `art/06` (tham chiếu 35°), palette giấy/sepia, outline mực và hướng sáng đã quy định. Loại bỏ cách dùng hình front-view bị xoay để giả thành cạnh tường hoặc đồ vật chiếu dimetric.

Pipeline lai đã duyệt:

1. Sinh sàn, module/đoạn tường, cửa, bóng tiếp xúc và các hình học quyết định bounds/footprint bằng renderer/vector có tham số. Hình học lấy từ model hoặc cấu hình module để visual và collision có cùng nguồn tọa độ.
2. Tạo props minh họa thành sprite riêng nền trong suốt. Chuẩn hóa về camera, scale tham chiếu, hướng sáng, mép alpha và điểm chạm sàn thống nhất; không để bóng vẽ làm giả footprint.
3. Manifest ánh xạ texture key/asset ID tới file hình và metadata model. Mỗi asset mới/cập nhật có provenance. Giữ file nguồn/đầu ra theo quy ước thư mục và công cụ của repo.
4. Không cài thêm dependency nếu công cụ hiện có đủ dùng. Nếu runtime art tool hoặc thư viện bị thiếu, ghi rõ điều kiện môi trường và xử lý theo toolchain được repo chấp thuận.

## 5. Bố cục và chuyển cảnh

Office và Archive phải có ranh phòng dễ đọc, mặt sàn khớp các cạnh tường, cửa nằm trên khoảng mở, nhóm đồ có mục đích, và hành lang đi lại đủ rộng so với footprint người chơi. Bàn, tủ, kệ và props không được cắt đường tiếp cận cửa hoặc tạo vật cản vô hình lệch khỏi hình ảnh.

Chuyển cảnh được đánh giá bằng luồng thật: khởi tạo ở spawn content; dùng các phím WASD đã có để đi tới cửa; tương tác bằng E; xác nhận scene đích và spawn đích. Lặp lại chiều quay về từ Archive. E2E không được teleport người chơi gần cửa để chứng minh tiêu chí này. Giữ nguyên transition ID/ý nghĩa; nếu liên kết scene/spawn hiện tại sai hoặc thiếu thì phải báo cáo như discrepancy với content contract trước khi sửa.

## 6. Kiểm tra và nghiệm thu

1. Schema/content validation chấp nhận model mới, từ chối model thiếu anchor/footprint hoặc giá trị segment/opening sai; toàn bộ scene JSON vẫn hợp lệ.
2. Test model/resolver xác nhận floor anchor, footprint, collision, interaction point và visual pivot độc lập; elevation/scale ảnh không làm lệch collision hoặc điểm sàn.
3. Validation hình học xác nhận segment tường khớp endpoint/module và doorway thật sự thông suốt theo footprint player; không có collider bắc qua lối mở.
4. E2E di chuyển từ spawn bằng WASD thật và nhấn E chuyển Office → Archive, rồi Archive → Office. Giữ thêm đường hồi quy khác của scene nếu bị ảnh hưởng.
5. Visual review screenshot cả hai scene ở viewport 1280×720: camera đồng nhất, pixel/grid scale hợp lý, floor/wall seam khép kín, cửa khớp lỗ tường, props có alpha sạch, anchor/depth hợp lý, lối đi nhìn thấy và scene không bị vật thể che khuất sai.
6. Chạy các phase gates dự án: `npm run lint`, `npm run test`, `npm run build`; thêm typecheck, format, content validation, E2E, memory checks và kiểm tra art pipeline phù hợp. Ghi chính xác output và hạn chế môi trường; không báo pass cho entrypoint chưa chạy.
7. Không đánh dấu Task 2 hoặc Phase 11E hoàn tất cho tới khi các tiêu chí trên có bằng chứng và user review kết quả trực quan.

## 7. Rủi ro và cách xử lý

- **Model mới còn lệch với collision:** cùng một model/manifest phải cung cấp nguồn logic cho cả renderer/validation; test route dùng footprint thực của player.
- **Art sprite không cùng camera:** prompt pack và preview kiểm tra theo scene master reference trước tích hợp; ưu tiên module hình học sinh xác định cho tường/sàn.
- **Đổi schema ảnh hưởng scene khác:** giữ tương thích với legacy nếu schema dùng chung, nhưng chỉ migrate asset tĩnh của Office/Archive trong thay đổi này; chạy validation toàn content.
- **E2E route phụ thuộc chuyển động screen-relative:** dùng input trình duyệt thực, kiểm tra waypoint theo hành lang có clearance; không coi một pathfinding/grid test là bằng chứng traversal.
- **Tài nguyên nguồn không sẵn có:** provenance ghi chính xác công cụ/nguồn; không âm thầm tái tạo từ asset thiếu hoặc đánh dấu sản phẩm placeholder là final.

## 8. Thứ tự thực hiện

Plan triển khai sau khi spec này được user duyệt. Thứ tự dự kiến: xác nhận và khóa baseline/reproduction; thiết kế schema và test trước; triển khai resolver/model; tạo/cập nhật module art và manifest; migrate Office/Archive; kiểm tra traversal hai chiều bằng E2E; visual review; cập nhật tài liệu, ledger và memory; chạy phase gates. Chi tiết file, commit và kiểm tra cụ thể thuộc implementation plan.
