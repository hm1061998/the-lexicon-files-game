# Phase 11E — Thiết kế lại model và art tĩnh Office/Archive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay tường/sàn/cửa/props tĩnh của Main Office + Archive bằng một model thống nhất (footprint, collision, interaction, visual pivot, depth độc lập; tường là segment có opening) và art dimetric 2:1 cùng camera, sao cho người chơi đi bằng WASD từ spawn tới cửa và chuyển cảnh hai chiều.

**Architecture:** `SceneDefinition` thêm `footprint` cho asset và mảng `walls` (segment trục-thẳng với `openings`). Một hàm thuần `expandWalls` trong `packages/game-content` biến mỗi segment thành các `SceneAssetDefinition` kiểu `wall` (mỗi module 1 đơn vị logic, collision = footprint module, không có collider trong opening); `WorldScene` chỉ nối thêm các asset sinh ra vào `resolveSceneAssets` nên depth/occluder/collision hiện có dùng lại. Validator hình học trong `game-content` (overlap, collision ⊆ footprint, doorway clearance, reachability theo body thật của player) là cổng chặn mọi lệch giữa ảnh/collision/lối đi. Art sinh bằng renderer Python sẵn có với camera dimetric đúng 2:1, ghi thẳng vào `apps/game-web/public/assets/environment/`.

**Tech Stack:** TypeScript strict, Zod, Phaser 3, Vitest, Playwright, Python (`.venv-art-codegen`: numpy + Pillow, `unittest`), npm + Nx (npm không có trong PATH: dùng runner trực tiếp như trong `docs/ai/MEMORY.md`).

**Spec:** `docs/superpowers/specs/2026-09-30-phase-11e-office-archive-static-world-redesign-design.md` (đã duyệt). Bối cảnh: Task 2 của `docs/superpowers/plans/2026-09-30-phase-11e-controls-visual-ux.md` (commit `bcab0e5`) chưa đạt; plan này thay phần composition Office/Archive của Task 2 đó và phải xong trước Task 3 của plan cũ.

## Global Constraints

- Giữ 2D dimetric 2:1, ô tham chiếu `128×64`; projector `x=originX+(u-v)×64`, `y=originY+(u+v)×32−elevationPx` không đổi.
- Giữ nguyên ID scene, asset, interactable, texture key cần tương thích, evidence, dialogue, objective, transition target/spawn (`hallway_door` ↔ `PLACEHOLDER_archive_door`, spawn `default`/`from_archive`/`from_office`), luật điều tra và nội dung gameplay. Đổi được: placement, footprint, collision, kích thước, texture file, thành phần module.
- Không đổi player/NPC art, animation, WASD, UI/HUD, evidence, Case #001 content, learning, persistence, API, thương mại; không sửa scene ngoài Main Office + Archive; không thêm pathfinding/AI NPC/physics package/3D; không ghép cả phòng thành một ảnh phẳng.
- Giữ palette giấy/sepia, outline mực, hướng sáng của `docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md`; đỏ chỉ cho clue/evidence/objective/contradiction/selected/marker.
- Case content chỉ trong `packages/game-content` (JSON + Zod); không hardcode ID/text Case #001 trong React/Phaser; Phaser scene không chứa logic học; scene cleanup listener như cũ.
- Không thêm dependency. Mỗi asset mới/cập nhật có dòng trong `assets/PROVENANCE.md`.
- Không dùng pnpm/yarn/bun. Không push, không merge `dev→main`. Tiếng Việt cho mọi tài liệu trong `docs/superpowers/`.
- E2E không được teleport người chơi gần cửa để chứng minh traversal; chỉ dùng phím WASD/E thật.
- Không đánh dấu Task 2 cũ hoặc Phase 11E hoàn tất cho tới khi có bằng chứng và user review screenshot.

## Review Focus

- Wall piece chạm nhau tại cạnh module không được để khe hở collision (người chơi lọt qua tường) — test ở Task 3 với hai module liền kề.
- Opening ở mép segment (start = 0 hoặc end = length) và hai opening liền nhau phải tạo đúng số piece (0/1 piece), không tạo collider độ dài 0 hay âm — test ở Task 3.
- Footprint/collision khai báo lệch đơn vị (footprint nhỏ hơn collision, collision ra ngoài `worldBounds`) phải bị validator từ chối bằng thông báo nêu asset ID — test ở Task 3.
- Đổi `origin`, `scale` hoặc `elevationPx` của một prop không được làm dịch collision, floor anchor, interaction point hay depth nền — test ở Task 4.
- Spawn đích của chuyển cảnh (`from_office`/`from_archive`) không được nằm trong collision hoặc ngoài clearance — validator ở Task 3 kiểm tra mọi spawn, E2E hai chiều ở Task 6–7 xác nhận.
- Player bị nhét giữa hai vật cách nhau hẹp hơn body 0.36 không được coi là "reachable": flood-fill dùng đúng body 0.36×0.36 — test ở Task 3.

## Bản đồ file

| File | Trách nhiệm |
| --- | --- |
| `packages/shared-types/src/scene.ts` | Thêm `footprint`, `WallSegmentDefinition`, `WallOpening`, `SceneDefinition.walls` |
| `packages/game-content/src/schema/scene.ts` | Zod cho `footprint`, `walls`; ràng buộc dimetric |
| `packages/game-content/src/geometry/wallSegments.ts` (mới) | `expandWalls(walls, kind?)` thuần: segment → asset module + doorway rects |
| `packages/game-content/src/geometry/sceneGeometry.ts` (mới) | `validateSceneGeometry(scene)`: overlap/containment/clearance/reachability |
| `packages/game-content/src/loader/loadScene.ts`, `loadCaseDefinition.ts` | Gọi `validateSceneGeometry` khi parse scene |
| `apps/game-web/src/game/scenes/WorldScene.ts` | Nối `expandWalls(def.walls)` vào asset list; bỏ góc xoay tường |
| `apps/game-web/src/game/systems/sceneAssetResolver.ts` | Phơi `footprint`; test độc lập pivot/elevation |
| `tools/art-codegen/iso.py`, `tools/art-codegen/world_modules.py` (mới), `tools/art-codegen/build_environment.py` (mới) | Camera dimetric đúng 2:1; sàn/tường/cửa theo module; ghi vào `public/assets/environment` |
| `packages/game-content/cases/case-001/scenes/{main_office,archive}.json` | Migrate sang model mới |
| `apps/game-web/e2e/scene-layout.spec.ts` | Traversal WASD thật hai chiều; bỏ kiểm tra "wall art length" cũ |
| `docs/art/06_…`, `docs/art/07_…`, `assets/PROVENANCE.md`, `docs/ai/*` | Hợp đồng art/model, prompt pack, provenance, ledger, memory |

**Quy ước model (quyết định của plan, dùng xuyên suốt):**

- `footprint`: `{ u, v, width, height }` offset logic so với floor anchor, cùng kiểu với `collision`. `collision`, nếu có, phải nằm trong `footprint` (đóng). Asset dimetric kiểu `wall | prop` và `interactable` không phải surface-child bắt buộc có `footprint`.
- `origin`/`scale`/`elevationPx` chỉ là visual pivot/elevation; không bao giờ đổi footprint/collision/interaction/depth.
- `walls[]`: `{ id, kind: 'office'|'archive', axis: 'u'|'v', line: number, start: integer, end: integer, openings: [{ id, start: integer, end: integer }] }`. `axis: 'u'` = tường chạy dọc trục `u` tại `v = line`; `axis: 'v'` = chạy dọc `v` tại `u = line`. `start < end` và đều nguyên; opening nằm trong `[start, end]`, `start < end`, nguyên, không chồng nhau. Độ dày cố định `WALL_THICKNESS = 0.25` (hằng export từ `wallSegments.ts`), module dài đúng 1 đơn vị. Opening rộng ≥ `MIN_OPENING_WIDTH = 2`.
- Texture key module do `expandWalls` quy định: `tex_wall_<kind>_<axis>` và `tex_wall_<kind>_<axis>_cap_start|cap_end`; khung cửa: `tex_door_frame_<kind>_<axis>`; sàn: `tex_floor_<kind>`. Scene JSON phải khai báo các key này trong `textures` (validator kiểm tra).
- Body người chơi cho mọi kiểm tra hình học: `PLAYER_LOGICAL_BODY = { u: -0.18, v: -0.18, width: 0.36, height: 0.36 }` (export từ `sceneGeometry.ts`; giá trị khớp `e2e/scene-layout.spec.ts`). Clearance tối thiểu của doorway và hành lang chính: khe hở ≥ `0.36 + 0.6 = 0.96` đơn vị.

---

### Task 1: Khóa baseline và tái hiện lỗi traversal

**Files:**
- Modify: `apps/game-web/e2e/scene-layout.spec.ts` (đã có thay đổi chưa commit: log lỗi `drive`, test `the player can walk to the office exit…`)
- Create: `docs/ai/2026-09-30-phase-11e-static-world-baseline.md`

**Interfaces:**
- Consumes: `drive(page, route, targetId)`, `path(scene, from, target)`, `areas(scene)`, `open(page)` trong spec hiện có; `window.__lexiconDebug.{logicalPlayer,nearby,storeSceneId}`.
- Produces: hai test traversal bị `test.fixme` (Office→Archive, Archive→Office) mà Task 6–7 bỏ `fixme`; file baseline ghi nguyên nhân gốc.

- [ ] **Step 1: Chạy lại repro.** Mở dev server (`node node_modules/vite/bin/vite.js --port 5174 --host 127.0.0.1` trong `apps/game-web`), chạy `npx playwright test e2e/scene-layout.spec.ts -g "walk to the office exit" --reporter=line`. Expected: FAIL, `nearby` = `null`, điểm cuối `{u≈5.747, v≈4.164}`, route `[(8.125,7.125),(8.875,7.125),(8.875,4.625),(0.875,4.625)]`.
- [ ] **Step 2: Tìm vật cản thật (systematic-debugging).** Trong test tạm (không commit), dump `rects(office)` đang chặn quanh `u∈[4.4,6.2], v∈[3.6,5.2]` và so với đường đi theo `v=4.625` của body 0.36. Ghi vào baseline: (a) asset ID nào chặn (nghi `decor_desk_invest`, `decor_chair_desk_invest`, `decor_coat_rack_invest`, `partition_office_invest_e`), (b) planner `path()` có dùng cùng body/step với `WorldScene` không, (c) cửa `hallway_door` (u=0.4) nằm trong khe tường `west_wall_upper`/`west_wall_lower` (v 3.75–5.55) hay bị collider tường che, (d) `interaction.radius=80` px có với tới từ vị trí đứng được không.
- [ ] **Step 3: Thêm test Archive → Office** `the player can walk from the archive arrival spawn to the archive exit and transition back`, cấu trúc như test Office nhưng: `page` tới archive bằng cách `open` → đi Office→Archive thật (dùng test trên) rồi lấy `logicalPlayer()`, route từ spawn `from_office` tới `PLACEHOLDER_archive_door`, nhấn `e`, `expect(storeSceneId).toBe('main_office')`. Đánh dấu cả hai test bằng `test.fixme(...)` kèm comment `// Bỏ fixme ở Task 6/7 khi layout mới được migrate`.
- [ ] **Step 4: Ghi `docs/ai/2026-09-30-phase-11e-static-world-baseline.md`** (tiếng Việt): lệnh repro, output thực tế, kết quả Step 2, và discrepancy với content contract nếu có (spec §5: transition sai/thiếu phải báo cáo trước khi sửa). Không sửa content ở task này.
- [ ] **Step 5: Verify và commit.** `npx playwright test e2e/scene-layout.spec.ts --reporter=line`: các test hiện có pass, hai test traversal hiển thị skipped.

```bash
git add apps/game-web/e2e/scene-layout.spec.ts docs/ai/2026-09-30-phase-11e-static-world-baseline.md docs/superpowers/specs/2026-09-30-phase-11e-office-archive-static-world-redesign-design.md docs/superpowers/plans/2026-09-30-phase-11e-office-archive-static-world-redesign.md
git commit -m "test(e2e): lock office/archive traversal repro and baseline"
```

---

### Task 2: Schema và type cho footprint và wall segment

**Files:**
- Modify: `packages/shared-types/src/scene.ts`, `packages/game-content/src/schema/scene.ts`
- Test: `packages/game-content/src/schema/scene.test.ts`

**Interfaces:**
- Produces (shared-types): `LogicalRectFootprint = LogicalRectCollision`-shape `{ readonly u: number; readonly v: number; readonly width: number; readonly height: number }`; `SceneAssetCommon.footprint?: LogicalRectFootprint | undefined`; `WallOpening { readonly id: string; readonly start: number; readonly end: number }`; `WallSegmentDefinition { readonly id: string; readonly kind: 'office' | 'archive'; readonly axis: 'u' | 'v'; readonly line: number; readonly start: number; readonly end: number; readonly openings: readonly WallOpening[] }`; `SceneDefinition.walls?: readonly WallSegmentDefinition[] | undefined`.
- Produces (zod): `sceneDefinitionSchema` chấp nhận/từ chối các trường trên.

- [ ] **Step 1: Viết test fail** trong `scene.test.ts` (tên + assert):
  - `accepts a dimetric prop with footprint containing its collision`.
  - `rejects a dimetric wall/prop/interactable without footprint` → issue path `assets.<i>` message chứa `footprint`.
  - `rejects a collision that is not inside the footprint` → message chứa `collision must be inside footprint`.
  - `accepts walls with openings` (`{id:'west',kind:'office',axis:'v',line:0,start:0,end:12,openings:[{id:'hallway',start:4,end:6}]}`).
  - `rejects a wall with non-integer or reversed range`, `rejects an opening outside its wall`, `rejects overlapping openings`, `rejects an opening narrower than 2`, `rejects duplicate wall ids`, `rejects a wall in a legacy (non-dimetric) scene`.
- [ ] **Step 2: Chạy** `node node_modules/vitest/vitest.mjs run packages/game-content/src/schema/scene.test.ts` (từ repo root). Expected: FAIL.
- [ ] **Step 3: Implement** types như Interfaces và schema: `footprint` dùng lại `logicalCollisionSchema`-shape (không có `type`); thêm `wallOpeningSchema`, `wallSegmentSchema` (`.strict()`, `z.number().int()`), `walls: z.array(wallSegmentSchema).optional()`; trong `superRefine` thêm các kiểm tra ở Step 1 (containment = `footprint.u <= c.u && footprint.u+footprint.width >= c.u+c.width` tương tự `v`). `MIN_OPENING_WIDTH = 2` export từ `schema/scene.ts` và được `wallSegments.ts` (Task 3) import lại để một nguồn sự thật.
- [ ] **Step 4: Chạy lại test scene + toàn `game-content`** (`run packages/game-content`). Expected: schema test PASS; các scene JSON hiện có **vẫn hợp lệ** vì `footprint` chỉ bắt buộc khi scene có `walls` hoặc khi asset đã thuộc scene được migrate (điều kiện ràng buộc: bắt buộc footprint chỉ khi `scene.walls !== undefined`, để Task 6–7 bật dần từng scene).
- [ ] **Step 5: Commit**

```bash
git add packages/shared-types/src/scene.ts packages/game-content/src/schema/scene.ts packages/game-content/src/schema/scene.test.ts
git commit -m "feat(content): add footprint and wall segments to scene schema"
```

---

### Task 3: `expandWalls` và `validateSceneGeometry`

**Files:**
- Create: `packages/game-content/src/geometry/wallSegments.ts`, `packages/game-content/src/geometry/sceneGeometry.ts`
- Test: `packages/game-content/src/geometry/wallSegments.test.ts`, `packages/game-content/src/geometry/sceneGeometry.test.ts`
- Modify: `packages/game-content/src/index.ts` (export `expandWalls`, `WALL_THICKNESS`, `validateSceneGeometry`, `PLAYER_LOGICAL_BODY`), `packages/game-content/src/schema/scene.ts` (gọi `validateSceneGeometry` trong `parseSceneDefinition` sau khi schema hợp lệ và `scene.walls` có mặt, lỗi gom vào `ContentValidationError`)

**Interfaces:**
- Consumes: types Task 2; `MIN_OPENING_WIDTH`.
- Produces:
  - `WALL_THICKNESS = 0.25`.
  - `expandWalls(walls: readonly WallSegmentDefinition[]): { assets: SceneAssetDefinition[]; doorways: Array<{ id: string; wallId: string; center: LogicalPoint; rect: LogicalRectCollision }> }`. Mỗi module 1 đơn vị là một asset `type:'wall'`, `id: '<wallId>:<index>'`, `position` = tâm module trên tường, `texture` theo quy ước khóa, `origin`/`scale` lấy từ hằng của art (Task 5 chốt: xuất `WALL_MODULE_ART` ở đây, Task 5 cập nhật giá trị), `footprint` = `collision` = hình chữ nhật `1 × WALL_THICKNESS` (hoặc `WALL_THICKNESS × 1` với `axis:'v'`) căn quanh `position`; module đầu/cuối của mỗi run dùng texture `_cap_start`/`_cap_end`; không asset nào trong opening. Door opening sinh đúng một `doorways` entry.
  - `PLAYER_LOGICAL_BODY = { u: -0.18, v: -0.18, width: 0.36, height: 0.36 }`.
  - `validateSceneGeometry(scene: SceneDefinition): string[]` (mảng thông báo; rỗng = hợp lệ).

- [ ] **Step 1: Viết test `wallSegments.test.ts` (fail trước):**
  - `emits one module per unit and skips openings`: tường `axis:'v', line:0, start:0, end:12`, opening `4..6` → 10 asset, không asset nào có tâm `v∈(4,6)`.
  - `adjacent modules share an exact edge` (Review Focus 1): với mọi cặp module liền nhau, `a.v+a.collision.v+a.collision.height === b.v+b.collision.v` bằng `toBe` (số nguyên + 0.5 offset không sai số).
  - `opening at the wall edge removes leading/trailing piece` và `two openings separated by zero length produce no empty piece` (Review Focus 2): không asset có `width` hoặc `height` ≤ 0.
  - `uses cap textures only at run ends`.
  - `doorways carry a rect spanning the opening and wall thickness`.
- [ ] **Step 2: Viết test `sceneGeometry.test.ts` (fail trước), dùng scene tối thiểu dựng trong test:**
  - `accepts an open room with a doorway wide enough`.
  - `rejects overlapping solids between two props` (thông báo chứa cả hai asset ID).
  - `rejects a collision outside worldBounds` (Review Focus 3, thông báo chứa asset ID).
  - `rejects a doorway narrower than player body plus clearance` (đặt prop `0.3` đơn vị trong opening rộng 2 → khe còn lại < 0.96).
  - `rejects a spawn inside a solid` (Review Focus 5).
  - `rejects an interactable not reachable from default spawn` và `treats a 0.30 gap as closed for the 0.36 player body` (Review Focus 6).
  - `requires every declared wall texture key in scene.textures`.
- [ ] **Step 3: Chạy** `…vitest.mjs run packages/game-content/src/geometry`. Expected: FAIL (module chưa tồn tại).
- [ ] **Step 4: Implement `expandWalls`** (số nguyên, không dùng cộng dồn float). **Implement `validateSceneGeometry`:** (1) solids = mọi `collision` (tuyệt đối theo floor anchor, resolve `restsOn` chỉ để bỏ qua surface-child — surface-child không có collision sàn) + wall modules; (2) kiểm tra từng cặp solid không chồng (epsilon `1e-9`); (3) `collision ⊆ worldBounds`; (4) khe hở giữa doorway rect và solid liền kề, đo theo trục vuông góc hướng đi, ≥ `0.96`; (5) flood-fill trên lưới `0.125` dùng `PLAYER_LOGICAL_BODY` (ô hợp lệ nếu body tại ô không chồng solid và nằm trong bounds) từ spawn `default`; mọi spawn và mọi điểm tương tác (floor anchor + `interaction.x/y` của asset có `interaction`, NPC/interactable) phải có ô hợp lệ kề cận trong bán kính `0.6` đơn vị; transition door: ô hợp lệ trong `0.6` đơn vị của interaction point; (6) mọi key từ `expandWalls` có trong `scene.textures`.
- [ ] **Step 5: Nối vào `parseSceneDefinition`** (chỉ khi `walls` có mặt) và export trong `index.ts`.
- [ ] **Step 6: Chạy** `…vitest.mjs run packages/game-content` — Expected: toàn bộ PASS, scene JSON cũ không bị ảnh hưởng (không có `walls`).
- [ ] **Step 7: Commit**

```bash
git add packages/game-content/src
git commit -m "feat(content): expand wall segments and validate scene geometry"
```

---

### Task 4: Runtime dùng model mới

**Files:**
- Modify: `apps/game-web/src/game/scenes/WorldScene.ts` (quanh dòng 213–270), `apps/game-web/src/game/systems/sceneAssetResolver.ts`
- Test: `apps/game-web/src/game/systems/sceneAssetResolver.test.ts`, `apps/game-web/src/game/systems/occlusion.test.ts`

**Interfaces:**
- Consumes: `expandWalls` (Task 3), `SceneDefinition.walls`.
- Produces: `ResolvedSceneAsset.footprint: LogicalRectCollision | null` (resolver phơi footprint tuyệt đối tương đối floor anchor, không suy từ ảnh).

- [ ] **Step 1: Viết test fail** trong `sceneAssetResolver.test.ts`:
  - `visual origin, scale and elevationPx do not move collision, floor anchor or interaction anchor` (Review Focus 4): resolve cùng asset hai lần với `origin:[0.5,0.9]/scale:1/elevationPx:0` và `origin:[0.1,0.2]/scale:3/elevationPx:40`; assert `floorAnchor`, `collision`, `footprint` bằng nhau (`toEqual`), `interactionAnchor.u/v` bằng nhau, chỉ `visualAnchor.elevationPx` khác.
  - `exposes footprint independent of collision`.
  Trong `occlusion.test.ts`: `treats an expanded wall module of an interior partition as an occluder and a full-width outer wall as not` (asset do `expandWalls` sinh, `isOccluder(asset, worldWidth)`); nếu phân loại sai thì chỉnh predicate theo test, không theo giả định.
- [ ] **Step 2: Chạy** `…vitest.mjs run apps/game-web/src/game/systems`. Expected: FAIL.
- [ ] **Step 3: Implement** `footprint` trong resolver; trong `WorldScene.ts` đổi nguồn asset thành `[...def.assets, ...expandWalls(def.walls ?? []).assets]` và phản ánh tương tự ở chỗ khác đọc `def.assets` nếu có (grep `def.assets`); bỏ phụ thuộc vào `asset.angle` cho `wall` (modules không xoay). Không đổi `createSceneAsset` ngoài việc vẫn hỗ trợ `angle` cho asset cũ.
- [ ] **Step 4: Chạy** `…vitest.mjs run apps/game-web` và `npx tsc -b apps/game-web`. Expected: PASS, không lỗi type.
- [ ] **Step 5: Commit**

```bash
git add apps/game-web/src/game
git commit -m "feat(game): build walls from segments and expose footprint"
```

---

### Task 5: Art dimetric đúng 2:1 theo module

**Files:**
- Modify: `tools/art-codegen/iso.py` (thêm camera `"dimetric"`)
- Create: `tools/art-codegen/world_modules.py`, `tools/art-codegen/build_environment.py`, `tools/art-codegen/test_world_modules.py`
- Modify: `assets/PROVENANCE.md`, `docs/art/07_AI_ASSET_PROMPT_PACK.md`
- Output (commit): `apps/game-web/public/assets/environment/common/tex_floor_{office,archive}.png`, `environment/{office,archive}/wall_<axis>.png`, `wall_<axis>_cap_start.png`, `wall_<axis>_cap_end.png`, `door_frame_<axis>.png`

**Interfaces:**
- Produces (Python): `Cam("dimetric")` với elevation `30°` (`sin φ = 0.5` ⇒ cạnh trục chiếu đúng độ dốc 1:2); `world_modules.floor_diamond(kind, width_u, height_v) -> PIL.Image` (RGBA, kích thước `(W+H)*64 × (W+H)*32`, alpha = hình thoi chính xác của `worldBounds`); `wall_module(kind, axis, cap=None) -> Image` (đúng một đơn vị logic dọc trục, dày `WALL_THICKNESS`); `door_frame(kind, axis, opening_width=2) -> Image`; hằng `PX_PER_LOGICAL = 64` (x) và `WALL_HEIGHT_PX`. `build_environment.py` ghi các file trên (deterministic, seed cố định) vào `apps/game-web/public/assets/environment/...`.
- Produces (manifest cho TS): `WALL_MODULE_ART` trong `wallSegments.ts`: `{ origin: [number, number]; scale: 1 }` cho mỗi `axis` — lấy từ output của `build_environment.py` in ra (điểm neo của module = điểm giữa cạnh dưới sát sàn) rồi chốt vào TS.

- [ ] **Step 1: Viết `test_world_modules.py` (fail trước):**
  - `test_dimetric_axes_have_2_to_1_slope`: chiếu vector `(1,0,0)` và `(0,1,0)` bằng `Cam("dimetric").proj`; assert `abs(dy/dx) == 0.5` (`assertAlmostEqual`, 1e-9) với dấu ngược nhau cho hai trục.
  - `test_floor_diamond_size_and_corners`: với `(16,12)` ảnh `1792×896`; alpha ở bốn đỉnh hình thoi (±2 px) khớp `(u-v)*64`, `(u+v)*32`; pixel ngoài hình thoi có alpha `0`; hàng/cột biên trong hình thoi alpha `255` (seam khép kín).
  - `test_wall_module_footprint_alignment`: alpha bbox của `wall_module('office','u')` — mép dưới-trái/dưới-phải nằm trên đường thẳng độ dốc 0.5 đi qua hai đầu module; chiều rộng ảnh = `64*1 + độ dày chiếu`; với `axis='v'` đối xứng.
  - `test_wall_modules_tile_without_gap`: ghép hai module `u` liền nhau theo bước `(64,32)` px, không có cột alpha 0 giữa phần thân (`alpha>0` trên toàn dải thân).
  - `test_door_frame_fits_opening`: bề ngang đáy khung = `opening_width * 64` px (±2) và trong suốt ở giữa (alpha 0 ở ô ngay dưới dầm cửa).
  - `test_outputs_are_clean_alpha`: mọi PNG sinh ra không có pixel `alpha>0` mà RGB là magenta hoặc đen thuần (như `test_no_background_leaks` hiện có).
- [ ] **Step 2: Chạy** `.venv-art-codegen/Scripts/python.exe -m unittest discover -s tools/art-codegen -p "test_world_modules.py"`. Expected: FAIL.
- [ ] **Step 3: Implement** camera `dimetric` và các hàm Interfaces trên bộ vật liệu/palette hiện có của `iso.py`/`scenes.py` (tái dùng `_partition_materials`, kính mờ, plaster; đổi camera chứ không đổi palette). Sàn kind `office`: linoleum be + thảm đặt theo tọa độ logic đã biết trong module (khai báo trong hằng `OFFICE_RUG = (u, v, w, d)` để Task 6 chốt không chồng collision); `archive`: gạch xám lạnh + nắp cống. Không sinh bóng "giả footprint" trong module tường; bóng tiếp xúc chỉ là viền tối trong alpha ở chân tường.
- [ ] **Step 4: Audit props** (không đổi nếu đạt): viết test `test_props_share_camera_and_contact_row` kiểm tra mọi `prop_*` đang dùng bởi Office/Archive có alpha sạch (không magenta/đen), bbox đáy nằm ở hàng tiếp xúc sàn (`alpha` hàng cuối bbox ≥ 0.9 độ phủ tối đa) và tỉ lệ chiều cao/bề ngang nằm trong khoảng của sheet tham chiếu đã chốt trong `docs/art/06`. Prop nào fail: tái sinh bằng `props.py` (camera `iso` đang dùng) và ghi provenance; nếu cần camera `dimetric` thì thêm ở đây và chạy lại toàn bộ props để không lẫn hai camera.
- [ ] **Step 5: Chạy** `build_environment.py`, rồi toàn bộ `unittest discover -s tools/art-codegen`. Expected: PASS (các test cũ 35/35 + test mới). Xem ảnh bằng Read tool để kiểm tra bằng mắt: ghép một đoạn tường 4 module + cửa + sàn trên nền kem.
- [ ] **Step 6: Cập nhật `WALL_MODULE_ART`** trong `wallSegments.ts` theo số đo in ra; thêm test `wallSegments.test.ts` khẳng định `origin` khớp `(ảnh.width/2, ảnh.height−đáy)`/kích thước ảnh (đọc PNG header như `textureSize` trong e2e).
- [ ] **Step 7: Provenance + prompt pack.** Mỗi file mới một dòng `assets/PROVENANCE.md` (Code renderer `tools/art-codegen` — `world_modules.py`, camera dimetric 30°, không dùng model sinh ảnh; tự sinh bằng code). `docs/art/07`: thêm mục về camera dimetric đúng 2:1 (khác tham chiếu 35° của props), module 1 đơn vị, điểm neo, cấm front-view xoay.
- [ ] **Step 8: Commit**

```bash
git add tools/art-codegen apps/game-web/public/assets/environment assets/PROVENANCE.md docs/art/07_AI_ASSET_PROMPT_PACK.md packages/game-content/src/geometry/wallSegments.ts packages/game-content/src/geometry/wallSegments.test.ts
git commit -m "feat(art): dimetric wall, floor and door modules"
```

---

### Task 6: Migrate Main Office và traversal Office → Archive

**Files:**
- Modify: `packages/game-content/cases/case-001/scenes/main_office.json`, `apps/game-web/e2e/scene-layout.spec.ts` (`expectedAssetIds`, bỏ `fixme` test Office→Archive, bỏ test "wall art length matches its logical footprint" vì tường không còn là ảnh xoay), `packages/game-content/src/loader/loadCaseDefinition.test.ts`/`index.test.ts` nếu đếm asset.

**Interfaces:**
- Consumes: `walls`, `footprint`, texture keys Task 3/5.

- [ ] **Step 1: Quy tắc bố cục (validator Task 3 là cổng, không phải ý kiến).** Bounds `16×12`. Giữ 4 khu đọc được: khu điều tra (Tây-Bắc, có `player_desk` chứa `objective_note`), sảnh giữa (Anna/Leo/David, `decor_meeting_table` chứa `meeting_minutes`/`phone_recording` ở phòng họp Tây-Nam), hành lang tới cửa. Đường từ spawn `default` tới `hallway_door` và tới từng NPC/interactable có khe ≥ 0.96 và đi được thẳng theo 1–3 đoạn trục. Tường ngoài: `wall_back` dọc `v=0` (`axis:'u'`, 0→16), tường Tây `axis:'v', line:0` 0→12 với opening `hallway` `v∈[4,6]` (cửa tâm `v=5`). Vách trong là segment nguyên, opening cửa phòng họp rộng 2. Không còn asset `type:'wall'` thủ công trong JSON, không `angle` cho tường.
- [ ] **Step 2: Migrate.** Đặt `footprint` cho mọi prop/interactable/wall; `collision` ⊆ footprint (bàn, tủ, kệ: collision = footprint trừ mép thấp nếu cần tiếp cận, còn lại bằng). `hallway_door`: floor anchor trên tâm opening `(0, 5)`, **không collision**, `interaction` offset logic `(0.7, 0)` (đứng trong phòng), `transition` giữ nguyên `targetSceneId:'archive'`, `targetSpawnId:'from_office'`; spawn `from_archive` = `{u:0.9, v:5}`. Sàn: asset `floor` dùng `tex_floor_office` với `origin` tính từ projector sao cho đỉnh hình thoi (u=0,v=0) trùng `projectScenePoint(0,0)` (e2e test ở Step 3 khẳng định). Thêm `textures` mới, xóa texture tường/partition cũ không còn dùng (không xóa file PNG cũ trong task này; Task 8 dọn). Text surface-child (`objective_note`, `meeting_minutes`, `phone_recording`) giữ `restsOn`/`surfaceOffset` hiện có.
- [ ] **Step 3: Test fail trước** trong `scene-layout.spec.ts`: `main_office: floor diamond corners match projected worldBounds` (đọc PNG size + origin từ JSON, so với `projection`), `main_office: door opening has no collider` (không rect nào của `rects(scene)` giao `hallway_door` interaction point ± body trong opening), cập nhật `expectedAssetIds.main_office` theo JSON mới (giữ mọi ID công khai/NPC/interactable ở `expectedInteractableIds`). Chạy → FAIL với JSON cũ.
- [ ] **Step 4: Bỏ `test.fixme`** của test Office→Archive. Chạy `npx playwright test e2e/scene-layout.spec.ts e2e/world.spec.ts --reporter=line` (có dev server). Expected: test Office→Archive PASS bằng WASD thật; `world.spec.ts` PASS. Nếu route của `path()` không khớp chuyển động thực, sửa planner để dùng đúng `PLAYER_LOGICAL_BODY` và waypoint có dung sai, **không** nới layout để chiều test.
- [ ] **Step 5: Chụp screenshot Office 1280×720** vào `.superpowers/sdd/2026-09-30-phase-11e-static-world/` (test `scene review captures…` hiện có), xem bằng Read tool, ghi nhận seam sàn/tường, cửa khớp lỗ tường, depth player-sau-tường.
- [ ] **Step 6: Chạy** `…vitest.mjs run packages/game-content apps/game-web`, `npx tsc -b`. Expected: PASS.
- [ ] **Step 7: Commit**

```bash
git add packages/game-content apps/game-web/e2e/scene-layout.spec.ts
git commit -m "feat(content): rebuild main office from wall segments and footprints"
```

---

### Task 7: Migrate Archive và traversal Archive → Office

**Files:**
- Modify: `packages/game-content/cases/case-001/scenes/archive.json`, `apps/game-web/e2e/scene-layout.spec.ts` (`expectedAssetIds.archive`, bỏ `fixme` test Archive→Office)

- [ ] **Step 1: Quy tắc bố cục** như Task 6 cho Archive: cửa `PLACEHOLDER_archive_door` trên opening Tây `v∈[4,6]` (tâm `(0,5)`), spawn `from_office` = `{u:0.9, v:5}`, `default` hiện có vẫn hợp lệ theo validator hoặc được dời sang ô hợp lệ gần nhất (báo trong baseline ledger); kho kệ theo hàng song song trục `u` có lối đi ≥ 0.96; khu security (terminal + chair + desk) tới được; giữ `PLACEHOLDER_security_terminal`, evidence log ID, transition ID. Sàn `tex_floor_archive`, tường `kind:'archive'`.
- [ ] **Step 2: Test fail trước** như Task 6 Step 3 cho `archive` (floor corners, door no collider, `expectedAssetIds.archive`).
- [ ] **Step 3: Migrate JSON** tương tự Task 6 Step 2.
- [ ] **Step 4: Bỏ `test.fixme`** Archive→Office; chạy `npx playwright test e2e/scene-layout.spec.ts e2e/world.spec.ts e2e/hud.spec.ts --reporter=line` **hai lần** (`--repeat-each=2`). Expected: PASS; ghi lại nếu timeout chập chờn đã biết ở `objective_note` (ledger 11E Task 2) còn xuất hiện hay không.
- [ ] **Step 5: Chụp screenshot Archive 1280×720**, xem bằng Read tool.
- [ ] **Step 6: Chạy** `…vitest.mjs run packages/game-content apps/game-web`, `npx tsc -b`. Expected: PASS.
- [ ] **Step 7: Commit**

```bash
git add packages/game-content apps/game-web/e2e/scene-layout.spec.ts
git commit -m "feat(content): rebuild archive from wall segments and footprints"
```

---

### Task 8: Dọn dẹp, tài liệu, ledger, memory và phase gates

**Files:**
- Modify: `docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md` (§ scene model/collision/interaction/scene JSON: thêm `footprint`, `walls`, camera dimetric 30° cho module môi trường), `docs/architecture/ARCHITECTURE.md` nếu có mô tả scene JSON, `docs/ai/MEMORY.md`, `docs/superpowers/plans/2026-09-30-phase-11e-controls-visual-ux.md` (đánh dấu Task 2 cũ được thay bởi plan này; chỉnh Next Actions)
- Create: `docs/ai/2026-09-30-phase-11e-static-world-verification.md`
- Delete: PNG tường/partition/sàn cũ không còn được tham chiếu (kiểm bằng grep trên `packages/game-content/cases` và `tools/art-codegen/assets_config.json`), và các builder cũ trong `scenes.py` không còn được dùng (`wall`, `partition`, `PARTITIONS`, `BUILDERS` tương ứng) cùng test của chúng — chỉ xóa khi grep xác nhận không còn dùng; provenance cập nhật trạng thái "thay bởi".

- [ ] **Step 1: Dọn dẹp theo grep**, rồi chạy `unittest discover -s tools/art-codegen` và `…vitest.mjs run` toàn repo để chắc không vỡ tham chiếu.
- [ ] **Step 2: Cập nhật tài liệu hợp đồng** (tiếng Việt) và dòng `walls`/`footprint` trong ví dụ scene JSON; ghi quyết định camera 30° (2:1 đúng) cho module môi trường vs tham chiếu 35° của props.
- [ ] **Step 3: Chạy phase gates, dán output vào ledger**: `npm run lint`, `npm run test`, `npm run build` (nếu `npm` vắng trong PATH, ghi rõ và chạy runner tương đương: `eslint`, `vitest run`, `tsc -b`, `vite build`, `prettier --check`; không báo pass cho entrypoint chưa chạy); `validateRegisteredContent`; toàn bộ E2E (`world`, `scene-layout ×2 --repeat-each=2`, `dialogue`, `hud`, `learning`, `listening`, `settings`, `timeline`, `boot`); Python `unittest`; `git diff --check`; memory checks của `tools/ai-memory`. Backend không đổi.
- [ ] **Step 4: Cập nhật `docs/ai/MEMORY.md`** theo protocol `docs/ai/README.md`: `active_spec` → spec redesign, `active_plan` → plan này, trạng thái task, verification, latest handoff (Task 3–6 của plan controls-visual-ux vẫn còn). Chưa đánh dấu Task 2 cũ/Phase 11E hoàn tất cho tới khi user duyệt screenshot.
- [ ] **Step 5: Gửi screenshot Office + Archive cho user review** (đường dẫn trong `.superpowers/sdd/2026-09-30-phase-11e-static-world/`), nêu hạn chế còn lại.
- [ ] **Step 6: Commit**

```bash
git add docs assets tools packages apps/game-web/src apps/game-web/e2e apps/game-web/public
git commit -m "docs(ai): record phase 11E static world redesign"
```
