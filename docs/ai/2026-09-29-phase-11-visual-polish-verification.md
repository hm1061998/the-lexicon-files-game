# Phase 11 Visual Polish — Xác minh

Ngày: 2026-09-29 (Asia/Saigon)
Trạng thái: hoàn tất Phần A (token, paper overlay, UI cổ điển, chuyển cảnh, marker) và Phần B (art AI đã xử lý, tích hợp texture). Tất cả gate PASS.

## Kết quả gate (commit code cuối `9075670`)

| Lệnh | Kết quả |
| --- | --- |
| `npm run lint` | PASS (exit 0) — 0 lỗi; 1 warning có từ trước (`GameCanvas.tsx` exhaustive-deps `initialSceneId`) |
| `npm run test` | PASS (exit 0) — game-web 41 file / 286 test; các package còn lại đọc từ cache Nx (PASS) |
| `npm run build` | PASS (exit 0) — cảnh báo chunk > 500 kB như trước |
| `npm run typecheck` | PASS (exit 0) |
| `npm run format:check` | Lần đầu FAIL: `assets/PROVENANCE.md`, `tools/art-codegen/assets_config.json` (file Phase 11 đã track) → `prettier --write` chỉ hai file này (commit `9075670`) → PASS |
| `npm run test:e2e` | PASS (exit 0) — 49 passed |
| `npm run memory:check` | PASS (exit 0) |
| `git diff --check` | PASS (exit 0) |

Sửa deferred minor trước gate: `.pause-menu button` dùng `font-size: var(--lexicon-text-min)` (commit `95e8851`).

## Đối chiếu concept (đã chụp bằng Playwright, ảnh lưu ngoài repo)

Đã xem trực tiếp: HUD office, sổ tay (tab Chứng cứ), menu Tạm dừng, modal evidence (Meeting Minutes), scene Archive, CASE CLOSED. So với `docs/concept/ingame_main_office_hud.webp`:

- **Giống về hướng:** bảng mục tiêu góc trên trái và bộ đếm hồ sơ góc trên phải dạng giấy cổ điển; thanh phím tắt dưới; prompt tương tác dạng thẻ có phím E; palette sepia, texture giấy nhẹ; nhân vật/prop dựng từ art đã xử lý.
- **Chưa giống concept:**
  1. Tường vẫn là placeholder `ph_wall`; ảnh tường AI là tấm chéo (1200x1162 / 1200x1177) không dùng được. Office chỉ có sàn + khung thảm phẳng, không có phòng có tường như concept; archive chỉ có dải tối phía trên thay cho tường.
  2. Không có minimap "Bản đồ nhỏ" (concept có; ngoài phạm vi Phase 11).
  3. Không có nội thất phong phú (tủ, cây, bảng trắng, bàn họp) – chỉ vài prop; player/NPC nhỏ hơn và ít chi tiết so với concept; bố cục thưa.
  4. Marker đỏ hình thoi hiển thị đúng ở archive (cạnh cửa) nhưng ở archive nó nằm gần ngực nhân vật khi đứng cạnh terminal; ở office chưa thấy marker trong ảnh chụp spawn (chưa đứng gần điểm tương tác).
  5. Tiếng Việt bị vẽ lệch dấu thanh ("Hô` sơ", "điê`u"): nguyên nhân là **glyph của Georgia trên Windows**, không phải font dự phòng của headless. Đã sửa bằng ngăn xếp `Cambria, "Times New Roman", Georgia, serif` (Cambria/Times New Roman vẽ đúng). Cần nhìn lại ảnh chụp sau sửa trên máy thật.
  6. Sổ tay: `select` chế độ dịch dùng style mặc định của trình duyệt (trắng), lệch hẳn phong cách giấy; nhãn "Chế độ dịch" dính liền select. Menu pause: layout hàng cài đặt chật, `select`/`input` chưa được style.
  7. Modal evidence: ảnh evidence (`evidence_*.png`) opaque với nền gỗ, chưa được dùng trong modal.
- Không tuyên bố "giống concept": phần khung UI gần tinh thần concept, còn scene thì chưa.

## FPS / paper overlay

Task 4 ghi nhận overlay giấy làm FPS giảm ~17 → 10 trên WebGL phần mềm headless. Không đo lại trên GPU thật ở đây. Khuyến nghị: đo trên máy có GPU; nếu vẫn tụt, thay overlay full-screen blend bằng texture tile nhỏ cố định (TileSprite alpha thấp, không blend mode) hoặc dời hiệu ứng sang CSS layer ở trên canvas.

## Sai lệch so với spec

- **PNG thay WebP** cho asset đã xử lý (spec ghi WebP; Task 5 chọn PNG).
- Thêm trường tùy chọn `scale` cho scene asset (schema + type) — mở rộng hợp đồng nội dung thêm một trường tùy chọn (controller chấp nhận).
- Tường vẫn `ph_wall` (ảnh tường AI dạng tấm chéo, không dùng được).
- Fade-in bị bỏ ở lần boot đầu (chỉ có fade khi chuyển cảnh).
- Art AI đã xử lý (gồm nhân vật tạo bằng ChatGPT, `apps/game-web/public/assets/characters/**`) **đã được commit và đi kèm trong nhánh `dev` cục bộ (chưa push)**; chỉ ảnh thô `assets/_incoming/` giữ cục bộ. Chủ dự án **phải xác nhận điều khoản đầu ra của OpenAI trước khi merge/push**.
- Sai lệch được chấp nhận: manifest texture (`TEXTURE_MANIFEST`) nằm trong game-web, hardcode id/texture Case #001 và preload toàn bộ (~9.6 MB) lúc boot. Follow-up: chuyển sang manifest theo scene trong `packages/game-content` và tải theo scene.
- Sửa sau final review: `vocabulary-tutorial` 12.6px → `--lexicon-text-min`; `.gitignore` thêm `__pycache__/` và `assets/_incoming/*`.
