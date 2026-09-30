# Phase 11D — Phản hồi của người dùng về scene và NPC (backlog)

**Nguồn:** phản hồi trực tiếp của người dùng sau khi xem kết quả Task 4 của Phase 11C (2026-09-30).
**Trạng thái:** ghi nhận, **chưa thực hiện**. Làm **sau khi Phase 11 (11C) hoàn tất**. Cần brainstorming/spec ngắn rồi plan trước khi code (AGENTS.md §2), viết bằng tiếng Việt.
**Liên quan:** `docs/superpowers/plans/2026-09-30-phase-11c-concept-fidelity-and-cleanup.md` (Task 4 là nơi phát sinh phản hồi), `docs/concept/ingame_main_office_hud.webp`, `docs/03_CASE_001_VERTICAL_SLICE_SPEC.md` (mô tả phòng và vị trí vật chứng), `docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md`.

## 1. Phòng quá rộng, đồ vật thưa, sắp xếp chưa hợp lý

- **Hiện trạng:** scene 2400×1440 (`worldBounds` y=160) quá lớn so với lượng nội thất; nhiều khoảng sàn trống; đồ đạc rải rác, không thành cụm chức năng.
- **Mong muốn:** căn phòng thu nhỏ lại (giảm kích thước thế giới/tường ngăn hoặc chia thành khu rõ ràng) và nội thất dày hơn, xếp có logic: bàn làm việc kèm ghế đối diện màn hình, khu họp có bàn họp và ghế bao quanh, tủ hồ sơ dựa tường, cây/đồ trang trí ở góc, lối đi rõ ràng giữa các khu.
- **Tiêu chí chấp nhận:** không còn khoảng trống lớn không có mục đích; mỗi vật có vị trí hợp lý (ghế hướng vào bàn, tủ sát tường, không xuyên nhau); người chơi vẫn tới được mọi vật/NPC/cửa (BFS `scene-layout.spec.ts`); xem ảnh chụp cạnh concept.
- **Gợi ý kỹ thuật:** đổi `worldBounds`/`size`, floor/wall texture và mọi tọa độ; minimap dùng `worldBounds`; kiểm tra lại spawn và teleport.

## 2. Vật chứng phải đặt trên bàn

- **Hiện trạng:** các vật chứng (biên bản họp `meeting_minutes`, máy ghi âm `phone_recording`, ghi chú `objective_note`, nhật ký an ninh…) nằm rời trên sàn.
- **Mong muốn:** mỗi vật chứng nằm trên mặt bàn tương ứng theo `docs/03` (biên bản trên bàn họp; máy ghi âm ở bàn của Leo hoặc vị trí spec quy định; ghi chú trên bàn làm việc…).
- **Tiêu chí chấp nhận:** sprite vật chứng vẽ đè lên mặt bàn (depth cao hơn bàn, offset theo chiều cao mặt bàn, `origin` phù hợp); vùng tương tác, viền đỏ, marker và bong bóng prompt neo vào vật chứng trên bàn (không neo vào chân bàn); người chơi tiếp cận từ mép bàn được (collision bàn không chặn tầm tương tác); kích thước vật chứng cân đối với bàn.
- **Gợi ý kỹ thuật:** thêm khái niệm "đặt trên" (`restsOn: <assetId>` + `surfaceOffset`) trong content thay vì hardcode tọa độ; cập nhật `interaction` offset; giữ `id`/`effects` không đổi.

## 3. Điểm dịch chuyển ra hành lang: vị trí và hình dạng chưa hợp lý

- **Hiện trạng:** cửa ra hành lang (và cửa quay lại ở Archive) đứng giữa sàn như vật rời, hình dạng/kích thước không cân đối với căn phòng.
- **Mong muốn:** cửa nằm trên đường tường (khung cửa gắn vào tường, có khoảng hở đi qua), kích thước theo tỉ lệ nhân vật (cao ~2 lần nhân vật), vị trí cân đối (giữa cạnh tường hoặc góc hợp lý); vùng kích hoạt chuyển cảnh đặt ngay trước cửa; spawn khi quay lại đặt trước cửa phía trong.
- **Tiêu chí chấp nhận:** cửa không còn đứng giữa sàn; vùng tương tác và bong bóng prompt nằm cạnh khung cửa; spawn `from_archive`/`from_office` khớp vị trí cửa; hai scene đối xứng hợp lý; E2E chuyển cảnh hai chiều vẫn PASS.
- **Gợi ý kỹ thuật:** render khung cửa trong tường bằng `tools/art-codegen` (đục lỗ trên tường/partition) hoặc prop cửa dạng gắn tường; đổi `transition` spawn point.

## 4. Thiếu tên NPC trên đầu

- **Mong muốn:** mỗi NPC có nhãn tên (Anna, Leo, David) hiển thị phía trên đầu.
- **Tiêu chí chấp nhận:** tên lấy từ content (không hardcode trong TS), font Cambria ≥ 14px, nền thẻ giấy nhỏ viền mực (không glow, không đỏ), căn giữa phía trên đầu theo chiều cao figure (không phụ thuộc số ma thuật; dùng `CHARACTER_FIGURE_HEIGHT` hoặc dữ liệu nhân vật); không đè bong bóng prompt; hiển thị nhất quán (quyết định khi spec: luôn hiện hay chỉ khi lại gần); depth trên nhân vật, dưới marker; cleanup khi đổi scene; nhãn có thể được đọc bởi screen reader qua mô tả khác (không bắt buộc).
- **Gợi ý kỹ thuật:** thêm `displayName` cho NPC trong content (đã có tên trong dữ liệu NPC/dialogue?), Phaser Text + backing Graphics tương tự `createRoomLabel`.

## 5. Thiếu chuyển động xoay hướng của NPC khi đối thoại mà người chơi không ở trước mặt

- **Hiện trạng:** NPC luôn dùng ảnh SE tĩnh, không quay về phía người chơi khi bắt đầu hội thoại.
- **Mong muốn:** khi hội thoại bắt đầu, NPC quay mặt về phía người chơi (chọn trong 4 hướng NE/SE/SW/NW theo vector NPC→người chơi bằng `resolveDirection`); có chuyển tiếp ngắn (ví dụ đi qua hướng lân cận trong ~120–200 ms thay vì nhảy tức thì; tắt chuyển tiếp khi giảm chuyển động, vẫn đổi hướng); sau khi hội thoại kết thúc NPC giữ hướng hoặc trở lại hướng ban đầu (quyết định khi spec, ghi rõ). Người chơi cũng nên quay về phía NPC khi bắt đầu đối thoại (đề xuất, xác nhận trong spec).
- **Tiêu chí chấp nhận:** unit test hàm chọn hướng (`facingToward(from, to)`), E2E: bắt đầu đối thoại từ phía sau/bên cạnh NPC → texture NPC đổi đúng hướng; kết thúc → hành vi đã chốt; không ảnh hưởng logic hội thoại/objective; cleanup tween/timer.
- **Gợi ý kỹ thuật:** cần đủ 4 ảnh idle cho mỗi NPC trong `characterSheets` (đã có ảnh, hiện chỉ khai báo SE); sự kiện `dialogue:started` trên bus mang `npcId`; WorldScene lắng nghe.

## 6. Thiếu hoạt ảnh nhịp thở của NPC và người chơi

- **Mong muốn:** nhân vật đứng yên có hoạt ảnh thở nhẹ (NPC và người chơi).
- **Tiêu chí chấp nhận:** hàm thuần `breathing({ timeMs, phaseOffset, reduced })` → `{ scaleX, scaleY }` (đề xuất `scaleY = 1 + 0.008·sin(2π·t/2400)`, `scaleX = 1`), áp lên sprite quanh điểm chân (origin 0.5, 0.88) không đổi `x/y` và không ảnh hưởng body vật lý; NPC lệch pha theo hash của id; dừng khi người chơi đi (anim đi bộ đã có) và khi hội thoại (tùy chọn); **tắt hoàn toàn khi bật "Giảm chuyển động"** (đây là hiệu ứng trang trí, khác hoạt ảnh đi bộ); không làm sai `getBounds()` cho viền đỏ/marker/prompt (kiểm tra sai lệch < 2 px); test thuần + E2E (scale dao động khi đứng yên, bằng 1 khi giảm chuyển động).
- **Gợi ý kỹ thuật:** cập nhật trong `WorldScene.update`, dùng chung với bóng dưới chân (không scale bóng); thêm debug hook dev-only đọc scale.

## Thứ tự đề xuất

1. Bố cục phòng (mục 1) + vật chứng trên bàn (mục 2) + cửa ra hành lang (mục 3) — cùng động vào scene JSON/art, làm chung một phase để thiết kế nhất quán.
2. NPC: tên trên đầu (mục 4), quay hướng khi đối thoại (mục 5), nhịp thở (mục 6).
3. Sau mỗi nhóm: chụp ảnh, **xem** cạnh concept, ghi verification trong ledger mới; không tuyên bố giống concept khi chưa xem.

## Ghi chú về Phase 11C đang chạy

Task 4 của Phase 11C (tường ngăn, nhãn phòng, nội thất dày) đã được commit dạng `wip` và chưa qua review; người dùng đánh giá kết quả chưa đạt kỳ vọng. Các mục 1–3 ở trên thay thế/điều chỉnh phần bố cục của Task 4 — khi thực hiện Phase 11D cần xem lại cả kết quả `wip`, không mặc định giữ nguyên bố cục hiện tại.
