# Phase 11E — Điều khiển và hoàn thiện trải nghiệm Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn thiện WASD theo hướng màn hình, bố cục office/archive, khả năng dùng panel ở viewport desktop/compact và hoạt ảnh idle mềm cho player/NPC mà không đổi gameplay điều tra.

**Architecture:** Giữ logical `(u,v)` cho scene, collision và content; chuyển phím screen-space qua nghịch đảo projector trong pure helper, còn `WorldScene` tiếp tục sở hữu movement/presentation. Giữ UI ở React và scene composition trong JSON; mọi thay đổi đều nằm trong các ranh giới hiện có.

**Tech Stack:** TypeScript strict, Phaser 3, React, CSS, Vitest, Playwright, npm + Nx.

**Spec:** `docs/superpowers/specs/2026-09-30-phase-11e-controls-visual-ux-design.md`

## Global Constraints

- Chiếu dimetric 2:1 giữ `screenX=(u-v)×64`, `screenY=(u+v)×32−elevationPx`; scene/collision tiếp tục dùng logical `(u,v)`.
- WASD theo màn hình: W lên, A trái, S xuống, D phải; chuẩn hóa tốc độ screen-space; typing focus và input lock hiện có vẫn chặn di chuyển.
- Bốn hướng animation hiện có NE/SE/SW/NW; không thêm hướng, AI/pathfinding hoặc tự đi cho NPC.
- Giữ scene/asset/interactable IDs, evidence, dialogue, objective, trigger và ý nghĩa điều tra; chỉ đổi vị trí/footprint/scale hoặc asset composition.
- Art theo `docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md`; asset load qua manifest/content hiện có, không hardcode Case #001 trong React/scene.
- Evidence modal giữ focus trap, focus-visible, trả focus khi đóng, target điều khiển tối thiểu 44px và khóa gameplay input.
- Nhịp thở chỉ là presentation; không đổi feet/collider/depth/interaction/game state; `reducedMotion` giữ scale trung tính.
- Specs và plans trong `docs/superpowers/` viết bằng tiếng Việt; không bắt đầu Phase 12.
- Dùng npm + Nx và các script hiện có; không thêm dependency nếu native đủ dùng.

## Review Focus

- Phím đối nhau hoặc đủ bốn phím cùng lúc phải triệt tiêu theo từng trục; test trong Task 1 với W+S, A+D và W+A+S+D.
- Screen-cardinal vector nằm đúng ranh giữa hai sprite directions phải chọn hàng ổn định; test trong Task 1 với bốn hướng cardinal và vector gần ranh.
- Focus ở input/textarea/contenteditable trong khi nhấn WASD không làm player dịch chuyển; giữ/điều chỉnh E2E test trong Task 1.
- Ảnh evidence cao cùng listening controls ở viewport 760×600 không che header/đóng hoặc làm mất nội dung cuộn; test browser ở Task 3.
- Chuyển idle↔walk/dialogue/reduced-motion, frame delta lớn và NPC phase offset không được tạo scale giật hoặc NaN; test helper và browser ở Task 5.

---

### Task 1: Điều khiển WASD theo màn hình và hướng animation

**Files:**
- Modify: `apps/game-web/src/game/systems/isoInput.ts`
- Test: `apps/game-web/src/game/systems/isoInput.test.ts`
- Modify: `apps/game-web/src/game/systems/direction.ts`
- Test: `apps/game-web/src/game/systems/direction.test.ts`
- Modify: `apps/game-web/src/game/scenes/WorldScene.ts`
- Modify: `apps/game-web/src/hud/KeyHints.tsx`, `apps/game-web/src/hud/hud.css` nếu cần để hiển thị hướng WASD.
- Test: `apps/game-web/e2e/world.spec.ts`, `apps/game-web/e2e/scene-layout.spec.ts`
- Modify: `docs/01_GAME_DESIGN_DOCUMENT.md`, `docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md`

**Interfaces:**
- Consumes: `MovementKeys`, `IsoProjection`, `LogicalPoint`, `movePlayer()` và projector/collision resolver hiện có.
- Produces: `resolveIsoInput(keys: MovementKeys, typing: boolean): LogicalPoint` trả logical vector từ screen intent; `screenSpeedVector(direction: LogicalPoint, projection: IsoProjection, speedPxPerSecond: number): LogicalPoint` tiếp tục chuẩn hóa vận tốc màn hình; `resolveDirection(vx: number, vy: number): Facing | null` có tie rule xác định từ screen vector.

- [ ] **Step 1: Viết test unit thất bại** cho W/A/S/D lần lượt tạo screen vector (0,−1)/(−1,0)/(0,1)/(1,0) sau projection; test bốn hướng chéo, giữ tốc độ screen bằng nhau, W+S, A+D, bốn phím triệt tiêu và typing focus.
- [ ] **Step 2: Chạy test input/facing** bằng `npx nx test @lexicon/game-web --run src/game/systems/isoInput.test.ts src/game/systems/direction.test.ts` (hoặc lệnh Vitest tương ứng hiện có); xác nhận test mới thất bại vì mapping cũ.
- [ ] **Step 3: Implement screen-to-logical inverse** trong `isoInput.ts` theo projector `u=screenX/128+screenY/64`, `v=screenY/64−screenX/128`; giữ screen-speed normalization và vector zero khi typing/đối hướng.
- [ ] **Step 4: Viết test direction thất bại rồi cập nhật facing** để lấy vector màn hình thực của intent/velocity, áp tie rule ổn định cho NW/NE/SE/SW sprite rows; cập nhật `WorldScene.updateLogicalMovement()` để không tự dựng vector direction bằng công thức cũ.
- [ ] **Step 5: Cập nhật HUD và tài liệu điều khiển** để chỉ dẫn WASD phản ánh hướng màn hình, đồng thời sửa mapping bàn phím trong `docs/01_GAME_DESIGN_DOCUMENT.md` và art/06; giữ logical trục/projector contract nguyên vẹn.
- [ ] **Step 6: Cập nhật E2E**: test mỗi phím di chuyển đúng hướng screen; sửa các giả định cũ như D→NE, helper điều hướng scene-layout chọn phím từ projected waypoint, và xác nhận typing/modal/input-lock, obstacle/side-slide, interaction/transition còn đúng.
- [ ] **Step 7: Chạy unit + E2E liên quan**, xác nhận pass và kiểm tra `git diff --check`.
- [ ] **Step 8: Commit** với thông điệp `feat(game): move with screen-relative WASD`.

### Task 2: Hoàn thiện composition office và archive

> **Trạng thái:** Implementation cũ `bcab0e5` không đạt nghiệm thu; các checkbox dưới đây chỉ ghi lịch sử đã thực thi. Task 2 được thay bởi [plan redesign static world](2026-09-30-phase-11e-office-archive-static-world-redesign.md). Chưa đánh dấu Task 2/Phase 11E hoàn tất và chưa bắt đầu Tasks 3–6 cho tới khi redesign qua gates và người dùng duyệt screenshot Office/Archive.

**Files:**
- Modify: `packages/game-content/cases/case-001/scenes/main_office.json`
- Modify: `packages/game-content/cases/case-001/scenes/archive.json`
- Test: `apps/game-web/e2e/scene-layout.spec.ts`
- Modify asset manifest/provenance chỉ khi cần asset đã có trong repo; không sinh asset mới trong task này.

**Interfaces:**
- Consumes: `SceneDefinition`, projection/content validators, obstacle/path helpers hiện có và WASD screen-relative từ Task 1.
- Produces: hai scene JSON giữ nguyên public IDs/gameplay contract nhưng có logical placement, footprint, scale và đường đi được rà lại.

- [x] **Step 1: Thêm test scene contract thất bại** cho tập scene/asset/interactable IDs, spawn bounds, doorway, evidence/interactables và path reachability trước khi chỉnh composition.
- [x] **Step 2: Chạy test scene-layout/content** để ghi nhận baseline; giữ mọi test reachability hiện hữu.
- [x] **Step 3: Chỉnh vị trí/footprint/scale bằng asset modular hiện có** để sàn, back/side walls và cửa khép mép; nhóm nội thất theo khu chức năng, giữ lối đi rõ, spawn/doorway không bị block.
- [x] **Step 4: Kiểm tra screenshot office 1280×720 và archive 1280×720** trong browser; sửa seam, tường lạc mép, props che đường đi hoặc depth nếu có.
- [x] **Step 5: Chạy content validation và toàn bộ `scene-layout.spec.ts`**, gồm ID preservation, path từ từng spawn tới mọi interactable, evidence trên mặt bàn, hai chiều door transition; chụp lại screenshot review.
- [x] **Step 6: Commit** với thông điệp `feat(content): refine office and archive layouts`.

### Task 3: Evidence modal có header cố định và body cuộn nội bộ

**Files:**
- Modify: `apps/game-web/src/evidence/EvidenceModal.tsx`
- Modify: `apps/game-web/src/evidence/evidence.css`
- Test: `apps/game-web/src/evidence/EvidenceModal.test.tsx`
- Test: `apps/game-web/e2e/world.spec.ts` (hoặc file E2E evidence-modal chuyên biệt nếu đã có pattern phù hợp).

**Interfaces:**
- Consumes: props/callback hiện có của `EvidenceModal`, `getFocusTrapTarget()`, `ListeningTaskPanel`.
- Produces: dialog shell bị ràng buộc theo viewport; header/title/close luôn nhìn thấy; nội dung art/description/transcript/question/controls nằm trong vùng cuộn nội bộ.

- [ ] **Step 1: Viết test render thất bại** xác nhận dialog có header và vùng nội dung scrollable tách biệt, vẫn render đủ evidence description, ảnh và listening controls khi có.
- [ ] **Step 2: Chạy `EvidenceModal.test.tsx`** để xác nhận cấu trúc mới chưa có.
- [ ] **Step 3: Tách markup header/body** với vùng nội dung có `min-height: 0; overflow-y: auto`; giới hạn panel theo viewport, giữ header cố định khi cuộn và close button có target ≥44px.
- [ ] **Step 4: Bổ sung Playwright kiểm tra 1280×720 và 760×600** với evidence có ảnh lớn + listening task; xác nhận header/close luôn trong viewport, body cuộn được tới control cuối, Tab/Shift+Tab trap hoạt động, close trả focus và thao tác modal không di chuyển player.
- [ ] **Step 5: Chạy unit và E2E modal** ở hai viewport, xem screenshot/layout thực tế, sửa overflow ngang hoặc vùng focus bị che nếu phát hiện.
- [ ] **Step 6: Commit** với thông điệp `fix(ui): keep evidence controls visible while scrolling`.

### Task 4: Rà soát nhịp UI HUD, notebook và pause

**Files:**
- Modify khi phát hiện vấn đề cụ thể: `apps/game-web/src/hud/KeyHints.tsx`, `apps/game-web/src/hud/hud.css`, `apps/game-web/src/notebook/notebook.css`, `apps/game-web/src/pause/pause.css` và component liên quan.
- Test: browser layout tests trong `apps/game-web/e2e/`.

**Interfaces:**
- Consumes: theme token/palette và component API hiện có từ `@lexicon/ui`; không thay đổi gameplay, state ownership hoặc nội dung học.
- Produces: HUD/notebook/pause có hierarchy, spacing, chữ/focus/hit target đồng nhất ở desktop 1280×720 và compact 760×600.

- [ ] **Step 1: Viết browser assertions** cho không tràn viewport, nút keyboard-focus rõ và target thao tác hiện hữu đạt ít nhất 44px nơi chuẩn UI yêu cầu; chạy để phát hiện baseline.
- [ ] **Step 2: Chụp/đánh giá HUD, notebook, pause** ở hai viewport và ghi đúng selectors/điểm lệch trong test.
- [ ] **Step 3: Chỉnh spacing, typography và button sizing tối thiểu** theo token/palette giấy hiện có; không biến paper UI thành dashboard và không thêm màu đỏ ngoài vùng được phép.
- [ ] **Step 4: Chạy browser assertions + E2E liên quan**, xác nhận focus-visible và không có clipping/overlap ở cả hai viewport.
- [ ] **Step 5: Commit** với thông điệp `style(ui): align HUD and panel spacing`.

### Task 5: Nhịp thở mềm cho player và NPC

**Files:**
- Modify: `apps/game-web/src/game/systems/breathing.ts`
- Test: `apps/game-web/src/game/systems/breathing.test.ts`
- Modify: `apps/game-web/src/game/scenes/WorldScene.ts`
- Test: `apps/game-web/e2e/world.spec.ts`

**Interfaces:**
- Consumes: scene clock `timeMs/deltaMs`, `breathingPhaseOffset(characterId)`, trạng thái movement/dialogue/reduced-motion và scale API của Phaser sprite.
- Produces: `updateBreathingWeight(currentWeight: number, idle: boolean, deltaMs: number): number` và `breathing(state: BreathingState): { scaleX: 1; scaleY: number }`, với `BreathingState={timeMs:number; phaseOffset:number; idleWeight:number; reducedMotion:boolean}`; per-actor blend state do `WorldScene` sở hữu, không dùng timer/global singleton.

- [ ] **Step 1: Viết test unit thất bại** cho amplitude ±0.0035, period 3200ms, phase offset khác nhau; reducedMotion trả scale trung tính; `updateBreathingWeight` clamp weight 0..1, bỏ qua delta âm, cap delta ở 100ms và không tạo NaN.
- [ ] **Step 2: Chạy `breathing.test.ts`** xác nhận helper chưa hỗ trợ envelope/blend mới.
- [ ] **Step 3: Implement `updateBreathingWeight(currentWeight, idle, deltaMs)`** tiến/lùi tuyến tính trong 450ms, cap `deltaMs` tối đa 100ms; implement `breathing(state)` với `scaleY=1+sin((timeMs/3200)×2π+phaseOffset)×0.0035×idleWeight`, `scaleX=1`, và neutral scale khi reduced motion.
- [ ] **Step 4: Thêm browser tests thất bại** cho player và NPC: idle scale dao động nhỏ/liên tục; walk/dialogue/reduced-motion về trung tính theo blend; feet screen position/collider/logical position không đổi.
- [ ] **Step 5: Tích hợp per-actor weight vào `WorldScene`** cho player/NPC trên scene clock; khi walking/dialogue/reducedMotion bắt đầu hoặc kết thúc thì blend weight tiến/lùi có delta cap, mỗi NPC giữ phase offset ổn định; reset/cleanup state theo scene lifecycle.
- [ ] **Step 6: Chạy unit và E2E** với idle→walk→idle, dialogue→idle và reduced-motion; lặp E2E animation nếu runner hỗ trợ để loại flake; kiểm tra screenshot/scale range và foot anchor.
- [ ] **Step 7: Commit** với thông điệp `fix(game): blend character idle breathing`.

### Task 6: Tích hợp, tài liệu và full phase gates

**Files:**
- Modify tài liệu authoritative vừa bị thay đổi nếu các task trước còn discrepancy: `docs/01_GAME_DESIGN_DOCUMENT.md`, `docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md`, `apps/game-web/AGENTS.md`.
- Test: toàn bộ unit/E2E/content checks theo `AGENTS.md`.
- Modify: `docs/ai/MEMORY.md` trong commit bàn giao riêng sau commit verification.

**Interfaces:**
- Consumes: kết quả Tasks 1–5 và tiêu chí nghiệm thu trong spec.
- Produces: Phase 11E hoàn chỉnh có kiểm tra full repo, screenshot review và memory pointer tới verification/current state.

- [ ] **Step 1: Rà spec từng mục**; cập nhật docs điều khiển/art contract cần thiết, kiểm tra manifest/provenance nếu có asset thay đổi, và xác nhận không thay đổi product/content IDs.
- [ ] **Step 2: Chạy `npm run lint`, `npm run test`, `npm run build`, `npm run typecheck`, `npm run format:check`, `npm run memory:check`, `npm run memory:test`**; khi sửa `apps/api`, chạy thêm `dotnet build` và `dotnet test`.
- [ ] **Step 3: Chạy E2E đầy đủ** qua `npm run test:e2e`; lặp test scene-layout và movement/breathing nhạy thời gian; kiểm tra screenshot ở 1280×720 và 760×600.
- [ ] **Step 4: Nếu npm/Nx target không khởi chạy do môi trường thiếu npm trong PATH**, dùng direct local runners tương đương đã có trong workspace và ghi chính xác lệnh/output; không tuyên bố các Nx entry point đã pass.
- [ ] **Step 5: Chạy `git diff --check`, review toàn bộ diff so với spec/guardrails**, ghi kết quả và giới hạn vào `docs/ai/2026-09-30-phase-11e-verification.md`; commit code/docs/verification.
- [ ] **Step 6: Cập nhật `docs/ai/MEMORY.md` theo protocol**: active plan, status/result commit, tests gần nhất và next action; chạy memory check/test, rồi commit memory riêng.
