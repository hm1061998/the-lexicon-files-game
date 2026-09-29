# Phase 11B — Ledger kiểm chứng

## Paper overlay

**Mục tiêu:** đo chi phí của lớp hạt giấy (`paper overlay`) và quyết định giữ Phaser TileSprite hay chuyển sang CSS.

**Phương pháp:** script `requestAnimationFrame` đếm khung hình trong 5 s, 3 lần mỗi chế độ, sau khi scene đã khởi động và chờ 1 s. Chế độ tắt dùng query dev-only `?noPaperOverlay=1` (chỉ hoạt động khi `import.meta.env.DEV`).

### Playwright headless (Chromium)

Renderer: `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)` — GL phần mềm, không có GPU thật.

| Chế độ                          | Lần 1 | Lần 2 | Lần 3 | Trung bình fps |
| ------------------------------- | ----- | ----- | ----- | -------------- |
| Phaser TileSprite bật (trước)   | 12.5  | 12.2  | 12.6  | 12.4           |
| Tắt overlay                     | 18.9  | 18.8  | 18.7  | 18.8           |
| CSS `.game-paper-overlay` (sau) | 19.2  | 18.8  | 19.1  | 19.0           |
| Tắt overlay (đối chứng, sau)    | 19.4  | 19.0  | 19.0  | 19.1           |

Overlay Phaser làm giảm khoảng 34% fps trên GL phần mềm; overlay CSS chênh dưới 1% so với tắt hẳn (nằm trong nhiễu đo).

### Trình duyệt tích hợp của Claude (Browser pane)

Renderer: `ANGLE (NVIDIA, NVIDIA GeForce GTX 1060 6GB (0x00001C03) Direct3D11 vs_5_0 ps_5_0, D3D11)` — GPU thật.

Không đo được số liệu hợp lệ: pane giới hạn `requestAnimationFrame` (tab `visibilityState: hidden` cho 0 khung hình; khi ép hiển thị chỉ đạt ~1 fps, giống nhau cả khi bật lẫn tắt overlay: 1.2 / 1.0 / 1.0 fps mỗi chế độ). Các số này phản ánh giới hạn của pane, không phải chi phí của overlay, nên không dùng.

### Ruling

Theo quy tắc của plan (“chỉ đo được trên GL phần mềm thì chọn CSS”): chuyển sang lớp CSS. Lý do: GPU thật không đo được, còn trên GL phần mềm overlay Phaser tốn ~34% fps; lớp CSS được compositor xử lý và gần như miễn phí.

Thay đổi:

- `.game-paper-overlay` (`hud.css`): `position: absolute; inset: 0; pointer-events: none; opacity: 0.14`, nền lặp từ `/assets/textures/paper_texture.png` (1024 px). Nằm sau canvas trong DOM và trước `.hud` (không có z-index; HUD/modal sau đó vẽ đè lên).
- `__lexiconDebug.paperOverlayAlpha()` đọc `getComputedStyle(...).opacity`; trả `null` khi overlay vắng (`?noPaperOverlay`).
- Xóa `paperOverlay.ts`, `PAPER_OVERLAY_KEY/ALPHA`, texture `paper_overlay` khỏi `sharedTextures` của case (Phaser không còn load nó).
- E2E: alpha trong [0.10, 0.18], `pointer-events: none`, `elementFromPoint` giữa màn hình là `CANVAS`, thứ tự DOM canvas < overlay < HUD, click/tương tác vẫn hoạt động.
- Ảnh chụp trước/sau đã xem: hạt giấy vẫn thấy được nhưng tinh tế, không đổi bố cục/màu HUD.

## Hoạt ảnh đi bộ và giảm chuyển động (Task 6)

**Ruling:** hoạt ảnh đi bộ của player là phản hồi di chuyển chức năng (cho biết nhân vật đang đi và theo hướng nào), nên **không** bị tắt khi bật "Giảm chuyển động". Giảm chuyển động chỉ tắt hiệu ứng trang trí (marker nhấp nhô, fade chuyển cảnh). Ruling này là ngoại lệ có chủ đích của Global Constraint "giảm chuyển động tắt mọi hoạt ảnh mới" trong plan Phase 11B. Bóng `shadow_soft` là ảnh tĩnh, không có chuyển động riêng.

Kiểm chứng: E2E `reduced motion keeps the walk animation (functional movement feedback)` bật giảm chuyển động qua menu tạm dừng rồi giữ D: `playerAnim().playing === true` và ≥ 3 frame khác nhau trong 800 ms (lấy mẫu mỗi 20 ms).

## Gate cuối Phase 11B (Task 8)

Chạy trên `db0a189`, cây làm việc sạch (chỉ `Claude outputs/` chưa theo dõi, không thuộc phase).

| Lệnh | Kết quả |
| --- | --- |
| `npx nx run-many -t lint test build --skip-nx-cache` | PASS 7 project; test game-web 335 (48 file); các package khác đều PASS |
| `npm run typecheck` | PASS |
| `npm run format:check` | PASS (không cần sửa file nào) |
| `npm run memory:check` | PASS |
| `git diff --check` | sạch |
| `npm run test:e2e` lần 1 | 67 passed (5.9 phút) |
| `npm run test:e2e` lần 2 | 67 passed (5.9 phút), không flaky |
| `python -m unittest` (tools/art-codegen, venv ngoài repo) | 25 tests OK |

Backend không đổi: không chạy `dotnet`. Console không có lỗi trong phiên chụp ảnh.

## Đối chiếu concept (đã xem ảnh chụp 1280x720)

Đã xem: office (HUD + minimap), minimap sau khi bật/tắt `M`, prompt `E`, evidence modal có ảnh, sổ tay, pause, archive, 3 khung nhân vật đang đi (`player_walk_se`, frame 2/0/6 khác nhau), cận cảnh chuỗi tiếng Việt. Ảnh lưu ngoài repo (scratchpad).

- **Cambria/dấu thanh:** cận cảnh "Đọc biên bản cuộc họp", "MỤC TIÊU HIỆN TẠI", "Tìm hiểu điều gì đã xảy ra với bản báo cáo" hiển thị đúng mọi dấu (ọ, ả, ể, ề, ạ, ệ); không lỗi dấu.
- **Gần concept:** khung giấy có viền đôi và bóng, tiêu đề chữ hoa, chấm đỏ mục tiêu, thanh phím tắt dưới, minimap khung giấy góc phải, marker kim cương đỏ, nhân vật đi bộ có bóng.
- **Còn khác concept (thật):**
  - Concept là phòng có tường hai mặt, cửa kính, bảng ghi chú, đèn, cây và nhiều đồ nội thất dày đặc; scene hiện chủ yếu là sàn gạch với thảm lớn và vài bàn/ghế/cây thưa, khoảng sàn trống rất rộng; tường chỉ thấy ở mép trên (archive/office), không có phòng phân vùng.
  - Concept có nhãn phòng ("PHÒNG HỌP", "KHO LƯU TRỮ") và cụm vật thể nổi bật (bàn họp có tài liệu phát sáng đỏ, prompt dạng bong bóng cạnh vật); hiện prompt là hộp cố định giữa dưới, không có viền đỏ phát sáng quanh vật.
  - Bảng "Hồ sơ" concept có biểu tượng thư mục và số đỏ lớn; hiện là ô nhỏ chữ nâu.
  - Minimap hiện là sơ đồ trừu tượng (khối xám + chấm), không vẽ tường/phòng như concept.
  - Điều khiển trong tạm dừng, sổ tay (select "Chế độ dịch", slider, checkbox) vẫn dùng kiểu mặc định của trình duyệt, lệch với phong cách giấy cổ điển; phím `Space — Né` của concept không có (ngoài MVP).
  - Sổ tay/modal khi mở thì thanh phím tắt dưới bị panel cắt ngang (sổ tay phủ bên phải).
- Kết luận: HUD/UI cùng tinh thần, scene **chưa** giống concept về mật độ và cấu trúc phòng.

## Sai lệch so với tài liệu (Phase 11B)

- Paper overlay của world là lớp **CSS**, không phải ảnh Phaser như `docs/art/06` §64 (đã ghi chú trong tài liệu đó).
- Texture manifest chuyển từ `TEXTURE_MANIFEST` trong game-web sang trường `textures` theo scene trong `packages/game-content` — đóng sai lệch đã chấp nhận ở Phase 11; `docs/art/06` §65 và `ARCHITECTURE.md` đã cập nhật.
- Cửa nằm giữa sàn (không dựa tường); `worldBounds` bắt đầu ở y=160 (cao 1440) nên minimap dùng `worldBounds`, không dùng gốc (0,0).
- Khung đi bộ là sheet 8x4 **sinh bằng code** từ 4 ảnh idle (`make_walk_frames.py`), không có tay vung; sheet thật thay cùng tên file theo `docs/art/07` bằng `slice_walk_sheet.py`. Anim key theo `actor_action_direction` (`player_walk_se`) theo `apps/game-web/AGENTS.md`, không theo `walk_player_se` trong brief. Chân chạm đất nhấc 1 px (không phải 3).
- Hoạt ảnh đi bộ không bị tắt bởi "Giảm chuyển động" (phản hồi chức năng; xem Task 6).
- `loader.timeout` 15 s giữ trong `createGame`; ảnh PNG lớn trên mạng chậm có thể hết hạn (worst-case ~45 s cả thử lại).
- Phím `M` (minimap) bị chặn khi input bị khóa (modal/sổ tay/pause/case đóng).
- `paper_grain_cream_tile_1024.png` được commit (1.2 MB); script sinh đã mất, file là nguồn chân lý.
- Chưa có số FPS trên GPU thật (pane Browser giới hạn rAF).
