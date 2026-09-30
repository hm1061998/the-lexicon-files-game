# Phase 11E — checkpoint redesign static world (2026-09-30)

## Trạng thái

Người dùng duyệt plan và chọn Native. Người dùng yêu cầu lưu memory, push `dev` và tiếp tục sau. Đây là checkpoint `in_progress`, chưa phải kết quả hoàn tất hoặc nghiệm thu hình ảnh.

- Tasks 1–5 đã thực thi: baseline/repro; schema footprint/wall segments; expansion/geometry gate; runtime/minimap; art module và 15 sprite nội thất/bảng dimetric 30°.
- Tasks 6–7 đang thực hiện: Office/Archive đã migrate JSON, giữ ID gameplay, sàn/module/cửa mới và footprint; E2E traversal đã mở lại. Chưa hoàn thành toàn bộ hồi quy sau chỉnh sửa cuối.
- Task 8 mới lưu handoff. Hợp đồng art06/architecture, cleanup, final review, phase gates và duyệt screenshot còn thiếu.
- Tasks 3–6 của plan cha `controls-visual-ux` vẫn chờ. Không bắt đầu phase khác.

## Bằng chứng đã chạy

```text
node node_modules/vitest/vitest.mjs run
Test Files  87 passed (87)
Tests       678 passed (678)
Duration    15.10s

node node_modules/typescript/bin/tsc -b
exit 0

.venv-art-codegen/Scripts/python.exe -m unittest discover -s tools/art-codegen -p test_world_modules.py
Ran 6 tests in 1.685s
OK
```

- Full Python trước khi thêm hai bảng: 41/41; sau thêm bảng chỉ chạy nhóm module 6/6. Cần chạy lại full.
- Scene-layout từng đạt 18/20: Office → Archive bằng WASD đạt; hai lỗi còn lại là proximity dùng elevation và race khi đợi runtime mới. Đã sửa, chưa có toàn bộ lượt xanh cuối cùng.
- World/HUD/layout lượt gần nhất hoàn tất: 65/76, còn fixture tọa độ cũ, key bar expectation cũ và HMR. Đã cập nhật fixture, cần chạy lại.
- Lượt full E2E 96 test bị dừng theo yêu cầu người dùng. Có 7 lỗi dialogue do fixture dùng x/y không còn tồn tại trong JSON logic. Helper và các fixture dialogue/learning/listening/settings/timeline đã đổi sang điểm sàn lấy từ content; chưa chạy lại hoàn tất.
- `eslint .`: 377 lỗi, phần lớn do quét cả skill/runtime ngoài phạm vi task. Scoped lint chỉ còn unused fixture và đã sửa; kết quả rerun ở checkpoint ghi trong memory.
- `npm`/`npx` vắng trong PATH. Không tuyên bố pass npm/Nx entrypoint. Build và toàn bộ phase gates cuối chưa chạy. Backend không đổi.

## Quyết định khi thực hiện

1. Dùng checkout `dev` hiện tại và runner Node trực tiếp; không tạo worktree mới.
2. Tường dày vào trong phòng từ line để line=0 không tạo collider ngoài bounds.
3. Wall modules được phép giao nhau tại góc; prop không giao solid. Cần review độ chặt điều kiện wall-wall.
4. Reachability dùng radius pixel thực với margin 20%; tabletop evidence không dùng ngưỡng 0.6 logic chung.
5. Lưu wallSpan cho occlusion, tránh làm mờ từng module của toàn bộ back wall.
6. Dùng pivot/footprint từ geometry thay tiêu chí alpha hàng cuối 90% không phù hợp hình thoi.
7. Migrate hai phòng đồng thời do texture key dùng chung phải trỏ cùng URL.
8. Tách interaction floor projection khỏi marker elevation; geometry gate chạy cả khi load case.
9. Dời spawn Office default (8,4.8), Archive default (8.5,5); giữ ID.
10. Giữ art/builders cũ vì assets_config.json còn tham chiếu; chưa xóa.

## Tiếp tục

1. Đọc memory, plan, Git; dùng `.venv-art-codegen` hiện có, không tạo lại venv.
2. Chạy dev server từ `apps/game-web` trên 5174; chạy Playwright từ cùng thư mục để screenshot dùng đường dẫn đúng. Kiểm tra server đang nghe đúng port.
3. Hoàn thành Task 6/7: full E2E + scene-layout/world/HUD repeat 2; sửa lỗi thực tế theo TDD. Không dùng teleport cho test traversal.
4. Task 8: hợp đồng art06/architecture, cleanup có kiểm tra tham chiếu, lint/test/build/format/Python/memory gates, một final reviewer theo skill Native, cập nhật plan và memory.
5. Chụp lại Office + Archive 1280×720, xin người dùng duyệt hình ảnh trước khi đánh dấu Task 2 cha/Phase 11E hoàn tất.

Ledger và ảnh cũ: `.superpowers/sdd/2026-09-30-phase-11e-office-archive-static-world-redesign/` (ignored, chỉ có ở máy này). Không chạy lại scratch `migrate.mjs`: các vị trí đã chỉnh tiếp và script không idempotent.
