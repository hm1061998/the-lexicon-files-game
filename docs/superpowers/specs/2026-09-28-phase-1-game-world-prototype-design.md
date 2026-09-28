# Phase 1 — Game World Prototype Design

Status: approved in chat 2026-09-28. Implements roadmap `docs/04_CODEX_IMPLEMENTATION_ROADMAP.md` §20. Visual/scene rules come from `docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md` (authoritative for numbers below when it states them).

## 1. Goal and success criteria

The player walks around one isometric office room built from JSON, cannot pass through walls or furniture, is drawn in front of or behind props correctly, and the game knows when the player is within reach of an interactable.

Acceptance (roadmap §20):

- player đi được quanh room;
- không xuyên wall/furniture;
- sprite sorting đúng.

## 2. Decisions (confirmed with the user)

| Topic | Decision |
|---|---|
| Scene | Scene A — Main Office only (Case #001 spec §5). No scene transitions. |
| WASD | Screen-aligned: W up, S down, A left, D right; diagonals from key combos, normalized speed. |
| Art | Runtime geometric placeholders generated in `BootScene` with Phaser Graphics + `generateTexture`, palette from docs/art/06. Matches layout, scale, camera angle and colliders — **not** the concept art look. Real art arrives in Phase 11 by swapping texture keys. |
| Physics | Arcade Physics, rectangle colliders (docs/art/06 §31 allows simplifying polygons). No Matter.js. |
| Out of scope | HUD, prompt UI, E-key interaction, dialogue, NPC movement, pathfinding, occlusion fade, animation sheets, audio, save. |

## 3. Architecture

```
packages/shared-types    SceneDefinition types, GameEventMap (pure types)
packages/game-content    Zod scene schema + loader; cases/case-001/scenes/main_office.json
apps/game-web/src/bridge typed event bus (createEventBus<GameEventMap>)
apps/game-web/src/game/systems   pure TS: input vector, direction, depth, nearest interactable
apps/game-web/src/game/scenes    BootScene (placeholder textures), WorldScene (generic)
apps/game-web/src/game/entities  Player, Prop
```

Rules kept: `game-core`/`learning-engine` untouched; no Case #001 text/IDs in Phaser/React code (scene id comes from content); Phaser holds position/collision/depth only; no API calls.

## 4. Content model

`SceneDefinition` (Zod, `packages/game-content/src/schema/scene.ts`; type re-exported from `shared-types`):

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
  x: number; y: number;               // floor contact point (§52)
  origin?: [number, number];          // default [0.5, 0.9]
  depth?: number;                     // fixed depth; otherwise y + depthBias
  depthBias?: number;                 // default 0
  collision?: { type: 'rect'; x: number; y: number; width: number; height: number }; // offset from (x,y)
  interaction?: { x: number; y: number; radius: number };                              // offset from (x,y)
};
```

Validation beyond shape: `spawn` inside `worldBounds`; asset ids unique; `radius > 0`, collider `width/height > 0`. Loader `loadSceneDefinition(caseId, sceneId): SceneDefinition` throws `ContentValidationError` with file + Zod path messages (developer-readable, never silent).

Main Office data: world `2400×1600`, bounds `0,0,2400,1600`, spawn `(1200, 1100)`; assets: floor (fixed depth -1000), back walls (left/right, colliders along the wall base), player desk, objective note (interactable, radius 90), Anna (npc, collider 30×18, interaction radius 90), hallway door (interactable, radius 80). Exact coordinates are content and live only in the JSON.

## 5. Pure systems (`apps/game-web/src/game/systems`)

- `resolveInputVector(keys: { up; down; left; right: boolean }): { x: number; y: number }` — screen axes, length 0 or 1.
- `resolveDirection(vx, vy): 'NE' | 'SE' | 'SW' | 'NW' | null` — §51; `null` when idle (keep last facing).
- `computeDepth(feetY: number, depthBias = 0): number`.
- `findNearestInteractable(pos, interactables): { id: string } | null` — nearest whose interaction circle contains `pos`; ties by id order.

Player speed constant: 220 px/s.

## 6. Phaser runtime

- `BootScene` generates textures (floor diamond, wall slab, desk box, note, door, NPC/player capsule with shadow and facing notch), then starts `WorldScene` with the loaded `SceneDefinition`.
- `WorldScene` creates assets by type; props/walls/npcs get static Arcade bodies from `collision`; player: origin `(0.5, 0.88)`, body `30×18` at the feet; `setDepth(computeDepth(y, bias))` every frame for player, once for static props.
- Camera: `startFollow(player)`, `setBounds(worldBounds)`; game config 1920×1080 with `Scale.FIT`.
- Interaction: each frame compute nearest interactable; on change emit `interaction:nearby { interactableId }` or `interaction:cleared {}` and show/hide the red diamond marker (Investigation Red `#A4412D`, 28 px, float 4 px over 1000 ms, no glow) above that asset.
- Keyboard ignored when `document.activeElement` is `input`/`textarea`/`contenteditable`. `WorldScene` removes keyboard and bus listeners on `shutdown`.
- Dev-only debug hook: when `import.meta.env.DEV`, expose `window.__lexiconDebug = { player(): {x,y,depth}, depthOf(id): number, nearby(): string | null }` for Playwright. Not present in production builds.

## 7. Events

`GameEventMap` (in `shared-types`) starts with:

```ts
'interaction:nearby': { interactableId: string };
'interaction:cleared': Record<string, never>;
```

Bus: `createEventBus<M>()` with `on/off/emit`, no dependency; one instance created in `GameCanvas` and passed to the game — no global singleton.

## 8. Error handling

Invalid scene JSON → loader throws `ContentValidationError`; `GameCanvas` catches and renders a readable developer error panel instead of a blank screen. Unknown texture key → `[CaseEngine]`-style dev log `[Scene] missing texture <key>` and a magenta fallback texture.

## 9. Testing

Unit (Vitest):
- scene schema: valid Main Office passes; missing spawn, duplicate ids, spawn outside bounds, radius 0 each fail with a path message;
- `resolveInputVector` (none, single, diagonal normalized, opposite keys cancel); `resolveDirection` (4 quadrants + idle); `computeDepth`; `findNearestInteractable` (none, one, nearest of two, boundary on radius);
- event bus on/off/emit.

E2E (Playwright, via debug hook):
- holding D for 500 ms increases player x;
- walking into the desk collider stops the player before the desk footprint;
- player below desk → player depth > desk depth; above → lower;
- walking into the note's radius makes `nearby()` return its id, walking away returns `null`;
- still exactly one canvas, no console errors.

## 10. Definition of Done

`npm run lint`, `npm run test`, `npm run build`, `npm run format:check`, `npm run test:e2e` pass with output recorded; AI memory updated.
