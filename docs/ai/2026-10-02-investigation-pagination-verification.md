# Verification — sổ tay và bảng suy luận không cuộn (2026-10-02)

Spec `docs/superpowers/specs/2026-10-02-investigation-no-scroll-design.md`, plan `docs/superpowers/plans/2026-10-02-investigation-no-scroll.md`. Môi trường: Windows, Node 22.23.3 (`.superpowers/runtime`), npm + Nx, Chromium (Playwright), một worker. Chỉ Chromium Windows; **không** tuyên bố full E2E toàn repo.

## Kết quả lệnh

| Lệnh | Kết quả |
| --- | --- |
| `npm run lint` (7 project) | PASS, 0 lỗi |
| `npm run test` | PASS: game-web 547 test (91 file), game-content 188, các package khác PASS |
| `npm run build` | PASS (cảnh báo có sẵn: chunk JS > 500 kB) |
| `npm run typecheck` (`tsc -b`) | PASS |
| `npx prettier --check .` | PASS |
| `npm run memory:check` | PASS |
| Nhóm E2E: `investigation-pagination investigation-acceptance notebook-deduction notebook-people timeline journey viewport-focus learning settings dialogue` | **61 passed (21,1 phút)** sau đợt sửa review; sau đó chạy lại riêng popover (4/4) và notebook-people + learning (7/7) khi chỉ đổi CSS popover và ảnh chụp |
| Backend | Không đổi `apps/api`, không chạy `dotnet` |

## Acceptance 5 viewport

`investigation-acceptance.spec.ts`: 1280×720, 760×600, 390×844, 1280×540, 844×390, mỗi viewport hai test.

- **Sổ tay 4 tab** (Nhân vật, Chứng cứ, Từ vựng, Dòng thời gian): mọi lời khai/mô tả/định nghĩa đọc đủ qua các trang (nối fragment khớp văn bản gốc), không cuộn (`expectNoInvestigationScroll`: offset cuộn không đổi sau wheel, mọi nút/đoạn nằm trong khung, không fragment nào tràn đáy trang của nó), nút đóng trong viewport, một canvas, không `pageerror`.
- **Bảng 4 mặt** (Manh mối, Dòng thời gian, Đối chiếu, Kết luận): khung bảng nằm trọn màn hình, không trang nào kẹt "Đang mở trang…", chọn được cặp dữ kiện trên nhiều trang.
- Thêm: reduced-motion (không lớp lật giấy, đổi trang tức thì), lật nhanh rồi đóng (không kẹt input, focus về game), resize khi đang đọc giữ neo, ảnh evidence bị chặn vẫn đọc được.
- Ảnh chụp thật: `docs/ai/playtests/2026-10-02-investigation-pagination/` (4 tab × 5 viewport, 4 mặt × 5 viewport, popover 3 viewport). Đã xem ảnh 844×390, 390×844, 1280×540, 1280×720.
- Kích thước: `expectComfortableControls` — mọi nút/select/input nhìn thấy ≥ 44×44 và chữ ≥ 14px (sổ tay và bảng ở 1280×720, 390×844, 844×390).

## Lỗi do acceptance và review độc lập tìm ra (đã sửa, có test)

1. Trang đo rộng hơn thực tế 8px (padding viewport) → chữ có thể tràn dưới trang. Sửa đo theo `clientWidth - 8`; thêm cơ chế tự hiệu chỉnh: nếu trang đang hiện tràn, giữ lại 24px và dàn trang lại (vì nút từ vựng inline-block có thể wrap khác văn bản phẳng).
2. 844×390: workspace bảng chỉ còn ~40px chiều cao đọc → layout ba cột cho màn hình thấp.
3. Ghi chú "Chưa thể nộp kết luận" nằm trên nền cork tối; pager Manh mối khó đọc → trang giấy/nút nền giấy.
4. Focus trap tính cả nút trong bản đo ẩn → Tab thoát khỏi hộp thoại; sửa bỏ `[inert], .page-measurement`.
5. Âm giấy: mỗi lần lật trang hợp lệ phát đúng một cue `paper` qua `PaperCueContext` (GameCanvas phát lên bus); biên (PageUp ở trang đầu) không phát.
6. Focus sau lật trang: giữ trên pager/viewport thay vì rơi về body; PageUp/PageDown khi focus ở thẻ popover chỉ lật popover.
7. Chọn lại hồ sơ mở ở trang đầu (neo cục bộ cũ bị reset khi nội dung đổi); empty state cho dòng thời gian/đối chiếu; lớp `contradiction-confirmed` phục hồi; bỏ ghim đỏ pseudo-element cũ; xoá component sổ tay cũ không còn dùng.
8. Bảng suy luận dùng token font Cambria thay Georgia (Georgia vẽ sai dấu thanh tiếng Việt trên Windows).
9. Popover từ vựng cao tới 62% (86% khi thấp ≤ 500px) và nằm trong dialog, nội dung phân trang; Esc trả focus về từ.

## Quyết định và giới hạn

- **page-flip** bị loại sau probe Chromium (còn RAF sau destroy); dùng lớp phủ SVG/CSS cứng 550ms. Đây **không phải page curl**; vòng gáy là một lớp ảnh. Không có dependency mới.
- Không có fixture nội dung dài tổng hợp trong browser (spec §10.2): acceptance dùng nội dung Case001 ở viewport nhỏ và unit test đo giả lập; chi phí: đoạn rất dài có vocabulary + translation chưa được chứng minh trong browser.
- Cải tiến đo: dùng hiệu chỉnh khi tràn thay vì render markup đo giống hệt (đơn giản hơn, có thể thêm một lần dàn lại).
- **Còn treo (Minor/ngoài phạm vi):** vùng `role=status` bọc cả tài liệu phân trang (pager + bản đo ẩn) → có thể đọc trùng; khối cố định cao hơn trang hiện thông báo lỗi dành cho dev; khay đối chiếu chỉ hiện số lượng thay vì hai dữ kiện đã chọn; mặt Kết luận chưa có trang hồ sơ nghi phạm; "Mở bảng" từ dòng thời gian sổ tay mở mặt Manh mối; trang tiếp nối sổ tay chưa có nhãn nguồn; một bộ đếm lật cho cả mục lục và chi tiết (hiệu ứng chạy ở cả hai), hướng lật luôn "tới"; tách văn bản chưa an toàn theo grapheme (ZWJ/dấu kết hợp); CSS chết `.deduction-relations`, `.deduction-card-grid`, `.timeline-recorded-*`; các test reduced-motion/resize đã thành assertion cứng nhưng chỉ ở 844×390.
- Oracle E2E cũ được chuyển sang giao diện mới nhưng giữ assertion engine/save/reload: timeline, journey, notebook-deduction, notebook-people, learning.

## Commit

`cc8ad7a` test regression → `1f537a9` popover → `325fc2e` format → `28c1174` acceptance + sửa lỗi → commit sửa review độc lập → commit CSS popover/ảnh/báo cáo này.
