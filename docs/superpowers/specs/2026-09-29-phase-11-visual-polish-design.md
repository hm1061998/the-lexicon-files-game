# Phase 11 — Visual Polish

**Trạng thái:** Đã duyệt (Phần A + B); hoàn tất triển khai. Sai lệch: asset xử lý dùng PNG thay WebP; thêm trường tùy chọn `scale` cho scene asset; tường vẫn placeholder `ph_wall`; fade-in bỏ ở boot đầu. Chi tiết: `docs/ai/2026-09-29-phase-11-visual-polish-verification.md`.
**Ngày:** 2026-09-29
**Lộ trình:** `docs/04_CODEX_IMPLEMENTATION_ROADMAP.md` §30 — "Apply graphic design spec: paper texture; sepia palette; red accent; vintage UI; typography; transitions; interaction marker. Không thay game logic."
**Tài liệu liên quan:** `docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md` §5 (palette, style), §33 (marker), §44 (paper overlay); `docs/concept/*.webp` và `docs/concept/README.md`; `docs/art/07_AI_ASSET_PROMPT_PACK.md`; `AGENTS.md` §6 (giới hạn màu đỏ); `apps/game-web/AGENTS.md`.

## 1. Bối cảnh và quyết định đã thống nhất với người dùng

- Repo **không có "graphic design spec" riêng**; nguồn duy nhất là `docs/art/06` (palette, style, paper overlay 0.10–0.18, marker) và hai ảnh concept.
- Phase 11 chia hai phần:
  - **Phần A — Visual polish bằng code (tài liệu này):** token thiết kế, paper overlay, UI cổ điển, typography, chuyển cảnh, marker. Không cần file ảnh.
  - **Phần B — Tích hợp art thật:** thay placeholder bằng ảnh do người dùng tạo bằng công cụ AI miễn phí. Chỉ lập spec/plan sau khi có file trong `assets/_incoming/`, vì kích thước, điểm neo và collider phụ thuộc file thật.
- Người dùng chọn **font hệ thống, ngăn xếp serif** (không thêm dependency, không tải mạng, hiển thị được tiếng Việt).
- Người dùng chọn **tự tạo ảnh bằng app AI miễn phí (Gemini/Bing/ChatGPT) rồi đưa file**. Lý do: máy chưa có khóa API tạo ảnh và trợ lý không được nhập khóa thay người dùng; máy chỉ có GPU Intel UHD, 16 GB RAM, không có Python nên không chạy Stable Diffusion cục bộ; Pollinations bị nguồn tin báo trả 401 không khóa, giới hạn ~1 ảnh/15 giây, giấy phép đầu ra mờ nên không chọn. Bộ prompt và quy trình nằm ở `docs/art/07_AI_ASSET_PROMPT_PACK.md`; provenance ghi ở `assets/PROVENANCE.md`.

## 2. Mục tiêu và tiêu chí thành công (Phần A)

Giao diện và lớp phủ trong game nhìn như "hồ sơ giấy cổ điển" theo concept, bằng palette đã khóa, mà **không đổi bất kỳ logic game nào**.

- Mọi UI dùng token từ một nơi; chữ ≥ 14px; cặp chữ/nền đạt WCAG AA (test tự động).
- Có paper overlay trong Phaser với alpha trong khoảng 0.10–0.18 và paper texture cho panel UI.
- Marker tương tác thực sự nổi 4 px trong khoảng 800–1200 ms và dừng khi bật giảm chuyển động.
- Chuyển cảnh và modal có hiệu ứng ngắn, tắt hẳn khi bật giảm chuyển động.
- Màu đỏ `#A4412D`/`#743026` chỉ xuất hiện ở: clue, evidence, objective, mâu thuẫn, selected node, marker (AGENTS §6).
- Toàn bộ gate hiện có (lint, test, build, typecheck, format, E2E, memory, `git diff --check`) tiếp tục PASS.

## 3. Thiết kế Phần A

1. **Token thiết kế.** Mở rộng `packages/ui/src/theme/palette.css` (và `palette.ts` giữ đồng bộ) với các màu còn thiếu trong palette `art/06` §5 (Warm Gray, Dusty Olive, Muted Green, Dark Red) và token chữ: serif nội dung `Cambria, "Times New Roman", Georgia, serif` (Georgia vẽ sai dấu thanh tiếng Việt trên Windows nên đặt cuối), chữ máy đánh cho keycap `"Courier New", ui-monospace, monospace`, thang cỡ chữ ≥ 14px. Test đơn vị kiểm độ tương phản WCAG AA cho các cặp chữ/nền được dùng (đọc token từ `palette.ts`; thêm test đồng bộ `palette.css` ↔ `palette.ts` để xử lý deferred minor Phase 3).
2. **Paper overlay.**
   - UI: panel giấy có texture sinh bằng CSS/SVG (nhiễu `feTurbulence` trong data URI hoặc gradient), độ mờ khoảng 0.12, không kéo dependency.
   - Phaser: lớp overlay giấy phủ toàn màn hình, alpha 0.10–0.18 (art/06 §44), đặt trên thế giới và dưới HUD, sinh bằng code trong `BootScene`; khóa theo texture key để Phần B chỉ cần thay bằng `paper_texture` thật.
3. **UI kiểu cổ điển.** Panel có viền mực kép và bóng cứng (không blur, không glow); nút viền mực, hover đổi nền; keycap kiểu chữ máy đánh; dấu CASE CLOSED kiểu con dấu nghiêng, viền mực; tiêu đề dùng small-caps/letter-spacing. Vùng focus giữ rõ.
4. **Chuyển cảnh và hiện panel.** Phaser fade camera khoảng 250 ms khi đổi scene; modal/panel hiện dần khoảng 160 ms. Cả hai tắt (đổi tức thì) khi `reducedMotion` bật, dùng đúng `MotionSource` của Phase 10 cho Phaser và thuộc tính `data-reduced-motion` cho CSS.
5. **Marker tương tác.** Sửa lỗi tồn tại từ Phase 1: `WorldScene.updateNearby` đặt lại vị trí marker mỗi frame nên tween nổi bị ghi đè, marker chưa từng chuyển động. Sửa bằng cách tween một độ lệch riêng và áp `baseY + offset` khi đặt vị trí. Marker vẽ lại là hình thoi đỏ có viền mực, không glow, nổi 4 px trong 1000 ms; khi giảm chuyển động bật thì dừng ở vị trí gốc, tắt thì chạy lại.
6. **Kiểm chứng.**
   - Unit: test tương phản, đồng bộ palette, hàm tính vị trí marker (base + offset).
   - E2E: marker thực sự dao động theo thời gian khi giảm chuyển động tắt và đứng yên khi bật; overlay giấy tồn tại và không chặn tương tác; các E2E hiện có không đổi kết quả.
   - Thị giác: chụp ảnh màn hình HUD, notebook, pause, evidence modal và báo cáo; người thực hiện tự xem, đối chiếu `docs/concept/ingame_main_office_hud.webp` và ghi chỗ chưa giống vào file verification. Repo chưa có công cụ so sánh ảnh tự động nên không tuyên bố "giống concept" khi chưa xem.

## 4. Ngoài phạm vi Phần A

Art thế giới và nhân vật, animation nhân vật, bố cục HUD mới, âm thanh, thay đổi save/learning/settings schema, đổi luật game.

## 5. Phần B — ghi nhận để phiên sau tiếp tục

- Điều kiện bắt đầu: có ảnh ưu tiên 1 trong `assets/_incoming/` (danh sách ở `docs/art/07`, mục 4.1) và dòng provenance tương ứng.
- Việc làm: tách nền magenta (ffmpeg có sẵn trên máy), đưa về WebP đúng kích thước theo art/06 §3 và §47–48, đặt vào `assets/…` theo §38, tạo manifest texture/loader, thay `ph_*` trong scene JSON (đổi texture key, origin, collider theo file thật; không đổi logic), giữ placeholder cho asset không đạt, chạy đủ gate và E2E.
- Rủi ro đã biết: AI khó giữ nhất quán 4 hướng nhân vật (làm sau, ưu tiên 3); cần kiểm tra điều khoản đầu ra từng công cụ trước khi dùng thương mại.

## 6. Tiêu chí chấp nhận và xác minh

- Mọi tiêu chí ở §2 đạt; ghi verification vào `docs/ai/2026-09-29-phase-11-visual-polish-verification.md` (hoặc ngày thực tế) gồm output thật của các gate và nhận xét thị giác.
- Chạy và lưu output: `npm run lint`, `npm run test`, `npm run build`, `npm run typecheck`, `npm run format:check`, `npm run test:e2e`, `npm run memory:check`, `git diff --check`. Backend checks chỉ khi sửa `apps/api`.
