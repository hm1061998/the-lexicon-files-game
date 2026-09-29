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
