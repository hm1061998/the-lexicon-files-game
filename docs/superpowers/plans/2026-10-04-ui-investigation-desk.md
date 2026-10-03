# Sổ tay, bảng suy luận và bảng buộc tội — Kế hoạch triển khai

> **Dành cho agent thực thi:** BẮT BUỘC dùng `superpowers:executing-plans` (Native) hoặc `superpowers:subagent-driven-development`. Các bước dùng checkbox (`- [ ]`).

**Mục tiêu:** Đưa sổ tay (J), bảng suy luận (B) và bảng buộc tội sang ngôn ngữ giấy của phần 1–4b: sổ gáy lò xo có tập giấy, thẻ chia mục kẻ dính, thẻ ghim trên bảng, ba loại nút; xóa alias `PaperPanel`. Chỉ đổi trình bày.

**Kiến trúc:** Hai primitive mới trong `packages/ui` (`PinnedCard`, biến thể của `FolderTabs`) dùng cho cả ba màn. Khung sổ (tập giấy, gáy cong, vòng lò xo) là markup + CSS trong `notebook/`. Điều khiển lật trang `PageControls` đổi markup sang `InkButton` nhưng giữ nguyên engine phân trang. Mọi tilt/animation mới đăng ký vào `motion.css` cùng commit.

**Công nghệ:** React, CSS, `packages/ui`, Vitest, Playwright (không dependency mới).

**Spec:** `docs/superpowers/specs/2026-10-04-ui-investigation-desk-design.md` (đã duyệt 04/10/2026). **Mockup đã duyệt:** `docs/superpowers/mockups/2026-10-04-{notebook,board,accusation}.png` — là đích hình ảnh; ảnh chụp thật phải gần với chúng.

## Ràng buộc chung

- Chỉ đổi trình bày: không đổi `game-core`, `learning-engine`, save, Condition/Effect, event bus, `deductionUiReducer`, `pickContradiction`, **thuật toán phân trang** (`paginateBlocks`, `useMeasuredPages`, `MeasuredPage`, `PageTurnSurface`, `pageFlipAdapter`); text/ID ở `game-content` (thêm UI string vào `vi.json` + `schema/ui.ts` + `shared-types` nếu cần). Không thêm dependency.
- Không cuộn: ở 1280×720, 760×600, 390×844, 1280×540, 844×390 không container nào trong giấy tràn (dùng `expectNoInvestigationScroll` có sẵn trong `e2e/investigationFixture.ts`); mục tiêu bấm ≥44px (`expectComfortableControls`); font ≥14px.
- Giữ nguyên: focus trap, trả focus, `aria-modal`, tên truy cập, phím J/B/Esc, chuyển nguyên tử sổ ↔ bảng, `aria-label` của nút trang (`"<nhãn>: <Trang trước|Trang sau>"`), `aria-current="page"` trên thẻ chia mục (test `hud.spec` bám nó).
- Đỏ chỉ cho evidence, contradiction, selected, objective (AGENTS §6): nhãn "Chứng cứ", thẻ ghim đang chọn, dây đỏ mâu thuẫn. Nút chính (`PaperButton`) không đỏ. Không timer, không "WRONG!"; sai giữ chuỗi `listeningMismatch`/"This interpretation doesn't match the evidence.".
- Tilt/animation mới: thêm selector vào cả khối `.lexicon-motion-off` và `@media (prefers-reduced-motion: reduce)` của `packages/ui/src/primitives/motion.css`, kèm test CSS (mẫu `apps/game-web/src/dialogue/dialogueCss.test.ts`) ngay trong cùng commit.
- Sau mỗi màn chuyển xong: ảnh chụp tạm ở 1280×720 xem bằng mắt, so với mockup.
- Mỗi task một commit; `git add` đường dẫn cụ thể; không push. Báo cáo: `docs/ai/2026-10-04-ui-investigation-desk-verification.md`. Ảnh E2E có thể ghi đè ảnh cũ trong `docs/ai/playtests/2026-10-02-*`: hoàn lại bằng `git checkout -- docs/ai/playtests/2026-10-02-*` trước khi commit.
- Heredoc có dấu nháy trong Bash tool hay lỗi: ghi file bằng công cụ Write.

## Review Focus

1. Số trang của từng mục sổ/bảng không đổi sau khi đổi padding, font, góc gấp (Task 0 ghi bảng "Trang n/N" mỗi mục × viewport; Task 9 so lại).
2. Chuyển J ↔ B giữ focus trong dialog mới và Esc đóng đúng lớp; không còn nút nào ngoài focus trap.
3. 1280×540 và 844×390: hàng thẻ chia mục không đẩy nội dung tràn; thẻ chia mục không che nút trang.
4. Dây nối `DeductionConnections` vẫn đúng vị trí khi thẻ nghiêng (tilt chỉ trên lớp thẻ, không trên khung chứa dây).
5. Đỏ chỉ ở nhãn "Chứng cứ", thẻ đang chọn, dây mâu thuẫn; mọi nút ba loại, không `<button>` thô (ngoài `.vocabulary-word`).

---

### Task 0: Baseline, bộ chụp ảnh và bảng số trang

**Files:**
- Create: `apps/game-web/e2e/investigationScreens.ts`, `apps/game-web/e2e/ui-investigation-shots.spec.ts`, `docs/ai/2026-10-04-ui-investigation-desk-verification.md`, `docs/ai/playtests/2026-10-04-ui-investigation/before/*.png`

**Interfaces:**
- Produces: `investigationScreens: readonly Screen[]` (kiểu `Screen` từ `shellScreens.ts`) gồm `notebook-people`, `notebook-evidence`, `notebook-vocabulary`, `notebook-timeline`, `board-clues`, `board-timeline`, `board-compare`, `board-conclusion`; mỗi `reach` seed trạng thái đầy đủ như `seedFull` của `investigation-acceptance.spec.ts` (tất cả evidence, fact, cờ; vocabulary bật), mở `openWorld`, bấm `j` hoặc `b`, chọn mục bằng nút tên `strings[...]`.

- [ ] **Step 1:** Viết `investigationScreens.ts` (dùng `seedInvestigation`, `strings`, `definition` từ `investigationFixture.ts`; mặt "Kết luận" cần đủ điều kiện để hiện `AccusationPanel`). Viết `ui-investigation-shots.spec.ts` opt-in `UI_INVESTIGATION_SHOTS_DIR`, viewport 1920×1080, 1280×720, 760×600, 390×844, 844×390, 1280×540.
- [ ] **Step 2:** Chạy với thư mục `before/`: `UI_INVESTIGATION_SHOTS_DIR=../../docs/ai/playtests/2026-10-04-ui-investigation/before npm run test:e2e -w @lexicon/game-web -- e2e/ui-investigation-shots.spec.ts`. Expected: 48 ảnh; xem vài ảnh để chắc mỗi màn có nội dung (không phải "Chưa thu thập…").
- [ ] **Step 3:** Ghi vào báo cáo: danh sách E2E đỏ có sẵn (17, xem `2026-10-03-ui-game-feel-verification.md`), pytest đỏ có sẵn, FPS baseline (`FPS_PROBE=1` 3 lần), và **bảng số trang** "Trang n/N" của từng mục sổ/bảng ở 1280×720, 760×600, 390×844, 844×390 (đọc từ `.page-controls`).
- [ ] **Step 4:** Commit `test(e2e): investigation screenshot set and baseline`.

### Task 1: Primitive `PinnedCard` và biến thể `FolderTabs`

**Files:**
- Create: `packages/ui/src/primitives/PinnedCard.tsx`, `pinned-card.css`
- Modify: `packages/ui/src/primitives/FolderTabs.tsx`, `folder-tabs.css`, `motion.css`, `packages/ui/src/index.ts`, `packages/ui/src/primitives/primitives.test.tsx`

**Interfaces:**
- Produces:
  - `PinnedCard(props: { as?: ElementType; pin?: 'pin' | 'tape'; tilt?: number; selected?: boolean; className?: string; children?: ReactNode } & Omit<HTMLAttributes<HTMLElement>, 'className'|'children'>)` — render `PaperSheet` (`edge="clean"`, `tone="fresh"`) với class `pinned-card`, thêm `pinned-card--selected` khi `selected`, một phần tử trang trí `.pinned-card__pin` (đinh) hoặc băng keo; `tilt` kẹp −2..2 như `PaperSheet`.
  - `FolderTabs` thêm hai prop: `variant?: 'folder' | 'book' | 'board'` (mặc định `'folder'`, class `folder-tabs--<variant>`) và `ariaCurrent?: 'page' | 'true'` (mặc định `'true'`); `book` = cột dọc dính mép phải tập giấy, mục `current` nhô ra; `board` = hàng ngang dính cạnh trên bảng, mục `current` nhô lên.
- [ ] **Step 1: Viết test đỏ** trong `primitives.test.tsx`: `PinnedCard` có class `pinned-card`, `pinned-card--selected` chỉ khi `selected`, đinh `.pinned-card__pin` khi `pin="pin"` và băng khi `pin="tape"`, tilt kẹp (`--paper-tilt:2deg` cho 5); `FolderTabs` `variant="book"` có `folder-tabs--book`, `ariaCurrent="page"` cho `aria-current="page"` và mặc định `"true"`. Test CSS: `motion.css` chứa `.pinned-card` trong cả khối motion-off và OS (mẫu `shellCss.test.ts`).
- [ ] **Step 2:** `npx vitest run packages/ui` — FAIL.
- [ ] **Step 3:** Cài đặt `PinnedCard` (CSS: bóng giấy, đinh tròn đỏ sẫm `--lexicon-dark-red` gradient, băng `tape_corner.png`; `selected` nhô 6px và viền 3px `--lexicon-investigation-red`, không glow) và hai prop của `FolderTabs` (CSS biến thể: kích thước, `translate` mục `current`; `book` ở màn hẹp hoặc thấp chuyển thành hàng ngang trên mép trên tập giấy, như ghi chú R-3). Đăng ký `.pinned-card` và `.folder-tabs--book .folder-tab`, `.folder-tabs--board .folder-tab` vào `motion.css` (motion-off và OS).
- [ ] **Step 4:** `npx vitest run packages/ui apps/game-web` — PASS; `npm run typecheck`.
- [ ] **Step 5:** Commit `feat(ui): pinned card and book/board folder tab variants`.

### Task 2: Điều khiển lật trang

**Files:**
- Modify: `apps/game-web/src/investigation/pagination/PageControls.tsx`, `pagination.css`, `apps/game-web/src/investigation/pagination/ChoicePages.tsx`
- Test: `apps/game-web/src/investigation/pagination/PageControls.test.tsx` (tạo mới), `MeasuredPage.test.tsx` giữ xanh

**Interfaces:**
- Consumes: `InkButton` với `sfx`.
- Produces: `PageControls` giữ props `{ index, count, label, strings, onChange }`; markup `nav.page-controls` chứa hai `InkButton` (`‹` sfx `paper-close` với `aria-label` "<nhãn>: Trang trước", `›` sfx `paper-open` "<nhãn>: Trang sau") và `span[aria-live="polite"].page-controls__label` "Trang n/m" (Patrick Hand ≥16px). `ChoicePages` dùng `InkButton` cho lựa chọn.

- [ ] **Step 1: Test đỏ:** `PageControls.test.tsx` (renderToString): hai nút là `ink-button`, `data-sfx` đúng (`paper-close`, `paper-open`), `disabled` ở đầu/cuối, nhãn "Trang 1/3", `aria-label` giữ nguyên dạng; `ChoicePages` không còn `<button` thô.
- [ ] **Step 2:** Chạy — FAIL.
- [ ] **Step 3:** Cài đặt; CSS: hai nút ≥44×44 viết tay (`font-size: 22px`, không gạch chân), nhãn giữa; không đổi chiều cao khối `.page-controls` (giữ để số trang không đổi — Review Focus 1).
- [ ] **Step 4:** Test PASS; chạy `npm run test:e2e -w @lexicon/game-web -- e2e/investigation-pagination.spec.ts` — xanh.
- [ ] **Step 5:** Commit `feat(ui): hand-lettered page turn controls`.

### Task 3: Sổ tay (J) — khung sổ, thẻ chia mục, nút

**Files:**
- Create: `apps/game-web/src/notebook/BookFrame.tsx`, `book-frame.css`
- Modify: `apps/game-web/src/notebook/NotebookPanel.tsx`, `notebook.css`, `NotebookReaderPage.tsx`, `packages/ui/src/primitives/motion.css`
- Test: `apps/game-web/src/notebook/NotebookPanel.test.tsx`, `bookFrameCss.test.ts` (tạo mới)

**Interfaces:**
- Produces: `BookFrame({ children, rightEdge }: { children: ReactNode; rightEdge: ReactNode })` — bao ngoài: bìa tối có đường khâu, hai tập giấy (class `book-leaf book-leaf--left|right`, mỗi tập có bậc thang mép bằng `box-shadow`, bóng tối dần về gáy bằng `::after`), rãnh gáy `.book-crease`, bảy vòng lò xo SVG trang trí `aria-hidden` (`BookBinding`, cùng markup mockup), `rightEdge` đặt dính mép phải tập giấy. `NotebookPanel` bỏ `PaperPanel`: `BookFrame` bao nội dung, `FolderTabs variant="book" ariaCurrent="page"` bốn thẻ làm `rightEdge`, nút đóng `InkButton` (nhãn chữ `strings.close`, `aria-label` giữ) và "Mở bảng suy luận" `PaperButton`. Ảnh vật chứng ghim băng trên trang phải dùng `PinnedCard pin="tape"`.

- [ ] **Step 1: Test đỏ:** `NotebookPanel.test.tsx`: markup có `book-leaf--left`/`--right`, `book-crease`, 7 `.book-coil`, `folder-tabs--book` với `aria-current="page"` đúng một thẻ, không `paper-panel`, nút đóng `ink-button` và nút mở bảng `paper-button`, `role="dialog"` + `aria-modal` + `aria-labelledby` giữ. `bookFrameCss.test.ts`: `motion.css` chứa `.book-leaf`/`.notebook-overlay` mở 220ms bị tắt ở cả hai khối; `book-frame.css` không có `overflow-y: auto|scroll` ở lá giấy.
- [ ] **Step 2:** `npx vitest run apps/game-web/src/notebook` — FAIL.
- [ ] **Step 3:** Cài đặt `BookFrame` theo mockup (vòng SVG, bậc thang mép, bóng gáy); mở sổ trượt lên + xoay 220ms (`notebook-overlay`); `NotebookReaderPage`: `notebook-index-card` → `PaperButton`, `notebook-back-contents` → `InkButton`, nút còn lại → `InkButton`; dọn luật `.paper-panel` trong `notebook.css`. Giữ kích thước vùng nội dung để số trang không đổi.
- [ ] **Step 4:** Test PASS + `npm run typecheck`. Chụp ảnh tạm 1280×720 (`ui-investigation-shots.spec.ts` với `-g "notebook"`), xem bằng mắt so với mockup. Chạy `e2e/hud.spec.ts -g "notebook"`, `e2e/notebook-people.spec.ts`, `e2e/investigation-pagination.spec.ts`, `e2e/viewport-focus.spec.ts` — chỉ đỏ trong danh sách có sẵn.
- [ ] **Step 5:** Commit `feat(ui): spiral notebook with stacked leaves and index tabs`.

### Task 4: Bảng suy luận (B) — khung bảng, thẻ chia mặt, thẻ ghim

**Files:**
- Modify: `apps/game-web/src/deduction/DeductionBoard.tsx`, `DeductionCluesFace.tsx`, `TimelineWorkspace.tsx`, `ContradictionWorkspace.tsx`, `deduction.css`
- Test: `apps/game-web/src/deduction/DeductionBoard.test.tsx`, `deductionCss.test.ts` (tạo mới)

**Interfaces:**
- Consumes: `PinnedCard`, `FolderTabs variant="board" ariaCurrent="page"`, `InkButton`, `PaperButton`.
- Produces: header là dải giấy ghim kẹp (`PaperSheet edge="torn" clip`), bốn mặt là `FolderTabs` hàng ngang dính cạnh trên bảng (mặt mở nhô lên); "Hồ sơ vụ việc / Liên hệ nguồn" là hai `InkButton` có `aria-pressed`; `deduction-card` (mỗi mảnh thông tin) là `PinnedCard` (tilt ±0.6 xen kẽ, `selected` cho thẻ đang chọn, `pin="pin"`); nút thao tác trong ba workspace là `InkButton`, hành động chính (`workspace-submit`, nút gửi đối chiếu) là `PaperButton`. Không đổi `deductionUiReducer`, `DeductionConnections`.

- [ ] **Step 1: Test đỏ:** `DeductionBoard.test.tsx`: `folder-tabs--board` với đúng một `aria-current="page"`; không `<button` thô trong markup ba mặt (regex `<button(?![^>]*class="[^"]*(ink-button|paper-button|device-key|folder-tab|vocabulary-word))`); `deduction-card` là `pinned-card`. `deductionCss.test.ts`: `motion.css` có `.deduction-card`/`.pinned-card` ở hai khối; `deduction.css` không có tilt trên `.deduction-surface`/khung dây nối (Review Focus 4).
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Cài đặt; giữ nguyên cấu trúc khung chứa dây (`DeductionConnections`) và chỉ nghiêng lớp thẻ; mở bảng 220ms. Đỏ chỉ ở `selected`, dây mâu thuẫn.
- [ ] **Step 4:** Test PASS; ảnh tạm 1280×720 bốn mặt so với mockup; chạy `e2e/notebook-deduction.spec.ts`, `e2e/timeline.spec.ts`, `e2e/investigation-acceptance.spec.ts`, `e2e/viewport-focus.spec.ts` — chỉ đỏ có sẵn.
- [ ] **Step 5:** Commit `feat(ui): pinboard deduction board with pinned cards and tabs`.

### Task 5: Bảng buộc tội (mặt "Kết luận")

**Files:**
- Modify: `apps/game-web/src/conclusion/AccusationPanel.tsx`, `conclusion.css`, `apps/game-web/src/deduction/DeductionBoard.tsx` (truyền chân dung), `apps/game-web/src/conclusion/AccusationPanel.test.tsx`

**Interfaces:**
- Produces: `AccusationPanel` thêm prop tùy chọn `portraits?: Readonly<Record<string, string>>` (id nghi phạm → đường dẫn từ `npc.portrait.default`); mỗi nghi phạm là `PinnedCard` có `Portrait`-style ảnh (dùng thẻ chữ cái đầu nếu thiếu), `selected` khi chọn (`aria-pressed` giữ), "Buộc tội" là `PaperButton` (vô hiệu khi chưa chọn), "Xóa phản hồi" `InkButton`; dòng phản hồi `role="status"` giữ chuỗi hiện có.

- [ ] **Step 1: Test đỏ:** markup có `pinned-card` cho từng nghi phạm, `pinned-card--selected` đúng một khi chọn, nút gửi là `paper-button`, `<img ... alt="">` khi có `portraits`, thẻ chữ cái đầu khi thiếu; hợp đồng props cũ không đổi.
- [ ] **Step 2:** FAIL; **Step 3:** cài đặt, `DeductionBoard` đọc `caseDefinition.npcs[].portrait?.default`.
- [ ] **Step 4:** Test PASS; `e2e/journey.spec.ts` + `e2e/case-002.spec.ts` (đóng vụ án) xanh; ảnh tạm so với mockup.
- [ ] **Step 5:** Commit `feat(ui): suspect pin cards and a paper accuse button`.

### Task 6: Thẻ từ vựng lớp đọc, xóa `PaperPanel`, canh gác nút

**Files:**
- Modify: `apps/game-web/src/vocabulary/InvestigationVocabularyPopover.tsx`, `packages/ui/src/primitives/PaperPanel.tsx` (xóa), `packages/ui/src/index.ts`, `packages/ui/src/primitives/primitives.test.tsx`, `form-controls.css`, `apps/game-web/e2e/button-guard.spec.ts`
- Create: `apps/game-web/e2e/ui-investigation.spec.ts`

- [ ] **Step 1: Mở rộng `button-guard.spec.ts`** thêm các màn `investigationScreens` (8 màn) — chạy: FAIL nếu còn nút thô. Viết `ui-investigation.spec.ts`: mỗi màn × 5 viewport (1280×720, 760×600, 390×844, 1280×540, 844×390) dùng `expectNoInvestigationScroll` và `expectComfortableControls`; đếm chữ/viền đỏ trong dialog chỉ ở `.evidence-category`-tương đương, `pinned-card--selected`, dây mâu thuẫn; giảm chuyển động (OS) làm `rotate: none` cho `.pinned-card`.
- [ ] **Step 2:** `InvestigationVocabularyPopover`: "Hiện bản dịch" và Đóng → `InkButton` (giữ class `investigation-vocabulary-close`).
- [ ] **Step 3:** Xóa `PaperPanel` (file, export, test, mọi `paper-panel` trong CSS); `form-controls.css` đổi `:is(.paper-panel, …)` thành `:is(.modal-sheet, .folder-cover, .book-leaf, .deduction-board)` và dọn luật `.paper-panel button:hover`; kiểm Cài đặt vẫn đúng kiểu (ảnh tạm màn Cài đặt). `grep -rn "PaperPanel\|paper-panel" apps packages --include=*.ts --include=*.tsx --include=*.css | grep -v dist` phải rỗng.
- [ ] **Step 4:** Chạy `button-guard`, `ui-investigation`, `ui-shell`, `onboarding`, `settings` — chỉ đỏ có sẵn; `npm run lint`, `typecheck`, `test`.
- [ ] **Step 5:** Commit `feat(ui): ink buttons in the reading layer, remove PaperPanel, extend the button guard`.

### Task 7: Xác minh, ảnh sau, review, memory

- [ ] **Step 1:** Chụp ảnh sau vào `docs/ai/playtests/2026-10-04-ui-investigation/after/` (48 ảnh) và so với mockup; ghi bảng trước/sau.
- [ ] **Step 2:** **So bảng số trang** với baseline Task 0 (Review Focus 1); khác biệt phải được giải thích hoặc sửa. `FPS_PROBE=1` 3 lần so baseline cùng điều kiện (ngưỡng 10%).
- [ ] **Step 3:** DoD, dán kết quả: `npm run lint`, `test`, `build`, `typecheck`, `prettier --check .`, `memory:check`, pytest, E2E đầy đủ so với 17 đỏ có sẵn (chạy một mình, không sửa file trong lúc chạy; ~55 phút).
- [ ] **Step 4:** Một review độc lập toàn nhánh (opus, `requesting-code-review`) theo Review Focus; sửa Critical/Important bằng RED→GREEN, ghi Minor vào ledger.
- [ ] **Step 5:** Cập nhật `apps/game-web/AGENTS.md` (dòng nút: bỏ chú thích "sổ tay… chờ phần 5"), `MEMORY.md` (phase `ui-investigation-desk`, `result_commit`, Next Actions ≤5), ghi chú PR-02 trong tài liệu định hướng; `npm run memory:check`. Commit `docs(ui): investigation desk verification, screenshots and memory`. Không push; chờ người dùng duyệt ảnh.
