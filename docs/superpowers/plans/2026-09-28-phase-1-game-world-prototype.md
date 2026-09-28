# Phase 1 — Game World Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Player đi quanh Main Office dựng từ JSON, có collision, depth sort, camera follow và phát hiện interaction radius.

**Architecture:** Scene content (JSON + Zod) ở `game-content`; type thuần ở `shared-types`; logic di chuyển/depth/interaction là hàm TS thuần trong `game-web/src/game/systems`; `WorldScene` generic dựng từ `SceneDefinition`; Phaser báo interaction qua event bus có kiểu.

**Tech Stack:** TypeScript strict, Zod 3.25, Phaser 3.88 (Arcade Physics), React 18, Vitest 2, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-28-phase-1-game-world-prototype-design.md` (đọc kèm `docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md` §14–17, §27–34, §51–53).

## Global Constraints

- Chỉ npm + Nx; không thêm dependency mới (Zod, Phaser đã có).
- `game-core`, `learning-engine` không bị sửa.
- Không có text/ID Case #001 (`main_office`, `case-001`, `anna`, …) trong code `apps/game-web/src` ngoài test/e2e; scene/case id mặc định đọc từ content (`DEFAULT_START` export từ `game-content`).
- Không `any`, không `eval`, không global singleton (debug hook chỉ ở `import.meta.env.DEV`).
- Palette: Ink Black `#2A2521`, Paper Cream `#D8C5A4`, Light Beige `#CDBA97`, Warm Gray `#A89B87`, Dark Brown `#3E342B`, Muted Green `#737660`; đỏ `#A4412D` **chỉ** cho interaction marker.
- Player origin `(0.5, 0.88)`, body `30×18` ở chân, tốc độ `220` px/s; game `1920×1080`, `Scale.FIT`.
- Scene phải gỡ listener bàn phím và bus khi `shutdown`.

## Review Focus

- Người chơi đang gõ trong `input`/`textarea` (Phase sau có notebook) → WASD không được di chuyển player (test Task 3 `resolveInputVector` nhận `typing: true`).
- Giữ cả W+D → tốc độ chéo không được nhanh hơn 220 px/s (test Task 3 độ dài vector = 1).
- Player đi tới mép world → không ra ngoài `worldBounds` (e2e Task 4 giữ A lâu, x ≥ 0).
- React StrictMode mount 2 lần → không nhân đôi listener bus / không emit trùng `interaction:nearby` (e2e Task 5 đếm event = 1 khi vào radius).
- JSON scene sai → có panel lỗi đọc được, không trắng màn hình (unit test Task 1 message chứa path; Task 4 `GameCanvas` render lỗi).

---

### Task 1: Scene schema, loader và dữ liệu Main Office

**Files:**
- Modify: `packages/shared-types/src/index.ts`
- Create: `packages/shared-types/src/scene.ts`
- Create: `packages/game-content/src/schema/scene.ts`, `packages/game-content/src/loader/loadScene.ts`, `packages/game-content/src/loader/ContentValidationError.ts`
- Modify: `packages/game-content/src/index.ts`, `packages/game-content/tsconfig.json`
- Create: `packages/game-content/cases/case-001/scenes/main_office.json`
- Test: `packages/game-content/src/schema/scene.test.ts`, `packages/game-content/src/loader/loadScene.test.ts`

**Interfaces:**
- Produces (`@lexicon/shared-types`): `SceneDefinition`, `SceneAssetDefinition`, `SceneAssetType`, `RectCollision`, `InteractionArea` đúng shape spec §4.
- Produces (`@lexicon/game-content`): `sceneDefinitionSchema` (Zod), `parseSceneDefinition(raw: unknown, source: string): SceneDefinition`, `loadSceneDefinition(caseId: string, sceneId: string): SceneDefinition`, `class ContentValidationError extends Error { readonly source: string; readonly issues: string[] }`, `DEFAULT_START: { caseId: string; sceneId: string }` = `{ caseId: 'case-001', sceneId: 'main_office' }`.

- [ ] **Step 1: Viết test fail** `scene.test.ts`:
  - `accepts the Main Office scene` — `parseSceneDefinition(mainOffice, 'main_office.json').id === 'main_office'`.
  - `rejects missing spawn` — throw `ContentValidationError`, `issues` có phần tử chứa `spawn`.
  - `rejects duplicate asset ids` — issue chứa `assets` và `duplicate`.
  - `rejects spawn outside worldBounds` — issue chứa `spawn`.
  - `rejects interaction radius 0` — issue chứa `radius`.
  - `error message names the source file` — `err.message` chứa `main_office.json`.
  `loadScene.test.ts`: `loads DEFAULT_START scene`; `unknown scene throws ContentValidationError mentioning case and scene id`.
- [ ] **Step 2:** `npx nx run @lexicon/game-content:test` → FAIL (module không tồn tại).
- [ ] **Step 3:** Implement. Schema dùng `z.object(...).strict()` + `superRefine` cho unique id và spawn-in-bounds; `origin` mặc định `[0.5, 0.9]`, `depthBias` mặc định `0`. Loader dùng registry tĩnh `{ 'case-001': { main_office: mainOfficeJson } }` (import JSON). Sửa `tsconfig.json` game-content: `rootDir: "."`, `include: ["src", "cases/**/*.json"]`.
- [ ] **Step 4:** Tạo `main_office.json` (world/bounds `2400×1600`, spawn `(1200,1100)`), asset:

| id | type | texture | x,y | collision (offset) | interaction | khác |
|---|---|---|---|---|---|---|
| floor | background | ph_floor | 1200,800 | — | — | depth -1000, origin [0.5,0.5] |
| wall_back | wall | ph_wall | 1200,420 | -1200,-40,2400,40 | — | |
| player_desk | prop | ph_desk | 1200,800 | -110,-40,220,60 | — | |
| objective_note | interactable | ph_note | 1400,1100 | — | 0,0,90 | |
| anna | npc | ph_npc | 800,1000 | -15,-9,30,18 | 0,0,90 | |
| hallway_door | interactable | ph_door | 2100,700 | — | 0,20,80 | |

- [ ] **Step 5:** `npx nx run @lexicon/game-content:test` → PASS 8/8; `npm run typecheck` → PASS.
- [ ] **Step 6:** Commit `feat(content): add scene schema, loader and Main Office scene`.

### Task 2: Event bus có kiểu

**Files:** Modify `packages/shared-types/src/index.ts`; Create `packages/shared-types/src/events.ts`, `apps/game-web/src/bridge/eventBus.ts`; Test `apps/game-web/src/bridge/eventBus.test.ts`

**Interfaces:**
- Produces: `type GameEventMap = { 'interaction:nearby': { interactableId: string }; 'interaction:cleared': Record<string, never> }`; `createEventBus<M extends Record<string, unknown>>(): EventBus<M>` với `on<K>(event, handler): () => void` (trả hàm unsubscribe), `off<K>(event, handler): void`, `emit<K>(event, payload): void`.

- [ ] **Step 1:** Test fail: `delivers payload to subscribers`, `off stops delivery`, `unsubscribe returned by on works`, `emit with no subscribers is a no-op`, `handler added twice is called once` (dùng `Set`).
- [ ] **Step 2:** `npx nx run @lexicon/game-web:test` → FAIL.
- [ ] **Step 3:** Implement bằng `Map<keyof M, Set<handler>>`.
- [ ] **Step 4:** Test → PASS 5/5.
- [ ] **Step 5:** Commit `feat(bridge): add typed event bus`.

### Task 3: System thuần

**Files:** Create `apps/game-web/src/game/systems/{input,direction,depth,interaction}.ts` + `*.test.ts` tương ứng; Create `apps/game-web/src/game/constants.ts` (`PLAYER_SPEED = 220`, `PLAYER_ORIGIN = [0.5, 0.88]`, `PLAYER_BODY = { width: 30, height: 18 }`, `PALETTE`, `INTERACTION_RED = '#A4412D'`).

**Interfaces:**
- Produces:
  - `resolveInputVector(keys: { up: boolean; down: boolean; left: boolean; right: boolean }, typing: boolean): { x: number; y: number }`
  - `isTypingTarget(el: Element | null): boolean` (input/textarea/`isContentEditable`)
  - `type Facing = 'NE' | 'SE' | 'SW' | 'NW'`; `resolveDirection(vx: number, vy: number): Facing | null`
  - `computeDepth(feetY: number, depthBias?: number): number`
  - `type InteractableArea = { id: string; x: number; y: number; radius: number }`; `findNearestInteractable(pos: { x: number; y: number }, areas: readonly InteractableArea[]): InteractableArea | null`

- [ ] **Step 1:** Test fail:
  - input: no keys → `{0,0}`; right → `{1,0}`; up → `{0,-1}`; up+right → `x≈0.7071, y≈-0.7071`, `Math.hypot === 1`; left+right → `{0,0}`; `typing: true` + right → `{0,0}`.
  - `isTypingTarget`: `null` → false; object `{ tagName: 'INPUT' }`/`'TEXTAREA'` → true; `{ tagName: 'DIV', isContentEditable: true }` → true (cast qua `as unknown as Element`, không cần jsdom).
  - direction: `(1,-1)`→NE, `(1,1)`→SE, `(-1,1)`→SW, `(-1,-1)`→NW, `(0,0)`→null.
  - depth: `computeDepth(800) === 800`; `computeDepth(800, 25) === 825`.
  - interaction: không area → null; ngoài radius → null; đúng biên (distance === radius) → trả area; hai area cùng chứa → gần hơn; bằng khoảng cách → id nhỏ hơn theo `localeCompare`.
- [ ] **Step 2:** `npx nx run @lexicon/game-web:test` → FAIL.
- [ ] **Step 3:** Implement 4 file.
- [ ] **Step 4:** Test → PASS.
- [ ] **Step 5:** Commit `feat(game): add pure movement, depth and interaction systems`.

### Task 4: WorldScene — render, di chuyển, collision, depth, camera

**Files:**
- Create: `apps/game-web/src/game/textures.ts`, `apps/game-web/src/game/entities/Player.ts`, `apps/game-web/src/game/entities/createSceneAsset.ts`, `apps/game-web/src/game/scenes/WorldScene.ts`, `apps/game-web/src/game/debug.ts`
- Modify: `apps/game-web/src/game/scenes/BootScene.ts`, `apps/game-web/src/game/createGame.ts`, `apps/game-web/src/game/GameCanvas.tsx`, `apps/game-web/src/App.test.tsx`
- Create: `apps/game-web/e2e/world.spec.ts`

**Interfaces:**
- Consumes: `loadSceneDefinition`, `DEFAULT_START` (Task 1); `EventBus<GameEventMap>` (Task 2); systems + constants (Task 3).
- Produces:
  - `generatePlaceholderTextures(scene: Phaser.Scene): void` — tạo key `ph_floor, ph_wall, ph_desk, ph_note, ph_door, ph_npc, ph_player, ph_marker, ph_missing` (magenta).
  - `createGame(parent: HTMLElement, options: { scene: SceneDefinition; bus: EventBus<GameEventMap> }): Phaser.Game` — Arcade physics `gravity 0`, 1920×1080, `Scale.FIT`, scenes `[BootScene, WorldScene]`; truyền options qua `game.registry` key `'world'`.
  - `WorldScene` key `'World'`; `BootScene` gọi `generatePlaceholderTextures` rồi `scene.start('World')`.
  - `createSceneAsset(scene, asset): { sprite: Phaser.GameObjects.Image; body: Phaser.GameObjects.Zone | null }` — texture không có → `console.warn('[Scene] missing texture <key>')` + `ph_missing`; collider = static zone từ `collision` offset.
  - `installDebugHook(api: LexiconDebug): () => void` với `type LexiconDebug = { player(): { x: number; y: number; depth: number }; depthOf(id: string): number; nearby(): string | null; teleport(x: number, y: number): void }`, gán `window.__lexiconDebug` chỉ khi `import.meta.env.DEV`, trả hàm gỡ. (`teleport` bổ sung so với spec để test depth "phía trên bàn" không phụ thuộc đường đi — chỉ dev.)
  - `GameCanvas`: gọi `loadSceneDefinition(DEFAULT_START.caseId, DEFAULT_START.sceneId)` trong `try`; `ContentValidationError` → render `<pre role="alert">` với `message` + `issues`; tạo `createEventBus<GameEventMap>()` trong effect.

- [ ] **Step 1: Viết e2e fail** `world.spec.ts` (mỗi test `goto('/')`, đợi `window.__lexiconDebug`):
  - `player moves right while D is held` — giữ `d` 500 ms → `x` tăng ≥ 80.
  - `player cannot walk through the desk` — giữ `w` 3000 ms từ spawn → `y > 820` và `y < 1100`.
  - `player cannot leave the world` — giữ `a` 7000 ms → `x >= 0`.
  - `player in front of desk draws above it` — tại spawn: `player().depth > depthOf('player_desk')`.
  - `player behind desk draws below it` — `teleport(1200, 700)` → `player().depth < depthOf('player_desk')`.
  - `single canvas and no console errors` (giữ từ `boot.spec.ts`).
- [ ] **Step 2:** `npm run test:e2e` → FAIL (`__lexiconDebug` undefined).
- [ ] **Step 3:** Implement các file trên. Player: `physics.add.sprite`, `setOrigin(0.5,0.88)`, `body.setSize(30,18)` đặt offset để đáy body trùng feet, `setCollideWorldBounds(true)`; `physics.world.setBounds(worldBounds)`; `physics.add.collider(player, staticGroup)`. `update()`: đọc WASD qua `this.input.keyboard.addKeys('W,A,S,D')`, `resolveInputVector(keys, isTypingTarget(document.activeElement))` × `PLAYER_SPEED`, `setDepth(computeDepth(player.y))`. Camera `startFollow`, `setBounds`. `shutdown`: gỡ keys + debug hook. `App.test.tsx` giữ mock `createGame`, thêm mock `@lexicon/game-content` không cần (loader thuần).
- [ ] **Step 4:** Thêm unit test `GameCanvas renders a readable error for invalid content` trong `App.test.tsx`: mock `loadSceneDefinition` throw `new ContentValidationError('bad.json', ['spawn: Required'])` → `renderToString` chứa `role="alert"` và `spawn: Required`.
- [ ] **Step 5:** `npm run test:e2e` → PASS 7/7 (gồm boot); `npx nx run @lexicon/game-web:test` → PASS; `npm run build` → PASS và `grep -r "__lexiconDebug" apps/game-web/dist` không có kết quả.
- [ ] **Step 6:** Commit `feat(game): add data-driven WorldScene with movement, collision and depth`.

### Task 5: Interaction radius, marker và event

**Files:** Create `apps/game-web/src/game/systems/InteractionTracker.ts` + `InteractionTracker.test.ts`; Modify `WorldScene.ts`, `e2e/world.spec.ts`

**Interfaces:**
- Consumes: `findNearestInteractable`, `InteractableArea` (Task 3); `EventBus<GameEventMap>` (Task 2).
- Produces: `class InteractionTracker { constructor(bus: EventBus<GameEventMap>); update(pos, areas): string | null; readonly current: string | null }` — chỉ emit khi thay đổi: sang id mới → `interaction:nearby`; từ id → null → `interaction:cleared`.

- [ ] **Step 1:** Unit test fail: `emits nearby once when entering`, `does not re-emit while staying`, `emits cleared when leaving`, `switching directly between areas emits nearby with the new id`.
- [ ] **Step 2:** Test → FAIL; implement; test → PASS 4/4.
- [ ] **Step 3:** e2e fail: `entering the note radius reports it nearby` — giữ `d` 800 ms từ spawn → `nearby() === 'objective_note'`; giữ `a` 1500 ms → `nearby() === null`. `nearby event fires once per entry` — test đếm qua `window.__lexiconDebug.nearbyEvents()` (bổ sung vào `LexiconDebug`: số lần `interaction:nearby` đã emit) → sau khi vào radius = 1.
- [ ] **Step 4:** Tích hợp vào `WorldScene`: areas lấy từ asset có `interaction` (tọa độ = x + offset); marker `ph_marker` (28 px) hiện ở `(area.x, area.y - 90)`, tween `y -4` yoyo 1000 ms, ẩn khi null; depth marker `10000`.
- [ ] **Step 5:** `npm run test:e2e` → PASS; commit `feat(game): track interaction radius and show marker`.

### Task 6: Definition of Done + memory

**Files:** Modify `docs/ai/MEMORY.md`

- [ ] **Step 1:** Chạy và ghi output: `npm run lint`, `npm run test`, `npm run build`, `npm run format:check`, `npm run test:e2e`, `npm run memory:check`.
- [ ] **Step 2:** Cập nhật `MEMORY.md` (phase-1, status, commit, verification, next action: chờ người dùng yêu cầu Phase 2); `npm run memory:check` → PASS.
- [ ] **Step 3:** Commit `docs: record Phase 1 completion`.
