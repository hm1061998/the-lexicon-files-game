# Phase 11B — Giải quyết tồn đọng và hoạt ảnh nhân vật Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: dùng `subagent-driven-development` để thực thi từng task. Steps dùng checkbox (`- [ ]`).

**Goal:** Xóa các deferred của Phase 11 (tường thật, nội thất, manifest theo scene, ảnh evidence, overlay rẻ hơn, các minor code) và cho nhân vật chuyển động (đi bộ/đứng yên) chỉ với 4 ảnh idle.

**Architecture:** Texture manifest chuyển vào `packages/game-content` (theo scene) và được nạp theo scene. Tường/nội thất tạo bằng renderer code trong `tools/art-codegen` (không dùng AI). Hoạt ảnh nhân vật là **thủ tục** (squash/lean quanh điểm chân, bóng mềm) — hàm thuần `characterMotion` + áp lên sprite; không thêm ảnh.

**Tech Stack:** TypeScript strict, Phaser 3, React, Zod, Vitest, Playwright, Python (venv ngoài repo) cho tool ảnh.

**Spec:** Không có spec riêng; đây là yêu cầu trực tiếp của người dùng (2026-09-30), nguồn: `docs/ai/MEMORY.md` mục Active Decisions/Deferred, `docs/art/06` (§ shadow, style), `docs/superpowers/specs/2026-09-29-phase-11-visual-polish-design.md`. Quyết định thiết kế (Ruling): (1) không làm minimap — không có trong docs/01, /04, /06; (2) hoạt ảnh nhân vật thủ tục vì chỉ có 4 ảnh idle, không tạo thêm khung đi bộ; (3) điều khoản OpenAI là việc của chủ dự án, không thuộc plan này.

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
- Bật giảm chuyển động khi đang đi → sprite trở về scale/góc gốc ngay, không kẹt méo (Task 6).
- Đứng yên rồi đổi hướng nhanh (texture swap) không làm nhân vật giật scale (Task 6).

## File Structure

| File | Trách nhiệm |
| ---- | ----------- |
| `packages/shared-types/src/scene.ts`, `packages/game-content/src/schema/*` | Thêm `textures` theo scene (key→url) và trường content cần cho Task 1/3/5 |
| `apps/game-web/src/game/assetManifest.ts` | Chỉ còn helper nạp từ danh sách do content cung cấp |
| `tools/art-codegen/scenes.py`, `props.py` | Tường dạng elevation thẳng; prop trang trí |
| `apps/game-web/src/game/systems/characterMotion.ts` (+ test) | Hàm thuần chuyển động nhân vật |
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

### Task 6: Hoạt ảnh nhân vật thủ tục

**Files:** Create `apps/game-web/src/game/systems/characterMotion.ts`, `characterMotion.test.ts`, `entities/shadow.ts`; Modify `entities/Player.ts`, `scenes/WorldScene.ts`, `game/debug.ts`, `e2e/world.spec.ts`.

**Interfaces:**
- Produces: `characterMotion(input: { moving: boolean; timeMs: number; reduced: boolean; phaseOffset?: number }): { scaleX: number; scaleY: number; angle: number }` — hàm thuần. Giá trị: đứng yên = thở nhẹ `scaleY = 1 + 0.008·sin(2π·t/2400)` (`scaleX = 1`, `angle = 0`); đi bộ = nhịp bước 340 ms/chu kỳ: `scaleY = 1 + 0.035·|sin(π·t/340)|`, `scaleX = 1 − 0.02·|sin(π·t/340)|`, `angle = 2.2·sin(2π·t/680)` (độ); `reduced = true` → luôn `{1,1,0}`. Sprite có origin chân (0.5, 0.88) nên squash/lean quay quanh chân, **không** đổi `x/y` (body vật lý giữ nguyên). `createShadow(scene, target)`: texture `shadow_soft` sinh bằng code (elip ink alpha 0.28, 44×16, không blur — dùng vài lớp elip đồng tâm alpha thấp), đặt dưới chân, depth = depth nhân vật − 1, theo vị trí mỗi frame; ẩn khi giảm chuyển động **không** ẩn (bóng là tĩnh, không phải chuyển động). NPC dùng phase khác nhau (`hash(id)`), chỉ thở.
- Consumes: `resolveDirection`/`nextFacing`, `MotionSource.reducedMotion()`.

- [ ] **Step 1: Test lỗi:** `characterMotion.test.ts`: đứng yên t=0 → `{scaleX:1, scaleY:1, angle:0}`; đi bộ t=170 (đỉnh nhịp) → `scaleY ≈ 1.035`, `scaleX ≈ 0.98`; `reduced=true` mọi t → `{1,1,0}`; `angle` đối xứng qua chu kỳ 680 ms (`angle(170) ≈ −angle(510)`); giá trị luôn trong `scaleY ∈ [0.99, 1.04]`, `|angle| ≤ 2.2`. E2E: giữ D 500 ms → `__lexiconDebug.playerMotion()` (dev-only, trả `{scaleX, scaleY, angle}`) khác `{1,1,0}` ít nhất một mẫu trong 500 ms; nhả phím → sau 300 ms `angle` về ≈ 0; bật giảm chuyển động khi đang đi → mẫu kế tiếp bằng `{1,1,0}` (Review Focus 4); đổi hướng nhanh (a rồi d trong 100 ms) `scaleY` không vượt 1.04.
- [ ] **Step 2:** chạy → FAIL.
- [ ] **Step 3:** Cài `characterMotion`; trong `WorldScene.update` áp `player.setScale(...)`/`setAngle(...)` từ kết quả (dùng `this.time.now`); `moving = velocity ≠ 0`; NPC lưu sprite trong danh sách để áp thở; dọn khi cleanup; sinh shadow trong `Player.ts`/scene và chống rò (destroy khi shutdown). Không tween Phaser (tránh xung đột với cleanup).
- [ ] **Step 4:** `npx nx run-many -t test lint`; `npm run test:e2e` PASS; chụp 2 khung (đứng/đi) bằng trình duyệt và xem bằng mắt: méo nhẹ, không nhảy, bóng nằm đúng chân. **Step 5:** commit `feat(game-web): procedural character idle and walk motion with shadow`.

---

### Task 7: Verification, kiểm tra tiếng Việt, cập nhật memory

**Files:** Create/Modify `docs/ai/2026-09-30-phase-11b-verification.md`, `docs/ai/MEMORY.md`.

- [ ] **Step 1:** Chạy đủ gate, ghi kết quả thật: `npm run lint`, `test`, `build`, `typecheck`, `format:check` (chỉ sửa file thuộc phase này), `test:e2e`, `memory:check`, `git diff --check`; nếu `apps/api` không đổi thì không chạy backend.
- [ ] **Step 2:** Chụp HUD, notebook, pause, evidence modal (có ảnh), archive, office bằng trình duyệt; **xem** và đối chiếu `docs/concept/ingame_main_office_hud.webp`; xác nhận dấu tiếng Việt hiển thị đúng với Cambria (chụp cận một chuỗi có dấu thanh); ghi khác biệt còn lại (không tuyên bố giống concept nếu chưa xem).
- [ ] **Step 3:** Cập nhật `docs/ai/MEMORY.md` theo `docs/ai/README.md` (≤ 12 KB, Next Actions ≤ 5, Active Decisions ≤ 10; xóa các deferred đã xử lý; giữ: điều khoản OpenAI là việc đầu tiên; các minor cũ không thuộc phase này như Esc/`unknownSuspect`/feedback đọc lại nếu vẫn treo). Commit code trước, memory sau.

## Self-Review

- **Coverage:** manifest → T1; tường + nội thất + concept → T2 (minimap loại bằng ruling); evidence modal → T3; FPS overlay → T4; marker/terminal/hằng số/transcript/lint/test hook → T5; hoạt ảnh nhân vật → T6; Cambria/verification/memory → T7; điều khoản OpenAI → ngoài plan (chủ dự án).
- **Phụ thuộc:** T2 dùng `textures` của T1; T5 dùng dữ liệu marker của T1/T2; T6 dùng sprite Player/NPC do T1 nạp. Tên nhất quán: `textures`, `loadSceneTextures`, `characterMotion`, `playerMotion()`, `shadow_soft`.
- **Ngoài phạm vi:** khung đi bộ vẽ tay/AI, minimap, mọi đổi luật game, Phase 12.
