# Phase 11D — Chuyển Case #001 sang isometric dimetric 2:1: Kế hoạch triển khai

> **Dành cho agent:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Người dùng đã chọn native inline execution; không giao implementation cho subagent.

**Mục tiêu:** Chuyển toàn bộ scene chơi được Case #001 sang projection dimetric 2:1, với di chuyển/collision/nội dung/asset đúng hệ tọa độ và các cải thiện scene/NPC đã chốt trong spec.

**Kiến trúc:** `game-content` lưu tọa độ mặt sàn logic `(u,v)`; pure spatial helpers xử lý projection, collision và tương tác; Phaser vẽ ở tọa độ chiếu và phát typed events; React chỉ đọc store/event. Scene được chuyển theo projector chung; nội dung vụ án, ID, effects, save và ranh giới package được giữ nguyên.

**Công nghệ:** TypeScript strict, Phaser 3, React, Zustand, Zod, Vitest, Playwright, Nx/npm, Python art-codegen hiện có và ImageGen cho asset walk mới.

**Đặc tả:** `docs/superpowers/specs/2026-09-30-phase-11d-scene-and-character-feedback-design.md`

## Ràng buộc chung

- Projection dimetric 2:1, cell tham chiếu 128×64 px: `screenX = originX + (u-v)×64`; `screenY = originY + (u+v)×32 - elevationPx`.
- Trục `u+` theo SE, `v+` theo NE; input `W=NW`, `D=NE`, `S=SE`, `A=SW`; chuẩn hóa vận tốc theo screen-space.
- Tọa độ content, spawn, collision, interaction, labels và minimap đều logical; render anchor được project đúng một lần.
- Gameplay physics/collision không dùng AABB screen-space. Không thêm dependency. `game-core` và `learning-engine` không import UI/Phaser/DOM.
- React↔Phaser chỉ qua `GameEventMap` và Zustand; Phaser không gọi backend; IDs/effects/dialogue semantics/persistence giữ nguyên.
- Asset bốn hướng NE/SE/SW/NW, walk sheet 8×4, 10 fps, frame 160×160, figure ~100 px, feet line 88%; ghi provenance.
- Spec/plan và cập nhật tài liệu dự án bằng tiếng Việt. Chỉ làm Phase 11D; không push nếu chưa được yêu cầu.

## Trọng tâm rà soát

1. Projector/inverse-projection sai trục hoặc áp hai lần — Task 1 kiểm tra bốn trục, round-trip, scene origin và camera conversion.
2. Collision logic khác hình chiếu hoặc lỗi ở góc tường/gap cửa — Task 2 test footprint, hai trục, corner sliding, world edge; Task 5 BFS kiểm tra reachability.
3. Interaction radius/anchor lệch sau khi chiếu hoặc khi camera zoom/resize — Task 3 test world→canvas tại zoom 1 và zoomed; Task 5 E2E kiểm marker, prompt, E trigger.
4. Tabletop evidence bị depth-sort dưới mặt bàn, marker neo vào chân bàn — Task 4 unit/E2E kiểm anchor/occlusion/depth.
5. Texture thiếu, walk frame không đồng bộ chân, hướng animation lộn — Task 6 content/art validator; Task 7 runtime test player và NPC animation registration.

---

### Tác vụ 1: Projection dimetric và hợp đồng tọa độ content

**Tệp:** `apps/game-web/src/game/systems/isometricProjection.ts` (+ test); `packages/shared-types/src/scene.ts`; `packages/game-content/src/schema/scene.ts` (+ test); scene fixture builders; hai scene JSON khai báo projection metadata nhưng chưa đổi vị trí.

**Giao diện:**
- `type LogicalPoint = { u: number; v: number }`; `type ScreenPoint = { x: number; y: number }`.
- `IsoProjection = { type: 'dimetric-2:1'; originX: number; originY: number; tileWidth: 128; tileHeight: 64 }`.
- `SceneDefinition.projection?: IsoProjection` is optional during migration; this task does not change world bounds or asset positions.
- `projectIso(point: LogicalPoint, projection: IsoProjection, elevationPx?: number): ScreenPoint`.
- `unprojectIso(point: ScreenPoint, projection: IsoProjection): LogicalPoint`.
- Legacy `SceneDefinition`/`SceneAssetDefinition` `{x,y}` vẫn được chấp nhận cho tới Task 5.

- [ ] **Bước 1: Viết test lỗi** cho `projectIso`: `(u+1,v)→(+64,+32)`, `(u,v+1)→(-64,+32)`, dấu ngược đúng, elevation 10 làm screenY−10, inverse khôi phục sai số `<0.01`; schema từ chối ratio/tile size khác và tọa độ không hữu hạn.
- [ ] **Bước 2: Chạy test đỏ** `npx nx test @lexicon/game-web` và `npx nx test @lexicon/game-content`; test mới fail do API/schema chưa có.
- [ ] **Bước 3: Implement** projector thuần và optional projection metadata/schema; chưa đổi tọa độ/type của scene hay runtime cũ.
- [ ] **Bước 4: Chạy test xanh** hai project và content validation.
- [ ] **Bước 5: Commit** `feat(game): define dimetric projection and logical scene coordinates`.

### Tác vụ 2: Di chuyển và collision trên logical plane

**Tệp:** tạo `apps/game-web/src/game/systems/logicalCollision.ts` (+ test), `isoInput.ts` (+ test); các unit thuần chạy tách khỏi runtime Cartesian hiện tại.

**Giao diện:**
- `type LogicalRect = { u: number; v: number; width: number; height: number }`.
- `moveWithCollisions(position: LogicalPoint, delta: LogicalPoint, body: LogicalRect, solids: readonly LogicalRect[], bounds: LogicalRect): { position: LogicalPoint; blockedU: boolean; blockedV: boolean }`.
- `resolveIsoInput(keys: MovementKeys, typing: boolean): LogicalPoint`.
- `screenSpeedVector(direction: LogicalPoint, projection: IsoProjection, speedPxPerSecond: number): LogicalPoint`.

- [ ] **Bước 1: Viết test lỗi**: WASD mapping; diagonal speed bằng cardinal theo screen-space; input focus trả `(0,0)`; collision chặn từng trục, corner sliding, không xuyên góc/bounds; gap theo projection đủ cho footprint đi qua.
- [ ] **Bước 2: Chạy test đỏ** `npx nx test @lexicon/game-web`.
- [ ] **Bước 3: Implement** pure logical collision/input helpers và function chuyển vận tốc logic từ screen-speed; chưa thay đổi `Player`/WorldScene.
- [ ] **Bước 4: Chạy test xanh** collision/input helpers; xác nhận cardinal/diagonal speed và typing focus.
- [ ] **Bước 5: Commit** `feat(game): move and collide in dimetric world coordinates`.

### Tác vụ 3: Nối projector với rendering, depth và interaction

**Tệp:** sửa `apps/game-web/src/game/scenes/WorldScene.ts`, `entities/createSceneAsset.ts`, `entities/Player.ts`, `entities/shadow.ts`, `systems/depth.ts`, `systems/anchorScreen.ts`, `systems/interaction.ts`, `bridge/connectBusToStore.ts`, `packages/shared-types/src/events.ts` và tests tương ứng.

**Giao diện:** drawable giữ `logicalAnchor`, `elevationPx`, `projectedAnchor`; `computeIsoDepth(floorAnchor, projection, depthBias)` sắp theo projected floor Y; `projectInteractionAnchor(resolvedAsset, projection)` trả screen/canvas point và camera/CSS scale chỉ áp một lần.

- [ ] **Bước 1: Viết test lỗi** cho sprite/player/shadow projection, depth bất biến theo elevation, tie-break determinism, anchor zoom 1/2 và canvas co 0.5; prop/NPC/evidence dùng source logical chung.
- [ ] **Bước 2: Chạy test đỏ** `npx nx test @lexicon/game-web`.
- [ ] **Bước 3: Implement** adapter `projectScenePoint(scene, point)` hỗ trợ cả scene cũ và `dimetric-2:1`; projected render objects/anchor/depth; cho scene isometric logical nearby/E trigger, radius theo screen-space, camera bounds từ bốn góc projected bounds và player events dùng tọa độ theo `coordinateSpace`. Giữ scene Cartesian hiện tại chạy cho tới Task 5.
- [ ] **Bước 4: Chạy test xanh** và smoke E2E `npm run test:e2e -w @lexicon/game-web -- e2e/world.spec.ts --retries=0`.
- [ ] **Bước 5: Commit** `feat(game): render and interact through iso projection`.

### Tác vụ 4: Tọa độ mặt bàn và asset resolution

**Tệp:** sửa `packages/shared-types/src/scene.ts`, `packages/game-content/src/schema/scene.ts` (+ tests), `apps/game-web/src/game/entities/createSceneAsset.ts`, `WorldScene.ts`, `hud/minimapModel.ts` (+ tests); tạo resolver thuần trong `apps/game-web/src/game/systems/`.

**Giao diện:**
- `SceneAssetDefinition` trong migration period chấp nhận legacy `{x,y}` và isometric `{position: LogicalPoint}`; tabletop child là `{restsOn: string; surfaceOffset: {u:number;v:number;elevationPx:number}}`.
- `resolveSceneAssets(assets): readonly ResolvedSceneAsset[]` kiểm unique IDs, unknown parent/cycle và resolve theo dependency order.
- `ResolvedSceneAsset` chứa `floorAnchor`, `visualAnchor`, collision và interaction anchor tách biệt.

- [ ] **Bước 1: Viết test lỗi** cho parent-child, unknown/self parent, cycle, offset thiếu/sai, floor depth không đổi do elevation; evidence marker/interaction neo vào visual anchor, collider bàn không kế thừa.
- [ ] **Bước 2: Chạy test đỏ** `npx nx test @lexicon/game-content` và `npx nx test @lexicon/game-web`.
- [ ] **Bước 3: Implement** union schema/resolver cho asset mới và dùng resolved asset trước khi tạo sprite; giữ legacy asset adapter tới khi JSON hoàn tất migrate ở Task 5.
- [ ] **Bước 4: Chạy test xanh** cả hai project và validation Case #001.
- [ ] **Bước 5: Commit** `feat(game-content): support elevated scene assets on surfaces`.

### Tác vụ 5: Dựng lại office/archive và minimap isometric

**Tệp:** migrate `packages/game-content/cases/case-001/scenes/{main_office,archive}.json`, `case.json`; sửa `apps/game-web/src/hud/minimapModel.ts`, `Minimap.tsx` (+ tests), `apps/game-web/e2e/scene-layout.spec.ts`, `e2e/world.spec.ts`; asset `apps/game-web/public/assets/environment/**` và `assets/PROVENANCE.md`.

**Giao diện:** Minimap nhận logical coords và chiếu mọi solids/partitions/labels/markers/player vào diamond view; scene JSON dùng logical position/collision/spawn, projection `dimetric-2:1` và bounds.

- [ ] **Bước 1: Viết test lỗi** cho metadata, gap cửa, support surfaces, minimap bounds/marker/partition, unique labels, BFS reachability mọi NPC/interactable/door/spawn và hai chiều qua cửa; kiểm prop/collider overlap.
- [ ] **Bước 2: Chạy test đỏ** `npx nx test @lexicon/game-content`, `npx nx test @lexicon/game-web` và scene-layout E2E với fixture mới.
- [ ] **Bước 3: Implement** chuyển toàn bộ scene JSON sang `dimetric-2:1` và logical positions/bounds/colliders; bỏ legacy adapter sau khi không còn content Cartesian. Thu gọn dimensions, gom bàn/ghế/tủ, tabletop evidence qua `restsOn`, doorway gap và spawn/trigger; tạo lại floor/walls/props bằng pipeline/ImageGen khi asset không đạt camera 2:1; provenance đầy đủ; minimap nhận logical source rồi chiếu.
- [ ] **Bước 4: Chạy test xanh** content/BFS; E2E `npm run test:e2e -w @lexicon/game-web -- e2e/scene-layout.spec.ts e2e/world.spec.ts --retries=0`, bao gồm đi lại và đổi scene hai chiều.
- [ ] **Bước 5: Chụp/xem** office/archive ở 1280×720 và 760×600 cạnh concept; sửa camera/assets/layout cho tới khi đạt tiêu chí.
- [ ] **Bước 6: Commit** `feat(game-content): migrate case scenes to dimetric layout`.

### Tác vụ 6: Tên NPC, dialogue facing và nhịp thở

**Tệp:** sửa `packages/shared-types/src/events.ts`, `apps/game-web/src/bridge/connectCaseEngine.ts`, `apps/game-web/src/game/scenes/WorldScene.ts`, `entities/Player.ts`, `systems/direction.ts`, `entities/createSceneAsset.ts`, `packages/game-content/cases/case-001/case.json`, `game/debug.ts`, `e2e/world.spec.ts`; tạo `systems/facingToward.ts` (+ test), `breathing.ts` (+ test), name-tag helper (+ test).

**Giao diện:** `facingToward(from: LogicalPoint,to: LogicalPoint): Facing`; `breathing({timeMs,phaseOffset,walking,inDialogue,reducedMotion}): {scaleX:1;scaleY:number}`; event `'dialogue:started': {npcId:string}` chỉ emit sau khi store bắt đầu dialogue thành công.

- [ ] **Bước 1: Viết test lỗi** cho 4 hướng/tie, emit event khi success only, reduced-motion snap, breathing ±0.008 và bằng 1 khi walking/dialogue/reduced, tên lấy từ `npcs.json`, bounds không chồng prompt.
- [ ] **Bước 2: Chạy test đỏ** `npx nx test @lexicon/game-web` và `npx nx test @lexicon/game-content`.
- [ ] **Bước 3: Implement** event từ bridge; quay player/NPC và giữ hướng cuối; tween 120–200 ms hoặc snap khi reduced-motion; labels content-driven; breathing trên visual layer riêng, phase theo NPC ID, logical collider/shadow/anchors cố định.
- [ ] **Bước 4: Chạy test xanh** unit/E2E từ bốn phía, giảm chuyển động, đóng dialogue giữ hướng, breathing và scene cleanup.
- [ ] **Bước 5: Commit** `feat(game): add iso dialogue facing and character breathing`.

### Tác vụ 7: Walk sheet hoàn chỉnh cho player và NPC

**Tệp:** assets `apps/game-web/public/assets/characters/{player,anna,leo,david}/chr_*_walk.png`; `assets/PROVENANCE.md`; sửa `packages/game-content/cases/case-001/case.json`, `apps/game-web/src/game/assetManifest.ts` (+ tests), `entities/characterAnimations.ts` (+ tests), `docs/art/07_AI_ASSET_PROMPT_PACK.md`.

**Giao diện:** mỗi `CharacterSheet.walk` khai báo texture sheet 1280×640, frame 160×160, thứ tự rows NE/SE/SW/NW, 8 frames/hướng, 10 fps; khai báo đủ `player`, `anna`, `leo`, `david`.

- [ ] **Bước 1: Viết test lỗi** cho đủ walk sheets, manifest dimensions/frame count, row/facing mapping, NPC registration, player animation continuity và missing-sheet fallback.
- [ ] **Bước 2: Chạy test đỏ** `npx nx test @lexicon/game-web` và `npx nx test @lexicon/game-content`.
- [ ] **Bước 3: Tạo ảnh** bằng ImageGen với bốn idle directions từng actor làm reference và prompt trong `docs/art/07` §4.4; tạo bốn sheet riêng. Chuẩn hóa bằng `.venv-art-codegen`/`slice_walk_sheet.py`; không dùng deform từ `make_walk_frames.py` làm asset phát hành. Xem contact sheet và loop 10 fps; regenerate nếu hình/scale/feet/loop không đạt.
- [ ] **Bước 4: Implement** provenance, thay sheet procedural player, thêm walk sheet NPC, register animation theo actor/hướng; không thêm autonomous NPC movement. Cập nhật docs art.
- [ ] **Bước 5: Chạy test xanh**; E2E xác nhận player walk dùng asset thật và NPC walk được đăng ký/trigger qua dev test control.
- [ ] **Bước 6: Commit** `feat(assets): add complete isometric walk sheets for cast`.

### Tác vụ 8: Đồng bộ art/architecture docs và full verification

**Tệp:** sửa `docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md` §3, §16–17, §30–32, §51–55; `docs/architecture/ARCHITECTURE.md`; `docs/art/07_AI_ASSET_PROMPT_PACK.md`; tạo `docs/ai/2026-09-30-phase-11d-verification.md`; `docs/ai/MEMORY.md` ở commit riêng tiếp theo.

- [ ] **Bước 1: Cập nhật** art/architecture docs từ runtime contract: logical plane, 128×64 projection, WASD, collision/depth, event/render boundary, tabletop metadata; gỡ mô tả Cartesian mâu thuẫn. Ghi game là 2D dimetric, không phải 3D.
- [ ] **Bước 2: Chạy gate** `npm run lint`, `npm run test`, `npm run build`, `npm run typecheck`, `npm run format:check`, `npm run memory:check`; Python unittest nếu tool art đổi; full E2E hai lần liên tiếp; scene-layout `--repeat-each=2 --retries=0` hai lần. Backend không đổi.
- [ ] **Bước 3: Chụp/xem** office, archive, dialogue, evidence, minimap, notebook, pause và toàn bộ sheet; ghi giống/khác concept.
- [ ] **Bước 4: Viết ledger** tiếng Việt: commit code, lệnh/output thật, screenshot verdict, provenance, hạn chế còn lại.
- [ ] **Bước 5: Self-review** đủ projector/controls/collision/camera/depth/minimap/scenes/tabletop/doors/names/facing/breathing/four sheets/docs; cleanup events, reduced-motion, product rules và texture completeness.
- [ ] **Bước 6: Commit** implementation/docs/ledger; update memory sau đó với `result_commit` là commit trước.

## Phụ thuộc

`T1 → T2 → T3 → T4 → T5 → T8`; `T3 → T6`; `T1 + T3 → T7`; T6 và T7 xong trước T8. Không bắt đầu phase tiếp theo.
