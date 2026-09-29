# The Lexicon Files — Architecture

> Tài liệu này tổng hợp kiến trúc từ `docs/01`–`06`. Khi mâu thuẫn, áp dụng bảng nguồn authoritative trong `docs/README.md`, rồi cập nhật file này cho khớp.

## 1. Nguyên tắc nền

1. **Local-first.** Toàn bộ gameplay vertical slice chạy client-side; API không nằm trên critical path.
2. **Content-driven.** Case, scene, dialogue, vocabulary là JSON được validate (Zod). Không hardcode Case #001 trong React/Phaser.
3. **Core độc lập framework.** `game-core` và `learning-engine` là TypeScript thuần — không import React, Phaser, Zustand, IndexedDB.
4. **Phaser = world, React = UI.** Hai bên chỉ nói chuyện qua typed event bus + store.
5. **Không eval.** Condition/Effect là discriminated union, được interpret bởi `game-core`.

## 2. Dependency graph (frontend)

```text
                     shared-types
                    ▲     ▲     ▲
                    │     │     │
          game-core   learning-engine   game-content (schema + loader + JSON)
                    ▲     ▲     ▲
                    └─────┼─────┘
                          │
        ui (React primitives, theme) ──► apps/game-web
```

Quy tắc import:

| Package | Được import | Cấm import |
|---|---|---|
| `shared-types` | — | mọi thứ khác |
| `game-core` | `shared-types` | React, Phaser, Zustand, DOM, `game-content` JSON |
| `learning-engine` | `shared-types` | React, Phaser, Zustand, DOM |
| `game-content` | `shared-types`, `zod` | engine, React, Phaser |
| `ui` | `react`, `shared-types` | Phaser, engine, content |
| `apps/game-web` | tất cả packages | — |

`game-core` nhận `CaseDefinition` đã được load qua tham số; không tự đọc file content.

## 3. Packages

### `packages/shared-types/src`
```text
content/   CaseDefinition, EvidenceDefinition, FactDefinition, ObjectiveDefinition,
           NPCDefinition, DialogueTree/Node/Choice, ContradictionDefinition, Condition, Effect
game/      GameState, ObjectiveState, GameEventMap (typed event bus contract)
save/      GameSave (versioned)
learning/  CEFRLevel, VocabularyEntry, VocabularyStage, VocabularyProgress, LanguageProfile
scene/     SceneDefinition, SceneAssetDefinition, CollisionDefinition, InteractionDefinition,
           SpawnPoints, TransitionDefinition
asset/     CharacterDefinition, AnimationDefinition, AssetRegistry, SceneManifest
```

### `packages/game-core/src`
```text
events/         createEventBus<GameEventMap>() — typed, có unsubscribe
case/           CaseEngine: load definition → khởi tạo state
condition/      evaluateCondition(state, condition) — pure
effect/         applyEffect(state, effect) → new state — pure
objective/      activate / complete, trigger theo event
evidence/       collect (idempotent, không trùng)
fact/           unlock facts theo unlockCondition
dialogue/       DialogueRunner: node, choices, conditions, effects, flags
timeline/       event slots + validate
contradiction/  validate cặp fact (chỉ khi đã biết cả hai)
deduction/      final accusation; sai → không reset progress
save/           serialize/deserialize + migrate theo `version`
```
Engine là **pure reducers + small services**: `(state, input) → { state, events }`. Dễ test bằng Vitest.

### `packages/learning-engine/src`
```text
vocabulary/  lookup entry
progress/    stage lifecycle unknown → seen → recognized → understood → used → mastered
review/      priority score (spaced repetition heuristic)
profile/     LanguageProfile, skill score EMA (old*0.8 + recent*0.2)
hints/       4 cấp: directional → linguistic → simplification → strong
telemetry/   local event log (vocab_seen, hint_used, …)
```

### `packages/game-content`
```text
cases/case-001/  case.json, evidences.json, dialogues.json, objectives.json,
                 facts.json, contradictions.json, vocabulary.json, scenes/*.json
vocabulary/      A1.json, A2.json, B1.json, B2.json (shared)
grammar/         grammar concepts
src/schema/      Zod schemas (mirror shared-types)
src/loader/      loadCase(id) → CaseDefinition đã validate
src/validation/  cross-reference checks: duplicate id, missing NPC/evidence/vocab,
                 objective dependency, broken dialogue next-node
```
`tools/validate-content` chạy validation; **build phải fail khi content invalid**.

### `packages/ui/src`
`theme/` (palette `lexicon_isometric_v1`, typography, paper texture tokens), `primitives/` (PaperPanel, KeyHint, Button, Modal có focus trap).

## 4. `apps/game-web/src`

```text
main.tsx, App.tsx
bridge/        EventBus instance + React hooks subscribe; Phaser ↔ React boundary
state/         Zustand stores (game, learning, settings) — bọc game-core reducers
persistence/   IndexedDB (idb): save slots, settings, learning profile; auto-save triggers
audio/         Howler wrapper (play/pause/replay, subtitle)
game/
  scenes/      BootScene, WorldScene (generic, load từ SceneDefinition)
  loaders/     scene manifest → preload; asset registry
  entities/    Player, Npc, Prop, Interactable (feet-origin, y-depth)
  systems/     movement (WASD), collision, depth sort, interaction radius, foreground fade, camera
hud/           ObjectivePanel, CaseProgress, InteractionPrompt, KeyHints
notebook/      tabs Case / People / Evidence / Vocabulary / Timeline
dialogue/      DialogueView + clickable words
evidence/      EvidenceModal
timeline/      TimelineScreen
deduction/     ContradictionUI, AccusationScreen, CaseSummary
vocabulary/    WordTooltip (click-only)
pause/         PauseMenu
```

### State boundaries
| Nơi | Chứa |
|---|---|
| Phaser | sprite position, animation, collision, camera, nearby interactable |
| Zustand | current case, evidence, facts, objectives, dialogue flags, learning progress, settings |
| IndexedDB | save slots, settings, learning profile |

Không duplicate state giữa các nơi. Phaser đọc store (read-only) + emit event; React dispatch action vào store.

### Luồng tương tác
```text
Player vào interaction radius (Phaser)
  → bus.emit('interaction:nearby')           → HUD hiện prompt
Player bấm E
  → bus.emit('interaction:triggered')        → store gọi game-core (collect/open dialogue)
  → game-core trả state + domain events      → store cập nhật, bus.emit('evidence:discovered'…)
  → persistence auto-save                    → React render modal/notebook
Modal critical mở → store.setInputLocked(true) → Phaser dừng movement
```

## 5. Scene & asset model (tóm tắt docs/art/06)

- World position = **feet / floor contact point**. Character origin `(0.5, 0.88)`; depth = `y (+ depthBias)`.
- Collider = footprint nhỏ, không dùng full sprite. Arcade Physics; Matter chỉ khi thật cần polygon.
- Scene layer: `00_floor … 70_fx`. Scene data trong JSON, `WorldScene` generic dựng từ `SceneDefinition`.
- 4 hướng NE/SE/SW/NW; anim key `${actor}_${action}_${direction}`.
- Chỉ load asset của scene hiện tại (manifest → preload → create); manifest là trường `textures` của scene JSON (còn `characterSheets`/`sharedTextures` ở `case.json`) trong `packages/game-content`, tải theo scene bằng `loadSceneTextures` (không còn manifest global trong game-web).
- Placeholder đặt tên final-friendly và gắn nhãn `PLACEHOLDER_*`.
- Palette cố định; **đỏ chỉ dùng cho investigation accent**.

## 6. Backend `apps/api` (.NET 10)

```text
LexiconFiles.Domain          Entities/VO thuần: GameSave, LanguageProfile, User… (không EF, không ASP.NET)
LexiconFiles.Application     Use cases theo feature folder, DTOs, ports (interfaces)
LexiconFiles.Infrastructure  EF Core DbContext, Npgsql, Configurations, Migrations, Identity, Clock
LexiconFiles.Api             Minimal API endpoints /api/v1, ProblemDetails, CORS explicit, /health/live /health/ready
LexiconFiles.Tests           Domain / Application / Api / Persistence (xUnit, Testcontainers PostgreSQL)
```
Dependency: `Api → Infrastructure → Application → Domain`. Cloud save dùng optimistic concurrency theo `revision` (409 khi lệch). Phase đầu chỉ scaffold + health + OpenAPI.

## 7. Quyết định kỹ thuật đã chốt

| Chủ đề | Quyết định | Nguồn |
|---|---|---|
| Package manager / monorepo | **npm + Nx** (npm workspaces). Cấm pnpm/yarn/bun | 04 §2; rule trong AGENTS.md §3 |
| Physics | Phaser Arcade | 06 §31 |
| Dialogue | custom JSON | README |
| Validation content | Zod, fail build | 04 §35 |
| Save | IndexedDB qua `idb`, schema `version` + migrate | 04 §34 |
| Backend | Modular monolith, Minimal API | 05 |
