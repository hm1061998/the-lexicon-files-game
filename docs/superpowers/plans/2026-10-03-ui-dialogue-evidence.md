# Hội thoại, vật chứng, bài nghe và thẻ từ vựng — Kế hoạch triển khai

> **Dành cho agent thực thi:** BẮT BUỘC dùng `superpowers:executing-plans` (Native) hoặc `superpowers:subagent-driven-development`. Các bước dùng checkbox (`- [ ]`).

**Mục tiêu:** Đưa hội thoại, modal vật chứng, bài nghe và thẻ định nghĩa từ vựng sang ngôn ngữ giấy của phần 1–3, chỉ đổi trình bày.

**Kiến trúc:** Hội thoại thành `PaperSheet` (torn, clip) neo đáy với lựa chọn là tờ ghi chú; vật chứng thành `ModalSheet` (tape) có ảnh dán nghiêng, nhãn "Vật chứng" đỏ mực (hợp lệ theo AGENTS §6); bài nghe là phiếu trong thẻ; thẻ từ vựng dùng lại luật trong luồng của phần 3. Mọi tilt mới đăng ký vào `motion.css` cùng commit.

**Công nghệ:** React, CSS, `packages/ui` (`PaperSheet`, `ModalSheet`, `InkButton`), Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-03-ui-dialogue-evidence-design.md` (đã duyệt 03/10/2026).

## Ràng buộc chung

- Chỉ đổi trình bày: không đổi `game-core`, `learning-engine`, save version, Condition/Effect, event bus; text/ID ở `game-content`; không thêm dependency.
- Giữ nguyên các class mà E2E bám: `.dialogue-panel`, `.dialogue-text`, `.dialogue-tools`, `.dialogue-voice-controls`, `.evidence-modal`, `.evidence-art`, `.listening-task`. Chỉ thêm class mới.
- Giữ nguyên focus trap, trả focus, `aria-modal`, `aria-labelledby`, `autoFocus` của nút Đóng vật chứng, `event.detail > 1` chống double-click ở lựa chọn.
- Đỏ chỉ ở nhãn "Vật chứng" (`.evidence-category`); lựa chọn, bài nghe, hội thoại không đỏ. Không timer, không "WRONG!".
- Mục tiêu bấm ≥44px (trừ `.vocabulary-word` chữ nội dòng); không tràn ngang ở 1280×720, 760×600, 390×844, 844×390; giấy nằm trong màn hoặc cuộn bên trong.
- Mọi tilt/animation mới nằm trong `motion.css` cho cả `lexicon-motion-off` và `prefers-reduced-motion` trong cùng commit, kèm test CSS.
- Ảnh trước chụp từ commit `4cc6802` (code UI chưa đổi so với `e540b54`).

## Review Focus

1. Thẻ từ vựng mở trong hội thoại không che các lựa chọn và không đổi `InvestigationVocabularyPopover` (luật CSS phải phạm vi `.dialogue-panel`, không rò sang màn điều tra).
2. Tilt ±0.5° của lựa chọn không làm focus/viewport-focus lệch ở 760×240 và 844×390.
3. Tờ lời khai và thẻ vật chứng không bị cắt ở màn thấp (844×390); nút Đóng luôn với tới bằng Tab.
4. Motion-off / OS reduced-motion phủ mọi tilt mới (lựa chọn, ảnh vật chứng, tờ).
5. Đỏ chỉ ở nhãn vật chứng; feedback bài nghe sai vẫn trung tính.

---

### Task 0: Baseline, spec chụp ảnh và ảnh trước

**Files:**
- Create: `apps/game-web/e2e/dialogueEvidenceScreens.ts`, `apps/game-web/e2e/ui-dialogue-evidence-shots.spec.ts`
- Create: `docs/ai/2026-10-03-ui-dialogue-evidence-verification.md`, `docs/ai/playtests/2026-10-03-ui-dialogue-evidence/before/*.png`

**Interfaces:**
- Produces: `dialogueEvidenceScreens: readonly Screen[]` (kiểu `Screen` như `shellScreens.ts`: `{ name; reach(page); quietCoach? }`) với bốn màn `dialogue`, `evidence`, `listening`, `vocab-in-dialogue`, tất cả `quietCoach: true`.

- [ ] **Step 1: Tạo `dialogueEvidenceScreens.ts`.** `reach` mỗi màn: `await seedOnboardingSeen(page)` do spec gọi trước (qua `quietCoach`), rồi `openWorld(page)`; `dialogue` dùng `talkToDavid(page)` và chờ `.dialogue-panel`; `evidence` teleport tới `scenePoint('main_office','meeting_minutes')`, bấm `e`, chờ dialog chứa "Meeting Minutes"; `listening` teleport tới `phone_recording`, bấm `e`, chờ "Leo's Phone Recording" và `.listening-task`; `vocab-in-dialogue` là `dialogue` rồi click `.dialogue-text .vocabulary-word` đầu tiên và chờ `.vocabulary-popover`.
- [ ] **Step 2: Tạo spec chụp ảnh opt-in** `ui-dialogue-evidence-shots.spec.ts` theo mẫu `ui-shell-shots.spec.ts`, biến môi trường `UI_DIALOGUE_SHOTS_DIR`, bốn viewport 1920×1080, 1280×720, 760×600, 390×844.
- [ ] **Step 3: Chạy baseline.** `npm run test:e2e -w @lexicon/game-web -- e2e/ui-dialogue-evidence-shots.spec.ts` (không đặt biến → skipped) rồi với `UI_DIALOGUE_SHOTS_DIR=../../docs/ai/playtests/2026-10-03-ui-dialogue-evidence/before`. Expected: 16 ảnh; xem từng ảnh một lần, sửa `reach` nếu sai màn.
- [ ] **Step 4: Ghi baseline vào báo cáo** (đỏ có sẵn = 17 test trong `docs/ai/2026-10-02-ui-shell-verification.md`; pytest đỏ `test_chair_directions`; FPS baseline 12,8 từ báo cáo shell).
- [ ] **Step 5: Commit** `test(e2e): dialogue and evidence screenshot set and baseline images`.

### Task 1: Hội thoại — tờ lời khai và thẻ từ vựng

**Files:**
- Modify: `apps/game-web/src/dialogue/DialogueView.tsx`, `dialogue.css`, `DialogueVoiceControls.tsx` (chỉ nếu cần class), `apps/game-web/src/vocabulary/vocabulary.css`, `packages/ui/src/primitives/motion.css`
- Test: `apps/game-web/src/dialogue/DialogueView.test.tsx`, `apps/game-web/src/title/shellCss.test.ts` (mở rộng, hoặc tạo `dialogueCss.test.ts` cạnh `DialogueView.test.tsx`)

**Interfaces:**
- Consumes: `PaperSheet` (`as`, `edge`, `clip`, `className`), `InkButton`.
- Produces: class `.dialogue-choice` (mỗi lựa chọn), `.dialogue-close` (nút Đóng); `DialogueView` giữ nguyên props.

- [ ] **Step 1: Viết test đỏ** trong `DialogueView.test.tsx`: markup chứa `paper-sheet` và `dialogue-panel`, không chứa `paper-panel`; mỗi lựa chọn có class `dialogue-choice`; nút Đóng có `ink-button dialogue-close`; vẫn có `role="dialog"` + `aria-modal="true"` + `aria-labelledby`. Trong test CSS: `motion.css` phần motion-off và phần OS đều chứa `.dialogue-choice`; `vocabulary.css` có luật `.dialogue-panel .vocabulary-popover` với `position: static` và **không** có luật nút nào trần (`/^\.vocabulary-popover button/m`).
- [ ] **Step 2: Chạy** `npx vitest run apps/game-web/src/dialogue apps/game-web/src/title/shellCss.test.ts`. Expected: FAIL.
- [ ] **Step 3: Sửa `DialogueView.tsx`:** thay `PaperPanel` bằng `<PaperSheet as="div" edge="torn" clip className="dialogue-panel">`; nút Đóng thành `<InkButton className="dialogue-close">`; thêm `className="dialogue-choice"` vào nút lựa chọn (giữ `onClick` và `event.detail > 1`).
- [ ] **Step 4: Sửa `dialogue.css`:** nền overlay nhẹ hơn (`rgba(42,37,33,0.35)`); `.dialogue-choice` là tờ ghi chú (`paper_sheet_fresh.png`, viền mảnh, `rotate: -0.5deg`/`0.5deg` theo `nth-child`, hover/focus `rotate: 0deg`, min-height 44px); bỏ luật `.dialogue-panel button` trần, giữ `:focus-visible` và kiểu voice controls (`.dialogue-voice-controls button` cao ≥44px, bo tròn mực); `max-height` của panel và cuộn bên trong giữ cho `max-height: 720px`.
- [ ] **Step 5: `vocabulary.css`:** thêm `.dialogue-panel .vocabulary-popover:not(.investigation-vocabulary-popover)` với `position: static; margin: 8px 0; width: 100%; box-sizing: border-box; background: var(--lexicon-beige)` và luật nút (khoảng 44px, viền mực, nền be, `:focus-visible`) có phạm vi `.dialogue-panel`.
- [ ] **Step 6: `motion.css`:** thêm `.dialogue-choice` (và `.dialogue-panel`) vào cả khối `.lexicon-motion-off` (transform/rotate/translate/animation none `!important`) lẫn khối `@media (prefers-reduced-motion: reduce)`.
- [ ] **Step 7: Chạy** lại bộ test ở Step 2 và `npx vitest run apps/game-web/src` (toàn game-web). Expected: PASS.
- [ ] **Step 8: Xem bằng mắt** `dialogue` và `vocab-in-dialogue` ở 1280×720 và 390×844 (chạy spec chụp ảnh vào thư mục tạm); kiểm tra thẻ từ vựng không che lựa chọn.
- [ ] **Step 9: Commit** `feat(game-web): witness-statement dialogue sheet with paper-note choices`.

### Task 2: Vật chứng và bài nghe

**Files:**
- Modify: `apps/game-web/src/evidence/EvidenceModal.tsx`, `evidence.css`, `ListeningTaskPanel.tsx` (chỉ class thêm nếu cần), `packages/ui/src/primitives/motion.css`
- Test: `apps/game-web/src/evidence/EvidenceModal.test.tsx`, `ListeningTaskPanel.test.tsx`, test CSS ở Task 1

**Interfaces:**
- Consumes: `ModalSheet` (`heading`, `headingId`, `className`, `overlayClassName`, `dialogRef`).
- Produces: class `.evidence-photo` (khung ảnh bao `img.evidence-art`), `.evidence-category` đỏ mực; `EvidenceModal` giữ props.

- [ ] **Step 1: Viết test đỏ:** `EvidenceModal` markup chứa `modal-sheet` và `evidence-modal`, không `paper-panel`; có `role="dialog"`, `aria-modal`, `aria-labelledby` trỏ vào `h2` tên vật chứng; ảnh nằm trong `.evidence-photo` và vẫn `alt=""`; nút Đóng vẫn có `aria-label` = `strings.close`. `ListeningTaskPanel` vẫn có `fieldset`/`legend`, `role="status"`, không chứa `style` đỏ. Test CSS: `motion.css` chứa `.evidence-photo` ở cả hai khối; `evidence.css` chỉ dùng màu đỏ cho `.evidence-category` (không có `#a4412d`/`--lexicon-focus` ở selector khác ngoài đó).
- [ ] **Step 2: Chạy** `npx vitest run apps/game-web/src/evidence apps/game-web/src/title/shellCss.test.ts`. Expected: FAIL.
- [ ] **Step 3: Sửa `EvidenceModal.tsx`:** bọc bằng `<ModalSheet heading={evidence.name} headingId={headingId} overlayClassName="evidence-overlay" className="evidence-modal" dialogRef={dialogRef}>`; thay nút Đóng bằng `InkButton autoFocus aria-label={strings.close}` đặt ở header; ảnh vào `<span className="evidence-photo">`; bỏ `PaperPanel` và `h2` tay (heading do `ModalSheet` vẽ — giữ `id={headingId}`).
- [ ] **Step 4: Sửa `evidence.css`:** bỏ `.evidence-modal button, a` kiểu hộp; `.evidence-photo` (khung trắng viền mảnh, bóng giấy, `rotate: -1.2deg`, max-width 240px); `.evidence-category` màu `var(--lexicon-focus)` kiểu nhãn; `.listening-task` là phiếu (nền `paper_sheet_fresh`, viền mảnh), điều khiển phát dùng `InkButton`/`ink-button` hoặc CSS tương đương cao ≥44px, đáp án là dòng giấy, transcript là tờ phụ; cuộn bên trong `.evidence-modal` ở màn thấp.
- [ ] **Step 5: `motion.css`:** thêm `.evidence-photo` vào cả hai khối.
- [ ] **Step 6: Chạy** `npx vitest run apps/game-web/src` và E2E `npm run test:e2e -w @lexicon/game-web -- e2e/hud.spec.ts -g "evidence" e2e/listening.spec.ts`. Expected: PASS hoặc chỉ đỏ thuộc danh sách có sẵn (`hud` collecting evidence / reload).
- [ ] **Step 7: Xem bằng mắt** `evidence` và `listening` 1280×720, 760×600, 390×844, 844×390.
- [ ] **Step 8: Commit** `feat(game-web): pinned evidence card and listening slip on a modal sheet`.

### Task 3: E2E guardrail

**Files:**
- Create: `apps/game-web/e2e/ui-dialogue-evidence.spec.ts`

- [ ] **Step 1: Viết spec** lặp qua `dialogueEvidenceScreens` × 4 viewport (1280×720, 760×600, 390×844, 844×390): giấy chính (`.dialogue-panel, .evidence-modal`) nằm trong viewport hoặc cuộn bên trong (cạnh trên/dưới trong màn), không tràn ngang, mọi nút hiện ≥43,5px trừ `.vocabulary-word`; test "đỏ": đếm các phần tử có màu chữ `#A4412D`/`--lexicon-focus` — chỉ `.evidence-category` ở màn `evidence`/`listening`, không phần tử nào ở `dialogue`; test thẻ từ vựng: ở `vocab-in-dialogue` hộp thẻ không giao với bất kỳ `.dialogue-choice` nào; test motion: bật setting giảm chuyển động (qua pause như `case-002.spec.ts` "Shell reduced motion") thì `.dialogue-choice` và `.evidence-photo` có `rotate: none`.
- [ ] **Step 2: Chạy** `npm run test:e2e -w @lexicon/game-web -- e2e/ui-dialogue-evidence.spec.ts`. Expected: PASS; nếu đỏ do lỗi thật, sửa code theo systematic-debugging rồi chạy lại.
- [ ] **Step 3: Commit** `test(e2e): dialogue and evidence guardrails`.

### Task 4: Xác minh, ảnh sau, review, memory

**Files:**
- Modify: `docs/ai/2026-10-03-ui-dialogue-evidence-verification.md`, `docs/ai/MEMORY.md`, `docs/product/2026-10-02-product-review-and-direction.md`
- Create: `docs/ai/playtests/2026-10-03-ui-dialogue-evidence/after/*.png`

- [ ] **Step 1: Chụp ảnh sau** vào `after/` (16 ảnh) và xem lại; ghi bảng trước/sau.
- [ ] **Step 2: Đo FPS** như phần 3 (`fps-probe.spec.ts`), ghi trước/sau.
- [ ] **Step 3: DoD:** `npm run lint`, `test`, `build`, `typecheck`, `format`, `memory:check`, pytest; dán kết quả vào báo cáo.
- [ ] **Step 4: E2E đầy đủ** `npm run test:e2e` (không sửa file trong lúc chạy); so với 17 đỏ có sẵn; đỏ mới do phase này phải sửa.
- [ ] **Step 5: Một review độc lập** (opus) toàn nhánh theo mục Review Focus; sửa Critical/Important bằng RED→GREEN; ghi minor vào ledger.
- [ ] **Step 6: Cập nhật** ghi chú PR-02 trong tài liệu định hướng, `MEMORY.md` (phase `ui-dialogue-evidence`, `status: in_progress` cho tới khi duyệt ảnh, `result_commit`, Next Actions ≤5), chạy `npm run memory:check`.
- [ ] **Step 7: Commit** `docs(ui): dialogue and evidence verification, screenshots and memory`. Không push; chờ người dùng duyệt ảnh.
