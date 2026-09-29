# Phase 11B — Giải quyết tồn đọng và hoạt ảnh nhân vật Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: dùng `subagent-driven-development` để thực thi từng task. Steps dùng checkbox (`- [ ]`).

**Goal:** Xóa các deferred của Phase 11 (tường thật, nội thất, manifest theo scene, ảnh evidence, overlay rẻ hơn, các minor code) và thêm khung đi bộ + hoạt ảnh theo frame cùng minimap.

**Architecture:** Texture manifest chuyển vào `packages/game-content` (theo scene) và được nạp theo scene. Tường/nội thất tạo bằng renderer code trong `tools/art-codegen` (không dùng AI). Khung đi bộ (8 khung × 4 hướng) sinh thủ tục từ 4 ảnh idle bằng tool Python, nạp thành spritesheet + Phaser anim; minimap là component HUD dựng từ content scene + sự kiện `player:moved`.

**Tech Stack:** TypeScript strict, Phaser 3, React, Zod, Vitest, Playwright, Python (venv ngoài repo) cho tool ảnh.

**Spec:** Không có spec riêng; đây là yêu cầu trực tiếp của người dùng (2026-09-30), nguồn: `docs/ai/MEMORY.md` mục Active Decisions/Deferred, `docs/art/06` (§ shadow, style), `docs/superpowers/specs/2026-09-29-phase-11-visual-polish-design.md`. Quyết định thiết kế (Ruling): (1) LÀM minimap (người dùng yêu cầu; docs/01 và docs/03 đã có phím `M Map`); (2) khung đi bộ 8 khung/hướng sinh thủ tục từ 4 ảnh idle làm giải pháp tạm, cùng hợp đồng sheet để người dùng thay ảnh thật sau; (3) điều khoản OpenAI là việc của chủ dự án, không thuộc plan này.

## Global Constraints

- Chỉ npm + Nx; không thêm dependency npm. Python chỉ dùng venv `C:/Users/Minh/AppData/Local/Temp/claude/D--Works-the-lexicon-files-game/98109fcc-761c-4fbd-a253-79a52b917ec2/scratchpad/venv/Scripts/python.exe` (numpy/scipy/pillow đã cài; không cài thêm).
- Không hardcode id/text/URL của Case #001 trong React/Phaser sau Task 1; texture key nằm trong content JSON. `game-core`/`learning-engine` không đổi.
- Font nội dung `Cambria, "Times New Roman", Georgia, serif`; chữ ≥ 14px; đỏ chỉ cho clue/evidence/objective/contradiction/marker; không glow/blur; giảm chuyển động tắt mọi hoạt ảnh mới (`MotionSource`/`data-reduced-motion`).
- Palette khóa theo `docs/art/06` §5; art sinh bằng code ghi provenance vào `assets/PROVENANCE.md`; `assets/_incoming/` không commit; không đụng ảnh ChatGPT hiện có.
- Mọi thay đổi dev-only dùng `import.meta.env.DEV`. Scene cleanup listener/tween khi shutdown.
- Gate cuối mỗi task chạm code: `npx nx run-many -t test`, `npm run lint`; E2E (`npm run test:e2e`, workers=1) khi chạm Phaser/CSS/scene; gate đầy đủ ở Task 7.

## Review Focus

- Đổi scene khi texture của scene đích chưa nạp xong (mạng chậm/file lỗi) → không màn hình trắng, có `console.warn` đọc được, fallback placeholder (Task 1).
- Nạp lại cùng scene (office→archive→office) không nạp trùng texture hoặc rò rỉ (Task 1).
- Player đi vào nội thất mới/tường mới không bị kẹt, vẫn tới được mọi interactable và cửa (Task 2).
- Đổi hướng nhanh khi đang đi / dừng đột ngột → anim đổi đúng hướng, dừng thì về idle của hướng cuối, không kẹt frame đi bộ (Task 6).
- Minimap khi đổi scene hoặc case đóng/pause: không hiện vị trí cũ; phím M bị bỏ qua khi gõ chữ (Task 7).

## File Structure

| File | Trách nhiệm |
| ---- | ----------- |
| `packages/shared-types/src/scene.ts`, `packages/game-content/src/schema/*` | Thêm `textures` theo scene (key→url) và trường content cần cho Task 1/3/5 |
| `apps/game-web/src/game/assetManifest.ts` | Chỉ còn helper nạp từ danh sách do content cung cấp |
| `tools/art-codegen/scenes.py`, `props.py` | Tường dạng elevation thẳng; prop trang trí |
| `tools/art-codegen/make_walk_frames.py`, `apps/game-web/src/game/entities/characterAnimations.ts` | Sinh sheet đi bộ; đăng ký anim |
| `apps/game-web/src/hud/Minimap.tsx`, `minimapModel.ts` | Bản đồ nhỏ HUD |
| `apps/game-web/src/game/entities/shadow.ts` | Sinh texture bóng mềm + gắn dưới nhân vật |
| `docs/ai/2026-09-30-phase-11b-verification.md` | Ledger verification |

---

### Task 1: Texture manifest theo scene trong game-content

**Files:** Modify `packages/shared-types/src/scene.ts`, `packages/game-content/src/schema/scene.ts` (+ test), `packages/game-content/cases/case-001/scenes/{main_office,archive}.json`, `apps/game-web/src/game/assetManifest.ts` (+ test), `scenes/BootScene.ts`, `scenes/WorldScene.ts`, `entities/Player.ts`, `game/constants.ts`; validation test in game-content nếu có kiểm tra tham chiếu texture.

**Interfaces:**
- Produces: `SceneDefinition.textures: readonly { key: string; url: string }[]` (Zod: mảng, key duy nhất trong scene, url bắt đầu `/assets/`); mỗi `asset.texture` của scene phải thuộc `textures` hoặc là `ph_*` (validate ở game-content: lỗi đọc được, nêu scene + key). `CaseDefinition` (hoặc scene) mang danh sách `playerTextures` dạng `{ NE, SE, SW, NW: key }` và scene khai báo `npcFacing` nếu cần — implementer chọn vị trí nhỏ nhất sao cho **không còn** id nhân vật/URL Case #001 trong TS. `loadSceneTextures(scene: Phaser.Scene, textures: readonly TextureEntry[]): Promise<void>` nạp textures chưa tồn tại, gọi `console.warn('[Assets] failed to load <key>')` khi lỗi và vẫn resolve; `facingTextureKey` đổi để nhận map từ content thay vì ghép chuỗi.
- `BootScene` nạp texture của scene khởi đầu trước khi `WorldScene` start; `WorldScene.transitionTo` nạp texture scene đích (trong lúc fade-out) trước `scene.restart()`. Paper texture nạp ở boot (dùng chung). Chỉ nạp asset của scene hiện tại (`apps/game-web/AGENTS.md`).

- [ ] **Step 1:** Viết test lỗi: schema từ chối `url` không bắt đầu `/assets/`, key trùng, và `asset.texture` không thuộc `textures` (không phải `ph_*`); đọc content thật `main_office`/`archive` pass; `assetManifest.test.ts` cập nhật: mọi url trong content tồn tại dưới `apps/game-web/public`; grep test (Vitest đọc file) khẳng định `apps/game-web/src/game/**/*.ts` (trừ test) không chứa chuỗi `anna|leo|david|case-001` hay `/assets/`.
- [ ] **Step 2:** Chạy `npx nx run @lexicon/game-content:test` và `@lexicon/game-web:test` → FAIL.
- [ ] **Step 3:** Cài đặt theo Interfaces; chuyển toàn bộ danh sách texture trong `TEXTURE_MANIFEST` hiện tại sang JSON theo scene (office: floor, desk, note, recorder, door, player/NPC facing dùng trong scene; archive: floor, terminal, door, …). Chỉ scene nào dùng NPC nào thì nạp ảnh NPC đó. Đổi `dist` của game-content nếu build cần (chạy `npx nx run @lexicon/game-content:build`).
- [ ] **Step 4:** E2E `world.spec.ts` thêm: chặn (`page.route`) một URL texture của archive trả 404 → chuyển sang archive vẫn thành công, `console` có `[Assets] failed to load`, không có exception (Review Focus 1); hai lần đi lại office↔archive không phát sinh request lặp lại cho texture đã nạp (đếm request). `npm run test:e2e` PASS.
- [ ] **Step 5:** Commit `refactor(game): per-scene texture manifest in game-content`.

---

### Task 2: Tường thật và nội thất

**Files:** Modify `tools/art-codegen/scenes.py` (+ `props.py` nếu cần), `tools/art-codegen/assets_config.json`, `packages/game-content/cases/case-001/scenes/{main_office,archive}.json`, `assets/PROVENANCE.md`; Output `apps/game-web/public/assets/environment/**`.

**Interfaces:**
- Produces: `wall(kind) ` mới xuất **tường elevation thẳng** (nhìn trực diện, không xiên): office 2400×260, archive 2400×260, RGBA/opaque, có len chân tường, viền trên, chi tiết (bảng ghim/kệ + hộp lưu trữ/đèn) theo palette `docs/art/06` §5; config dest giữ tên `scene_office_wall_back.png` / `scene_archive_wall_back.png` (ghi đè output cũ, `targetWidth` 2400, không keyMagenta nếu render opaque). Scene JSON: `wall_back` đổi sang `tex_*_wall`, giữ collision rect hiện có (đúng chiều rộng, trên mép sàn); thêm prop trang trí (chair, plant, filing_cabinet, meeting_table, security_terminal đã có) với id mới dạng `decor_*` (type `prop`, có collision nhỏ ở chân), đặt sao cho mọi interactable và cửa vẫn tiếp cận được.

- [ ] **Step 1:** Test lỗi (Python `unittest` trong `tools/art-codegen`): ảnh wall render ra đúng 2400×260 và hàng trên cùng/dưới không trong suốt bất thường; E2E: với mỗi interactable trong scene, `teleport` cách 200px rồi đi bộ tới trong ≤ 4 s và `nearby()` bằng id đó (dùng danh sách id từ scene JSON đọc qua fixture, không hardcode text); player không xuyên `decor_*` (giữ nguyên pattern desk-collision).
- [ ] **Step 2:** chạy → FAIL.
- [ ] **Step 3:** Viết lại `wall()` (elevation), chạy pipeline (`build_game_assets.py`), thêm `decor_*` vào JSON và `textures` của scene (Task 1). Ghi provenance (công cụ: code renderer, không mô hình sinh ảnh). Mở ảnh đầu ra bằng Read; chụp màn hình cả hai scene bằng trình duyệt tích hợp/Playwright, **xem ảnh** rồi chỉnh vị trí đến khi cân đối, không đè interactable, không chặn đường tới cửa.
- [ ] **Step 4:** `python -m unittest` (venv) PASS; `npm run test:e2e` PASS; `npx nx run-many -t test` PASS.
- [ ] **Step 5:** Commit `feat(assets): straight back walls and scene decor`.

---

### Task 3: Ảnh evidence trong modal

**Files:** Modify `packages/shared-types` (EvidenceDefinition thêm `image?: string`), `packages/game-content/src/schema/*` + `cases/case-001/evidence*.json` (đặt `image` cho 3 evidence có PNG), `apps/game-web/src/evidence/EvidenceModal.tsx`, `evidence.css`, test `EvidenceModal.test.tsx`, `e2e`.

**Interfaces:** `EvidenceDefinition.image?: string` (đường dẫn `/assets/evidence/*.png`, validate như `textures`, file phải tồn tại — validate ở test game-web như manifest); modal hiển thị `<img alt="">` (mô tả có sẵn của evidence dùng cho nội dung chính, ảnh mang tính trang trí → `alt=""`), khung giấy, `max-width`, không làm mất focus trap.

- [ ] **Step 1:** Test lỗi: render `EvidenceModal` với evidence có `image` → có `img` với `src`; evidence không `image` → không có `img`; E2E: mở meeting_minutes → ảnh hiện và `naturalWidth > 0`.
- [ ] **Step 2:** chạy → FAIL. **Step 3:** cài đặt; ảnh lỗi tải (`onError`) ẩn ảnh, không vỡ layout. **Step 4:** test + E2E PASS. **Step 5:** commit `feat(game-web): show evidence artwork in modal`.

---

### Task 4: Đo và tối ưu paper overlay

**Files:** Create `docs/ai/2026-09-30-phase-11b-verification.md` (phần đo); Modify (nếu cần) `apps/game-web/src/game/paperOverlay.ts`, `WorldScene.ts`, `GameCanvas.tsx`, css.

**Interfaces:** nếu chuyển sang CSS: lớp `.game-paper-overlay` (position absolute, `pointer-events: none`, opacity 0.14, nền nhiễu SVG data URI) trong `.game-root` dưới HUD; `__lexiconDebug.paperOverlayAlpha()` đọc `getComputedStyle(...).opacity` (giữ hợp đồng test cũ `[0.10, 0.18]`). Không đổi alpha.

- [ ] **Step 1:** Đo FPS bằng trình duyệt tích hợp của app (có thể có GPU) và Playwright: script `requestAnimationFrame` đếm trong 5 s với overlay bật/tắt (thêm query dev-only `?noPaperOverlay=1` để tắt), 3 lần mỗi chế độ; ghi số vào ledger.
- [ ] **Step 2:** Quyết định: nếu FPS giảm > 15% ở trình duyệt có GPU thật **hoặc** nếu chỉ đo được headless (không có GPU) thì chọn phương án CSS (rẻ nhất trên mọi máy). Ghi ruling vào ledger. Test lỗi trước: E2E `paperOverlayAlpha ∈ [0.10, 0.18]` và overlay không chặn click (`elementFromPoint` tại giữa canvas không phải overlay).
- [ ] **Step 3:** Cài đặt phương án đã chọn (nếu giữ Phaser, chỉ ghi kết quả đo, không đổi code); xóa `generatePaperOverlayTexture`/texture nếu thành CSS và dọn test liên quan. **Step 4:** unit + E2E PASS. **Step 5:** commit `perf(game-web): cheaper paper overlay` hoặc `docs: record paper overlay measurement`.

---

### Task 5: Các minor code còn treo

**Files:** Modify `apps/game-web/src/game/scenes/WorldScene.ts`, `game/constants.ts`, `packages/game-content/cases/case-001/scenes/archive.json`, `apps/game-web/src/game/GameCanvas.tsx`, `e2e/world.spec.ts`, và file liên quan đến transcript Learning/âm lượng (`hud`/`evidence`/`audio`).

- [ ] **Step 1: Test lỗi cho từng mục:** (a) E2E marker: khi giảm chuyển động bật, `markerY()` bằng đúng `baseY` (đọc `baseY` từ `nearby` area + anchor qua debug hook nếu cần, hoặc so với giá trị khi offset = 0); marker đổi từ interactable A sang B không mang offset/vị trí của A. (b) Marker không che ngực player ở terminal archive: đứng sau terminal, `markerY()` < `player().y - 100` (marker nằm trên đầu). (c) Transcript hai lần khi bật Learning + phụ đề: test `EvidenceModal`/`ListeningTaskPanel` xác nhận transcript xuất hiện đúng một lần (tìm chỗ lặp qua `transcriptVisibility`). (d) Test hook âm lượng: `useMasterVolume` áp đúng giá trị và không gọi lại khi StrictMode mount đôi. (e) `GameCanvas.tsx` không còn warning lint `initialSceneId`.
- [ ] **Step 2:** chạy → FAIL (các mục chưa đúng).
- [ ] **Step 3:** Sửa: neo marker theo đỉnh sprite với khoảng hở tối thiểu để không phủ thân player; `CHARACTER_FIGURE_HEIGHT` chuyển vào content (`markerAnchorHeight` trên asset NPC/scene hoặc hằng giải thích rõ nguồn: chiều cao nhân vật trong `assets_config.json`) — nếu chọn hằng thì có comment + test khớp `assets_config.json`; đặt `depthBias` terminal về giá trị có comment lý do hoặc 0; sửa mọi lỗi (c)(d)(e). Không đổi luật game.
- [ ] **Step 4:** `npx nx run-many -t test lint`, `npm run test:e2e` PASS; lint không còn warning cũ. **Step 5:** commit `fix(game-web): resolve deferred marker, transcript and test gaps`.

---

### Task 6: Khung đi bộ và hoạt ảnh theo từng frame

**Files:** Create `tools/art-codegen/make_walk_frames.py` (+ `test_make_walk_frames.py`), `apps/game-web/src/game/entities/characterAnimations.ts` (+ test), `entities/shadow.ts`; Output `apps/game-web/public/assets/characters/<name>/chr_<name>_walk.png`; Modify `packages/shared-types`/`game-content` (khai báo sheet), `entities/Player.ts`, `scenes/WorldScene.ts`, `game/debug.ts`, `e2e/world.spec.ts`, `assets/PROVENANCE.md`, `docs/art/07_AI_ASSET_PROMPT_PACK.md` (mục prompt walk).

**Interfaces:**
- Hợp đồng sheet (theo `docs/art/06` mục Walk / sprite sheet, chỉnh theo khung 160): `chr_<name>_walk.png` = **8 cột × 4 hàng**, mỗi ô 160×160, hàng theo thứ tự `NE, SE, SW, NW`, chân ở 88% chiều cao ô, RGBA, 10 fps. Đây là hợp đồng chung cho **cả ảnh thủ tục lẫn ảnh thật** người dùng tạo sau (thay file cùng tên là chạy, không sửa code).
- `make_walk_frames.py` (venv Python): đọc 4 ảnh `chr_<name>_idle_<dir>.png` trong `public/assets/characters/<name>/`, sinh 8 khung/hướng bằng biến dạng thủ tục có kiểm soát — tách thân trên/chân theo đường hông (≈ 58% chiều cao figure); chân chia hai nửa theo cột giữa vùng chân: chân "bước" dịch ngang ±(5·sin φ) px và nhấc cao tối đa 3 px khi `sin φ > 0` (φ = 2π·k/8, chân kia lệch pha π); thân trên nhấp nhô `bob = 2·|sin φ|` px, nghiêng ±1.5° quanh hông, vai đối pha ±1 px; bàn chân không chìm dưới hàng 88%; nền trong suốt sạch (không viền); khung k=0 xấp xỉ pose idle. CLI: `make_walk_frames.py <name>|--all`. Ghi provenance (nguồn: code, biến dạng từ idle ChatGPT). Đây là giải pháp tạm thay ảnh thật.
- Content khai báo sheet (cùng chỗ với facing textures của Task 1): `characterSheets: { [name]: { idle: {NE,SE,SW,NW → key}, walk: key | null } }`; `textures` nạp spritesheet (`frameWidth/frameHeight = 160`). `characterAnimations.ts`: `registerCharacterAnimations(scene, name, sheetKey)` tạo `walk_<name>_<dir>` (8 khung, 10 fps, repeat -1); `walkAnimKey(name: string, facing: Facing): string` hàm thuần (`walk_player_se`). Nhân vật không có sheet (`walk: null`, ví dụ NPC đứng yên) dùng texture idle tĩnh.
- Hành vi: khi player di chuyển → `anims.play(walkAnimKey('player', facing), true)`; đổi hướng → anim mới, giữ frame hiện tại làm `startFrame`; khi dừng → `anims.stop()` và `setTexture` idle của hướng cuối. Kích thước/collider không đổi. Bóng `shadow_soft`: elip ink alpha 0.28, 44×16, vài lớp elip đồng tâm alpha thấp (không blur), dưới chân mỗi nhân vật, depth = depth nhân vật − 1, theo vị trí mỗi frame, destroy khi shutdown. **Ruling:** hoạt ảnh đi bộ là phản hồi di chuyển chức năng nên **không** bị tắt bởi giảm chuyển động (giảm chuyển động chỉ tắt hiệu ứng trang trí); ghi trong ledger.
- Dev hook `__lexiconDebug.playerAnim(): { key: string | null; frame: number | null; playing: boolean }`.
- Prompt ảnh thật: thêm vào `docs/art/07` mục "Walk sheet" (8 khung × 4 hướng cho từng nhân vật, cùng STYLE_LOCK, nền magenta, cùng lưới/khung/chân 88% để cắt được), kèm cách đặt file thay thế.

- [ ] **Step 1: Test lỗi:** Python `unittest`: (a) mỗi sheet đúng 1280×640; (b) mọi ô không rỗng, hàng dưới cùng của alpha bbox ≈ 141 ± 1; (c) 8 khung của một hướng không giống hệt nhau (≥ 5 khung khác biệt vượt ngưỡng pixel) và khoảng cách khung 7→0 không lớn hơn 1.5× khoảng cách trung bình giữa hai khung liền kề (vòng lặp liền mạch); (d) không pixel bán trong suốt có màu magenta. Vitest: `walkAnimKey('player','SE') === 'walk_player_se'`; đăng ký anim tạo 4 anim × 8 khung × 10 fps (fake scene tối thiểu hoặc qua E2E). E2E: giữ D → `playerAnim().playing` và `key` bắt đầu `walk_player_`, `frame` nhận ≥ 3 giá trị khác nhau trong 600 ms; nhả phím → `playing=false` và `playerTexture` là idle của hướng cuối; đổi hướng a→d giữa chừng không lỗi console; bật giảm chuyển động vẫn phát anim.
- [ ] **Step 2:** chạy → FAIL.
- [ ] **Step 3:** Cài đặt; chạy `make_walk_frames.py --all`; **xem** các sheet bằng Read (player đủ 4 hướng, khung 0/2/4/6) và chụp 3 khung trong game; chỉnh biên độ đến khi bước chân đọc được và không vỡ hình/đứt chân. Cập nhật content (Task 1) thêm spritesheet cho player.
- [ ] **Step 4:** `python -m unittest`, `npx nx run-many -t test lint`, `npm run test:e2e` PASS.
- [ ] **Step 5:** Commit `feat(game): walk sheets and per-frame character animation`.

---

### Task 7: Minimap (bản đồ nhỏ)

**Files:** Create `apps/game-web/src/hud/Minimap.tsx`, `minimap.css`, `Minimap.test.tsx`, `minimapModel.ts` (+ test); Modify `packages/shared-types/src/events.ts` (`'player:moved'`), `bridge/connectBusToStore.ts` (+ test), `state/gameStore.ts` (+ test), `hud/Hud.tsx`, `hud/KeyHints.tsx`, `UiStrings` (shared-types + schema game-content + ui strings JSON case-001: `minimapTitle` = "Bản đồ nhỏ", `toggleMap` = "Bản đồ"), `scenes/WorldScene.ts`, `e2e/hud.spec.ts`.

**Interfaces:**
- `GameEventMap['player:moved']: { x: number; y: number }`; `WorldScene` phát khi scene khởi tạo và sau đó tối đa mỗi 100 ms chỉ khi vị trí đổi ≥ 2 px (hàm thuần `shouldEmitPlayerMoved(prev, next, dtMs): boolean` có test). Store: `playerPosition: { x: number; y: number } | null` + `setPlayerPosition`; reset khi đổi scene. Đây là view được publish, không phải nguồn thứ hai (Phaser vẫn là nguồn vị trí).
- `buildMinimapModel(scene: SceneDefinition, playerPosition: { x: number; y: number } | null): { viewBox: string; solids: Rect[]; markers: { id: string; x: number; y: number; kind: 'interactable' | 'door' | 'npc' }[]; player: { x: number; y: number } | null }` — hàm thuần: `solids` từ `asset.collision` (toạ độ thế giới = asset.x + c.x…), markers từ `asset.interaction` (kind theo `asset.type`/transition), theo `worldBounds`. Không hardcode Case #001.
- `<Minimap />`: khung giấy góc phải-trên dưới `CaseProgress` (theo concept `docs/concept/ingame_main_office_hud.webp`), SVG; tường/vật cản nét mực `--lexicon-border`; interactable hình thoi nhỏ đỏ `--lexicon-investigation-red` (map marker được phép); cửa ô nhỏ; player chấm tròn mực + viền giấy; nhãn `strings.minimapTitle` ≥ 14px; `aria-label` mô tả; phím **M** bật/tắt (bỏ qua khi focus ở input/textarea/contenteditable — tái dùng `isTypingTarget`/`shouldHandleShortcut`), mặc định hiện; bị khóa khi case đóng/pause/modal như phím J; KeyHints thêm `M — Bản đồ`. Không lưu vào settings/save. Dưới 720 px rộng ẩn minimap để không đè HUD; không che `InteractionPrompt`/`ObjectivePanel`.

- [ ] **Step 1: Test lỗi:** `minimapModel.test.ts` (solid = collision đổi sang toạ độ thế giới; marker cho mọi asset có interaction; player null khi chưa có vị trí); `shouldEmitPlayerMoved` (dt<100 → false; dịch <2px → false; ≥2px và dt≥100 → true); bridge/store: `player:moved` cập nhật `playerPosition`, đổi scene reset; `Minimap.test.tsx`: số solids/markers theo model, nhãn có, phím M ẩn/hiện, M bị bỏ qua khi focus ở input; E2E: minimap hiện ở office, chấm player dịch chuyển sau khi đi bộ 500 ms, M ẩn rồi hiện lại, bounding box không giao với `Hồ sơ`/mục tiêu.
- [ ] **Step 2:** chạy → FAIL. **Step 3:** cài đặt; chụp màn hình và **xem** đối chiếu concept (vị trí, khung giấy, nhãn). **Step 4:** test + lint + E2E PASS. **Step 5:** Commit `feat(game-web): minimap with player marker and M toggle`.

---

### Task 8: Verification, kiểm tra tiếng Việt, cập nhật memory

**Files:** Create/Modify `docs/ai/2026-09-30-phase-11b-verification.md`, `docs/ai/MEMORY.md`.

- [ ] **Step 1:** Chạy đủ gate, ghi kết quả thật: `npm run lint`, `test`, `build`, `typecheck`, `format:check` (chỉ sửa file thuộc phase này), `test:e2e`, `memory:check`, `git diff --check`; backend không đổi thì không chạy.
- [ ] **Step 2:** Chụp HUD (có minimap), notebook, pause, evidence modal (có ảnh), archive, office, nhân vật đang đi bằng trình duyệt; **xem** và đối chiếu `docs/concept/ingame_main_office_hud.webp`; xác nhận dấu tiếng Việt đúng với Cambria (chụp cận một chuỗi có dấu thanh); ghi khác biệt còn lại (không tuyên bố giống concept nếu chưa xem).
- [ ] **Step 3:** Cập nhật `docs/ai/MEMORY.md` theo `docs/ai/README.md` (≤ 12 KB, Next Actions ≤ 5, Active Decisions ≤ 10; xóa deferred đã xử lý; giữ: điều khoản OpenAI là việc đầu tiên; **khung đi bộ hiện là thủ tục tạm — người dùng có thể tạo walk sheet thật theo `docs/art/07` và thay file cùng tên**; các minor cũ ngoài phạm vi nếu còn treo). Commit code trước, memory sau.

## Self-Review

- **Coverage:** manifest → T1; tường + nội thất + concept → T2; evidence modal → T3; FPS overlay → T4; marker/terminal/hằng số/transcript/lint/test hook → T5; khung đi bộ + hoạt ảnh theo frame + prompt ảnh thật → T6; minimap (docs/01 dòng 276 và docs/03 dòng 790 đã có phím `M Map`) → T7; verification/Cambria/memory → T8; điều khoản OpenAI → ngoài plan.
- **Phụ thuộc:** T2 dùng `textures` của T1; T5 dùng dữ liệu marker của T1/T2; T6 dùng sheet khai báo của T1; T7 dùng scene của T2 (solids) và tránh chồng HUD. Tên nhất quán: `textures`, `loadSceneTextures`, `characterSheets`, `walkAnimKey`, `playerAnim()`, `shadow_soft`, `player:moved`, `buildMinimapModel`.
- **Ngoài phạm vi:** khung đi bộ vẽ tay/AI (người dùng tạo sau), mọi đổi luật game, Phase 12.
