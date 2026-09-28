# The Lexicon Files — Codex Implementation Roadmap

## 1. Mục tiêu

Tài liệu này hướng dẫn Codex triển khai project theo từng phase có thể kiểm tra độc lập.

Không được cố xây toàn bộ game trong một lần.

---

# 2. Stack

```text
Monorepo: npm workspaces + Nx
Frontend: React + TypeScript + Vite
Game: Phaser 3
State: Zustand
Backend: ASP.NET Core (.NET 10)
API: REST + OpenAPI
ORM: Entity Framework Core
DB: PostgreSQL + Npgsql
Auth: ASP.NET Core Identity + JWT (post-MVP unless account sync is required)
Realtime: SignalR only for future realtime features
Cache: Redis optional, not required for vertical slice
Local save: IndexedDB
Audio: Howler.js
Frontend testing: Vitest + Playwright
Backend testing: xUnit
Frontend lint: ESLint
Frontend format: Prettier
```

Trong vertical slice, backend có thể optional.
Local-first để giảm complexity.

---

# 3. Recommended Repository

```text
the-lexicon-files/
├── apps/
│   ├── game-web/
│   └── api/
│       ├── LexiconFiles.Api/
│       ├── LexiconFiles.Application/
│       ├── LexiconFiles.Domain/
│       ├── LexiconFiles.Infrastructure/
│       └── LexiconFiles.Tests/
│
├── packages/
│   ├── game-core/
│   ├── game-content/
│   ├── shared-types/
│   ├── learning-engine/
│   └── ui/
│
├── assets/
│   ├── maps/
│   ├── environment/
│   ├── characters/
│   ├── evidence/
│   ├── audio/
│   └── ui/
│
├── docs/
│   ├── GAME_DESIGN_DOCUMENT.md
│   ├── ENGLISH_LEARNING_SYSTEM_DESIGN.md
│   └── CASE_001_VERTICAL_SLICE_SPEC.md
│
└── tools/
```

---

# 4. Architecture

```text
React UI
   │
   │ Game Event Bus
   ▼
Phaser Runtime
   │
   ▼
Game Core State
   │
   ├── Case Engine
   ├── Dialogue Engine
   ├── Evidence Engine
   ├── Objective Engine
   ├── Learning Engine
   └── Save Engine
```

Không để React components gọi Phaser internals trực tiếp.

Không để Phaser scene quản lý learning logic.

---

# 5. Event Bus

Ví dụ:

```ts
type GameEventMap = {
  'evidence:discovered': { evidenceId: string };
  'objective:updated': { objectiveId: string };
  'npc:interacted': { npcId: string };
  'dialogue:opened': { dialogueId: string };
  'vocabulary:seen': { vocabularyId: string };
  'contradiction:found': { contradictionId: string };
  'scene:changed': { sceneId: string };
};
```

Dùng typed event bus.

---

# 6. State Boundaries

## Phaser state

Chỉ runtime:

```text
sprite position
animation
collision
camera
nearby interactable
```

## Zustand state

Game/application:

```text
current case
evidence
facts
objectives
dialogue flags
learning progress
settings
```

## Persistence

IndexedDB:

```text
save slots
settings
learning profile
```

---

# 7. Content-Driven Design

Không hardcode Case #001 vào components.

```text
packages/game-content/cases/case-001/
├── case.json
├── evidences.json
├── dialogues.json
├── objectives.json
├── facts.json
├── contradictions.json
└── vocabulary.json
```

---


# 8. Backend Architecture — ASP.NET Core

Backend sử dụng **.NET 10 + ASP.NET Core**.

Kiến trúc khuyến nghị cho giai đoạn đầu:

```text
Modular Monolith
+
Clean boundaries
+
Feature-oriented application layer
```

Không cần microservices cho MVP.

Solution:

```text
apps/api/
├── LexiconFiles.Api/
├── LexiconFiles.Application/
├── LexiconFiles.Domain/
├── LexiconFiles.Infrastructure/
└── LexiconFiles.Tests/
```

## LexiconFiles.Api

Chịu trách nhiệm:

```text
HTTP endpoints
OpenAPI
Authentication middleware
Exception handling
Request validation integration
Health checks
```

## LexiconFiles.Application

Chịu trách nhiệm:

```text
Use cases
Commands / Queries
DTOs
Application services
Interfaces
Authorization rules
```

Có thể dùng MediatR nếu project thực sự cần command/query pipeline.
Không bắt buộc thêm MediatR trong MVP nếu service đơn giản hơn.

## LexiconFiles.Domain

Chứa:

```text
Entities
Value Objects
Domain rules
Enums
Domain events when useful
```

Không phụ thuộc:

```text
EF Core
ASP.NET Core
PostgreSQL
HTTP
```

## LexiconFiles.Infrastructure

Chứa:

```text
EF Core DbContext
PostgreSQL mappings
Repositories when needed
Persistence
External storage
Authentication implementation
Clock / IDs
```

---

# 9. Backend Data Model

MVP local-first nên backend chưa nằm trên critical gameplay path.

Khi thêm cloud sync, các aggregate chính:

```text
User
GameSave
LanguageProfile
CaseProgress
Achievement
```

Không lưu authored case content vào database trong phase đầu.
Case definition vẫn nằm trong version-controlled content files.

Ví dụ:

```csharp
public sealed class GameSave
{
    public Guid Id { get; init; }
    public Guid UserId { get; init; }
    public string CaseId { get; set; } = default!;
    public string SceneId { get; set; } = default!;
    public string StateJson { get; set; } = default!;
    public int Version { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
```

---

# 10. Persistence

Database:

```text
PostgreSQL
```

Provider:

```text
Npgsql.EntityFrameworkCore.PostgreSQL
```

Migration:

```text
EF Core Migrations
```

Nguyên tắc:

- migration được commit vào source control;
- không dùng `EnsureCreated()` production;
- database timestamps dùng `DateTimeOffset` hoặc UTC;
- game save có schema version để migrate state.

---

# 11. API Design

Base:

```text
/api/v1
```

Future endpoints:

```text
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh

GET    /api/v1/profile
GET    /api/v1/game-saves
GET    /api/v1/game-saves/{id}
PUT    /api/v1/game-saves/{id}

GET    /api/v1/language-profile
PUT    /api/v1/language-profile
```

Vertical slice có thể không gọi những endpoint này nếu chưa cần account/cloud save.

API responses phải có contract rõ ràng và version được.

---

# 12. Authentication

MVP single-player local:

```text
No account required
```

Khi cần cloud sync:

```text
ASP.NET Core Identity
+
JWT access token
+
refresh token rotation
```

Không tự triển khai password hashing.

Refresh token phải:

- revoke được;
- rotate;
- lưu dạng hash nếu persist;
- có expiry.

---

# 13. Validation

Ưu tiên:

```text
DataAnnotations cho DTO đơn giản
```

hoặc:

```text
FluentValidation
```

nếu validation phức tạp.

Không đặt business rule chỉ ở controller.

---

# 14. Error Contract

Dùng RFC 9457 / Problem Details.

Ví dụ:

```json
{
  "type": "https://example.com/problems/save-conflict",
  "title": "Save conflict",
  "status": 409,
  "detail": "The cloud save was updated by another session."
}
```

ASP.NET Core:

```text
ProblemDetails
```

Không trả stack trace production.

---

# 15. Observability

Backend:

```text
Serilog
OpenTelemetry
Health Checks
```

MVP tối thiểu:

```text
structured logging
request correlation id
/health
```

---

# 16. Backend Testing

Sử dụng:

```text
xUnit
```

Test layers:

```text
Domain unit tests
Application unit tests
API integration tests
Persistence integration tests
```

Integration DB có thể dùng:

```text
Testcontainers for PostgreSQL
```

Không dùng EF InMemory để thay thế hoàn toàn PostgreSQL behavior.

---

# 17. CORS

Development:

```text
allow local frontend origin explicitly
```

Production:

```text
allow deployed game origin explicitly
```

Không dùng:

```text
AllowAnyOrigin + credentials
```

---

# 18. Backend Scope for Vertical Slice

Phase đầu backend chỉ cần scaffold đủ sạch để mở rộng.

Không cần backend cho:

```text
player movement
evidence collection runtime
dialogue runtime
timeline
contradiction
local save
```

Những phần này phải chạy client-side.

Backend được thêm vào critical path khi có:

```text
account
cloud save
cross-device sync
leaderboard
content delivery
analytics
```

Điều này giúp vertical slice chạy ngay cả khi API unavailable.

---


# 19. Phase 0 — Project Foundation

Deliverables:

- workspace;
- Vite React;
- Phaser integration;
- TypeScript strict;
- ESLint;
- Prettier;
- Vitest;
- Playwright;
- ASP.NET Core .NET 10 solution;
- Api/Application/Domain/Infrastructure/Tests projects;
- OpenAPI;
- health endpoint;
- xUnit;
- PostgreSQL configuration skeleton;
- base folders.

Acceptance:

```text
npm install
npm run dev
npm run build
npm run test
```

đều chạy.

---

# 20. Phase 1 — Game World Prototype

Implement:

- Phaser canvas;
- one office scene;
- placeholder isometric art;
- WASD;
- collision;
- depth sorting;
- camera;
- interaction radius.

Không làm polished assets.

Acceptance:

- player đi được quanh room;
- không xuyên wall/furniture;
- sprite sorting đúng.

---

# 21. Phase 2 — React HUD Integration

Implement:

- objective panel;
- case progress;
- interaction prompt;
- bottom key hints;
- pause UI.

Event bus kết nối Phaser → React.

Acceptance:

- đến interactable → UI prompt hiện;
- rời xa → prompt biến mất;
- React không rerender Phaser canvas.

---

# 22. Phase 3 — Case Engine

Implement data model:

```text
Case
Scene
Evidence
Fact
Objective
Condition
Effect
```

Implement:

- load case JSON;
- activate objective;
- complete objective;
- unlock facts.

Acceptance:

- case content không hardcode;
- test case engine bằng unit tests.

---

# 23. Phase 4 — Evidence + Notebook

Implement:

- collect evidence;
- evidence modal;
- notebook;
- people tab;
- evidence tab;
- vocabulary tab skeleton.

Acceptance:

- evidence discovered updates notebook;
- duplicate evidence không thêm hai lần;
- state persists.

---

# 24. Phase 5 — Dialogue

Implement:

- dialogue renderer;
- choice nodes;
- conditions;
- effects;
- NPC interaction;
- dialogue flag state.

Acceptance:

- Anna/Leo/David trees chạy;
- conditional dialogue unlock sau contradiction.

---

# 25. Phase 6 — Learning Engine

Implement:

- vocabulary definitions;
- clickable word;
- translation mode;
- progress stage;
- vocabulary notebook;
- basic learning profile.

Acceptance:

- vocab event tracked;
- refresh vẫn giữ progress;
- no hardcoded words in UI.

---

# 26. Phase 7 — Audio / Listening

Implement:

- Howler;
- play/pause/replay;
- subtitle mode;
- phone recording evidence.

Acceptance:

- audio replay;
- task answer;
- listening result updates case state.

---

# 27. Phase 8 — Timeline + Contradiction

Implement:

- timeline screen;
- discovered events;
- contradiction validator;
- contradiction UI.

MVP UI có thể click-select hai facts.

Acceptance:

```text
David statement
+
Security log
→ contradiction
```

---

# 28. Phase 9 — Case Completion

Implement:

- final accusation;
- wrong conclusion handling;
- case closed;
- report summary;
- learning summary.

Acceptance:

- correct suspect completes case;
- wrong suspect không reset progress.

---

# 29. Phase 10 — Persistence

Implement IndexedDB.

Schemas:

```text
GameSave
Settings
LanguageProfile
```

Auto-save trigger:

```text
evidence
objective
dialogue
scene
contradiction
```

Acceptance:

- reload browser resumes progress.

---

# 30. Phase 11 — Visual Polish

Apply graphic design spec:

- paper texture;
- sepia palette;
- red accent;
- vintage UI;
- typography;
- transitions;
- interaction marker.

Không thay game logic.

---

# 31. Phase 12 — Testing & Performance

Tests:

## Unit

```text
case engine
condition engine
objective engine
learning engine
save engine
contradiction
```

## E2E

```text
start case
collect evidence
talk NPC
find security log
find contradiction
accuse David
complete case
reload/save
```

## Performance

- texture atlas;
- lazy assets;
- no memory leaks;
- scene cleanup.

---

# 32. Condition System

Không dùng eval.

```ts
type Condition =
  | { type: 'hasEvidence'; evidenceId: string }
  | { type: 'hasFact'; factId: string }
  | { type: 'objectiveCompleted'; objectiveId: string }
  | { type: 'flag'; key: string; value: boolean }
  | { type: 'all'; conditions: Condition[] }
  | { type: 'any'; conditions: Condition[] };
```

---

# 33. Effect System

```ts
type Effect =
  | { type: 'addEvidence'; evidenceId: string }
  | { type: 'unlockFact'; factId: string }
  | { type: 'setFlag'; key: string; value: boolean }
  | { type: 'activateObjective'; objectiveId: string }
  | { type: 'completeObjective'; objectiveId: string };
```

---

# 34. Save Schema

```ts
type GameSave = {
  version: number;
  caseId: string;
  sceneId: string;

  player: {
    x: number;
    y: number;
  };

  evidenceIds: string[];
  factIds: string[];
  objectiveState: Record<string, string>;
  flags: Record<string, boolean>;

  languageProfile: LanguageProfile;

  updatedAt: string;
};
```

Migrations phải dựa trên `version`.

---

# 35. Content Validation

Dùng Zod.

Validate:

- duplicate IDs;
- missing referenced NPC;
- missing evidence;
- invalid objective dependency;
- invalid vocabulary id;
- broken dialogue next node.

Build phải fail khi content invalid.

---

# 36. Coding Rules for Codex

1. TypeScript strict.
2. Không dùng `any` nếu không có lý do.
3. Không hardcode case content trong React/Phaser.
4. Core logic phải test được ngoài Phaser.
5. Scene cleanup event listeners khi destroy.
6. Không tạo global mutable singleton ngoài approved stores.
7. Không gọi backend trực tiếp từ Phaser scenes.
8. Không thêm dependency nếu native solution đủ.
9. Mỗi phase phải build/test trước khi chuyển phase tiếp.
10. Không tự mở rộng scope.

---

# 37. UI Rules

- React cho UI.
- Phaser cho world.
- Không duplicate state.
- Keyboard shortcuts ignore input/textarea/contenteditable.
- UI phải accessible.
- Fonts >= 14px desktop.
- Focus visible.
- Pause game when modal critical is open.

---

# 38. Asset Placeholder Strategy

Trong Phase 1–10:

Có thể dùng:

```text
simple colored isometric placeholders
```

Tên asset phải final-friendly:

```text
office_desk_01
office_chair_01
npc_leo_idle
```

Phase 11 replace asset không đổi code path.

---

# 39. Error Handling

Content load error:

```text
show developer-readable message
do not silently continue
```

Save corruption:

```text
backup
attempt migration
fallback new save only after user confirmation
```

MVP có thể đơn giản hơn nhưng không crash trắng màn hình.

---

# 40. Logging

Dev-only:

```text
[CaseEngine]
[Dialogue]
[Objective]
[Learning]
[Save]
```

Production giảm log.

---

# 41. Definition of Done per Phase

Mỗi phase cần:

```text
implementation
tests
lint
build
short documentation
no known console error
```

Không đánh dấu complete nếu chỉ có UI mock.

---

# 42. Master Prompt for Codex

Sử dụng prompt này ở đầu project:

```text
You are implementing "The Lexicon Files", a desktop web detective game
that teaches English through contextual investigation gameplay.

Before coding:
1. Read all files under /docs.
2. Treat GAME_DESIGN_DOCUMENT.md as product rules.
3. Treat ENGLISH_LEARNING_SYSTEM_DESIGN.md as learning rules.
4. Treat CASE_001_VERTICAL_SLICE_SPEC.md as the MVP content contract.
5. Follow the implementation roadmap phase by phase.

Architecture constraints:
- React + TypeScript for application UI.
- Phaser 3 for world rendering and interaction.
- Zustand for application/game state.
- ASP.NET Core on .NET 10 for backend APIs.
- Entity Framework Core + PostgreSQL/Npgsql for server persistence.
- Backend should be a modular monolith with clean Domain/Application/Infrastructure/API boundaries.
- Do not put backend on the critical gameplay path for the vertical slice; local gameplay and IndexedDB save must work without the API.
- Core game logic must remain framework-independent and unit-testable.
- Case content must be data-driven.
- Do not hardcode Case #001 content inside React or Phaser classes.
- Use a typed event bus between Phaser and React.
- Persist vertical-slice progress locally with IndexedDB.
- Add cloud persistence only when a later phase explicitly requires it.
- Use strict TypeScript on the frontend and nullable reference types on the backend.
- Use xUnit for .NET tests.
- Validate content data.
- Do not add multiplayer, AI NPC, voice recognition or procedural generation
  during the vertical slice.

Working method:
- Work on only the requested phase.
- First inspect the existing codebase.
- Write a short implementation plan.
- Make the smallest coherent architecture change.
- Add tests for core logic.
- Run lint, tests and build.
- Fix all failures before finishing.
- Summarize changed files and remaining risks.
- Never silently change product rules from the docs.
```

---

# 43. Per-Phase Prompt Template

```text
Implement Phase X from docs/04_CODEX_IMPLEMENTATION_ROADMAP.md.

Requirements:
- Read all relevant docs first.
- Inspect current implementation.
- Do not implement future phases.
- Preserve existing behavior.
- Keep content data-driven.
- Add/adjust tests.
- Run lint/test/build.
- Report:
  1. implementation summary
  2. files changed
  3. tests added
  4. commands executed
  5. known limitations
```

---

# 44. Recommended Codex Workflow

```text
Phase 0
↓ review
Phase 1
↓ playtest
Phase 2
↓ review
Phase 3–5
↓ functional vertical slice
Phase 6–8
↓ learning + deduction
Phase 9–10
↓ completion + save
Phase 11
↓ visual polish
Phase 12
↓ hardening
```

Không giao Codex toàn bộ 12 phase trong một prompt.

---

# 45. Final Acceptance

Project MVP hoàn thành khi:

```text
npm install
npm run dev
```

cho phép người dùng:

```text
start Case #001
move
interact
read English evidence
inspect vocabulary
talk to NPC
listen to audio
collect facts
find contradiction
accuse suspect
finish case
reload and resume progress
```

và trải nghiệm giữ đúng visual/game design specification.
