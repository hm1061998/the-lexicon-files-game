# Baseline redesign Office/Archive

Plan đã được user duyệt, thực thi Native trên `dev`, từ `661c190`.

Repro: `node ../../node_modules/@playwright/test/cli.js test e2e/scene-layout.spec.ts -g 'walk to the office exit' --reporter=line` với Vite port 5174. Kết quả: 1 failed; vị trí cuối `(5.746666666666666, 3.997803559933405)`, nearby `objective_note`, thay vì `hallway_door`. Route: `(8.125,7.125) → (8.875,7.125) → (8.875,4.625) → (0.875,4.625)`.

`decor_desk_invest` chiếm `u=4.5667..5.5667`, `v=3.8333..4.4167`; body phải dừng tại mép `u=5.5667+0.18=5.7467`. Planner dùng body 0.36 và lưới 0.25; runtime dùng cùng body. Driver chọn phím theo octant màn hình nên không đi chính xác theo trục logic; khi quá hạn waypoint vẫn đi tiếp khiến nhân vật lệch vào bàn. Đây là lỗi driver có bằng chứng, đồng thời layout hiện tại không đủ dung sai đi lại và artwork tường không khớp geometry. Không kết luận gameplay transition bị hỏng từ test driver này.

`hallway_door` tại `(0.4,4.65)`, interaction offset `(0,0.1667)`, radius 80 px. Opening cũ `v=3.75..5.55` không bị wall collider bắc qua. Transition `archive/from_office` và chiều về hợp lệ; không phát hiện discrepancy content cần đổi target/spawn ID.

Hai traversal tests được giữ fixme trong baseline và sẽ bật lại sau migration. Hai assertion độ dài/hướng artwork cũ cũng fixme vì đã tái hiện sai hướng; chúng sẽ được thay bằng kiểm tra module/corner/door opening. Không coi các test skipped là bằng chứng sản phẩm đạt yêu cầu.
