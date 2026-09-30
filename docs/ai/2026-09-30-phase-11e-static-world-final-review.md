# Phase 11E — Review cuối redesign static world

Reviewer độc lập, chỉ đọc, kiểm tra `8a13afa..3b758e1` và working diff của phiên tiếp tục 2026-09-30. Không dispatch reviewer thứ hai. Phạm vi: spec/plan Office/Archive static world; chưa nghiệm thu hình ảnh.

## Kết quả và sửa lỗi

- Không có Critical.
- Important 1: ID asset khai báo có thể trùng module sinh tự động. Schema chỉ kiểm assets khai báo; resolver runtime sẽ throw sau khi build content đã qua. Đã thêm kiểm uniqueness trước khi tạo map geometry; test qua scene loader và case loader.
- Important 2: miễn trừ mọi overlap wall-wall quá rộng, cho phép tường song song trùng toàn đoạn. Đã giữ source segment/trục; chỉ miễn trừ mối nối vuông góc ở đầu/cuối (góc hoặc chữ T), từ chối overlap song song và giao giữa segment.
- TDD: 5 test đã fail trước sửa (duplicate ID ở hai loader, hai offset tường song song và giao giữa segment); 2 test giữ mối nối hợp lệ. Sau sửa game-content 158/158 pass.
- Lỗi runtime phát hiện trước review: tween xoay đã hoàn tất bị giữ trong array, `targets=null` làm crash lúc phỏng vấn tiếp. Sửa bằng Map sprite→tween đang chạy, bỏ entry khi complete và cleanup. Test ba cuộc phỏng vấn đã fail trước sửa và pass sau sửa.

## Review Focus

1. Module chạm cạnh chính xác: code và test equality đạt.
2. Opening ở mép/liền nhau: logic đạt qua phép tái hiện độc lập 0/1/0 module; không có collider âm/0. Fixture committed chưa có case riêng 0/1.
3. Collision vượt footprint/bounds: bị từ chối, lỗi nêu ID.
4. Origin/scale/elevation: không dịch floor/collision/interaction/depth; marker dùng elevation riêng.
5. Geometry kiểm mọi spawn và clearance. E2E traversal dùng WASD/E thật; chưa assert tọa độ chính xác sau hai lần arrival.
6. Khe 0.30 đóng với body 0.36×0.36: flood-fill và test đạt.

## Minor hoãn lại

- Thêm assertion tọa độ chính xác `from_office`/`from_archive` sau khi runtime mới sẵn sàng; hiện test xác nhận traversal và scene ID, validator kiểm spawn hợp lệ.
- Thêm fixture opening riêng đúng 0/1 module; logic hiện được reviewer kiểm chứng và các test edge/opening hiện hữu vẫn chạy.

## Những phần reviewer không tự kết luận

- Thẩm mỹ và screenshot: quyền duyệt thuộc người dùng; Phase 11E vẫn `in_progress`.
- HUD che một phần phòng/cửa, character art/breathing: thuộc plan cha hoặc phạm vi giữ nguyên. Không mở rộng redesign để xử lý.
- Legacy art/builders: giữ vì `assets_config.json` còn tham chiếu; cleanup chỉ sau khi registry không dùng.
- Learning/persistence/backend/Phase 12: không thay đổi logic trong redesign; không tự bắt đầu phase khác.
- Gates cuối: executor ghi output thực tế trong verification; reviewer không tuyên bố kết quả trước khi chạy xong.

## Quyết định khi tiếp tục

- Dùng Native và checkout `dev` theo memory đã duyệt; không push/merge phiên tiếp tục này.
- Khôi phục venv từ bundled Python 3.12 với numpy/Pillow sẵn có và scipy trong venv; dùng npm 10.9.7 đã có bằng PATH shim cục bộ. Node của harness thực tế là 24.19.0, thỏa engines ≥22.
- Cho phép mối nối vuông góc ở endpoint dạng góc/chữ T để giữ layout hiện tại; không miễn trừ overlap toàn bộ wall-wall.
- Script format dùng glob toàn repo, bỏ kiểu file Prettier không hỗ trợ và loại cache pytest/venv trước expansion. Ignore file đơn thuần không tránh được EPERM khi `prettier --check .` quét cache.
- Helper Bash review-package không chạy đủ do thiếu dirname trong PATH; reviewer đọc Git trực tiếp, executor lưu diff bằng PowerShell. Bằng chứng authoritative vẫn là Git/spec/plan.
- Repeat E2E phát hiện test dùng E tức thời có thể bỏ lỡ frame: Phaser `Key.onUp` xóa `_justDown` trước `WorldScene.update`. Diagnostic tái hiện keydown/keyup cùng frame → không có interaction; giữ E qua frame → hội thoại mở. Hai test NPC dùng keydown, chờ dialog, rồi keyup trong finally; không thêm retry hay sửa logic nhận phím của runtime. Targeted repeat 4/4 pass.

Kết quả review: hai Important đã có test RED→GREEN; Minor hoãn được ghi rõ. Chỉ sau gates cuối và người dùng duyệt ảnh mới nghiệm thu phần redesign. Tasks 3–6 của plan cha và Phase 12 chưa bắt đầu.
