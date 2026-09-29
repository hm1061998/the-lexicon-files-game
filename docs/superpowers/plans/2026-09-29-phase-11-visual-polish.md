# Phase 11 — Visual Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: dùng `subagent-driven-development` (khuyến nghị) hoặc `executing-plans` để thực thi plan này từng task. Các bước dùng checkbox (`- [ ]`).

**Goal:** Áp dụng lớp hoàn thiện thị giác "hồ sơ giấy cổ điển" (token, paper overlay, UI, chuyển cảnh, marker) và thay placeholder bằng art thật trong `assets/_incoming/`, không đổi logic game.

**Architecture:** Phần A thuần code: token CSS/TS đồng bộ có test, overlay giấy sinh bằng code trong `BootScene`, marker tween độ lệch riêng, fade camera. Phần B: một script Python xử lý ảnh (tách nền magenta, đổi kích thước về kích thước in-game) xuất PNG alpha vào `apps/game-web/public/assets/`, một manifest TS nạp texture ở `BootScene`, rồi đổi texture key trong scene JSON. Placeholder `ph_*` giữ làm fallback.

**Tech Stack:** TypeScript strict, Phaser 3, React, Vitest, Playwright, Python 3 + numpy/scipy/Pillow (chỉ cho tool ảnh trong `tools/art-codegen`, không thuộc build).

**Spec:** `docs/superpowers/specs/2026-09-29-phase-11-visual-polish-design.md` (Phần A §3; Phần B §5). Art contract: `docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md`; provenance: `assets/PROVENANCE.md`.

## Global Constraints

- Chỉ npm + Nx; không thêm dependency npm. Font hệ thống: nội dung `Cambria, "Times New Roman", Georgia, serif` (Georgia đặt cuối vì vẽ sai dấu thanh tiếng Việt trên Windows); keycap `"Courier New", ui-monospace, monospace`; chữ ≥ 14px.
- Paper overlay Phaser alpha trong 0.10–0.18 (art/06 §44); overlay UI khoảng 0.12; không blur, không glow.
- Marker: hình thoi đỏ `#A4412D` viền mực, nổi 4 px trong 1000 ms (khoảng cho phép 800–1200 ms); dừng khi `reducedMotion` bật.
- Chuyển cảnh Phaser ≈ 250 ms, panel hiện ≈ 160 ms; cả hai tức thì khi giảm chuyển động (`MotionSource` cho Phaser, `data-reduced-motion` cho CSS).
- Đỏ (`#A4412D`/`#743026`) chỉ cho clue, evidence, objective, contradiction, selected node, marker (AGENTS §6).
- Không đổi game logic, save/learning/settings schema. Phaser không chứa learning logic; scene phải cleanup listener; không hardcode Case #001 trong React/Phaser (texture key nằm trong scene JSON).
- Tải file từ dịch vụ bên thứ ba cần người dùng cho phép — plan này không tải gì.
- Gate mỗi task: `npx nx run <project>:test` liên quan; gate cuối: `npm run lint`, `test`, `build`, `typecheck`, `format:check`, `test:e2e`, `memory:check`, `git diff --check`.

## Review Focus

- Bật giảm chuyển động **giữa lúc marker đang nổi** → marker về đúng vị trí gốc, không trôi; tắt lại → nổi tiếp từ gốc (Task 3).
- Marker biến mất rồi hiện ở interactable khác → không dùng offset cũ làm lệch vị trí (Task 3).
- Đổi scene hai lần liên tiếp/ nhấn E khi đang fade → không double-restart, không rò listener (Task 4).
- File ảnh thiếu hoặc lỗi tải → console.warn đọc được, game vẫn chạy bằng placeholder, không màn hình trắng (Task 6).
- Ảnh nhân vật có viền magenta còn sót sau khi tách nền → kiểm tra pixel alpha rìa (Task 5).

## File Structure

| File | Trách nhiệm |
| ---- | ----------- |
| `packages/ui/src/theme/palette.css` / `palette.ts` | Token màu, chữ; nguồn duy nhất |
| `packages/ui/src/theme/contrast.ts` (+ test) | `contrastRatio(a, b)` WCAG |
| `packages/ui/src/primitives/paper-panel.css`, `keycap.css` | Panel giấy, keycap kiểu máy đánh |
| `apps/game-web/src/game/systems/markerFloat.ts` (+ test) | Hàm thuần vị trí marker |
| `apps/game-web/src/game/paperOverlay.ts` | Sinh texture + lớp overlay giấy |
| `apps/game-web/src/game/assetManifest.ts` (+ test) | Bảng `key → url` texture thật, nạp ở `preload` |
| `tools/art-codegen/build_game_assets.py` | Tách nền, đổi kích thước, ghi `public/assets` |
| `docs/ai/2026-09-29-phase-11-visual-polish-verification.md` | Ledger verification + nhận xét thị giác |

---

### Task 1: Token thiết kế và kiểm tra tương phản

**Files:**
- Modify: `packages/ui/src/theme/palette.ts`, `packages/ui/src/theme/palette.css`
- Create: `packages/ui/src/theme/contrast.ts`, `packages/ui/src/theme/palette.test.ts`

**Interfaces:**
- Produces: `PALETTE` bổ sung `warmGray '#A89B87'`, `dustyOlive`, `mutedGreen '#737660'`, `darkRed '#743026'` (giá trị dustyOlive lấy từ `docs/art/06` §5 Palette); `contrastRatio(fg: string, bg: string): number`; biến CSS `--lexicon-warm-gray`, `--lexicon-dusty-olive`, `--lexicon-muted-green`, `--lexicon-dark-red`, `--lexicon-font-body`, `--lexicon-font-mono`, `--lexicon-text-min: 14px`.

- [ ] **Step 1: Viết test lỗi** trong `palette.test.ts`: (a) mỗi key của `PALETTE` có biến CSS tương ứng trong `palette.css` (đọc file bằng `fs`, so sánh hex không phân biệt hoa/thường; ánh xạ camelCase→`--lexicon-kebab`, riêng `investigationRed → --lexicon-investigation-red`, `paperCream → --lexicon-paper`, `lightBeige → --lexicon-beige`, `inkBlack → --lexicon-ink`, `darkBrown → --lexicon-border`); (b) `contrastRatio('#2A2521','#D8C5A4') >= 4.5` (ink/paper), `contrastRatio('#2A2521','#CDBA97') >= 4.5`, `contrastRatio('#D8C5A4','#3E342B') >= 4.5` (paper trên darkBrown), `contrastRatio('#A4412D','#D8C5A4') >= 3` (đỏ chỉ dùng cho chữ lớn/viền); (c) `contrastRatio('#000','#fff')` ≈ 21.
- [ ] **Step 2:** `npx nx run @lexicon/ui:test` → FAIL (thiếu key/hàm).
- [ ] **Step 3:** Thêm key vào `palette.ts`, biến vào `palette.css`, cài `contrastRatio` (công thức WCAG 2.x luminance tương đối) trong `contrast.ts`; xuất từ `index.ts`. Nếu cặp nào ở (b) không đạt, chỉnh cặp dùng trong UI ở Task 2, **không** đổi giá trị palette đã khóa.
- [ ] **Step 4:** `npx nx run @lexicon/ui:test` → PASS.
- [ ] **Step 5:** Commit `feat(ui): extend palette tokens and add contrast checks`.

---

### Task 2: UI kiểu cổ điển và hiện panel

**Files:**
- Modify: `packages/ui/src/primitives/paper-panel.css`, `packages/ui/src/primitives/keycap.css`, `apps/game-web/src/hud/hud.css`, `pause/pause.css`, `notebook/notebook.css`, `evidence/evidence.css`, `conclusion/conclusion.css`, `dialogue/dialogue.css`
- Test: `apps/game-web/src/hud/hud.test.tsx` (thêm), `apps/game-web/e2e/hud.spec.ts` (thêm)

**Interfaces:**
- Consumes: token Task 1.
- Produces: class `.paper-panel` có viền mực kép (`border` + `box-shadow` cứng, không blur), texture giấy nhiễu (`feTurbulence` trong data URI SVG, độ mờ ≈ 0.12); `@keyframes lexicon-panel-in` 160 ms; con dấu `.case-closed-stamp` nghiêng, viền mực.

- [ ] **Step 1: Viết test lỗi (E2E `hud.spec.ts`)**: `getComputedStyle` của `.paper-panel` đầu tiên có `fontFamily` chứa `Georgia`, `fontSize` ≥ 14px, `boxShadow` không chứa giá trị blur khác `0px`; khi `data-reduced-motion="true"` thì `animationName` của panel mở (vd. pause) là `none` hoặc duration `0s`.
- [ ] **Step 2:** `npm run test:e2e -- hud.spec.ts` → FAIL.
- [ ] **Step 3:** Áp token vào các file CSS trên: font serif token, `letter-spacing`/small-caps cho tiêu đề, nút viền mực + hover đổi nền, keycap font mono, focus ring giữ rõ. Thay mọi hex cứng còn sót bằng `var(--lexicon-*)` (grep `#[0-9a-fA-F]{3,6}` trong các CSS). Màu đỏ chỉ ở clue/evidence/objective/contradiction/selected node; chuyển chỗ khác sang mực/nâu. Trong `hud.css` mở rộng khối `.game-root[data-reduced-motion='true'] *` để tắt `lexicon-panel-in`.
- [ ] **Step 4:** Chạy `npx nx run @lexicon/game-web:test`, `npm run test:e2e` → PASS (toàn bộ E2E cũ không đổi).
- [ ] **Step 5:** Commit `feat(ui): classic paper-file styling and panel entrance`.

---

### Task 3: Sửa marker nổi và vẽ lại marker

**Files:**
- Create: `apps/game-web/src/game/systems/markerFloat.ts`, `markerFloat.test.ts`
- Modify: `apps/game-web/src/game/scenes/WorldScene.ts`, `apps/game-web/src/game/textures.ts`, `apps/game-web/src/game/debug.ts` (thêm `markerY(): number | null`), `apps/game-web/e2e/world.spec.ts`

**Interfaces:**
- Produces: `markerPositionY(baseY: number, floatOffset: number): number` (= `baseY + floatOffset`); `WorldScene` giữ `markerFloat = { offset: 0 }` làm target của tween (`offset` từ 0 → `-4`, 1000 ms, yoyo, repeat -1); `__lexiconDebug.markerY()` trả `marker.y` khi visible, ngược lại `null`.

- [ ] **Step 1: Viết test lỗi**: `markerFloat.test.ts` — `markerPositionY(100, 0) === 100`, `markerPositionY(100, -4) === 96`, `markerPositionY(-50, -4) === -54`. E2E `world.spec.ts`: đến gần `objective_note`, lấy hai mẫu `markerY()` cách nhau 500 ms khi giảm chuyển động **tắt** → khác nhau; bật giảm chuyển động (qua Pause settings) → hai mẫu cách 500 ms **bằng nhau** và bằng giá trị gốc; tắt lại → dao động lại.
- [ ] **Step 2:** chạy test → FAIL.
- [ ] **Step 3:** Tạo `markerFloat.ts`. Trong `WorldScene`: tween `markerFloat` object (không tween `marker.y`); `updateNearby` đặt `marker.setPosition(area.x, markerPositionY(markerBaseY, markerFloat.offset))`; `syncMarkerMotion` khi `pause` đặt `markerFloat.offset = 0`. Đổi `ph_marker` thành hình thoi (fill `INTERACTION_RED`, viền `PALETTE.inkBlack` 2px, không glow) trong `textures.ts`. Cleanup tween như hiện có.
- [ ] **Step 4:** `npx nx run @lexicon/game-web:test`, `npm run test:e2e -- world.spec.ts` → PASS (review focus: bật giảm chuyển động giữa chu kỳ; đổi interactable).
- [ ] **Step 5:** Commit `fix(game-web): make interaction marker float and redraw as diamond`.

---

### Task 4: Paper overlay Phaser và fade chuyển cảnh

**Files:**
- Create: `apps/game-web/src/game/paperOverlay.ts`, `paperOverlay.test.ts`
- Modify: `apps/game-web/src/game/scenes/BootScene.ts`, `WorldScene.ts`, `constants.ts`, `debug.ts` (thêm `paperOverlayAlpha(): number | null`), `apps/game-web/e2e/world.spec.ts`

**Interfaces:**
- Produces: `PAPER_OVERLAY_KEY = 'paper_overlay'`, `PAPER_OVERLAY_ALPHA = 0.14`, `SCENE_FADE_MS = 250` trong `constants.ts`; `generatePaperOverlayTexture(scene: Phaser.Scene): void` (bỏ qua nếu texture key đã tồn tại — để Phần B thay bằng texture thật cùng key); `addPaperOverlay(scene: Phaser.Scene): Phaser.GameObjects.TileSprite` (scrollFactor 0, phủ viewport, depth 9000 — dưới marker `10000`, trên thế giới; HUD là React nên luôn nằm trên).

- [ ] **Step 1: Viết test lỗi** `paperOverlay.test.ts`: `PAPER_OVERLAY_ALPHA` nằm trong `[0.10, 0.18]`; `SCENE_FADE_MS` trong `[200, 300]`. E2E: `paperOverlayAlpha()` ∈ [0.10, 0.18]; di chuyển và tương tác với `objective_note` vẫn hoạt động (overlay không chặn: `setInteractive` không được gọi); sau `scene:transitionRequested` sang archive, `debug.player()` xuất hiện tại spawn sau ≤ 1 s và hai lần yêu cầu chuyển liên tiếp chỉ khởi động lại scene một lần.
- [ ] **Step 2:** chạy → FAIL.
- [ ] **Step 3:** `generatePaperOverlayTexture` vẽ nhiễu nhẹ màu `paperCream` bằng `scene.textures.createCanvas` (tile 256²) trong `BootScene.create` sau placeholders. `WorldScene.create`: thêm overlay, `camera.fadeIn(SCENE_FADE_MS)`. `transitionTo`: nếu `this.transitioning` thì return; đặt cờ; nếu `motion.reducedMotion()` gọi `scene.restart()` ngay, ngược lại `camera.fadeOut(SCENE_FADE_MS)` rồi restart ở `CAMERA_FADE_OUT_COMPLETE` (dùng `once`, gỡ ở cleanup). Đặt lại cờ trong `create`. Fade-in cũng bỏ qua khi giảm chuyển động.
- [ ] **Step 4:** `npx nx run @lexicon/game-web:test`, `npm run test:e2e` → PASS toàn bộ.
- [ ] **Step 5:** Commit `feat(game-web): paper overlay and scene fade transitions`.

---

### Task 5: Pipeline xử lý ảnh (Phần B)

**Files:**
- Create: `tools/art-codegen/build_game_assets.py`, `tools/art-codegen/assets_config.json`, `tools/art-codegen/test_build_game_assets.py`
- Output: `apps/game-web/public/assets/{characters,environment,evidence,textures}/*.png`
- Modify: `assets/PROVENANCE.md`

**Interfaces:**
- Produces: `assets_config.json` là mảng `{ "src": "assets/_incoming/<file>.png", "dest": "<đường dẫn dưới public/assets>", "targetWidth": number | null, "keyMagenta": boolean, "frame": number | null }`. Đích và tên: `characters/<name>/chr_<name>_idle_<dir>.png` (frame vuông 160, chân ở 88% chiều cao, người cao ≈ 100 px để khớp `ph_player` 100 px và `PLAYER_ORIGIN` `[0.5, 0.88]`), `environment/office/scene_office_floor.png`, `…/scene_office_wall_back.png`, `environment/archive/…`, prop `prop_*` với `targetWidth`: desk 360, note 48, audio_recorder 56, door 130, chair 90, plant 80, filing_cabinet 120, meeting_table 420, security_terminal 120; `evidence/evidence_*.png` targetWidth 480; `textures/paper_texture.png` giữ nguyên. CLI: `python tools/art-codegen/build_game_assets.py` (đọc config, ghi mọi đích, in bảng kích thước).

- [ ] **Step 1: Kiểm tra môi trường**: `python -c "import numpy, scipy, PIL"`. Nếu thiếu, dùng đúng Python đã dùng cho `slice_turnaround.py` (đọc docstring script) hoặc báo người dùng cài `pip install numpy scipy pillow` — không tự cài toàn cục khi chưa hỏi. Mở từng ảnh `_incoming` để xác định nền (magenta hay đã trong suốt) và ghi vào config (`keyMagenta`).
- [ ] **Step 2: Viết test lỗi** `test_build_game_assets.py` (pytest hoặc `unittest`): với ảnh tổng hợp 64×64 nền `#FF00FF` có ô vuông nâu ở giữa, `key_magenta()` trả alpha 0 ở góc, 255 ở giữa, và không pixel nào ở rìa có màu gần magenta với alpha > 0 (kiểm tra despill: kênh R,B không vượt G quá 40 ở pixel bán trong suốt). Chạy → FAIL.
- [ ] **Step 3:** Cài `key_magenta(img) -> RGBA` (khoảng cách tới magenta → alpha mềm, despill), `fit_width(img, w)`, `frame_character(img, frame=160)`; script đọc config, ghi PNG alpha. Cắt khoảng trống trước khi đổi kích thước (bbox theo alpha) rồi neo chân prop ở đáy để `origin [0.5, 1]` dùng được.
- [ ] **Step 4:** Chạy test → PASS; chạy CLI; mở 3 file đầu ra (một nhân vật, một prop, một sàn) bằng Read và xác nhận thị giác: không viền magenta, không cắt cụt. Tổng dung lượng `public/assets` in ra; nếu > 15 MB thì giảm bằng quantize PNG.
- [ ] **Step 5:** Thêm dòng provenance cho mỗi file đầu ra (nguồn = file `_incoming` tương ứng + "xử lý bằng build_game_assets.py"); cập nhật ghi chú xác nhận điều khoản ChatGPT vẫn **chờ chủ dự án xác nhận** (không tự xác nhận). Ghi sai lệch so với art/06: xuất PNG alpha thay WebP (tránh thêm tool), lý do trong verification. Commit `feat(assets): add game asset build pipeline and processed art`.

---

### Task 6: Nạp texture thật và thay trong scene JSON (Phần B)

**Files:**
- Create: `apps/game-web/src/game/assetManifest.ts`, `assetManifest.test.ts`
- Modify: `apps/game-web/src/game/scenes/BootScene.ts`, `entities/createSceneAsset.ts`, `entities/Player.ts`, `scenes/WorldScene.ts` (hướng nhân vật), `packages/game-content/cases/case-001/scenes/main_office.json`, `archive.json`, các test content liên quan nếu tham chiếu `ph_*`; `apps/game-web/e2e/world.spec.ts`

**Interfaces:**
- Produces: `TEXTURE_MANIFEST: readonly { key: string; url: string }[]` (key dạng `tex_office_desk`, `tex_player_se`, …; url `/assets/...`); `loadTextureManifest(scene: Phaser.Scene): void` dùng trong `BootScene.preload`; `facingTextureKey(character: string, facing: Facing): string` (`tex_${character}_${facing.toLowerCase()}`); `resolveTextureKey(scene, key): string` trả `key` nếu tồn tại, ngược lại `'ph_missing'` sau `console.warn('[Scene] …')`.

- [ ] **Step 1: Viết test lỗi** `assetManifest.test.ts`: mọi `url` bắt đầu bằng `/assets/`, `key` duy nhất, và mọi file tương ứng tồn tại dưới `apps/game-web/public` (dùng `fs.existsSync`); `facingTextureKey('player','NE') === 'tex_player_ne'`. E2E: sau khi load, `__lexiconDebug` báo không có `[Scene] missing texture` trong console (`page.on('console')`), và player vẫn va chạm với `player_desk` (teleport gần bàn, đi vào, vị trí không xuyên qua).
- [ ] **Step 2:** chạy → FAIL.
- [ ] **Step 3:** Tạo manifest + `loadTextureManifest`; `BootScene.preload` gọi nó, gắn `this.load.on('loaderror', file => console.warn('[Assets] failed to load', file.key))` — game tiếp tục bằng placeholder. Trong scene JSON đổi `texture` sang key thật (`ph_floor→tex_office_floor`, `ph_desk→tex_office_desk`, `ph_note→tex_note`, `ph_audio_recorder→tex_audio_recorder`, `ph_door→tex_door_hallway`, NPC/`archive` tương ứng); nhân vật NPC dùng `tex_<name>_se`. Chỉnh `origin`, vị trí `y` và `collision` theo kích thước ảnh thật (chân prop ở đáy → `origin [0.5, 1]`), giữ nguyên `id`, `interaction`, `effects`. Player: `movePlayer` cập nhật texture theo `resolveDirection` (chỉ khi hướng đổi, giữ hướng cuối khi đứng yên) bằng `setTexture(facingTextureKey('player', facing))`. Đặt `paper_overlay` thật nếu muốn: tải `paper_texture.png` dưới key `PAPER_OVERLAY_KEY` (Task 4 bỏ qua sinh code khi key đã có). Nếu `createSceneAsset` cần fallback thì dùng `resolveTextureKey`.
- [ ] **Step 4:** `npm run test`, `npm run test:e2e` → PASS. Chụp ảnh màn hình main_office và archive (Playwright hoặc trình duyệt tích hợp), xem tận mắt: nhân vật không chìm dưới prop khi đi ngang (depth), marker đúng vị trí, va chạm hợp lý; chỉnh collision/origin cho tới khi ổn.
- [ ] **Step 5:** Commit `feat(game-web): integrate processed art textures into scenes`.

---

### Task 7: Verification, đối chiếu concept, cập nhật memory

**Files:**
- Create: `docs/ai/2026-09-29-phase-11-visual-polish-verification.md`
- Modify: `docs/ai/MEMORY.md`, `docs/superpowers/specs/2026-09-29-phase-11-visual-polish-design.md` (đổi trạng thái sang "đã duyệt", ghi sai lệch PNG)

- [ ] **Step 1:** Chạy đủ gate và lưu output rút gọn (số test, exit code) vào ledger: `npm run lint`, `test`, `build`, `typecheck`, `format:check`, `test:e2e`, `memory:check`, `git diff --check`. Nếu `format:check` báo file mới, chạy `npx prettier --write` trên đúng file rồi chạy lại.
- [ ] **Step 2:** Chụp HUD, notebook, pause, evidence modal, CASE CLOSED, scene office và archive; xem từng ảnh, đối chiếu `docs/concept/ingame_main_office_hud.webp`, ghi chỗ chưa giống. Không tuyên bố "giống concept" nếu chưa xem.
- [ ] **Step 3:** Cập nhật `MEMORY.md` theo protocol `docs/ai/README.md` (commit code trước, memory ở commit kế, `result_commit` = commit code cuối; giữ ≤ 12 KB, `Next Actions` ≤ 5; gỡ deferred minor đã xử lý: marker nổi, palette đồng bộ; thêm việc còn lại: animation đi bộ, xác nhận điều khoản ChatGPT, prop chưa dùng). `npm run memory:check`.
- [ ] **Step 4:** Commit `docs(memory): record Phase 11 completion`. Không push; người dùng tự merge.

---

## Self-Review (đã chạy)

- **Spec coverage:** §3.1 → Task 1; §3.2 → Task 2 (UI) + Task 4 (Phaser); §3.3 → Task 2; §3.4 → Task 2 (CSS) + Task 4 (fade); §3.5 → Task 3; §3.6 → test mỗi task + Task 7; §5 Phần B → Task 5–6. Sai lệch có chủ ý: PNG thay WebP (Task 5).
- **Nhất quán tên:** `markerPositionY`, `markerFloat`, `PAPER_OVERLAY_KEY/ALPHA`, `SCENE_FADE_MS`, `facingTextureKey`, `TEXTURE_MANIFEST` dùng đồng nhất giữa các task.
- **Rủi ro mở:** Task 5 phụ thuộc Python + numpy/scipy/Pillow (máy hiện chưa thấy Pillow trong `python` mặc định); nếu thiếu, dừng và hỏi người dùng trước khi cài. Điều khoản đầu ra ChatGPT chưa được chủ dự án xác nhận.
