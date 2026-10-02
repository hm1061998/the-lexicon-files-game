# Hội thoại, vật chứng, bài nghe và thẻ từ vựng

Ngày: 03/10/2026. Trạng thái: **chờ duyệt**. Plan: chưa viết. Chưa sửa code.

Phân loại theo `brainstorming`: **architectural** — đổi cách trình bày của ba màn trong lúc chơi và dùng lại primitive `packages/ui`. Sau khi spec được duyệt mới chuyển sang `writing-plans`.

Đây là **phần 4** của chương trình làm lại UI (xem `docs/superpowers/specs/2026-10-02-ui-foundation-hud-design.md` §12 và `2026-10-02-ui-shell-design.md`). Phần 1–3 (nền vật liệu, HUD, vỏ ngoài game) đã hoàn tất, được duyệt và đã push.

## 1. Mục tiêu và nguồn yêu cầu

Hội thoại và modal vật chứng phải cùng ngôn ngữ "hồ sơ trinh thám trên giấy" với HUD và shell. Chỉ đổi trình bày; logic, store, phím tắt, text và ID trong content giữ nguyên.

Tiêu chí thành công:

1. Ảnh chụp các màn mới đặt cạnh ảnh HUD/shell trông cùng một game; người dùng duyệt bằng mắt.
2. Hội thoại, vật chứng và bài nghe không còn dùng `PaperPanel`, không còn nút hộp be kiểu web, không còn viền 1–2px kiểu panel.
3. Mọi luồng hiện có vẫn chạy: chọn lựa chọn hội thoại, giọng đọc, từ vựng click-mới-mở, đóng bằng nút/Esc, nghe và trả lời bài nghe, transcript.
4. Không thêm dependency; không đổi `game-core`, `learning-engine`, save version, Condition/Effect, event bus.

Nguồn (người dùng, 03/10/2026): tiếp phần 4; hội thoại là **tờ lời khai ghim dưới đáy**; vật chứng là **tấm thẻ vật chứng ghim kẹp**; phạm vi gồm hội thoại, modal vật chứng, bài nghe và thẻ định nghĩa từ vựng ở hội thoại. Thiết kế đã được duyệt bằng lời trong hội thoại trước khi viết spec này.

Liên quan: `AGENTS.md` §6, `apps/game-web/AGENTS.md`, spec phần 3 (§2 `ModalSheet`, motion switch).

## 2. Hiện trạng (đối chiếu code tại `e540b54`)

| Màn | File | Ghi chú |
| --- | --- | --- |
| Hội thoại | `dialogue/DialogueView.tsx`, `dialogue.css`, `DialogueVoiceControls.tsx` | `PaperPanel as="div"` `.dialogue-panel` neo đáy; tự trap Tab (`getFocusTrapTarget`) và trả focus; lựa chọn là nút hộp be |
| Vật chứng | `evidence/EvidenceModal.tsx`, `evidence.css` | `PaperPanel` `.evidence-modal`; ảnh `.evidence-art` 240px; nút Đóng `autoFocus`; trap Tab riêng |
| Bài nghe | `evidence/ListeningTaskPanel.tsx` | `section.listening-task`: timestamp, điều khiển phát, hỗ trợ phụ đề, `fieldset` radio, feedback `role="status"`, transcript |
| Thẻ từ vựng | `vocabulary/VocabularyText.tsx`, `vocabulary.css` | Popover `.vocabulary-popover` (mặc định) trong hội thoại/vật chứng; bản sửa phần 3 chỉ áp trong `.modal-sheet` |

E2E đang bám các class: `.dialogue-panel`, `.dialogue-text`, `.dialogue-tools`, `.dialogue-voice-controls`, `.evidence-modal`, `.evidence-art`, `.listening-task`. Các class này **giữ nguyên** (thêm class mới, không đổi tên).

## 3. Thiết kế

### 3.1 Hội thoại — tờ lời khai dưới đáy

- Bỏ `PaperPanel`; dùng `PaperSheet` (`edge="torn"`, `clip`) neo đáy màn, rộng `min(760px, 100%)`. Giữ `div.dialogue-panel` làm phần tử ngoài để E2E không đổi.
- Lớp nền `.dialogue-overlay` nhẹ hơn (cảnh phía sau còn thấy), vẫn chặn click xuống thế giới.
- Header: nhãn `strings.dialogue` kiểu nhãn hồ sơ, `h2` tên người nói, dòng vai trò; nút Đóng là `InkButton` nhỏ.
- Lời thoại (`.dialogue-text`, `lang="en"`, `tabIndex=-1`, nhận focus khi đổi node) giữ nguyên cấu trúc; chỉ đổi kiểu chữ/đường kẻ.
- Lựa chọn: mỗi nút là một tờ ghi chú giấy nhỏ (`paper_sheet_fresh`), nghiêng ±0.5° xen kẽ, hover/focus thẳng lại; bản dịch Beginner là dòng chữ nhỏ bên dưới. Giữ chống double-click (`event.detail > 1`). **Không dùng màu đỏ.**
- `DialogueVoiceControls`: nút mực nhỏ, cao ≥44px.
- Màn thấp (`max-height: 720px`): tờ nằm giữa như hiện tại, tự cuộn trong tờ.

### 3.2 Vật chứng — tấm thẻ ghim kẹp

- Dùng `ModalSheet` (heading = tên vật chứng, `role="dialog"`, `aria-modal`, `tape`) thay `PaperPanel`; `div.evidence-modal` giữ làm class ngoài. `autoFocus` của nút Đóng giữ nguyên; trap Tab và trả focus giữ logic hiện tại.
- Ảnh `.evidence-art`: khung ảnh trắng viền mỏng + bóng giấy, nghiêng nhẹ, `alt=""` như hiện tại và vẫn ẩn khi ảnh lỗi.
- Nhãn "Vật chứng" (`strings.evidence`) dùng **đỏ mực** (`--lexicon-focus`/`#A4412D`) — hợp lệ theo `AGENTS` §6 vì đó là evidence. Không dùng đỏ ở chỗ khác.
- Mô tả có từ vựng như hiện tại.

### 3.3 Bài nghe

- Phiếu đính kèm trong thẻ: timestamp kiểu nhãn, điều khiển phát là `InkButton`, hỗ trợ phụ đề là dòng chữ nhỏ; đáp án là các dòng giấy trong `fieldset` (vẫn `radio`, `legend` giữ); transcript là tờ giấy phụ.
- Feedback sai giữ lời trung tính "This interpretation doesn't match the evidence." kiểu hiện có; không đỏ lớn, không "WRONG!", không timer.

### 3.4 Thẻ định nghĩa từ vựng ở hội thoại

- Mở rộng luật phần 3 từ `.modal-sheet` sang `.dialogue-panel` (cùng kiểu: trong luồng, nút mực, nền be). Thẻ trong tờ lời khai đẩy các dòng bên dưới xuống, không che lựa chọn. Không đổi `InvestigationVocabularyPopover`.

### 3.5 Chuyển động và trợ năng

- Mọi tilt/animation mới (tờ lời khai, tờ ghi chú lựa chọn, ảnh vật chứng) nằm trong danh sách của `motion.css` cho cả `lexicon-motion-off` và `prefers-reduced-motion` **ngay trong cùng commit** (bài học review phần 3), kèm test CSS như `shellCss.test.ts`.
- Giữ: focus trap, trả focus, `aria-modal`, tên truy cập, mục tiêu ≥44px, không tràn ngang ở 1280×720, 760×600, 390×844, 844×390; giấy nằm trong màn hoặc cuộn bên trong.

## 4. Kiểm chứng

- Test đơn vị: cấu trúc `DialogueView`/`EvidenceModal`/`ListeningTaskPanel` (class giữ nguyên, lựa chọn, focus), test CSS motion và luật thẻ từ vựng.
- E2E mới `ui-dialogue-evidence.spec.ts`: hội thoại, vật chứng ảnh, vật chứng bài nghe, thẻ từ vựng mở trong hội thoại — fit 4 viewport, mục tiêu ≥44px, đếm đỏ (chỉ nhãn vật chứng), thẻ từ vựng không che lựa chọn.
- Ảnh trước/sau (`docs/ai/playtests/2026-10-03-ui-dialogue-evidence/{before,after}/`, 4 kích thước) chụp bằng spec opt-in; "trước" chụp từ commit `e540b54`.
- FPS: không đổi dự kiến (không đụng Phaser), đo lại để ghi.
- Definition of Done: `lint`, `test`, `build`, `typecheck`, `format`, `memory:check`; E2E đầy đủ so với danh sách đỏ có sẵn (17); một review độc lập cuối.

## 5. Ngoài phạm vi

Sổ tay và bảng suy luận, xóa alias `PaperPanel` (phần 5); art nhân vật/scene; audio; đổi luồng hội thoại hay nội dung case; `InvestigationVocabularyPopover`; backend.

## 6. Rủi ro

- R-1: nghiêng ±0.5° làm lệch focus trong vùng cuộn (đã gặp ở phần 3) → tilt chỉ ở tờ ghi chú nhỏ, test viewport-focus chạy lại.
- R-2: tờ lời khai neo đáy cao hơn màn thấp → cuộn bên trong, test 844×390.
- R-3: bài nghe dài trong thẻ → thẻ cuộn bên trong, nút Đóng luôn với tới bằng Tab.
