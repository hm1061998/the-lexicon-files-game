# Phần 4b — Cảm giác game: hội thoại, bài nghe, hệ thống nút và âm thanh UI

Ngày: 03/10/2026. Trạng thái: **chờ người dùng duyệt spec**. Chưa sửa code.

Phân loại theo `brainstorming`: **architectural** — đổi bố cục hội thoại và bài nghe, thêm trường content `portrait`, nâng settings lên v2, thêm hệ thống âm thanh UI chung, thêm primitive dùng chung và chuyển mọi nút của các màn phần 1–4 sang hệ thống mới. Sau khi spec được duyệt mới chuyển sang `writing-plans`.

Thuộc chương trình làm lại UI: phần 1–3 và phần 4 (`2026-10-03-ui-dialogue-evidence-design.md`) đã xong; người dùng duyệt phần 4 làm bước nền cho phần 4b (03/10/2026). Phần 5 (sổ tay, bảng suy luận) vẫn là spec riêng.

## 1. Mục tiêu và nguồn yêu cầu

Người dùng 03/10/2026: game "vẫn mang hơi hướng web quá, chưa phải một game engine thật sự, các UI hội thoại, nghe bản ghi âm, các nút bấm vào nhìn rất thô". Sau khi xem hai ảnh phác thảo (hội thoại dạng cảnh thẩm vấn, máy ghi âm là vật thể), người dùng chọn đi theo hướng này.

Chẩn đoán: chất liệu đã là giấy, nhưng **ngữ pháp trình bày và phản hồi** vẫn của trang web — thẻ giữa màn hình, hàng ô nút có viền như form, mọi thứ hiện tức thì, bấm không có phản hồi âm thanh hay xúc giác.

Tiêu chí thành công:

1. Hội thoại đọc như một cảnh: camera tiến vào, biết ai đang nói, chữ hiện dần, lựa chọn chọn bằng phím số.
2. Bài nghe thao tác trên một máy ghi âm có phím vật thể và sóng âm thật.
3. Trên mọi màn thuộc phạm vi (§6.2), không còn nút thô: mọi nút thuộc một trong ba loại, có trạng thái hover/nhấn/focus/vô hiệu và âm thanh.
4. Người dùng duyệt ảnh trước/sau; toàn bộ E2E hiện có vẫn pass, hai case chơi hết được.

## 2. Quyết định đã chốt

| Mã | Quyết định | Phương án loại |
| --- | --- | --- |
| G-1 | Hội thoại: dải đáy có chân dung bên trái; phím **L** mở nhật ký hội thoại dạng cột phải. | Chỉ dải đáy; chỉ cột phải kiểu Disco Elysium. |
| G-2 | Chân dung tạm sinh bằng code từ sprite; content khai báo `portrait: { default }` để sau thay bằng ảnh Blender/họa sĩ và thêm biểu cảm không đổi schema. | Chờ chân dung Blender; làm biểu cảm ngay. |
| G-3 | Âm thanh UI lấy từ bộ CC0 có sẵn (ưu tiên Kenney, bổ sung OpenGameArt), kiểm giấy phép từng file. Thiếu âm phù hợp thì báo người dùng, không tự tổng hợp. | Sinh bằng code; kết hợp. |
| G-4 | Hệ thống nút áp dụng cho mọi màn phần 1–4 cộng hội thoại/bài nghe/vật chứng; sổ tay và bảng suy luận để phần 5. | Chỉ hội thoại/bài nghe/vật chứng; gộp phần 5. |
| G-5 | Bàn phím đầy đủ ngay; tay cầm để PR-08, mô hình focus thiết kế sẵn để chỉ cần map phím. | Làm tay cầm trong spec này. |
| G-6 | Không che từ khóa trong lời thoại bài nghe (đổi quy tắc học docs/02 là product rule, ngoài spec). | Che từ khóa đến khi xin gợi ý. |

## 3. Hiện trạng (đối chiếu code tại `abe090d`)

- `DialogueView` là `PaperSheet` torn giữa màn hình, có focus trap; lựa chọn là các nút ghi chú; `DialogueVoiceControls` là một nút phát lại giọng đọc. Lựa chọn tối đa trong content hiện tại: 5.
- `EvidenceModal` là `ModalSheet` với hai tab nút "Chứng cứ"/"Bài nghe của vụ án"; `ListeningTaskPanel` có các nút Phát/Dừng/Phát lại, Gợi ý, Mở lời thoại và các nút đáp án; `transcriptVisibility` quyết định lời thoại theo chế độ dịch và phụ đề; `useAudioPlayback` chưa trả tiến độ phát.
- Âm thanh: `presentationAudio` phát cue `'footstep' | 'paper' | 'ui' | 'evidence' | 'door' | 'dialogue'` theo `case.audio` — case không khai báo `audio` (Case #002) không có âm nào.
- Settings v1: `translationMode`, `volume`, `subtitles`, `reducedMotion`.
- Camera: `cameraFollow` có zoom ưu tiên theo viewport (không phải 1,0).
- 56 thẻ `<button>` thô trong 22 file `.tsx` của `apps/game-web/src`; 11 chỗ đã dùng `InkButton`. `packages/ui` đã có `InkButton`, `PaperSheet`, `ModalSheet`, `FolderTabs`, `DeskBackdrop`, `Stamp`, `KeyHintLine`, `Keycap`.

## 4. Hội thoại

### 4.1. Bố cục

- Dải tối ở đáy, cao khoảng 40% viewport (tối thiểu 260px ở 1280×720), nền gradient mực trong suốt dần lên trên.
- Chân dung bên trái: ảnh dán nghiêng −3°, viền giấy trắng, kẹp giấy, chú thích tên viết tay; cạnh đó tên (Xanh Mono) + chức danh (IBM Plex Mono).
- Lời thoại tiếng Anh Literata 24px (≥ 20px ở màn hẹp), câu dịch nghiêng bên dưới theo `translationMode`; giữ `VocabularyText`.
- Góc phải: ghi chú tay "Ghi chú điều tra" hiển thị lời khai đã ghi của NPC đang nói (nguồn: `notebookStatements` đã ghi, như sổ tay hiện có).
- Khi hội thoại mở: HUD, nhãn NPC và chỉ báo cue ẩn; nhãn góc trên "ĐANG THẨM VẤN · <tên>". Giọng đọc (`DialogueVoiceControls`) chuyển thành `InkButton` trong dải.
- Màn hẹp (D-1 của spec nền): chân dung thu nhỏ đặt cạnh tên; ghi chú tay ẩn; dải được phép cuộn bên trong.

### 4.2. Camera

- Phaser nghe `dialogue:started { npcId }`: tween zoom từ zoom hiện tại lên ×1,2 trong 400ms và đặt tâm ở trung điểm người chơi–NPC (kẹp trong biên camera hiện có). `dialogue:ended`: tween về zoom và chế độ follow trước đó.
- `reducedMotion`: đặt ngay, không tween. React không gọi Phaser; chỉ qua bus hiện có.
- Debug hook `cameraZoom(): number` để E2E kiểm tỉ lệ.

### 4.3. Chữ hiện dần

- Settings v2 thêm `textSpeed: 'instant' | 'normal' | 'fast'` (mặc định `normal` = 45 ký tự/giây; `fast` = 90). Migration v1 → v2 điền mặc định.
- Hàm thuần `revealCount(elapsedMs: number, charsPerSecond: number, length: number): number`.
- Space / E / Enter / click trên dải: lần đầu hiện hết câu, lần sau sang câu tiếp (nếu node chỉ có một lựa chọn "Tiếp") hoặc không làm gì (khi có nhiều lựa chọn).
- Screen reader nhận cả câu ngay (bản đầy đủ trong vùng `aria-live`, bản đang hiện dần `aria-hidden`). Từ vựng gạch chân chỉ tương tác khi đã hiện.
- Không có timer ép trả lời; lựa chọn hiện khi câu đã hiện hết.

### 4.4. Lựa chọn

- Dòng đánh số 1–9 (keycap số + Literata 20px), chọn bằng phím số hoặc chuột; hover/focus vẽ nét gạch mực; chọn phát âm "tích bút".
- "Đã hỏi": hàm thuần `isChoiceSeen(choice, targetNode, flags): boolean` — true khi lựa chọn và node đích có ít nhất một `setFlag` giá trị `true` và mọi flag đó đã `true` trong state. Dòng đã hỏi màu mờ kèm chữ "đã hỏi"; vẫn chọn được.

### 4.5. Nhật ký hội thoại (phím L)

- Cột giấy bên phải (rộng 360–420px), liệt kê các câu đã hiện trong lượt chơi này, nhóm theo NPC, câu mới nhất ở dưới; mở/đóng bằng L, Esc hoặc nút chữ mực.
- Dữ liệu trong store (`dialogueLog: { npcId, nodeId, treeId }[]`), không lưu vào save — save version giữ nguyên; tải lại thì trống.
- Chỉ mở được khi đang hội thoại hoặc ngoài thế giới không có modal khác; L bị bỏ qua khi focus ở ô nhập.

### 4.6. Chân dung

- Content: `npcs.json` thêm trường tùy chọn `portrait: { default: string }` (đường dẫn asset); schema chấp nhận thêm khóa biểu cảm sau này nhưng spec này chỉ dùng `default`.
- `tools/art-codegen/build_portraits.py`: từ `chr_<npc>_idle_sw.png` crop đầu–thân theo bounding box alpha, phóng to, xử lý sepia + nét mực để giấu vỡ hạt, xuất `apps/game-web/public/assets/portraits/<npc>.png` 240×300; seed cố định, test cùng-đầu-vào-cùng-đầu-ra; dòng `PROVENANCE.md`.
- Thiếu `portrait` hoặc ảnh lỗi: thẻ chữ cái đầu tên trên giấy, không lỗi.

## 5. Vật chứng và bài nghe

### 5.1. Vật chứng

- Modal đổi thành cảnh mặt bàn (`DeskBackdrop`): ảnh vật chứng ghim nghiêng bên trái, thẻ mô tả bên phải với nhãn "VẬT CHỨNG" đỏ thẫm `#743026`; hai tab đổi sang `FolderTabs`.
- Mở: trượt lên + xoay về góc trong 220ms; đóng 160ms. Esc / "Đóng" (InkButton); focus trả về như hiện tại.

### 5.2. Máy ghi âm

- Component `CassetteRecorder` (SVG/CSS) trong `apps/game-web/src/evidence/`: cửa sổ hai cuộn băng (quay khi phát, đứng yên khi `reducedMotion`), LCD hiển thị `task.timestamp` và thời gian đã phát, bốn `DeviceKey`: Về đầu, Phát/Dừng, Gợi ý, Lời thoại.
- Sóng âm: script `tools/audio-codegen/build_peaks.mjs` (Node, không dependency) đọc WAV PCM16 và xuất `<file>.peaks.json` (`{ version: 1, bars: number[64] }`, giá trị 0–1) cạnh file âm thanh; lúc chạy chỉ tô cột theo tiến độ. Thiếu file peaks → ẩn sóng.
- `useAudioPlayback` bổ sung `progress: number` (0–1) cập nhật bằng `requestAnimationFrame` khi đang phát.
- Lời thoại: băng giấy dưới máy, giữ nguyên `transcriptVisibility`/`resolveTranscriptBlock` (G-6).
- Câu hỏi: thẻ giấy kẻ dòng; đáp án là mẩu giấy chọn bằng chuột hoặc phím 1–n. Sai → "This interpretation doesn't match the evidence." (chuỗi hiện có), không dấu X đỏ, không phạt. Đúng → `Stamp` "ĐÃ XÁC MINH" (animate, tắt khi `reducedMotion`).
- Gợi ý từ khóa: giấy note vàng (Patrick Hand ≥ 18px).
- Phím tắt khi máy ghi âm mở: Space phát/dừng, R về đầu, H gợi ý, T lời thoại; bỏ qua khi focus ở ô nhập.
- Giữ nguyên `answerListeningTask` và mọi trạng thái tải/lỗi/thử lại hiện có.

## 6. Hệ thống nút, âm thanh UI, con trỏ, chuyển động

### 6.1. Ba loại nút (`packages/ui`)

| Loại | Dùng cho | Hình | Nhấn |
| --- | --- | --- | --- |
| `InkButton` (có sẵn) | thao tác phụ: Đóng, Quay lại, Gợi ý văn bản | chữ mực, gạch chân khi hover/focus | lún 1px |
| `PaperButton` (mới) | thao tác chính: Vụ án mới, Tiếp tục, Xác nhận | mẩu giấy/tab có bóng mềm | lún 2px, bóng ngắn lại |
| `DeviceKey` (mới) | nút vật thể (máy ghi âm, thiết bị sau này) | phím nổi có đế | lún 4px |

- Trạng thái chung: hover nhấc 1px + `--lexicon-shadow-lift`; focus viền 3px như spec nền; vô hiệu mờ 45%, không âm.
- Mỗi primitive gắn `data-sfx` mặc định (`press`, `press`, `device-click`), cho phép ghi đè (`stamp`, `tab`, `pen`…).

### 6.2. Phạm vi chuyển nút (G-4)

Các file trong `apps/game-web/src`: `hud/*`, `title/*`, `pause/*`, `briefing/*`, `conclusion/CaseSummaryScreen.tsx`, `onboarding/*`, `dialogue/*`, `evidence/*`, `vocabulary/*`, `game/GameCanvas.tsx` (thông báo phục hồi), cùng màn Cài đặt. **Không** gồm `notebook/*`, `deduction/*`, `investigation/*`, `conclusion/AccusationPanel.tsx` (phần 5).

Test E2E canh gác: trên các màn thuộc phạm vi, mọi `button` đang hiển thị phải có class `ink-button`, `paper-button`, `device-key` hoặc là phần tử thuộc primitive đã kiểm (`folder-tabs`, `key-hint-line`).

### 6.3. Âm thanh UI (G-3)

- Thư mục `apps/game-web/public/audio/ui/` + `provenance.json` (nguồn, URL, giấy phép, SHA-256, biến đổi) theo mẫu `audio/case-001/provenance.json`.
- Bộ âm: `press`, `paper-open`, `paper-close`, `pen`, `stamp`, `tab`, `device-click`, `tape-loop` (lặp khi phát bản ghi). Định dạng `.ogg`, chuẩn hóa âm lượng.
- Âm thanh UI là **âm chung của game**, không thuộc `case.audio`, nên mọi case đều có.
- `uiSound` trong game-web: một listener `pointerdown`/`keydown` (Enter/Space) ở gốc ứng dụng, đọc `data-sfx` của phần tử nút gần nhất, bỏ qua nút `disabled`/`aria-disabled`; không có âm khi hover. Phát qua cùng factory Howler của `presentationAudio`, theo `volume`.
- Settings v2 thêm `uiSounds: boolean` (mặc định `true`); công tắc trong Cài đặt.

### 6.4. Con trỏ

- `art-codegen` sinh ba con trỏ 32×32 (kính lúp cho canvas thế giới, ngòi bút cho giấy, bàn tay cho nút) với điểm nhấn khai báo trong CSS; fallback `auto`/`pointer`. Dòng `PROVENANCE.md`.

### 6.5. Chuyển động

- Dải hội thoại, nhật ký, modal vật chứng: mở trượt + xoay 220ms, đóng 160ms, phần tử con lần lượt cách 40ms. Tắt hết khi `reducedMotion`/`prefers-reduced-motion`.

## 7. Ranh giới (không đổi)

`game-core`, `learning-engine`, `dialogueRunner`, `answerListeningTask`, save version, Condition/Effect, event bus (chỉ dùng event có sẵn), phím tắt toàn cục J/B/M/Esc, guardrail AGENTS.md §6 (không timer ép, sai không phạt, đỏ đúng chỗ). Text hiển thị mới đi vào UI strings `vi.json` + schema.

## 8. Kiểm thử và tiêu chí hoàn thành

- **Unit:** migration settings v1 → v2; `revealCount`; `isChoiceSeen`; `build_peaks.mjs` cùng đầu vào cùng JSON và đúng 64 cột; `uiSound` (nút vô hiệu im, `uiSounds=false` im, `data-sfx` ghi đè); primitive `PaperButton`/`DeviceKey`; `build_portraits.py` (unittest).
- **E2E:** phím 1–9, Space hiện hết rồi sang câu; L mở/đóng nhật ký; `cameraZoom()` ≈ zoom gốc × 1,2 khi hội thoại và trở lại khi đóng; phím Space/R/H/T của máy ghi âm; test canh gác nút; chơi hết Case #001 và #002; settings v2 lưu/đọc.
- **Ảnh:** trước/sau ở 1920×1080, 1280×720, 760×600, 390×844 cho hội thoại, nhật ký, bài nghe, vật chứng, màn tiêu đề, tạm dừng.
- **Hiệu năng:** FPS (probe hiện có) không giảm quá 10%.
- **Duyệt bằng mắt:** người dùng duyệt ảnh trước khi đánh dấu hoàn tất.
- **DoD:** `npm run lint`, `test`, `build`, `format:check`, `test:e2e`, `memory:check`, test Python của `tools/art-codegen`; báo cáo `docs/ai/2026-10-03-ui-game-feel-verification.md`.

## 9. Rủi ro

| Mã | Rủi ro | Xử lý |
| --- | --- | --- |
| R-1 | Không tìm đủ âm CC0 phù hợp (nhất là tiếng băng chạy). | Báo người dùng danh sách thiếu kèm ứng viên; không tự tổng hợp (G-3). |
| R-2 | Chữ hiện dần làm E2E hiện có (đọc text ngay) bị đỏ. | E2E đặt `textSpeed: 'instant'` qua settings trừ test riêng của tính năng. |
| R-3 | Zoom camera khi hội thoại xung đột với `cameraFollow` và biên scene. | Lưu và khôi phục trạng thái follow; kẹp tâm trong biên; test E2E hai scene. |
| R-4 | Chuyển 56 nút gây sai lệch focus/aria. | Chuyển theo từng màn kèm test focus hiện có; test canh gác. |
| R-5 | Chân dung tạm từ sprite 31×97px vẫn kém. | Xử lý nét mực/sepia; ghi rõ là tạm; trường `portrait` cho phép thay ảnh không sửa code. |

## 10. Ngoài phạm vi

Sổ tay, bảng suy luận, `AccusationPanel` (phần 5); tay cầm (PR-08); biểu cảm chân dung; che từ khóa trong bài nghe (G-6); chân dung Blender (spike riêng sau khi cài MCP).
