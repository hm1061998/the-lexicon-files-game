# Phase 1 — Thiết kế Game World Prototype

Trạng thái: đã duyệt trong chat ngày 2026-09-28. Triển khai roadmap `docs/04_CODEX_IMPLEMENTATION_ROADMAP.md` §20. Rule hình ảnh/scene lấy từ `docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md` (tài liệu đó là chuẩn cho các con số bên dưới khi nó có quy định).

## 1. Mục tiêu và tiêu chí thành công

Player đi lại trong một phòng làm việc isometric được dựng từ JSON, không đi xuyên tường hay đồ đạc, được vẽ đúng thứ tự trước/sau đồ vật, và game biết khi nào player ở trong tầm của một vật tương tác được.

Acceptance (roadmap §20):

- player đi được quanh room;
- không xuyên wall/furniture;
- sprite sorting đúng.

## 2. Quyết định (đã xác nhận với người dùng)

| Chủ đề | Quyết định |
|---|---|
| Scene | Chỉ Scene A — Main Office (spec Case #001 §5). Không chuyển scene. |
| WASD | Theo trục màn hình: W lên, S xuống, A trái, D phải; đi chéo bằng tổ hợp phím, tốc độ được chuẩn hóa. |
| Art | Placeholder hình học sinh lúc runtime trong `BootScene` bằng Phaser Graphics + `generateTexture`, palette theo docs/art/06. Khớp bố cục, tỉ lệ, góc camera và collider — **không** giống nét vẽ concept art. Art thật đưa vào ở Phase 11 bằng cách thay texture key. |
| Physics | Arcade Physics, collider hình chữ nhật (docs/art/06 §31 cho phép đơn giản hóa polygon). Không dùng Matter.js. |
| Ngoài phạm vi | HUD, UI prompt, tương tác bằng phím E, dialogue, NPC di chuyển, pathfinding, fade khi che khuất, sprite sheet animation, audio, save. |

## 3. Kiến trúc

```
packages/shared-types    type SceneDefinition, GameEventMap (chỉ type)
packages/game-content    Zod scene schema + loader; cases/case-001/scenes/main_office.json
apps/game-web/src/bridge event bus có kiểu (createEventBus<GameEventMap>)
apps/game-web/src/game/systems   TS thuần: input vector, direction, depth, interactable gần nhất
apps/game-web/src/game/scenes    BootScene (texture placeholder), WorldScene (generic)
apps/game-web/src/game/entities  Player, Prop
```

Rule giữ nguyên: không đụng `game-core`/`learning-engine`; không có text/ID của Case #001 trong code Phaser/React (scene id lấy từ content); Phaser chỉ giữ position/collision/depth; không gọi API.

## 4. Mô hình content

`SceneDefinition` (Zod, `packages/game-content/src/schema/scene.ts`; type được re-export từ `shared-types`):

```ts
type SceneDefinition = {
  id: string;
  size: { width: number; height: number };
  worldBounds: { x: number; y: number; width: number; height: number };
  spawn: { x: number; y: number };
  assets: SceneAssetDefinition[];
};
type SceneAssetDefinition = {
  id: string;
  type: 'background' | 'wall' | 'prop' | 'interactable' | 'npc';
  texture: string;
  x: number; y: number;               // điểm chạm sàn (§52)
  origin?: [number, number];          // mặc định [0.5, 0.9]
  depth?: number;                     // depth cố định; nếu không có thì y + depthBias
  depthBias?: number;                 // mặc định 0
  collision?: { type: 'rect'; x: number; y: number; width: number; height: number }; // offset tính từ (x,y)
  interaction?: { x: number; y: number; radius: number };                              // offset tính từ (x,y)
};
```

Validation ngoài kiểm tra shape: `spawn` nằm trong `worldBounds`; asset id không trùng; `radius > 0`, collider `width/height > 0`. Loader `loadSceneDefinition(caseId, sceneId): SceneDefinition` throw `ContentValidationError` kèm tên file + đường dẫn lỗi Zod (developer đọc được, không bao giờ im lặng).

Dữ liệu Main Office: world `2400×1600`, bounds `0,0,2400,1600`, spawn `(1200, 1100)`; asset gồm: sàn (depth cố định -1000), tường sau (trái/phải, collider dọc chân tường), bàn của player, tờ ghi chú objective (interactable, radius 90), Anna (npc, collider 30×18, interaction radius 90), cửa ra hành lang (interactable, radius 80). Tọa độ chính xác là content và chỉ nằm trong JSON.

## 5. System thuần (`apps/game-web/src/game/systems`)

- `resolveInputVector(keys: { up; down; left; right: boolean }): { x: number; y: number }` — trục màn hình, độ dài 0 hoặc 1.
- `resolveDirection(vx, vy): 'NE' | 'SE' | 'SW' | 'NW' | null` — theo §51; trả `null` khi đứng yên (giữ hướng cũ).
- `computeDepth(feetY: number, depthBias = 0): number`.
- `findNearestInteractable(pos, interactables): { id: string } | null` — vật gần nhất có vòng tròn tương tác chứa `pos`; nếu bằng nhau thì theo thứ tự id.

Hằng tốc độ player: 220 px/s.

## 6. Phaser runtime

- `BootScene` sinh texture (hình thoi sàn, tấm tường, khối bàn, tờ ghi chú, cửa, khối trụ NPC/player có bóng và vạch chỉ hướng), rồi start `WorldScene` với `SceneDefinition` đã load.
- `WorldScene` tạo asset theo type; prop/wall/npc có static Arcade body lấy từ `collision`; player: origin `(0.5, 0.88)`, body `30×18` ở chân; `setDepth(computeDepth(y, bias))` mỗi frame cho player, một lần cho prop tĩnh.
- Camera: `startFollow(player)`, `setBounds(worldBounds)`; game config 1920×1080 với `Scale.FIT`.
- Tương tác: mỗi frame tính interactable gần nhất; khi thay đổi thì emit `interaction:nearby { interactableId }` hoặc `interaction:cleared {}` và hiện/ẩn marker hình thoi đỏ (Investigation Red `#A4412D`, 28 px, nổi 4 px trong 1000 ms, không glow) phía trên asset đó.
- Bỏ qua bàn phím khi `document.activeElement` là `input`/`textarea`/`contenteditable`. `WorldScene` gỡ listener bàn phím và bus khi `shutdown`.
- Debug hook chỉ ở dev: khi `import.meta.env.DEV`, expose `window.__lexiconDebug = { player(): {x,y,depth}, depthOf(id): number, nearby(): string | null }` cho Playwright. Không có trong bản build production.

## 7. Event

`GameEventMap` (trong `shared-types`) khởi đầu với:

```ts
'interaction:nearby': { interactableId: string };
'interaction:cleared': Record<string, never>;
```

Bus: `createEventBus<M>()` với `on/off/emit`, không dependency; một instance tạo trong `GameCanvas` và truyền vào game — không dùng global singleton.

## 8. Xử lý lỗi

Scene JSON sai → loader throw `ContentValidationError`; `GameCanvas` bắt lỗi và hiển thị panel lỗi cho developer đọc được thay vì màn hình trắng. Texture key không tồn tại → dev log `[Scene] missing texture <key>` và dùng texture fallback màu magenta.

## 9. Kiểm thử

Unit (Vitest):
- scene schema: Main Office hợp lệ thì pass; thiếu spawn, trùng id, spawn ngoài bounds, radius 0 — mỗi trường hợp fail kèm đường dẫn lỗi;
- `resolveInputVector` (không phím, một phím, chéo đã chuẩn hóa, hai phím ngược chiều triệt tiêu); `resolveDirection` (4 góc phần tư + đứng yên); `computeDepth`; `findNearestInteractable` (không có, một, gần nhất trong hai, đúng biên radius);
- event bus on/off/emit.

E2E (Playwright, qua debug hook):
- giữ D 500 ms thì x của player tăng;
- đi thẳng vào collider của bàn thì player dừng trước footprint của bàn;
- player ở dưới bàn → depth player > depth bàn; ở trên → nhỏ hơn;
- đi vào radius của tờ ghi chú thì `nearby()` trả id của nó, đi ra xa thì trả `null`;
- vẫn đúng một canvas, không có console error.

## 10. Definition of Done

`npm run lint`, `npm run test`, `npm run build`, `npm run format:check`, `npm run test:e2e` pass và có ghi lại output; AI memory được cập nhật.
