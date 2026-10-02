# Vỏ ngoài game: tiêu đề, chọn hồ sơ, các bước phụ, tạm dừng, briefing, tổng kết

Ngày: 02/10/2026. Trạng thái: **chờ người dùng duyệt spec**. Plan: chưa viết. Chưa sửa code.

Phân loại theo `brainstorming`: **architectural** — thêm primitive dùng chung trong `packages/ui`, thêm texture sinh bằng code, đổi trình bày của chín màn ngoài lúc chơi. Sau khi spec được duyệt mới chuyển sang `writing-plans`.

Đây là **phần 3** của chương trình làm lại UI (xem `docs/superpowers/specs/2026-10-02-ui-foundation-hud-design.md` §12). Phần 1+2 (nền vật liệu, HUD, chỉ dẫn trong thế giới) đã hoàn tất và được duyệt.

## 1. Mục tiêu và nguồn yêu cầu

Các màn ngoài lúc chơi phải cùng ngôn ngữ "hồ sơ trinh thám trên giấy" với HUD đã làm: người chơi mở game thấy một **mặt bàn điều tra** với **bìa hồ sơ**, không phải một trang web có nút. Chỉ đổi trình bày; logic, store, phím tắt, text và ID trong content giữ nguyên.

Tiêu chí thành công:

1. Ảnh chụp các màn mới, đặt cạnh ảnh HUD phần 1+2, trông cùng một game; người dùng duyệt bằng mắt.
2. Không còn `PaperPanel` ở chín màn này; không còn nút kiểu hộp web, thanh toolbar hay panel viền 1–2px.
3. Mọi luồng hiện có vẫn chạy: chọn hồ sơ, tiếp tục/làm lại, hỏi mức hỗ trợ, cài đặt, "Cách điều tra", tạm dừng, briefing, tổng kết, khôi phục save.
4. Không thêm dependency; không đổi `game-core`, `learning-engine`, save version, Condition/Effect, event bus.

Nguồn (người dùng, 02/10/2026): chọn làm lại toàn bộ UI; chọn nền **mặt bàn điều tra** (vật liệu sinh bằng code, không art ngoài); chọn bố cục **bìa hồ sơ + tab chia mục**; chọn đủ bốn nhóm màn: (a) tiêu đề + chọn hồ sơ, (b) các bước phụ trước game, (c) tạm dừng + briefing, (d) màn tổng kết; chọn cách làm **vỏ dùng chung trong `packages/ui`**.

Liên quan: `docs/01_GAME_DESIGN_DOCUMENT.md` §2.3 (diegetic UI), `AGENTS.md` §6 (guardrail sản phẩm), spec phần 1+2 (D-1…D-6: desktop trước, vật liệu bằng code, bộ font, bóng mềm).

## 2. Hiện trạng (đối chiếu code tại `48c6e0c`)

| Màn | File | Ghi chú |
| --- | --- | --- |
| Chọn hồ sơ | `title/CasePicker.tsx` | `PaperPanel` + danh sách thẻ `.case-card`; autoFocus vào hồ sơ khuyến nghị |
| Tiêu đề | `title/TitleScreen.tsx` | `PaperPanel` với bốn/năm nút dọc; "Đổi hồ sơ" tùy chọn |
| Mức hỗ trợ | `title/SupportPicker.tsx` | `PaperPanel`, ba lựa chọn + "Dùng mặc định", `role="dialog"` |
| Xác nhận làm lại | `title/NewCaseConfirm.tsx` | `alertdialog`, nút "Bắt đầu lại" / "Hủy" |
| Cài đặt, Cách điều tra | `GameCanvas` stage `settings`/`howto`, `onboarding/HowToInvestigate.tsx` | `PaperPanel` + `SettingsFields` |
| Khôi phục save | `SaveRecoveryScreen` trong `GameCanvas` | `role="alert"`, hai nút |
| Tạm dừng | `pause/PauseMenu.tsx` | `role="dialog"`, `aria-modal`, `SettingsFields` bên trong |
| Briefing | `briefing/BriefingMemo.tsx` | `role="dialog"`, bốn dòng có từ vựng click-mới-mở, nút "Nhận hồ sơ" |
| Tổng kết | `conclusion/CaseSummaryScreen.tsx` | `role="dialog"`, dòng `role="status"` CASE CLOSED, báo cáo `buildCaseReport` |

Tất cả dùng `PaperPanel` cũ (viền 2px, bóng cứng). `title.css` nền `--lexicon-ink` phẳng. Logic stage nằm ở `title/titleModel.ts` (`nextTitleStage`, `selectTitleActions`) và `GameCanvas` (`CaseFlow`). E2E (`onboarding`, `hud`, `viewport-focus`, `notebook-people`) bám một số class: `title-card`, `pause-menu`, `briefing-memo`, `case-summary`, `.case-card`.

## 3. Quyết định đã chốt

| Mã | Quyết định | Phương án loại |
| --- | --- | --- |
| S-1 | Nền các màn trước game là **mặt bàn điều tra**: gỗ tối sinh bằng code + vignette; không cần art mới. | Dựng lại cảnh Phaser làm nền (tốn FPS, đổi luồng boot); ảnh minh họa ngoài (chờ PR-06). |
| S-2 | Màn tiêu đề là **bìa hồ sơ + tab chia mục** trên bàn; các lựa chọn là tab. | Tờ giấy lớn + danh sách chữ; chồng giấy đặt lệch. |
| S-3 | Phạm vi: cả bốn nhóm màn (§2). | Chỉ một phần. |
| S-4 | **Vỏ dùng chung** trong `packages/ui` (`DeskBackdrop`, `FolderCover`, `FolderTabs`, `ModalSheet`); các màn chỉ lắp nội dung. | CSS riêng từng màn; router màn hình mới thay stage. |
| S-5 | Giữ nguyên `titleModel`, stage, store, phím tắt, focus trap hiện có. | Đổi cấu trúc stage. |
| S-6 | Các bước phụ (hỗ trợ, cài đặt, cách điều tra) chạy **trong cùng bìa**; xác nhận làm lại và khôi phục save là `ModalSheet`/tờ ghi chú. | Mỗi bước một màn riêng. |

## 4. Vật liệu mới (`tools/art-codegen/build_ui_materials.py`)

Thêm vào script hiện có (cùng `SEED`, byte ổn định, Pillow + numpy, không model ảnh), xuất vào `apps/game-web/public/assets/ui/`:

| File | Dùng cho | Ghi chú |
| --- | --- | --- |
| `desk_wood.png` | nền mặt bàn | 512×512 lát liền mép (cả hai trục), gỗ tối, vân dọc, vài vết xước nhẹ |
| `folder_cover.png` | bìa hồ sơ | 9-slice (slice 48), manila, mép sờn, đường gấp giữa |
| `folder_tab.png` | tab chia mục | 9-slice (slice 20), đầu tab xiên, nhô ra phía phải |
| `scrim_vignette.png` | nền modal | chỉ kênh alpha (RGB đồng nhất), tối dần ra mép |

Test Python mở rộng `test_build_ui_materials.py`: hai lần build cho cùng bytes; `desk_wood` lát liền (chênh mép trung bình < 4 mức xám) và màu trung bình trong palette tối (gần `--lexicon-border`); `folder_cover`/`folder_tab` có góc trong suốt và tâm đặc; `scrim_vignette` chỉ alpha thay đổi, giữa gần 0 và mép cao. `assets/PROVENANCE.md`: một dòng mỗi file ("Code renderer `tools/art-codegen/build_ui_materials.py`, seed 20261002, không dùng model sinh ảnh").

## 5. Primitive trong `packages/ui`

Chỉ React + CSS, không import game state/Phaser/store; text do nơi dùng truyền vào.

| Primitive | Trách nhiệm | Thuộc tính chính |
| --- | --- | --- |
| `DeskBackdrop` | mặt bàn tràn viền: gỗ + vignette; vài vật trang trí tĩnh bằng CSS (kẹp, vết cốc) | `children`; `aria-hidden` cho phần trang trí |
| `FolderCover` | bìa hồ sơ: nhãn trên bìa, tiêu đề (Xanh Mono ≥ 18px), tagline (Patrick Hand), vùng nội dung | `label?`, `title`, `tagline?`, `children`, `tabs?: ReactNode` |
| `FolderTabs` | cột tab nhô ra cạnh phải bìa; màn hẹp (< 960 rộng hoặc < 640 cao) chuyển thành hàng dưới bìa | `items: { id, label, onSelect, primary?, disabled?, current? }[]`, `aria-label` |
| `ModalSheet` | `PaperSheet` làm hộp thoại: `role` (`dialog` mặc định, `alertdialog` tùy chọn), `aria-modal`, `aria-labelledby`, nền `scrim`, `Stamp` tùy chọn | `heading`, `role?`, `stamp?`, `onKeyDown?`, `children`, `tilt?` |

Quy tắc chung:

- Tab trong `FolderTabs` là `InkButton` (≥ 44×44), focus ring theo `--lexicon-focus`, `aria-current` cho tab đang chọn; tab `primary` được tô đậm. Thứ tự DOM = thứ tự đọc = thứ tự Tab.
- Font: tiêu đề Xanh Mono ≥ 18px; thân Literata; nhãn nhỏ IBM Plex Mono; ghi chú tay Patrick Hand ≥ 18px.
- Bóng: blur ≤ 6px, alpha ≤ 25% (D-5). Màu đỏ chỉ cho con dấu CASE CLOSED (kết luận); không dùng làm nền, nút hay dấu khuyến nghị.
- Chuyển động: giấy/bìa vào 160–220ms; con dấu 180ms. **Sửa lỗi review phần 1:** class `lexicon-motion-off` hiện không được áp ở đâu. Từ phần này, root của vỏ (`.game-root` hoặc `DeskBackdrop`/`ModalSheet`) gắn `lexicon-motion-off` khi setting giảm chuyển động bật; `prefers-reduced-motion` đã có sẵn. Khi tắt: không animation/transition, không tilt, bìa/thẻ không xếp lệch.
- Focus trap và Esc giữ ở `pause/focusTrap.ts` và `usePauseShortcut`; `ModalSheet` không tự tạo trap mới, chỉ nhận `onKeyDown`.

`PaperPanel` giữ nguyên cho dialogue/evidence/notebook (phần 4–5).

## 6. Các màn trước game

Giữ `titleModel`, stage `title/support/confirm/settings/howto/playing` và luồng `selectedCaseId` của `GameCanvas`.

### 6.1. Chọn hồ sơ (màn đầu sau mỗi lần tải)

`DeskBackdrop` + một chồng thẻ hồ sơ xếp lệch nhẹ (tilt ±1,5°) trên bàn. Mỗi hồ sơ vẫn là một `button` (giữ `.case-card`, tên truy cập chứa tiêu đề case): bìa manila nhỏ, tên Xanh Mono, hàng "Dễ · A2–B1 · Khoảng 25 phút", tóm tắt, bốn số liệu (`selectCaseCards` không đổi). Hồ sơ khuyến nghị có con dấu mực `Stamp` "Dành cho người chơi mới" màu mực nâu (không đỏ, đúng AGENTS §6). AutoFocus vào hồ sơ khuyến nghị. Không có điểm, xếp hạng, đếm giờ.

### 6.2. Tiêu đề

`FolderCover` giữa bàn: nhãn trên bìa là **tên hồ sơ đang chọn** (hiện giờ chưa có), tiêu đề `strings.titleGame`, tagline `strings.titleTagline`. `FolderTabs`: *Tiếp tục điều tra* (chỉ khi có save; tab `primary`), *Vụ án mới* (`primary` khi chưa có save), *Cách điều tra*, *Cài đặt*, *Đổi hồ sơ*. Tab chính autoFocus như hiện nay.

### 6.3. Các bước phụ

- **Mức hỗ trợ:** ba tờ ghi chú trên bìa (Cơ bản/Đang học/Đắm chìm) + "Dùng mặc định"; autoFocus Đang học; giữ `role="dialog"` và tên `supportTitle`.
- **Xác nhận làm lại:** `ModalSheet role="alertdialog"` với `Stamp` trung tính, nút "Bắt đầu lại" và "Hủy"; Hủy là mặc định an toàn (autoFocus). Không dùng "WRONG!", không đỏ báo lỗi.
- **Cài đặt, Cách điều tra:** trang bên trong bìa với tab "Quay lại" (stage `back` như cũ); `SettingsFields` và `HowToInvestigate` dùng lại, chỉ đổi lớp bao.
- **Khôi phục save:** tờ ghi chú giấy ngả trên `DeskBackdrop`, `role="alert"`, hai nút ("Tạo save mới", "Hủy"), lý do lỗi đọc được.

Esc ở bước phụ = Quay lại như hiện tại. Màn hẹp 390×844: bìa chiếm gần hết chiều ngang, tab xuống hàng dưới, không tràn ngang; mục tiêu bấm ≥ 44×44.

## 7. Overlay trên game mờ tối (`ModalSheet`)

Nền `scrim_vignette` trên game đứng yên; giữ khóa input, Esc, focus trap và `aria-modal` hiện có.

- **Tạm dừng:** tờ "TẠM DỪNG"; *Tiếp tục* là mặc định (autoFocus); `InkButton` cho Cài đặt/Cách điều tra; `SettingsFields` trong tờ. Tên hộp thoại `strings.paused`.
- **Briefing:** bản ghi nhớ kiểu công văn từ nội dung `briefing` của case (không hardcode chữ), tiêu đề, bốn dòng có từ vựng click-mới-mở (logic hiện có), con dấu trung tính, nút "Nhận hồ sơ" (autoFocus). Khóa input đến khi nhận; hiển thị lại trong case file như hiện nay.
- **Tổng kết:** CASE CLOSED là `Stamp animate` (180ms, tắt khi giảm chuyển động), giữ `role="status"` trên dòng này; báo cáo từ `buildCaseReport` in trên giấy; nút quay về tiêu đề. Màu đỏ chỉ ở con dấu này. Không điểm số, xếp hạng, đếm giờ.

## 8. Ranh giới kiến trúc (không đổi)

- Không đổi `game-core`, `learning-engine`, save version, Condition/Effect, event bus, store, phím tắt, điều kiện khóa input.
- Text hiển thị lấy từ content/UI strings (`packages/game-content/ui/vi.json` + `schema/ui.ts`); chuỗi mới (nếu có, ví dụ nhãn bìa) thêm vào đó. Không hardcode text case trong React.
- Màn trước game không khởi động Phaser (như hiện nay).
- Giữ tên class mà E2E dùng khi có thể; nếu buộc đổi, cập nhật test trong cùng commit và ghi lý do.

## 9. Kiểm thử và tiêu chí hoàn thành

### 9.1. Test tự động

- `packages/ui`: render, role/`aria`, focus của `DeskBackdrop`, `FolderCover`, `FolderTabs`, `ModalSheet`; `ModalSheet`/`FolderTabs` không tilt và không animation khi `lexicon-motion-off`; tương phản cho cặp màu mới (mực trên `folder_cover`, chữ cream trên `desk_wood`) ≥ 4.5.
- `game-web`: cập nhật test của `TitleScreen`, `CasePicker`, `SupportPicker`, `NewCaseConfirm`, `PauseMenu`, `BriefingMemo`, `CaseSummaryScreen` cho cấu trúc mới (giữ tên nút, role, autoFocus).
- `tools/art-codegen`: test như §4.

### 9.2. E2E và ảnh chụp

- Cập nhật `onboarding`, `viewport-focus`, `hud`, `case-002`, `journey` cho class/cấu trúc mới; không tăng số E2E đỏ so với danh sách có sẵn trong `docs/ai/2026-10-02-ui-foundation-hud-verification.md`.
- Thêm spec mở ảnh chụp (opt-in, `UI_SHOTS_DIR` như `ui-shots.spec.ts`) ở 1920×1080, 1280×720, 760×600, 390×844 cho: chọn hồ sơ, tiêu đề (có/không save), hỏi mức hỗ trợ, xác nhận làm lại, tạm dừng, briefing, tổng kết; kèm kiểm tra không tràn ngang và mục tiêu bấm ≥ 44×44 ở mọi kích thước.
- Ảnh trước/sau lưu tại `docs/ai/playtests/<ngày chạy>-ui-shell/`.

### 9.3. Hiệu năng

Màn trước game không chạy Phaser; đo lại FPS gameplay cùng cách phần 1 (không được giảm > 10% so với cùng điều kiện) và ghi dung lượng PNG mới thêm vào `public/assets/ui`.

### 9.4. Duyệt bằng mắt

Ảnh trước/sau (và đặt cạnh ảnh HUD phần 1+2) trong báo cáo; người dùng duyệt trước khi đánh dấu phase hoàn tất.

### 9.5. Definition of Done

Chạy và dán output: `npm run lint`, `npm run test`, `npm run build`, `npm run format:check`, `npm run typecheck`, `npm run test:e2e`, `npm run memory:check`, và `python -m pytest tools/art-codegen -q`. Một review độc lập toàn nhánh (cleanup listener, focus/aria, guardrail §6). Báo cáo verification: `docs/ai/<ngày>-ui-shell-verification.md`.

## 10. Rủi ro và câu hỏi mở

| Mã | Rủi ro | Xử lý |
| --- | --- | --- |
| R-1 | Đổi cấu trúc DOM làm đỏ E2E boot (nhiều spec đi qua `openWorld`/`passTitle`). | Giữ tên nút/role; chạy `onboarding`, `journey`, `case-002` sau mỗi nhóm màn; helper `journeyHelpers` chỉ đổi khi buộc phải. |
| R-2 | Bìa + tab xuống hàng dưới ở màn hẹp bị tràn hoặc che nút. | Kiểm tra 390×844 và 844×390 trong spec ảnh; tab `flex-wrap`. |
| R-3 | `desk_wood` lát lộ mép lặp ở 1920×1080. | Test lát liền; vignette che bớt; xem ảnh 1920×1080. |
| R-4 | Class motion-off áp ở root làm tắt animation ngoài ý muốn trong game. | Chỉ áp trên root của vỏ (không bọc `GameRoot` đang chơi); test phạm vi. |
| R-5 | `Stamp` mặc định dùng đỏ điều tra (đã nêu ở review phần 1) nên dễ bị dùng sai chỗ. | Thêm biến thể màu mực nâu cho `Stamp` (`tone: 'ink' \| 'red'`, mặc định `ink`); chỉ CASE CLOSED truyền `red`. Test cho cả hai. |

Câu hỏi mở: không còn câu nào chặn việc lập plan.

## 11. Ngoài phạm vi

Hội thoại, modal evidence/listening (phần 4); sổ tay, bảng suy luận, xóa alias `PaperPanel` (phần 5); art nền ngoài (ImageGen, PR-06); audio; thay đổi luồng chọn hồ sơ hay `titleModel`; backend.

## 12. Các phần tiếp theo

1. **Phần 4 — Hội thoại và modal evidence/listening.**
2. **Phần 5 — Sổ tay và bảng suy luận:** thẻ chia mục + bảng ghim, xóa alias `PaperPanel`.

Mỗi phần có spec, plan và verification riêng; chỉ mở khi người dùng yêu cầu.
