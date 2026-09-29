# Phase 11C — Bám concept và dọn tồn đọng Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: dùng `subagent-driven-development` để thực thi từng task. Steps dùng checkbox (`- [ ]`).

**Goal:** Đưa giao diện và scene gần `docs/concept/ingame_main_office_hud.webp` hơn (HUD, prompt gắn vào vật, viền đỏ vật tương tác, phòng phân vùng có nhãn, nội thất dày) và giải quyết các tồn đọng còn treo của Phase 11/11B.

**Architecture:** HUD là React/CSS theo token hiện có; prompt gắn vào vật nhờ sự kiện bus mới `interaction:anchor` (tọa độ màn hình do WorldScene phát, React không chạm nội bộ Phaser). Scene giữ hệ tọa độ 2D trục thẳng hiện tại (không đổi sang isometric cắt lớp): thêm tường ngăn phòng, nhãn phòng từ content, nhiều nội thất/đồ treo tường sinh bằng renderer code. Tồn đọng chia thành nhóm độ bền (engine) và nhóm vệ sinh (test/asset/tài liệu).

**Tech Stack:** TypeScript strict, Phaser 3, React, Zod, Vitest, Playwright, Python (venv ngoài repo) cho tool ảnh.

**Spec:** Không có spec riêng; yêu cầu trực tiếp của người dùng 2026-09-30 ("sửa giao diện cho giống concept", "giải quyết các tồn đọng còn lại"). Nguồn: `docs/concept/ingame_main_office_hud.webp` và `docs/concept/README.md`, `docs/ai/2026-09-30-phase-11b-verification.md` (mục "Đối chiếu concept"), `docs/ai/MEMORY.md` (minor còn treo), `docs/art/06`, `docs/superpowers/plans/2026-09-30-phase-11b-backlog-and-character-motion.md`. Điều khoản OpenAI đã được chủ dự án xác nhận (chat 2026-09-30).

## Global Constraints

- Chỉ npm + Nx; không thêm dependency npm. Python chỉ dùng venv `C:/Users/Minh/AppData/Local/Temp/claude/D--Works-the-lexicon-files-game/98109fcc-761c-4fbd-a253-79a52b917ec2/scratchpad/venv/Scripts/python.exe` (numpy/scipy/pillow có sẵn; không cài thêm).
- Font nội dung `Cambria, "Times New Roman", Georgia, serif` qua token `--lexicon-font-body`; chữ ≥ 14px (`--lexicon-text-min`); palette khóa theo `docs/art/06` §5.
- Đỏ (`#A4412D`/`#743026`) chỉ cho clue, evidence, objective, contradiction, selected node, map marker (AGENTS §6). Viền đỏ quanh vật tương tác được phép vì đó là clue/evidence/objective. Không glow mềm, không blur; dùng viền nét mực/đỏ sắc.
- Hint/prompt giúp hiểu, không tự giải; tooltip từ vựng chỉ mở khi click; không "WRONG!", không timer ép trả lời (AGENTS §6).
- Concept khác `docs/art/06` thì dùng art/06; phím `Space — Né` của concept **không thuộc MVP** (không thêm).
- Phaser↔React chỉ qua bus (`GameEventMap`) và Zustand; không hardcode id/text/URL Case #001 trong React/Phaser (nhãn phòng, chuỗi UI nằm trong content JSON); scene cleanup listener/tween khi shutdown.
- Phím tắt bỏ qua khi focus ở input/textarea/contenteditable.
- Giảm chuyển động tắt mọi hiệu ứng trang trí mới (hoạt ảnh đi bộ là ngoại lệ đã chốt).
- Mọi thay đổi dev-only dùng `import.meta.env.DEV`. `assets/_incoming/` không commit. Provenance cho asset mới trong `assets/PROVENANCE.md`.
- Gate mỗi task: `npx nx run-many -t test`, `npm run lint`, `npm run test:e2e` (workers=1) khi chạm Phaser/CSS/scene; gate đầy đủ ở Task 6.

## Review Focus

- Prompt gắn vào vật khi vật ở sát mép màn hình hoặc bị HUD che → không tràn khỏi viewport, không đè minimap/mục tiêu (Task 2).
- Viền đỏ chỉ hiện với vật đang được `nearby`, biến mất khi đi xa, khi mở modal/hội thoại, hoặc case đóng (Task 2).
- Tường ngăn mới không chặn đường tới bất kỳ interactable/cửa nào; người chơi không bị nhốt (Task 4).
- Chuyển scene lúc đang chờ tải texture: nhân vật dừng, không hiện prompt cũ, phím E không kích hoạt (Task 3).
- Form control kiểu giấy vẫn dùng bàn phím được và focus ring rõ (Task 1).

## File Structure

| File | Trách nhiệm |
| ---- | ----------- |
| `apps/game-web/src/hud/*.tsx`, `hud.css` | Objective panel, badge Hồ sơ, key bar, prompt bubble |
| `packages/ui/src/primitives/*` | Kiểu form control giấy dùng chung |
| `apps/game-web/src/game/scenes/WorldScene.ts` (+ helper thuần) | Phát `interaction:anchor`, viền đỏ, khóa input khi chuyển scene |
| `packages/game-content/cases/case-001/scenes/*.json` | Tường ngăn, nhãn phòng (`labels`), decor |
| `tools/art-codegen/{scenes,props}.py` | Tường ngăn, đồ treo tường, prop mới |
| `docs/ai/2026-09-30-phase-11c-verification.md` | Ledger verification |

---

### Task 1: HUD chrome theo concept

**Files:** Modify `apps/game-web/src/hud/{ObjectivePanel,CaseProgress,KeyHints}.tsx`, `hud.css`, `packages/ui/src/primitives/*` (thêm `form-controls.css` import từ `paper-panel.css` hoặc theme), `pause/pause.css`, `notebook/notebook.css`, `hud.test.tsx`, `e2e/hud.spec.ts`; UI strings nếu cần nhãn mới trong `packages/game-content` (`UiStrings` + schema + `ui/vi.json`).

**Interfaces:** Không đổi API. Cấu trúc DOM giữ `data-testid`/class hiện có; thêm class `hud-objective-clip` (kẹp giấy SVG inline), `hud-case-badge` (biểu tượng thư mục SVG inline + số lớn `4/8`). Token mới nếu cần: `--lexicon-hud-shadow` (bóng cứng).
- Objective panel: tiêu đề chữ hoa/small-caps màu `--lexicon-investigation-red`, viền dưới mảnh, kẹp giấy góc trái-trên, mép giấy hơi rách (clip-path răng cưa nhẹ hoặc SVG), bullet tròn rỗng trước mục tiêu (concept), chữ ≥ 14px.
- Badge "Hồ sơ": biểu tượng thư mục + nhãn + số lượng lớn màu đỏ (evidence progress được phép đỏ).
- Key bar: dải giấy full-width đáy màn hình, keycap viền mực, nhãn, vạch phân cách dọc giữa các nhóm; hiển thị `E Tương tác | J Sổ tay | M Bản đồ | Esc Tạm dừng` (không `Space`).
- Form control kiểu giấy: `select`, `input[type=range]`, `input[type=checkbox]`, `button` trong pause/notebook/settings: viền mực, nền giấy, mũi tên/thumb/tick vẽ bằng CSS tùy biến (`appearance: none`), focus ring 2px mực có offset, hover đổi nền; đủ tương phản (dùng token, có test contrast nếu thêm cặp mới).

- [ ] **Step 1: Test lỗi:** E2E `hud.spec.ts`: objective panel có heading đỏ (`getComputedStyle(...).color` = `rgb(164, 65, 45)`) và có phần tử `.hud-objective-clip`; badge `.hud-case-badge` chứa số dạng `x/y` với `fontSize ≥ 24px`; key bar hiển thị đúng 4 phím `E,J,M,Esc` và không có `Space`; mở pause: `select` và `input[type=range]` có `appearance` = `none` và `borderTopWidth ≥ 1px`, focus (`Tab`) tạo outline ≥ 2px; `hud.test.tsx` (renderToString): ObjectivePanel render heading + bullet; CaseProgress render số.
- [ ] **Step 2:** chạy → FAIL.
- [ ] **Step 3:** Cài đặt HUD và form control. Chụp màn hình 1280×720 (office) cùng pause + notebook và **xem** so với concept; chỉnh đến khi cùng ngôn ngữ (giấy cũ, mực, kẹp giấy, số đỏ), không tràn, không đè minimap.
- [ ] **Step 4:** `npx nx run-many -t test lint`, `npm run test:e2e` PASS.
- [ ] **Step 5:** Commit `feat(game-web): concept-style HUD chrome and paper form controls`.

---

### Task 2: Prompt gắn vào vật và viền đỏ vật tương tác

**Files:** Create `apps/game-web/src/game/systems/anchorScreen.ts` (+ test); Modify `packages/shared-types/src/events.ts` (`'interaction:anchor'`), `game/scenes/WorldScene.ts`, `game/debug.ts`, `bridge/connectBusToStore.ts` (+ test), `state/gameStore.ts` (+ test), `hud/InteractionPrompt.tsx`, `hud/hud.css`, `hud.test.tsx`, `e2e/hud.spec.ts`, `e2e/world.spec.ts`.

**Interfaces:**
- `GameEventMap['interaction:anchor']: { interactableId: string; x: number; y: number } | { interactableId: null }` — `x,y` là tọa độ **màn hình tương đối canvas** (px CSS) của điểm neo prompt. Hàm thuần `worldToScreen(world: {x:number;y:number}, camera: {scrollX:number;scrollY:number;zoom:number;width:number;height:number}, canvasRect: {width:number;height:number}): {x:number;y:number}` (mặc định zoom 1; scale nếu canvas bị co bằng `canvasRect.width / camera.width`). WorldScene phát khi nearby đổi và mỗi khi camera/vật đổi vị trí quá 2 px (tối đa mỗi 50 ms), phát `{interactableId:null}` khi rời vật, chuyển scene, hoặc input bị khóa.
- Store: `interactionAnchor: { x: number; y: number } | null`. `InteractionPrompt` dạng bong bóng: khối giấy nhỏ có keycap `E` + nhãn, đặt cạnh vật (offset phải-dưới điểm neo), `transform` kẹp vào viewport (hàm thuần `clampBubble(pos, size, viewport, margin)` có test) và không đè `.hud-minimap`, objective panel: nếu đè thì đặt sang bên đối diện; khi chưa có anchor (hoặc màn hình < 720 px) rơi về vị trí đáy giữa như hiện tại.
- Viền đỏ: `WorldScene` vẽ `Phaser.GameObjects.Graphics` (depth ngay dưới marker, trên vật) một khung hình thoi/hình chữ nhật viền `#A4412D` 2px bao quanh bounds sprite của vật `nearby` (dùng `getBounds()`; nét sắc, không glow), cập nhật mỗi frame, ẩn khi không nearby/khóa input/case đóng, hủy khi cleanup. Debug hook dev-only `highlightBounds(): { x; y; width; height } | null`.

- [ ] **Step 1: Test lỗi:** `anchorScreen.test.ts`: `worldToScreen` với scroll (100,50) và vật ở (300,250) → (200,200); zoom 1; canvas co 0.5 → nhân 0.5; `clampBubble` giữ bong bóng trong viewport với margin 8 (test mép trái/phải/trên/dưới), bong bóng không đè hình chữ nhật cấm truyền vào (trả vị trí bên đối diện). Store/bridge: `interaction:anchor` cập nhật/clear `interactionAnchor`; đổi scene → null. E2E: đến gần `objective_note`: bubble `getBoundingClientRect()` nằm trong viewport, không giao với `.hud-minimap` và objective panel, và cách điểm neo ≤ 240 px; `highlightBounds()` khác null, rời vật → null; mở notebook → null; case đóng → không viền.
- [ ] **Step 2:** chạy → FAIL.
- [ ] **Step 3:** Cài đặt theo Interfaces; giữ `InteractionTracker`/E-key logic không đổi. Chụp màn hình cạnh vật ở giữa màn hình và sát mép, **xem** đối chiếu concept (bong bóng "E — Đọc biên bản cuộc họp" cạnh vật, viền đỏ quanh tài liệu).
- [ ] **Step 4:** `npx nx run-many -t test lint`, `npm run test:e2e` PASS.
- [ ] **Step 5:** Commit `feat(game): anchored interaction bubble and red target outline`.

---

### Task 3: Độ bền engine (input khi chuyển scene, hook dev, va chạm, phím tắt)

**Files:** Modify `game/scenes/WorldScene.ts`, `game/entities/Player.ts`, `game/systems/*` (helper thuần mới `walkMotion.ts` + test), `game/debug.ts`, `pause/shouldHandleShortcut.ts` (+ test) và các hook phím (`useNotebookShortcut`, `useMinimapShortcut`, `usePauseShortcut`) nếu cần, `game/constants.ts`, `tools/art-codegen/assets_config.json` (+ test đọc), `packages/game-content/cases/case-001/scenes/archive.json`, `e2e/world.spec.ts`.

**Interfaces:**
- Khi `transitioning`/`pendingTransition`: `update()` dừng nhân vật (`movePlayer(player, {x:0,y:0})`), không gọi `updateNearby`/`updateInteract`, `interactionTracker.clear()` một lần, marker ẩn, highlight/anchor clear. E2E chặn (route) một texture archive chậm 2 s: trong lúc chờ, `nearby()` = null, giữ `d` không làm `player().x` đổi, `E` không phát `interaction:triggered`.
- `requestTransition` (dev hook) gọi `store.transitionScene(...)` như luồng thật rồi mới phát bus (hoặc gọi đúng hàm mà `connectCaseEngine` dùng), để store và Phaser luôn khớp.
- `isWalking(input: { deltaX: number; deltaY: number; blocked: boolean }, epsilon = 0.5): boolean` hàm thuần: nhân vật chỉ phát anim đi bộ khi dịch chuyển thực tế > epsilon; đẩy vào vật cản (`body.blocked` hoặc delta ≈ 0) → idle của hướng đang nhìn. Áp trong `Player.ts`/`planWalk`.
- `CHARACTER_FIGURE_HEIGHT`: thêm `figureHeight` (100) vào `assets_config.json` cho mục character; test Vitest đọc file này và khẳng định bằng `CHARACTER_FIGURE_HEIGHT` (thay test chỉ chặn trên).
- Terminal archive: `depthBias` để player luôn vẽ trên vật khi chân ≥ chân vật: `computeDepth` cho player cộng `+0.01` (hằng `PLAYER_DEPTH_EPSILON` có comment) hoặc tương đương; test thuần `depth.test.ts` (player y = terminal y → player nằm trên).
- Phím tắt `J`, `M`, `Esc` và các phím khác qua `shouldHandleShortcut`: bỏ qua khi `ctrlKey || metaKey || altKey` (Shift giữ nguyên hành vi hiện có); test.

- [ ] **Step 1: Test lỗi:** các test ở Interfaces (E2E chờ texture; unit `isWalking`, `depth`, `shouldHandleShortcut` với Ctrl/Meta/Alt, `constants` khớp config; E2E đẩy nhân vật vào tường/decor 500 ms → `playerAnim().playing === false`; `requestTransition` cập nhật `activeSceneId` trong store — kiểm bằng debug hook dev `storeSceneId()` nếu chưa có).
- [ ] **Step 2:** chạy → FAIL. **Step 3:** cài đặt. **Step 4:** `npx nx run-many -t test lint`, `npm run test:e2e` PASS. **Step 5:** Commit `fix(game): lock input during scene load, honest walk state and shortcut modifiers`.

---

### Task 4: Bố cục scene theo concept (tường ngăn, nhãn phòng, nội thất dày)

**Files:** Modify `tools/art-codegen/{scenes.py,props.py,assets_config.json}` (+ tests), `packages/shared-types/src/scene.ts` + `packages/game-content/src/schema/scene.ts` (+ test) cho `labels`, `packages/game-content/cases/case-001/scenes/{main_office,archive}.json`, `game/scenes/WorldScene.ts` (vẽ nhãn), `hud/minimapModel.ts` (+ test) và `Minimap.tsx` (vẽ tường ngăn đậm, nhãn viết tắt không bắt buộc), `e2e/scene-layout.spec.ts`, `assets/PROVENANCE.md`; Output `apps/game-web/public/assets/environment/**`.

**Interfaces:**
- Content: `SceneDefinition.labels?: readonly { id: string; text: string; x: number; y: number; angle?: number }[]` (text tiếng Việt trong JSON: office ⇒ ví dụ "PHÒNG HỌP", "PHÒNG ĐIỀU TRA"; archive ⇒ "KHO LƯU TRỮ"; id duy nhất). Phaser vẽ `Phaser.GameObjects.Text` (font token đọc từ CSS var hoặc hằng cùng stack Cambria, nét chữ mực, nền bảng tên giấy nhỏ vẽ bằng Graphics), depth trên tường ngăn, dưới marker; hủy khi shutdown. Nhãn không tương tác, không chứa logic game.
- Tường ngăn: renderer mới `partition(kind, orientation, length)` xuất tường elevation mỏng (ngang: dải như `wall()` cao ~200; dọc: cột tường hẹp ~40 rộng có mép trên) với cửa kính/khung cửa (khoảng hở cho người đi + `glass` visual). Scene JSON: các asset `partition_*` (type `wall`) có collision; **luôn để lối đi ≥ 96 px** giữa các phòng và trước mọi interactable/cửa. Office: chia khu họp (bàn họp `meeting_table` + ghế) tách khỏi khu làm việc; archive: khu kệ kho tách khu terminal.
- Nội thất/đồ treo: thêm prop hoặc dùng lại `prop_*` có sẵn nhiều hơn (mục tiêu ~25–35 vật mỗi scene, tránh lặp máy móc: biến thể `scale`/hướng), bổ sung prop code-render mới (ghi vào `props.py` + `assets_config.json`): giá áo khoác (coat rack), bình nước (water cooler), bảng trắng/bảng ghim treo tường (đặt lên wall/partition), hộp hồ sơ chồng, cây thêm; tất cả palette art/06, viền mực, không glow.
- Minimap: `buildMinimapModel` thêm `partitions` (rect collision của asset type `wall` ngoài tường sau) nét đậm hơn; `labels` hiển thị dạng chấm/không chữ (không cần chữ ≥14px trên map) — giữ đơn giản.
- Test độ tiếp cận: `scene-layout.spec.ts` BFS hiện có phải vẫn PASS cho **mọi** interactable, cửa và spawn; thêm kiểm tra khoảng cách tối thiểu (cửa/interactable cách collision ≥ 48 px) và mỗi `labels[].id` duy nhất.

- [ ] **Step 1: Test lỗi:** schema `labels` (text bắt buộc không rỗng, id duy nhất, tọa độ trong worldBounds); Python `unittest` cho `partition()` (kích thước, không nền đen/magenta, mép trên trong suốt bên ngoài); `minimapModel` có `partitions`; BFS/khoảng cách E2E như trên; E2E: nhãn hiển thị (debug hook dev `labels(): string[]` trả text các nhãn đang tạo).
- [ ] **Step 2:** chạy → FAIL. **Step 3:** cài đặt; chạy pipeline; chụp cả hai scene, **xem** và so với concept (phòng họp riêng, kho lưu trữ có kệ, nhãn phòng, cây/tủ/bình nước); chỉnh vị trí/độ dày đến khi cân đối, không có vật bị che sai depth hoặc chặn cửa. Cập nhật provenance.
- [ ] **Step 4:** `python -m unittest` (venv), `npx nx run-many -t test lint`, `npm run test:e2e` PASS.
- [ ] **Step 5:** Commit `feat(assets): partitioned rooms, room labels and denser furnishing`.

---

### Task 5: Vệ sinh test/asset/tài liệu và tồn đọng cũ

**Files:** Modify `e2e/scene-layout.spec.ts`, `e2e/world.spec.ts`, `hud/Minimap.tsx` (+ test), `game/assetManifest.ts` (+ test), `packages/game-content/src/schema/caseDefinition.ts` + `packages/shared-types/src/case-engine.ts` (`imageAsset`), `evidence/EvidenceModal.tsx` (+ test onError), `apps/game-web/public/assets/textures/paper_texture.png`, `apps/game-web/public/assets/characters/{anna,leo,david}/chr_*_walk.png` (xóa khỏi public), `tools/art-codegen/make_walk_frames.py` (+ test), `docs/art/07_AI_ASSET_PROMPT_PACK.md`; và triage các minor Phase 10 cũ trong `docs/ai/MEMORY.md` (Esc/`unknownSuspect`/feedback đọc lại; thiếu test hook âm lượng/StrictMode).

- [ ] **Step 1 (test-first cho phần có hành vi):** (a) `Minimap`: bán kính marker/player suy ra từ `worldBounds.width` (test: world 1200 và 2400 cho bán kính tỉ lệ), `aria-label` chứa tên nhãn + vị trí tương đối (ví dụ "Bản đồ nhỏ — đang ở <tên phòng gần nhất>" nếu Task 4 có `labels`, không thì giữ nhãn); E2E overlap kiểm ở viewport 760×600 và 1280×720. (b) `loadSceneTextures`: test thuần rằng khi scene shutdown giữa chừng promise vẫn settle (`Promise` resolve khi nhận sự kiện shutdown/`destroy` của scene) — sửa code cho đúng. (c) E2E 404 texture: khẳng định sprite dùng `ph_missing` (`debug.textureOf(id)` hoặc cảnh báo `[Scene] missing texture`) và bỏ bộ lọc `404` rộng. (d) `EvidenceModal` onError: test bằng jsdom/RTL nếu có, nếu không có môi trường DOM thì test hàm thuần `nextImageState('error')` tách khỏi component. (e) Xóa `imageAsset` khỏi schema/type nếu không nơi nào dùng (grep) hoặc đánh dấu deprecated có comment, và thống nhất một helper `assetPath` dùng cho `image` và `textures[].url` (một nơi validate `/assets/`, không `..`). (f) `scene-layout.spec.ts`: probe decor chờ đến khi player dừng hoặc chạm (poll vị trí ổn định 200 ms) thay vì giữ phím cố định 700 ms; cửa sổ không tiến triển nới lên 5 s nhưng tổng thời gian không tăng (giới hạn mỗi chặng dựa trên khoảng cách/tốc độ ×3); chạy `--repeat-each=2` 2 lần liên tiếp không lỗi. (g) `paper_texture.png` thu nhỏ còn tile ≤ 512×512, ≤ 400 KB (giữ hạt giấy nhìn được; kiểm ảnh trước/sau) — cập nhật CSS `background-size` và provenance. (h) Xóa 3 walk sheet NPC khỏi `public/` (không dùng; tái tạo được bằng `make_walk_frames.py <name>`), ghi vào README/docs/art/07. (i) `make_walk_frames.py`: thêm vung tay nhẹ đối pha với chân (±2 px ngang cho nửa thân trên phía tay, nếu cắt tay khỏi thân không tách được thì bỏ và ghi lý do), khung chân trụ lift 1 px giữ nguyên; test (a)–(d) hiện có vẫn PASS; **xem** sheet player/anna. (j) `docs/art/07`: thêm chiều cao nhân vật ≈100 px vào prompt walk. (k) Triage minor cũ: tái hiện từng mục (Esc mở pause khi đang ở modal/thiếu focus; `unknownSuspect` khi buộc tội với id lạ; feedback đọc lại bởi screen reader — kiểm `aria-live`); nếu tái hiện được thì viết test lỗi rồi sửa, nếu không thì ghi "không tái hiện" kèm cách kiểm vào ledger. Hook âm lượng dưới StrictMode: thêm test mount hai lần dùng `react-dom/server`/hook harness sẵn có hoặc E2E đọc âm lượng thực tế (`audio.volume`) sau boot.
- [ ] **Step 2:** chạy các test mới → FAIL đúng chỗ. **Step 3:** cài đặt từng mục. **Step 4:** `python -m unittest`, `npx nx run-many -t test lint`, `npm run test:e2e` (2 lần) PASS. **Step 5:** Commit theo nhóm hợp lý (`fix(...)`, `chore(assets)`, `docs`).

---

### Task 6: Verification, đối chiếu concept song song, cập nhật memory

**Files:** Create `docs/ai/2026-09-30-phase-11c-verification.md`, Modify `docs/ai/MEMORY.md`, `docs/architecture/ARCHITECTURE.md` nếu sự kiện bus/anchor mới cần ghi.

- [ ] **Step 1:** Chạy đủ gate và ghi kết quả thật: `npm run lint`, `test`, `build` (`--skip-nx-cache`), `typecheck`, `format:check` (chỉ sửa file thuộc phase), `test:e2e` **hai lần**, `memory:check`, `git diff --check`, `python -m unittest` (venv); backend không đổi thì không chạy.
- [ ] **Step 2:** Chụp HUD office (có bong bóng prompt + viền đỏ vật), phòng họp, archive, notebook, pause (form control giấy), evidence modal, minimap; **xem** từng ảnh cạnh `docs/concept/ingame_main_office_hud.webp`; lập bảng "giống / còn khác" trung thực (không tuyên bố giống nếu chưa xem); ghi rõ khác biệt cấu trúc còn lại (concept isometric cắt lớp vs 2D trục thẳng).
- [ ] **Step 3:** Cập nhật `docs/ai/MEMORY.md` theo `docs/ai/README.md` (≤ 12 KB, Next Actions ≤ 5, Active Decisions ≤ 10; phase-11c; xóa mục đã xử lý; giữ walk sheet thật và Phase 12 chờ chỉ đạo). Commit code/tài liệu trước, memory ở commit kế tiếp (result_commit = commit code cuối).

## Self-Review

- **Coverage:** HUD (panel, badge, key bar, form) → T1; bong bóng prompt + viền đỏ → T2; nhãn phòng, phòng phân vùng, nội thất dày, minimap tường ngăn → T4; tồn đọng engine (input khi tải, hook dev, đi bộ tại chỗ, depth tie, phím modifier, hằng số) → T3; tồn đọng test/asset/tài liệu (radii, aria, settle, 404 placeholder, onError, imageAsset, helper path, flake scene-layout, paper 1.2 MB, NPC sheet, arm swing, prompt, minor Phase 10) → T5; verification/concept/memory → T6.
- **Phụ thuộc:** T2 dùng bus/store; T4 dùng schema `labels` mới và BFS; T5(a) dùng `labels` của T4; tên nhất quán: `interaction:anchor`, `interactionAnchor`, `worldToScreen`, `clampBubble`, `highlightBounds()`, `isWalking`, `labels`, `partition()`.
- **Ngoài phạm vi:** chuyển cả game sang isometric cắt lớp, phím `Space — Né`, khung đi bộ vẽ tay thật (người dùng tạo sau), Phase 12.
