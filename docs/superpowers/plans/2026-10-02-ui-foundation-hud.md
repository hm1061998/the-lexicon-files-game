# Nền vật liệu UI, HUD và chỉ dẫn trong thế giới — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay HUD kiểu web bằng HUD vật liệu giấy theo concept, làm vật chứng và cổng dịch chuyển dễ thấy, trên nền font và texture đóng gói sẵn.

**Architecture:** Nền vật liệu nằm ở `packages/ui` (token, font, primitive thuần React/CSS) và `tools/art-codegen` (PNG sinh bằng code). HUD React chỉ đổi phần trình bày, giữ store/bus/phím tắt. Phần Phaser (nhãn NPC, cue vật chứng, cổng) dùng hàm thuần trong `game/systems` để test không cần Phaser; React đưa vùng HUD cần tránh cho Phaser qua store.

**Tech Stack:** TypeScript strict, React 18, Phaser 3.88, Zustand, Vitest, Playwright; Python (numpy + Pillow, unittest) trong `.venv-art-codegen`; `@fontsource` 5.3.x; npm + Nx.

**Spec:** `docs/superpowers/specs/2026-10-02-ui-foundation-hud-design.md` (đã duyệt 02/10/2026).

## Global Constraints

- Chỉ npm + Nx; thêm dependency bằng `npm install <pkg> -w @lexicon/ui`. Node 22 theo `docs/ai/MEMORY.md` (`NX_DAEMON=false`, runtime riêng nếu wrapper lỗi).
- Dependency mới duy nhất được phép: `@fontsource/xanh-mono`, `@fontsource/ibm-plex-mono`, `@fontsource/literata`, `@fontsource/patrick-hand` (D-3). Không thêm thư viện animation hay UI.
- Chỉ import subset `latin`, `latin-ext`, `vietnamese`; weight: Xanh Mono 400, IBM Plex Mono 500, Literata 400 + 600, Patrick Hand 400.
- Xanh Mono không dùng dưới 18px; chữ tối thiểu 14px; lời thoại/mục tiêu ≥ 18px.
- Bóng: blur ≤ 6px, alpha ≤ 25% (D-5). Focus: viền 3px `--lexicon-dark-red`, offset 3px.
- Chuyển động: giấy vào 160–220ms, gạch mực 300ms, con dấu/số nảy 180ms; không rung, không nhấp nháy; tắt hết khi `reducedMotion` (setting) hoặc `prefers-reduced-motion`.
- Marker vật chứng: không glow, nổi 4px, chu kỳ 1000ms. Chỉ cổng có lớp sáng `ADD` alpha ≤ 0,35, bán kính ≤ 1,2 ô; không post-process bloom, không viền neon (D-6).
- Đỏ `#A4412D`/`#743026` chỉ cho clue/evidence/objective/contradiction/selected node/map marker (AGENTS.md §6).
- Không đổi `game-core`, `learning-engine`, save version, Condition/Effect, event bus, phím tắt, điều kiện khóa input. React không gọi Phaser; Phaser không đọc DOM.
- Text hiển thị lấy từ content/UI strings. Giữ class E2E dùng: `.hud-objective-panel`, `.hud-panel-launcher`, `.hud-case-progress`, `.hud-case-badge`, `.hud-case-progress-count`, `.hud-minimap`, `.hud-key-hints`, `.hud-interaction-prompt`, `.coach-note`.
- Mỗi task một commit nhỏ; `git add` đường dẫn cụ thể; giữ `apps/game-web/debug.log` untracked; không push.
- Spec/plan/báo cáo bằng tiếng Việt. Báo cáo verification: `docs/ai/2026-10-02-ui-foundation-hud-verification.md` (tạo ở Task 0).

## Review Focus

1. Font chưa tải xong (mạng chậm, file thiếu): Phaser vẫn boot sau tối đa 3 giây bằng fallback, không treo màn hình đen. (Task 1)
2. Người chơi đứng trong bán kính nhãn của hai NPC cùng lúc: cả hai nhãn hiện, không chồng lên prompt tương tác. (Task 6)
3. Vật chứng nằm sau khối HUD hoặc ngay mép màn hình: chỉ báo ngoài màn hình không bị che bởi mục tiêu/bản đồ/dòng phím, và không hiện khi vật đã nằm trong khung hình. (Task 7)
4. Người chơi vừa qua cổng xuất hiện ngay trước cổng bên kia: không tự kích hoạt lại cổng, prompt không nhấp nháy. (Task 8)
5. Màn hẹp 390×844 và 844×390: dòng phím chỉ còn phím, không tràn ngang, các mục vẫn bấm được và có tên cho screen reader. (Task 5)

---

## Định danh chung

| Loại | Giá trị |
| --- | --- |
| Token font | `--lexicon-font-display` (Xanh Mono), `--lexicon-font-label` (IBM Plex Mono), `--lexicon-font-body` (Literata), `--lexicon-font-hand` (Patrick Hand); `--lexicon-font-mono` = `var(--lexicon-font-label)` |
| Token khác | `--lexicon-shadow-paper: 0 3px 6px rgb(42 37 33 / 25%)`, `--lexicon-shadow-lift: 0 5px 6px rgb(42 37 33 / 22%)`, `--lexicon-focus: 3px solid var(--lexicon-dark-red)` |
| TS (`packages/ui/src/theme/fonts.ts`) | `export const FONT_FAMILIES = { display: 'Xanh Mono', label: 'IBM Plex Mono', body: 'Literata', hand: 'Patrick Hand' } as const` |
| Asset UI | `apps/game-web/public/assets/ui/` (tên file theo spec §4.2) |
| Slice 9-slice (px) | `paper_torn_frame.png` 48; `index_tab_frame.png` 24; `keycap_plate.png` 10 |
| Asset world | `apps/game-web/public/assets/ui/world/evidence_ripple.png` (128×64), `portal_arch_ne.png`, `portal_arch_nw.png` (256×320, origin chân vòm), `portal_veil_ne.png`, `portal_veil_nw.png` (spritesheet 10 frame 128×192) |
| Texture key Phaser | `tex_evidence_ripple`, `tex_portal_arch_ne`, `tex_portal_arch_nw`, `sheet_portal_veil_ne`, `sheet_portal_veil_nw` |
| Store mới | `hudInsets: { top: number; right: number; bottom: number; left: number }` + `setHudInsets(insets)` trong `gameStore` |
| Option `createGame` mới | `hudInsets?: () => HudInsets` |
| Debug hook mới (`window.__lexiconDebug`) | `nameplateVisible(id): boolean`, `offscreenCueIds(): string[]`, `portalFacing(id): 'ne' \| 'nw' \| 'ne-flip' \| 'nw-flip'` |
| Python | `.venv-art-codegen` (Windows: `.venv-art-codegen/Scripts/python`), test: `python -m pytest tools/art-codegen -q` |

---

### Task 0: Baseline, nguồn dải giấy phía trên, công cụ đo

**Files:**
- Create: `apps/game-web/e2e/ui-shots.spec.ts`, `apps/game-web/e2e/fps-probe.spec.ts`
- Create: `docs/ai/2026-10-02-ui-foundation-hud-verification.md`

**Interfaces:**
- Produces: hai spec chạy có điều kiện. `ui-shots.spec.ts` chỉ chạy khi `UI_SHOTS_DIR` được đặt, chụp 5 tình huống (vào game; đứng gần `meeting_minutes` hoặc vật chứng đầu tiên của case-001; đứng gần `hallway_door`; quay camera để một vật chứng nằm ngoài khung; ngay sau khi đổi mục tiêu) ở 1920×1080, 1280×720, 760×600, 390×844, tên `<tình-huống>-<w>x<h>.png`. `fps-probe.spec.ts` chỉ chạy khi `FPS_PROBE=1`, launch với `--use-gl=swiftshader`, đứng yên trong `main_office` 5 giây, đếm `requestAnimationFrame`, ghi `{ fps, runs: [..3] }` vào stdout.

- [ ] **Step 1:** Chạy `npm run lint`, `npm run test`, `npm run build`, `npm run test:e2e`; ghi danh sách test fail sẵn có vào báo cáo (mục "Baseline").
- [ ] **Step 2:** Viết hai spec trên (dùng `openWorld`, `worldClick`, `scenePoint` từ `journeyHelpers`/`sceneTestData`). Xác nhận chúng bị skip khi không đặt biến môi trường.
- [ ] **Step 3:** Chạy `UI_SHOTS_DIR=docs/ai/playtests/2026-10-02-ui-foundation-hud/before npx playwright test e2e/ui-shots.spec.ts` (qua `scripts/run-e2e.mjs` nếu cần server) và `FPS_PROBE=1` ba lần; ghi FPS baseline vào báo cáo.
- [ ] **Step 4:** Xác định nguồn dải giấy phía trên ở 1280×720 (tắt lần lượt `.hud`, `.game-paper-overlay`, đọc `camera.worldView` và `screenBounds` qua debug). Ghi kết luận vào báo cáo: `UI` (sửa ở Task 5) hoặc `scene/camera` (chỉ ghi, đề xuất spec riêng).
- [ ] **Step 5:** Commit `test(e2e): add opt-in UI screenshot and FPS probes; record UI baseline`.

### Task 1: Font đóng gói và token

**Files:**
- Modify: `packages/ui/package.json`, `package-lock.json`, `packages/ui/src/theme/palette.css`, `packages/ui/src/theme/palette.test.ts`, `packages/ui/src/index.ts`
- Create: `packages/ui/src/theme/fonts.css`, `packages/ui/src/theme/fonts.ts`, `packages/ui/src/theme/fonts.test.ts`
- Create: `apps/game-web/src/game/fontReady.ts`, `apps/game-web/src/game/fontReady.test.ts`
- Modify: `apps/game-web/src/game/constants.ts` (`LABEL_FONT_FAMILY`), `apps/game-web/src/game/GameCanvas.tsx` (chờ font trước `createGame`), `apps/game-web/src/main.tsx` (import `@lexicon/ui/fonts.css` hoặc qua `palette.css`), `assets/PROVENANCE.md`

**Interfaces:**
- Produces: token ở "Định danh chung"; `FONT_FAMILIES`; `waitForFonts(fontSet: Pick<FontFaceSet, 'load'>, specs: readonly string[], timeoutMs: number): Promise<'loaded' | 'timeout'>`; `LABEL_FONT_FAMILY = '"IBM Plex Mono", ui-monospace, monospace'`.

- [ ] **Step 1: Test đỏ** — `fonts.test.ts`: `fonts.css` có đúng 15 dòng `@import '@fontsource/<family>/<subset>-<weight>.css'` cho (xanh-mono 400, ibm-plex-mono 500, literata 400, literata 600, patrick-hand 400) × (latin, latin-ext, vietnamese); không có import subset khác. `palette.test.ts`: thay assert Cambria bằng assert bốn token font, `--lexicon-font-mono: var(--lexicon-font-label)`, hai token bóng và `--lexicon-focus`. `fontReady.test.ts`: `load` resolve → `'loaded'`; `load` không bao giờ resolve → `'timeout'` sau `timeoutMs` (fake timers); `load` reject → `'timeout'`, không ném lỗi.
- [ ] **Step 2:** Chạy `npx vitest run packages/ui apps/game-web/src/game/fontReady.test.ts` — FAIL.
- [ ] **Step 3:** `npm install @fontsource/xanh-mono @fontsource/ibm-plex-mono @fontsource/literata @fontsource/patrick-hand -w @lexicon/ui`; viết `fonts.css`, token, `fonts.ts`, `waitForFonts`. Trong `GameCanvas`, trước `createGame` gọi `waitForFonts(document.fonts, ['500 20px "IBM Plex Mono"', '400 16px "Literata"'], 3000)`; `'timeout'` → `console.warn('[Assets] fonts not ready, using fallback')` chỉ ở dev. Hủy đúng khi effect cleanup chạy trước khi promise xong.
- [ ] **Step 4:** Test PASS; `npm run build -w @lexicon/game-web` — font nằm trong `dist/assets`; ghi tổng dung lượng woff2 thêm vào báo cáo.
- [ ] **Step 5:** `PROVENANCE.md`: 4 dòng (họ font, `@fontsource/<x>@5.3.0`, OFL 1.1, subset/weight dùng).
- [ ] **Step 6:** Commit `feat(ui): bundle OFL fonts with Vietnamese subsets and add font tokens`.

### Task 2: Texture UI sinh bằng code

**Files:**
- Create: `tools/art-codegen/build_ui_materials.py`, `tools/art-codegen/test_build_ui_materials.py`
- Create (output): `apps/game-web/public/assets/ui/*.png` (9 file spec §4.2, chưa gồm `world/`)
- Modify: `assets/PROVENANCE.md`

**Interfaces:**
- Produces: `render_paper_sheet(tone: Literal['fresh','aged'], seed: int) -> Image`, `render_torn_frame(seed) -> Image`, `render_paper_clip() -> Image`, `render_tape_corner(seed) -> Image`, `render_index_tab_frame(seed) -> Image`, `render_stamp_ring(seed) -> Image`, `render_keycap_plate() -> Image`, `render_cork_board(seed) -> Image`, `build(out_dir: Path) -> list[Path]`; hằng `SLICES = {'paper_torn_frame': 48, 'index_tab_frame': 24, 'keycap_plate': 10}`, `SEED = 20261002`. CLI: `python tools/art-codegen/build_ui_materials.py [--check]` (`--check` so hash với file đã commit, khác thì exit 1).

- [ ] **Step 1: Test đỏ** — `test_build_ui_materials.py` (unittest): build hai lần vào hai thư mục tạm cho cùng bytes mọi file; đúng 9 tên file; `paper_sheet_*` 512×512 và mép trái khớp mép phải (chênh trung bình < 2 mức xám); `paper_torn_frame` có pixel alpha 0 ở ngoài mép xé trong dải `SLICES` cạnh dưới/phải và alpha 255 ở tâm; màu nền giấy nằm trong ±8 của `#D8C5A4` (fresh) / `#CDBA97` (aged); `stamp_ring` chỉ có kênh alpha thay đổi (RGB đồng nhất để tô bằng CSS mask).
- [ ] **Step 2:** `python -m pytest tools/art-codegen/test_build_ui_materials.py -q` — FAIL.
- [ ] **Step 3:** Viết script theo kiểu `build_case002_evidence.py` (numpy noise có seed, `Image.alpha_composite`, không model ảnh); chạy để sinh file.
- [ ] **Step 4:** Test PASS; `--check` exit 0.
- [ ] **Step 5:** `PROVENANCE.md`: một dòng cho mỗi file ("Code renderer `tools/art-codegen/build_ui_materials.py`, seed 20261002 — không dùng model sinh ảnh").
- [ ] **Step 6:** Commit `feat(art): generate paper UI materials in art-codegen`.

### Task 3: Primitive vật liệu trong `packages/ui`

**Files:**
- Create: `packages/ui/src/primitives/PaperSheet.tsx`, `paper-sheet.css`, `PaperClip.tsx`, `InkButton.tsx`, `ink-button.css`, `IndexTab.tsx`, `index-tab.css`, `Stamp.tsx`, `stamp.css`, `KeyHintLine.tsx`, `key-hint-line.css`, `motion.css`
- Modify: `PaperPanel.tsx` (alias), `paper-panel.css`, `Keycap.tsx`/`keycap.css`, `primitives.test.tsx`, `packages/ui/src/index.ts`

**Interfaces:**
- Consumes: token Task 1; ảnh Task 2 qua URL `/assets/ui/<file>.png`.
- Produces:
  - `PaperSheet(props: { as?: ElementType; className?: string; edge?: 'clean' | 'torn'; tone?: 'fresh' | 'aged'; tilt?: number; clip?: boolean; tape?: 'tl' | 'tr'; children?: ReactNode })` — class `paper-sheet paper-sheet--<edge> paper-sheet--<tone>`, tilt qua CSS var `--paper-tilt` (kẹp vào −2…2), `clip` render `PaperClip`.
  - `PaperClip(): JSX.Element` (`aria-hidden`).
  - `InkButton(props: ButtonHTMLAttributes<HTMLButtonElement>)` — class `ink-button`.
  - `IndexTab(props: { className?: string; tone?: 'fresh' | 'aged'; children: ReactNode })`.
  - `Stamp(props: { className?: string; animate?: boolean; children: ReactNode })`.
  - `KeyHintLine(props: { className?: string; compact?: boolean; items: readonly KeyHintItem[] })`, `type KeyHintItem = { key: string; label: string; onActivate?: () => void; disabled?: boolean; dimmed?: boolean; className?: string }` — mục có `onActivate` render `InkButton` (`aria-label` = label khi `compact`), mục không có thì render `span`.
  - `PaperPanel` = `PaperSheet edge="clean"` giữ API cũ, giữ class `paper-panel`.
  - `motion.css`: class `lexicon-motion-off` trên root tắt animation/transition/tilt; `@media (prefers-reduced-motion: reduce)` cùng hiệu ứng.

- [ ] **Step 1: Test đỏ** (`primitives.test.tsx`, `renderToString`): `PaperSheet` với `edge="torn" tilt={5}` có class `paper-sheet--torn` và `--paper-tilt:2deg`; `clip` render svg/ảnh `aria-hidden="true"`; `KeyHintLine compact` với item `{ key: 'J', label: 'Sổ tay', onActivate }` render `<button` có `aria-label="Sổ tay"` và không render text "Sổ tay" ngoài aria; item `disabled` render `disabled=""`; `Stamp animate` có class `stamp--animate`; `PaperPanel` vẫn có class `paper-panel`.
- [ ] **Step 2:** `npx vitest run packages/ui` — FAIL.
- [ ] **Step 3:** Viết primitive và CSS (border-image dùng `SLICES` ở "Định danh chung"; bóng/focus/motion theo token).
- [ ] **Step 4:** Test PASS; thêm test tương phản trong `palette.test.ts` cho các cặp mới (`inkBlack` trên `#E9DCC2` giấy sáng, `darkRed` trên `paperCream`) ≥ 4.5.
- [ ] **Step 5:** Commit `feat(ui): add paper material primitives`.

### Task 4: HUD — mục tiêu, hồ sơ, bản đồ nhỏ

**Files:**
- Modify: `apps/game-web/src/hud/ObjectivePanel.tsx`, `CaseProgress.tsx`, `Minimap.tsx`, `hud.css`, `minimap.css`, `hud.test.tsx`, `Minimap.test.tsx`
- Create: `apps/game-web/src/hud/objectiveTransition.ts`, `objectiveTransition.test.ts`
- Modify: `apps/game-web/e2e/hud.spec.ts`, `e2e/feedback-minimap.spec.ts` (chỉ chỗ phụ thuộc cấu trúc cũ)

**Interfaces:**
- Consumes: `PaperSheet`, `IndexTab`, `Stamp` (Task 3).
- Produces: `type ObjectiveDisplay = { current: { id: string; text: string } | null; leaving: { id: string; text: string } | null }`; `nextObjectiveDisplay(prev: ObjectiveDisplay, active: { id: string; text: string } | null): ObjectiveDisplay` (đổi id → cái cũ thành `leaving`; cùng id → giữ nguyên; `null` → `current: null` và cái cũ thành `leaving`); `clearLeaving(d: ObjectiveDisplay): ObjectiveDisplay`.

- [ ] **Step 1: Test đỏ** — `objectiveTransition.test.ts` cho ba nhánh trên. `hud.test.tsx`: `ObjectivePanel` render `paper-sheet--torn`, tiêu đề trong phần tử font display, vẫn có `hud-objective-panel`; thu gọn render `.hud-panel-launcher` chứa chữ `strings.objectiveHeading` (không còn ký tự "−"); `CaseProgress` render `IndexTab` với `.hud-case-progress-count` dạng `x/y`; `Minimap` không còn text `strings.minimapPlayer` hiển thị nhưng `aria-label` của svg vẫn chứa `strings.minimapTitle`.
- [ ] **Step 2:** `npx vitest run apps/game-web/src/hud` — FAIL.
- [ ] **Step 3:** Cài đặt. Gạch mực: `leaving` render với class `hud-objective--leaving` 300ms rồi `clearLeaving` (timer trong effect, dọn khi unmount). Số hồ sơ nảy 180ms khi `evidenceIds.length` tăng. Thu gọn mục tiêu/bản đồ là tab giấy gập (vẫn là `button`, `aria-expanded`).
- [ ] **Step 4:** Test PASS. Cập nhật `hud.spec.ts` cho cấu trúc mới (giữ assert màu đỏ `rgb(164, 65, 45)`, cỡ số ≥ 24px; bỏ assert `svg` thư mục nếu IndexTab không có svg). Chạy `npx playwright test e2e/hud.spec.ts e2e/feedback-minimap.spec.ts` qua `run-e2e.mjs` — PASS.
- [ ] **Step 5:** Commit `feat(hud): paper objective card, case file tab and taped minimap`.

### Task 5: HUD — dòng phím, prompt, coach note, vùng tránh

**Files:**
- Modify: `apps/game-web/src/hud/KeyHints.tsx`, `InteractionPrompt.tsx`, `Hud.tsx`, `hud.css`, `apps/game-web/src/onboarding/CoachNote.tsx`, `coach.css`, `apps/game-web/src/state/gameStore.ts`
- Create: `apps/game-web/src/hud/useHudInsets.ts`, `apps/game-web/src/hud/hudInsets.ts`, `hudInsets.test.ts`
- Modify (nếu Task 0 kết luận `UI`): file CSS gây dải giấy phía trên
- Modify: `e2e/hud.spec.ts`, `e2e/feedback-viewport.spec.ts`, `e2e/onboarding.spec.ts` (chỗ phụ thuộc)

**Interfaces:**
- Consumes: `KeyHintLine`, `PaperSheet`, `Keycap` (Task 3).
- Produces: store `hudInsets` + `setHudInsets` (mặc định 0 cả bốn cạnh; `setHudInsets` không đổi state nếu giá trị bằng nhau); `computeHudInsets(viewport: { width: number; height: number }, rects: readonly { left: number; top: number; right: number; bottom: number }[]): HudInsets` (khối chạm mép trên → `top = max(bottom)`; chạm mép dưới → `bottom = viewport.height - min(top)`; trái/phải tương tự; khối không chạm mép nào trong 32px bị bỏ qua); `useHudInsets(hudRef)` đo `.hud-objective-panel, .hud-case-progress, .hud-minimap, .hud-key-hints` bằng `ResizeObserver` và gọi `setHudInsets`.

- [ ] **Step 1: Test đỏ** — `hudInsets.test.ts`: mục tiêu ở góc trên trái (0,0)-(340,110) và dòng phím (400,680)-(880,720) trong 1280×720 cho `{ top: 110, bottom: 40, left: 0, right: 0 }`; khối ở giữa màn hình bị bỏ qua. `hud.test.tsx`: `KeyHints` render đúng thứ tự phím `E, J, B, M, Esc`, không có `WASD`; `E` có class dimmed khi `nearby === null`; `CoachNote` dùng class `coach-note` và font hand.
- [ ] **Step 2:** `npx vitest run apps/game-web/src/hud apps/game-web/src/onboarding` — FAIL.
- [ ] **Step 3:** Cài đặt. `KeyHints` → `KeyHintLine` (giữ `className="hud-key-hints"`, `disabled` theo `inputLocked`, `compact` khi viewport < 960 rộng hoặc < 640 cao); E không có `onActivate` (tương tác vẫn qua prompt), J/B/M/Esc gọi action store như cũ. `InteractionPrompt`: chỉ thay `PaperPanel` bằng `PaperSheet` + chữ body 16px, không đổi logic đo/neo. `CoachNote`: giấy note `tape="tr"`, chữ `--lexicon-font-hand` ≥ 18px. Nếu Task 0 kết luận `UI`, gỡ dải giấy.
- [ ] **Step 4:** Test PASS. Cập nhật E2E: `hud.spec.ts` kỳ vọng phím `['E', 'J', 'B', 'M', 'Esc']`; compact: 4 `button` (J, B, M, Esc), mỗi nút có `aria-label`, `.hud-key-hints` không tràn ngang ở 390×844 và 844×390 (`scrollWidth <= clientWidth`). Chạy các spec liên quan — PASS.
- [ ] **Step 5:** Commit `feat(hud): ink key hint line, paper prompt and handwritten coach note`.

### Task 6: Nhãn NPC theo khoảng cách

**Files:**
- Create: `apps/game-web/src/game/systems/nameplateVisibility.ts`, `nameplateVisibility.test.ts`
- Modify: `apps/game-web/src/game/entities/createNpcNameplate.ts`, `apps/game-web/src/game/scenes/WorldScene.ts` (`syncNpcPresentation`, debug hook), `apps/game-web/src/game/constants.ts`
- Modify: `apps/game-web/e2e/feedback-labels.spec.ts`

**Interfaces:**
- Consumes: `LABEL_FONT_FAMILY` (Task 1).
- Produces: `nameplateVisible(args: { player: { x: number; y: number }; npcFeet: { x: number; y: number }; interactionRadius: number; hovered: boolean }): boolean` — true khi `hovered` hoặc khoảng cách màn hình (px world) ≤ `NAMEPLATE_RADIUS_FACTOR * interactionRadius` (`NAMEPLATE_RADIUS_FACTOR = 1.5` trong `constants.ts`). Debug `nameplateVisible(id)`; `npcNameplate(id)` giữ trường `hasPaperPlate` (tính bằng cờ, không bằng `list.length`).

- [ ] **Step 1: Test đỏ** — biên đúng 1,5×bán kính (=) là true, vượt 1px là false; hovered xa vẫn true; hai NPC cùng trong bán kính đều true.
- [ ] **Step 2:** `npx vitest run apps/game-web/src/game/systems/nameplateVisibility.test.ts` — FAIL.
- [ ] **Step 3:** Cài đặt: nameplate mới (thẻ kem, ghim nhỏ đỏ thẫm 6px, chữ IBM Plex Mono 18px, bóng mềm vẽ bằng `fillRect` alpha 0,22 lệch 2–3px); alpha tween 0↔1 trong 150ms khi trạng thái đổi, đặt thẳng khi `reducedMotion`; hover dùng `pointerover/pointerout` trên sprite NPC; giữ `nameTagPosition` để tránh prompt; dọn tween khi shutdown.
- [ ] **Step 4:** Test PASS. `feedback-labels.spec.ts`: lúc vào game ở spawn `default` nhãn Anna ẩn; đi tới cạnh Anna (`worldClick` gần `anna`) → `nameplateVisible('anna')` true; giữ assert `text`, `hasPaperPlate`, `textColor`, `gap ≥ 6`. Chạy — PASS.
- [ ] **Step 5:** Commit `feat(world): show NPC dossier tags by proximity or hover`.

### Task 7: Cue vật chứng và chỉ báo ngoài màn hình

**Files:**
- Modify: `tools/art-codegen/build_ui_materials.py`, `test_build_ui_materials.py` (thêm `render_evidence_ripple(seed) -> Image`, output `world/evidence_ripple.png`)
- Create: `apps/game-web/src/game/systems/offscreenCues.ts`, `offscreenCues.test.ts`
- Modify: `apps/game-web/src/game/entities/WorldCueLayer.ts`, `apps/game-web/src/game/scenes/WorldScene.ts`, `apps/game-web/src/game/createGame.ts` (option `hudInsets`), `apps/game-web/src/game/GameCanvas.tsx`, `apps/game-web/src/game/textures.ts` hoặc nơi preload texture dùng chung
- Modify: `apps/game-web/e2e/feedback-world-cues.spec.ts`, `assets/PROVENANCE.md`

**Interfaces:**
- Consumes: `hudInsets` store (Task 5).
- Produces: `offscreenCues(args: { cues: readonly { id: string; x: number; y: number }[]; view: { x: number; y: number; width: number; height: number }; player: { x: number; y: number }; insets: HudInsets; margin: number; max: number }): { id: string; x: number; y: number; angle: number }[]` — chỉ cue nằm ngoài `view`; điểm là giao của tia player→cue với hình chữ nhật view đã co bởi `insets + margin` (tọa độ màn hình); sắp theo khoảng cách tới player, cắt `max`. Hằng: `margin = 24`, `max = 3`. `WorldCueLayer.sync(visibleIds, nearestId, reducedMotion)` giữ chữ ký; thêm `syncOffscreen(view, player, insets)`. Debug `offscreenCueIds()`.

- [ ] **Step 1: Test đỏ** — `offscreenCues.test.ts`: cue trong view → rỗng; cue bên phải ngoài view → điểm có `x = view.width - insets.right - 24`, `angle ≈ 0`; 5 cue ngoài view → 3 cue gần nhất; insets đẩy điểm khỏi vùng HUD. Python: `evidence_ripple.png` 128×64, chỉ alpha thay đổi.
- [ ] **Step 2:** Chạy vitest + pytest — FAIL.
- [ ] **Step 3:** Cài đặt: marker 24px (thoi đỏ viền kem), nổi 4px chu kỳ 1000ms; ripple dưới vật (scale 0,6→1, alpha 0,7→0, chu kỳ 2400ms; tĩnh alpha 0,5 khi `reducedMotion`); chỉ báo ngoài màn hình 16px, `setScrollFactor(0)`, depth trên marker; dọn tween/object khi `destroy`. `GameCanvas` truyền `hudInsets: () => store.getState().hudInsets`.
- [ ] **Step 4:** Test PASS; cập nhật `feedback-world-cues.spec.ts` (giữ assert `worldCueCount` = 3 lúc đầu; thêm: dịch camera/đi xa để một cue ra ngoài → `offscreenCueIds()` chứa id đó; nhặt vật → id biến mất). PROVENANCE thêm `evidence_ripple.png`.
- [ ] **Step 5:** Commit `feat(world): larger evidence cues with ink ripple and off-screen pointers`.

### Task 8: Vòm cổng sát tường

**Files:**
- Modify: `tools/art-codegen/build_ui_materials.py`, `test_build_ui_materials.py` (thêm `render_portal_arch(facing: Literal['ne','nw'], seed) -> Image`, `render_portal_veil(facing, seed) -> Image` spritesheet 10 frame; dùng phép chiếu của `iso.py`)
- Modify: `packages/shared-types/src/scene.ts` (`style: 'aged-brass' | 'arch'`), `packages/game-content/src/schema/scene.ts`
- Create: `packages/game-content/src/geometry/portalPlacement.ts`, `portalPlacement.test.ts`
- Modify: `packages/game-content/src/geometry/sceneGeometry.ts` (gọi `validatePortalPlacement`)
- Modify (content): `packages/game-content/cases/case-001/scenes/main_office.json`, `archive.json`; `case-002/scenes/main_office.json`, `mail_room.json`, `reception.json`
- Create: `apps/game-web/src/game/systems/portalFacing.ts`, `portalFacing.test.ts`
- Modify: `apps/game-web/src/game/systems/portalPresentation.ts`, `portalPresentation.test.ts`, `apps/game-web/src/game/scenes/WorldScene.ts`
- Modify: `apps/game-web/AGENTS.md`, `docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md` (§63 ngoại lệ D-6), `assets/PROVENANCE.md`

**Interfaces:**
- Produces:
  - `validatePortalPlacement(scene: SceneDefinition): string[]` — mỗi asset có `portal` phải có `position` cách `line` của một wall segment ≤ 0,25 theo trục vuông góc và nằm trong `[start, end]` của một `opening` của segment đó; lỗi `scenes.<scene>.<asset>.portal: not inside any wall opening`.
  - `portalFacing(wall: { axis: 'u' | 'v'; line: number }, sceneSize: { u: number; v: number }): 'ne' | 'nw' | 'ne-flip' | 'nw-flip'` — axis `v` → `ne`; axis `u` → `nw`; `line > size/2` theo trục tương ứng → bản `-flip`.
  - `createPortalPresentation(scene, args: { position: ScreenPoint; facing: ReturnType<typeof portalFacing>; reducedMotion: boolean })` → `{ setReducedMotion(value: boolean): void; destroy(): void }`.
  - Content mỗi cổng: `texture` = `tex_portal_arch_<ne|nw>`, `portal: { style: 'arch', radius: 0.65 }`, `position` = tâm opening trên `line` (vd. `hallway_door` → `{ u: 0, v: 5 }`; cổng ở `v@15.75` → `u: 15.75`), `interaction.x/y` = 0,75 ô vào trong phòng (offset logic; xác nhận `x`↔`u`, `y`↔`v` bằng `projectInteractionAnchor` trước khi sửa content; vd. `{ x: 0.75, y: 0 }` cho tường `u=0`, `{ x: -0.75, y: 0 }` cho `u=15.75`), `footprint` nằm trong bề dày tường (rộng 0,3 ô theo trục vuông góc, dài bằng opening); spawn `from_*` tương ứng dời về vị trí cổng cũ (u 1.5 hoặc 14.5). Scene `textures` thêm arch + veil (veil có `frameWidth: 128, frameHeight: 192`), bỏ `tex_brass_portal` khỏi scene nào không còn dùng.

- [ ] **Step 1: Test đỏ** — `portalPlacement.test.ts`: cổng tại `{u:0,v:5}` với opening `v@0 [4–6]` hợp lệ; tại `{u:1.5,v:5}` báo lỗi đúng chuỗi; tại `{u:0,v:7}` (ngoài opening) báo lỗi. `portalFacing.test.ts`: bốn trường hợp. `portalPresentation.test.ts`: `reducedMotion` không tạo tween; `destroy` dọn tween và object; alpha lớp sáng ≤ 0,35. Python: hai hướng arch 256×320, veil 1280×192.
- [ ] **Step 2:** Chạy vitest + pytest — FAIL; `npm run test -w @lexicon/game-content` — FAIL ở 6 cổng hiện có (đúng kỳ vọng).
- [ ] **Step 3:** Sinh art, viết validator/facing/presentation (veil chạy 8 fps, hạt bụi ≤ 6, lớp sáng `ADD`; `reducedMotion` → frame 0, không hạt). Sửa 5 scene JSON theo "Interfaces". Biển tên phòng đích phía trên vòm lấy từ `labels` của scene đích (không hardcode).
- [ ] **Step 4:** Test PASS; `node .claude/skills/authoring-case-content/scripts/check-case-flow.mjs case-001` và `case-002` — `closable=true`. E2E `feedback-navigation*.spec.ts`, `journey.spec.ts`, `case-002.spec.ts`, `scene-layout.spec.ts`, `world.spec.ts` — PASS (cập nhật kỳ vọng tọa độ chỉ khi test đọc tọa độ cứng; thêm assert: sau khi qua cổng, prompt không tự kích hoạt lại và `portalFacing('hallway_door') === 'ne'`).
- [ ] **Step 5:** `apps/game-web/AGENTS.md` dưới rule marker: "Ngoại lệ (02/10/2026): cổng dịch chuyển được có lớp sáng ấm `ADD` alpha ≤ 0,35, bán kính ≤ 1,2 ô; không bloom/neon. Bóng UI mềm blur ≤ 6px alpha ≤ 25%. Font: Xanh Mono/IBM Plex Mono/Literata/Patrick Hand." Ghi tương ứng vào docs/art/06 §63 và phần UI. PROVENANCE thêm 4 file vòm/veil.
- [ ] **Step 6:** Commit `feat(world): wall-mounted arch portals with warm light and placement validator`.

### Task 9: Verification, tài liệu, review

**Files:**
- Modify: `docs/ai/2026-10-02-ui-foundation-hud-verification.md`, `docs/product/2026-10-02-product-review-and-direction.md` (cột trạng thái PR-02), `docs/ai/MEMORY.md`
- Create: `docs/ai/playtests/2026-10-02-ui-foundation-hud/after/*.png`

- [ ] **Step 1:** Chạy `UI_SHOTS_DIR=docs/ai/playtests/2026-10-02-ui-foundation-hud/after` cho `ui-shots.spec.ts`; ghép bảng trước/sau/concept trong báo cáo.
- [ ] **Step 2:** `FPS_PROBE=1` ba lần; so với baseline Task 0. Giảm > 10% → thay veil động bằng frame tĩnh + lớp sáng tĩnh (R-3), đo lại, ghi cả hai số.
- [ ] **Step 3:** DoD, dán output: `npm run lint`, `npm run test`, `npm run build`, `npm run format:check`, `npm run test:e2e`, `npm run memory:check`, `python -m pytest tools/art-codegen -q`. Test fail phải nằm trong danh sách baseline Task 0, nếu không thì sửa.
- [ ] **Step 4:** Một review độc lập toàn nhánh theo `requesting-code-review` (tập trung: rule §6, cleanup listener/tween, vùng tránh HUD, guardrail ánh sáng). Xử lý phát hiện theo `receiving-code-review`.
- [ ] **Step 5:** Cập nhật PR-02 ("người dùng chọn làm lại toàn bộ UI 02/10/2026; phần 1+2 theo spec `2026-10-02-ui-foundation-hud-design.md`"), `MEMORY.md` theo protocol `docs/ai/README.md`.
- [ ] **Step 6:** Commit `docs(ui): verification, screenshots and memory for UI foundation + HUD`. Chờ người dùng duyệt ảnh (spec §9.4) trước khi đánh dấu phase hoàn tất; không push.
