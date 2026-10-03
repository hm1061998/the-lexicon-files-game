# Sổ tay, bảng suy luận và bảng buộc tội: thẻ chia mục, thẻ ghim, ba loại nút

Ngày: 04/10/2026. Trạng thái: **chờ duyệt**. Plan: chưa viết. Chưa sửa code.

Phân loại theo `brainstorming`: **architectural** — đổi cách trình bày của ba màn điều tra lớn nhất, dùng lại và mở rộng primitive `packages/ui`, xóa alias `PaperPanel`. Sau khi spec được duyệt mới chuyển sang `writing-plans`.

Đây là **phần 5**, phần cuối của chương trình làm lại UI (`2026-10-02-ui-foundation-hud-design.md` §12). Phần 1–4b đã xong, được duyệt và đã push.

## 1. Mục tiêu và nguồn yêu cầu

Sổ tay (J), bảng suy luận (B) và bảng buộc tội phải cùng ngôn ngữ "hồ sơ điều tra trên giấy" với phần 1–4b: nút thuộc ba loại có trạng thái và âm thanh, mục chọn là thẻ chia dính mép giấy, các mảnh thông tin là thẻ ghim trên bảng. Chỉ đổi trình bày; logic, store, phím tắt, save, text và ID trong content giữ nguyên; **không đổi thuật toán phân trang**.

Tiêu chí thành công:

1. Ảnh chụp sổ tay (4 mục), bảng suy luận (4 mặt) và bảng buộc tội đặt cạnh ảnh phần 1–4b trông cùng một game; người dùng duyệt bằng mắt.
2. Không còn `PaperPanel` trong code; alias bị xóa khỏi `packages/ui`, CSS `.paper-panel` và `form-controls.css` được dọn.
3. Mọi `button` hiển thị ở ba màn này thuộc ba loại (`InkButton`, `PaperButton`, `DeviceKey`) hoặc primitive đã kiểm (`FolderTabs`, `.vocabulary-word`); test canh gác `button-guard.spec.ts` mở rộng phủ sổ tay, bảng suy luận và bảng buộc tội.
4. **Không cuộn** (spec `2026-10-02-investigation-no-scroll-design.md` vẫn hiệu lực): ở 1280×720, 760×600, 390×844, 1280×540, 844×390 không container nào trong giấy tràn; nội dung dài vẫn đọc bằng lật trang hoặc chuyển mặt.
5. Mọi luồng hiện có vẫn chạy (xem §6); không thêm dependency; không đổi `game-core`, `learning-engine`, save version, Condition/Effect, event bus.

Nguồn (người dùng, 04/10/2026): tiếp phần 5; giữ lật trang và làm nó thật hơn; sổ gáy lò xo kèm thẻ chia mục kẻ dính; bảng ghim kèm thẻ ghim cho bảng suy luận và bảng buộc tội. Ghi chú mâu thuẫn đã giải: spec nền nói "bỏ thanh tab và phân trang", nhưng spec không cuộn buộc phải lật trang; người dùng chọn giữ lật trang nên dòng "bỏ phân trang" của spec nền không còn hiệu lực.

Liên quan: `AGENTS.md` §6 (đỏ chỉ cho clue/evidence/objective/contradiction/selected node/map marker), `apps/game-web/AGENTS.md` (ba loại nút, `motion.css`, no-scroll), phần 3, 4, 4b.

## 2. Hiện trạng (đối chiếu code tại `9cc8716`)

| Màn | File | Ghi chú |
| --- | --- | --- |
| Sổ tay | `notebook/NotebookPanel.tsx`, `notebook.css` (694 dòng), `NotebookReaderPage.tsx` | Duy nhất còn dùng `PaperPanel`; thanh tab 4 mục (`aria-current` + `aria-pressed`); nút `×` và "Mở bảng suy luận" là `<button>` thô; sổ hai trang gáy lò xo, bốn góc bìa |
| Điều khiển trang | `investigation/pagination/PageControls.tsx`, `pagination.css`, `PageTurnSurface.tsx`, `ChoicePages.tsx`, `ReadDocument.tsx` | Nút "‹ ›" hộp 44×44 và nhãn "Trang n/m"; lật bằng nút, phím hoặc kéo góc |
| Bảng suy luận | `deduction/DeductionBoard.tsx`, `DeductionCluesFace.tsx`, `TimelineWorkspace.tsx`, `ContradictionWorkspace.tsx`, `DeductionCaseFile.tsx`, `DeductionConnections.tsx`, `deduction.css` (530 dòng) | Bảng nút chai; 4 mặt qua hàng tab hộp (`aria-pressed`); hồ sơ vụ việc / liên hệ nguồn; 13 `<button>` thô |
| Bảng buộc tội | `conclusion/AccusationPanel.tsx`, `conclusion.css` | 4 `<button>` thô; là mặt "Kết luận" của bảng suy luận |
| Thẻ từ vựng | `vocabulary/InvestigationVocabularyPopover.tsx` | 2 `<button>` thô trong lớp đọc của sổ/bảng |
| Alias | `packages/ui/src/primitives/PaperPanel.tsx`, `index.ts`, `form-controls.css` | Chỉ `NotebookPanel` còn dùng; `form-controls.css` còn tham chiếu `.paper-panel` |

Đã có để dùng lại: `InkButton`, `PaperButton`, `DeviceKey`, `FolderTabs`, `PaperSheet` (clip, tape, tilt), `Stamp`, `ModalSheet`, `DeskBackdrop`, `motion.css`, `uiSound`/`data-sfx`.

## 3. Thiết kế

### 3.1 Sổ tay (J): sổ gáy lò xo, thẻ chia mục kẻ dính

- Bỏ `PaperPanel`; khung sổ là chính phần gáy lò xo và góc bìa SVG hiện có (không thêm art mới), nền không viền hộp. Overlay giữ lớp tối nhẹ trên thế giới như hiện nay.
- Bốn mục (Nhân vật, Chứng cứ, Từ vựng, Dòng thời gian) thành **thẻ chia mục**: `FolderTabs` thò ra mép phải của sổ ở ≥ 960×640 (cột dọc), và hàng ngang sát mép trên sổ ở màn nhỏ. Thẻ hiện tại có `aria-current="page"`; bỏ `aria-pressed` (đây là điều hướng, không phải nút bật tắt). Mục đang mở nhô ra thêm và đậm hơn; viền đỏ cũ của tab đang chọn bỏ (đỏ không cần ở đây).
- Tiêu đề "Sổ tay điều tra" và nhãn phím `J` giữ; nút đóng là `InkButton` có nhãn chữ "Đóng" (vẫn ≥44px, `aria-label` giữ); "Mở bảng suy luận" là `PaperButton` đặt ở góc dưới sổ hoặc cạnh tiêu đề (cùng một chỗ ở mọi viewport để focus order ổn định).
- Mở: trượt lên và xoay về góc 220ms (như `ModalSheet`); đóng tức thì (như các màn khác). Tắt bởi `lexicon-motion-off` và `prefers-reduced-motion`.

### 3.2 Lật trang thật hơn

- `PageControls`: nút "‹ ›" thành hai **góc gấp** (dog-ear) ở góc dưới của từng trang, là `InkButton` (≥44×44, vùng bấm tính cả góc); "Trang n/m" là nhãn mực viết tay (Patrick Hand ≥ 16px) giữa hai góc; đầu/cuối trang làm góc mờ và `disabled`. `aria-label` giữ dạng `"<nhãn>: <Trang trước|Trang sau>"` như hiện có.
- Âm thanh: góc gấp dùng `paper-open`/`paper-close` thay `press` (nút lật tới và lui); không phát khi nút `disabled`.
- Không đổi `paginateBlocks`, `useMeasuredPages`, `MeasuredPage`, `PageTurnSurface`, `pageFlipAdapter`: chỉ markup điều khiển và CSS.
- Lật bằng bàn phím và kéo góc như hiện tại; không wheel/touch cuộn.

### 3.3 Bảng suy luận (B): bảng ghim

- Khung bảng giữ nền `cork_board.png`; header "Bảng suy luận" là một dải giấy ghim kẹp (bỏ dải kem hộp). Bốn mặt (Manh mối, Dòng thời gian, Đối chiếu, Kết luận) là `FolderTabs` hàng ngang dính cạnh trên của bảng; mặt đang mở nhô lên. `aria-current="page"`.
- "Hồ sơ vụ việc" / "Liên hệ nguồn" là hai `InkButton` kiểu nhãn (`aria-pressed` giữ: đây là nút bật tắt thật).
- Mỗi mảnh thông tin (manh mối, sự kiện, dữ kiện đối chiếu) là **thẻ ghim**: `PaperSheet` nhỏ có đinh ghim hoặc băng keo, nghiêng nhẹ ±0.6° xen kẽ; thẻ được chọn hoặc đã ghép dùng đỏ mực (selected node, contradiction: đúng §6); dây nối giữ nguyên `DeductionConnections`. Mọi tilt mới đăng ký trong `motion.css` (motion-off và OS reduced motion) ngay cùng commit.
- Nút thao tác trên thẻ (chọn, ghép, đặt vào dòng thời gian, bỏ) là `InkButton`; hành động chính của mặt (Gửi đối chiếu, Chốt sự kiện) là `PaperButton`. Không đổi logic `deductionUiReducer`, `pickContradiction`.
- Nút đóng và "Mở sổ tay" như §3.1.

### 3.4 Bảng buộc tội (mặt "Kết luận")

- Danh sách nghi phạm là các thẻ ghim; thẻ đang chọn nhô và đỏ mực (selected). Nút "Buộc tội" là `PaperButton` (hành động chính, không đỏ, vẫn sai không phạt: chuỗi "This interpretation doesn't match the evidence." giữ nguyên, không "WRONG!", không timer). `AccusationPanel` giữ hợp đồng props/test hiện có.

### 3.5 Thẻ từ vựng trong lớp đọc

- `InvestigationVocabularyPopover`: nút Đóng, Hiện bản dịch và nút trang là `InkButton`; giữ bố cục thẻ trong dialog, không cuộn.

### 3.6 Xóa `PaperPanel`

- Xóa `PaperPanel.tsx`, export trong `index.ts`, test liên quan trong `primitives.test.tsx`, luật `.paper-panel` còn lại trong CSS, và đổi `form-controls.css` sang `:is(.modal-sheet, .folder-cover, <khung sổ>, <bảng>)`. Kiểm bằng grep không còn `PaperPanel`/`paper-panel` trong `apps` và `packages` (ngoài `dist`).

### 3.7 Chuyển động, trợ năng, âm thanh

- Mở sổ/bảng 220ms trượt và xoay; thẻ ghim xuất hiện lần lượt cách 40ms (giữ ở mức nhẹ, không làm chậm đọc). Tắt hết khi giảm chuyển động.
- Focus trap, trả focus, `aria-modal`, tên truy cập, mục tiêu ≥44px, focus ring 3px giữ; phím J/B/Esc giữ.
- Âm thanh: thẻ chia mục `tab`, đóng sổ `paper-close`, lật `paper-open`/`paper-close` (đã có file CC0).

## 4. Kiểm chứng

- Unit: markup `NotebookPanel`, `PageControls`, `DeductionBoard`, `AccusationPanel` (class ba loại nút, `aria-current`, không `paper-panel`), test CSS motion cho thẻ ghim và góc gấp, `primitives.test.tsx` sau khi xóa alias.
- E2E hiện có phải giữ xanh: `notebook-deduction`, `notebook-people`, `investigation-pagination`, `investigation-acceptance`, `viewport-focus`, `journey`, `case-002`; cập nhật các selector đổi (ví dụ tab).
- E2E mới/mở rộng: `button-guard` thêm sổ tay (4 mục), bảng suy luận (4 mặt), bảng buộc tội; `ui-investigation.spec.ts` kiểm vừa khung và không cuộn ở 5 viewport, mục tiêu ≥44px, đếm đỏ (chỉ selected/contradiction/evidence).
- Ảnh trước/sau (`docs/ai/playtests/2026-10-04-ui-investigation/{before,after}/`): sổ tay 4 mục, bảng 4 mặt, bảng buộc tội × 1920×1080, 1280×720, 760×600, 390×844, 844×390; FPS đo lại.
- Definition of Done: `lint`, `test`, `build`, `typecheck`, `format`, `memory:check`, pytest; E2E đầy đủ so với 17 đỏ có sẵn; một review độc lập cuối.

## 5. Ngoài phạm vi

Thuật toán phân trang và engine đọc; thêm art mới (SVG gáy lò xo giữ nguyên); đổi nội dung/luật case, engine suy luận, save; Phaser; âm thanh mới (`tape-loop` vẫn tùy chọn); backend.

## 6. Rủi ro

- R-1: engine phân trang đo chiều cao nội dung; đổi font/padding thẻ ghim hay góc gấp có thể thay số trang. Giữ kích thước vùng chứa nội dung, chạy lại `investigation-pagination` và ảnh ở 5 viewport.
- R-2: `:where()` của `InkButton`/`PaperButton` và CSS riêng của sổ/bảng (694 + 530 dòng) cạnh tranh; chuyển từng màn, mỗi màn kèm chụp ảnh và E2E fit.
- R-3: hàng tab thêm chiều cao ở 844×390 và 1280×540 có thể phá no-scroll; tab ở màn thấp nằm dọc mép sổ hoặc thu nhỏ, kèm test fit.
- R-4: xóa alias làm mất kiểu điều khiển form trong sổ; dọn `form-controls.css` sau khi chuyển và kiểm Cài đặt.
- R-5: dây nối bảng suy luận phụ thuộc vị trí thẻ; tilt chỉ trên lớp thẻ, không trên khung chứa dây.
