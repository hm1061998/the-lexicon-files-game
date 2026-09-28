# Phase 3 — Kế hoạch triển khai Case Engine

> **Dành cho agent thực thi:** BẮT BUỘC dùng `superpowers:subagent-driven-development` (khuyến nghị) hoặc `superpowers:executing-plans` để thực hiện lần lượt từng task. Các bước dùng cú pháp checkbox `- [ ]`.

**Mục tiêu:** Xây Case Engine thuần framework, nạp Case #001 từ JSON đã validate, quản lý objective/evidence/fact/flag và đưa state qua bridge/store hiện có.

**Kiến trúc:** `shared-types` định nghĩa contract, `game-content` dùng Zod để parse và lắp case từ JSON, `game-core` chạy reducer/condition/effect thuần, còn `game-web` chỉ chuyển tiếp typed event và hiển thị state trong Zustand/HUD. Content mẫu gồm objective khởi đầu, một evidence/fact và scene Main Office.

**Tech Stack:** TypeScript strict, Zod, Vitest, Zustand, Phaser event bus hiện có; không thêm dependency.

**Spec:** `docs/superpowers/specs/2026-09-28-phase-3-case-engine-design.md`

## Ràng buộc chung

- Chỉ dùng npm + Nx; không dùng pnpm, yarn hoặc bun.
- `game-core` và `shared-types` không import React, Phaser, Zustand, DOM, IndexedDB hoặc `game-content`.
- Case content chỉ nằm trong `packages/game-content` dưới JSON + Zod; không hardcode ID/text Case #001 trong React/Phaser.
- Phaser ↔ React chỉ qua typed `GameEventMap` và Zustand; Phaser không chứa learning/case logic.
- Condition/Effect là discriminated union; tuyệt đối không dùng `eval`.
- Không thêm dependency nếu native hiện có đủ dùng.
- Shortcut bỏ qua khi focus ở `input`, `textarea` hoặc `contenteditable`; listener phải cleanup khi shutdown/unmount.
- Lỗi content phải đọc được cho developer, không im lặng chạy tiếp hoặc crash trắng màn hình.
- Không triển khai Phase 4 (evidence modal/notebook/persistence) trong plan này.

## Điểm cần review kỹ

- Condition đệ quy rỗng: `all([]) === true`, `any([]) === false`; test ở Task 3.
- Fact có nhiều evidence nguồn: chỉ mở khi `unlockCondition` đúng; validate mọi `sourceEvidenceIds`; test ở Task 2/3.
- Effect chứa ID không tồn tại: loader báo source/path rõ; reducer từ chối nguyên transaction và giữ state cũ; test ở Task 2/3.
- Chạy lại cùng `addEvidence`/`unlockFact` không nhân đôi state hoặc domain event; test ở Task 3.
- `interaction:triggered` lặp dưới React StrictMode không đăng ký handler hoặc áp dụng effect trùng; test cleanup/đăng ký ở Task 4.

---

### Task 1: Shared contracts cho Case Engine

**Files:**
- Tạo: `packages/shared-types/src/case-engine.ts`
- Tạo: `packages/shared-types/src/type-tests/case-engine.ts`
- Sửa: `packages/shared-types/src/scene.ts`, `packages/shared-types/src/index.ts`
- Test: `packages/shared-types/src/index.test.ts`

**Interfaces:**
- Tạo `ObjectiveDefinition { id: string; text: string }`.
- Tạo `EvidenceDefinition { id: string; caseId: string; name: string; category: EvidenceCategory; description: string; relatedFactIds: readonly string[]; relatedNpcIds?: readonly string[]; vocabularyIds?: readonly string[]; imageAsset?: string }`; category theo docs: `document | audio | photo | object | statement | digital`.
- Tạo `FactDefinition { id: string; text: string; sourceEvidenceIds: readonly string[]; unlockCondition: Condition }`.
- Tạo `Condition` và `Effect` đúng union trong spec/roadmap.
- Tạo `CaseDefinition { id: string; title: string; evidenceTotal: number; initialObjectiveId: string; scenes: readonly SceneDefinition[]; evidences: readonly EvidenceDefinition[]; facts: readonly FactDefinition[]; objectives: readonly ObjectiveDefinition[] }`.
- Tạo `ObjectiveStatus = 'locked' | 'active' | 'completed'`, `GameState { caseId; caseTitle; evidenceTotal; objectiveStatuses: Record<string, ObjectiveStatus>; evidenceIds: readonly string[]; discoveredFactIds: readonly string[]; flags: Readonly<Record<string, boolean>> }`, `CaseDomainEvent` và `CaseTransitionResult` dùng ở Task 3.
- `CaseDomainEvent` phân biệt `evidenceAdded`, `factUnlocked`, `objectiveActivated`, `objectiveCompleted`, `flagChanged`; `CaseEngineError` gồm `unknownEvidence`, `unknownFact`, `unknownObjective`, `objectiveNotActive`, `objectiveAlreadyCompleted` và `id` tương ứng.
- Thêm `effects?: readonly Effect[]` vào `InteractionArea`; Phaser vẫn chỉ cần đọc ID/prompt.
- Giữ `CaseSummary` tạm tới khi Task 4 chuyển app sang `CaseDefinition`, sau đó xóa nếu không còn consumer.

- [ ] **Bước 1: Viết kiểm tra export/type contract**
  - Thêm type fixture dưới `src/type-tests/` dùng `satisfies` cho mỗi Condition/Effect variant và `CaseDefinition`; thêm kiểm tra entry point để export runtime hiện có không bị mất.
- [ ] **Bước 2: Chạy kiểm tra và xác nhận thất bại vì type chưa tồn tại**
  - Chạy `npx nx run @lexicon/shared-types:test` và `npm run typecheck` → lỗi type mới chưa được khai báo.
- [ ] **Bước 3: Khai báo type và export public**
  - Giữ mọi type framework-free, readonly; dùng import type cho `SceneDefinition`.
- [ ] **Bước 4: Chạy test và typecheck package**
  - Chạy lại hai lệnh ở Bước 2; kỳ vọng pass.
- [ ] **Bước 5: Commit**
  - `git commit -m "feat(types): define case engine contracts"`

### Task 2: Schema, loader và content Case #001 tối thiểu

**Files:**
- Tạo: `packages/game-content/src/schema/caseDefinition.ts`, `packages/game-content/src/loader/loadCaseDefinition.ts`
- Sửa: `packages/game-content/src/index.ts`, `packages/game-content/cases/case-001/case.json`, `objectives.json`, `evidences.json`, `facts.json`, `scenes/main_office.json`
- Xóa/thay consumer cũ trong task sau: `packages/game-content/src/schema/case.ts`, `packages/game-content/src/loader/loadCase.ts` (chỉ xóa khi Task 4 đã chuyển `GameCanvas`)
- Test: `packages/game-content/src/schema/caseDefinition.test.ts`, `packages/game-content/src/loader/loadCaseDefinition.test.ts`

**Interfaces:**
- `parseCaseDefinition(input: { caseRaw: unknown; objectivesRaw: unknown; evidencesRaw: unknown; factsRaw: unknown; sceneRaws: readonly unknown[] }, source: string): CaseDefinition`.
- `loadCaseDefinition(caseId: string): CaseDefinition`.
- JSON shape: `case.json` giữ `id`, `title`, `evidenceTotal`, `initialObjectiveId` và thêm `sceneIds`; các file danh sách có root key tương ứng (`objectives`, `evidences`, `facts`). Scene interaction nhận `effects` tùy chọn.
- Fixture Case #001 giữ `evidenceTotal: 5`, một objective hiện có, một evidence mẫu và một fact mẫu có `unlockCondition: { type: 'hasEvidence', evidenceId: <sample-id> }`; objective note có effect hoàn thành objective khởi đầu.

- [ ] **Bước 1: Viết test đỏ cho schema và loader**
  - Schema: chấp nhận fixture tối thiểu; từ chối evidenceTotal âm/không nguyên, duplicate ID, category sai, scene interaction effect sai.
  - Tham chiếu: từ chối initial objective không tồn tại, evidence source không tồn tại, related fact không tồn tại, scene ID không đăng ký và evidence/fact/objective ID không hợp lệ trong Condition/Effect.
  - Loader: `loadCaseDefinition('case-001')` trả đủ scene/evidence/fact/objective; case ID lạ ném `ContentValidationError` có source.
- [ ] **Bước 2: Chạy test để xác nhận fail**
  - `npx nx run @lexicon/game-content:test` → FAIL do parser/loader mới chưa có.
- [ ] **Bước 3: Thêm Zod strict schema và cross-reference validation**
  - Aggregate lỗi theo file/field path bằng `ContentValidationError`; scene parse dùng `parseSceneDefinition` hiện có.
- [ ] **Bước 4: Thêm fixture content và loader registry**
  - Đăng ký mọi JSON Case #001; giữ scene được load từ `packages/game-content`, không hardcode nội dung trong app.
- [ ] **Bước 5: Chạy test package**
  - `npx nx run @lexicon/game-content:test` → PASS.
- [ ] **Bước 6: Commit**
  - `git commit -m "feat(content): load validated case definitions"`

### Task 3: Pure reducers cho state, condition, effect, objective và fact

**Files:**
- Tạo: `packages/game-core/src/case/createCaseState.ts`, `condition/evaluateCondition.ts`, `effect/applyEffects.ts`, `objective/transitionObjective.ts`, `case-engine.test.ts` hoặc test cạnh từng module
- Sửa: `packages/game-core/src/index.ts`, `packages/game-core/src/index.test.ts`

**Interfaces:**
- `createCaseState(definition: CaseDefinition): GameState`.
- `evaluateCondition(state: GameState, condition: Condition): boolean`.
- `applyEffects(definition: CaseDefinition, state: GameState, effects: readonly Effect[]): CaseTransitionResult`.
- `activateObjective(definition: CaseDefinition, state: GameState, objectiveId: string): CaseTransitionResult`.
- `completeObjective(definition: CaseDefinition, state: GameState, objectiveId: string): CaseTransitionResult`.
- `CaseTransitionResult` là discriminated union: `{ ok: true; state: GameState; events: readonly CaseDomainEvent[] } | { ok: false; state: GameState; error: CaseEngineError }`.
- `CaseDomainEvent` có event cho evidence added, fact unlocked, objective activated/completed và flag changed; không tự phát bus.

- [ ] **Bước 1: Viết test đỏ cho điều kiện và khởi tạo**
  - Test từng leaf condition, `all`/`any` lồng nhau và quy ước mảng rỗng; state mới có objective ban đầu active, objective còn lại locked và evidence/fact/flags rỗng.
- [ ] **Bước 2: Chạy test để xác nhận fail**
  - `npx nx run @lexicon/game-core:test` → FAIL do API chưa có.
- [ ] **Bước 3: Implement khởi tạo state và condition evaluator**
  - Switch exhaustive theo `Condition`; không phụ thuộc runtime/framework.
- [ ] **Bước 4: Viết test đỏ cho effects và objective transition**
  - Kiểm tra ordered effects; add evidence; set/clear flag; unlock fact trực tiếp hoặc khi condition trở thành đúng; activate/complete objective; kích hoạt objective đã completed, ID lạ và complete objective chưa active trả error, state không đổi; lặp effect không tạo duplicate event/state.
- [ ] **Bước 5: Implement effect reducer và objective transition**
  - Validate ID với definition; áp dụng toàn bộ transaction trên state mới; chỉ trả state mới nếu mọi effect hợp lệ. Sau effect batch, mở một lần các fact có `unlockCondition` đúng.
- [ ] **Bước 6: Chạy test và framework-free guard**
  - `npx nx run @lexicon/game-core:test` → PASS, bao gồm import guard hiện có.
- [ ] **Bước 7: Commit**
  - `git commit -m "feat(game-core): add case state reducers"`

### Task 4: Tích hợp event bus, Zustand và HUD

**Files:**
- Sửa: `apps/game-web/src/state/gameStore.ts`, `apps/game-web/src/bridge/connectBusToStore.ts`, `apps/game-web/src/game/GameCanvas.tsx`, `apps/game-web/src/hud/ObjectivePanel.tsx`, `apps/game-web/src/hud/CaseProgress.tsx`, test tương ứng
- Tạo nếu cần để tách trách nhiệm: `apps/game-web/src/bridge/connectCaseEngine.ts` và test
- Sửa/xóa sau khi chuyển hết consumer: `packages/game-content/src/schema/case.ts`, `packages/game-content/src/loader/loadCase.ts`, export/test cũ của `CaseSummary`

**Interfaces:**
- `GameStoreState { caseDefinition: CaseDefinition; caseState: GameState; nearby; paused; inputLocked; setNearby; togglePause; setPaused; applyCaseEffects }`; `GameStore = StoreApi<GameStoreState>`.
- `createGameStore({ caseDefinition }: { caseDefinition: CaseDefinition }): GameStore` khởi tạo core `GameState` đúng một lần mỗi mount; transient UI fields (nearby, paused, inputLocked) vẫn thuộc store.
- `applyCaseEffects(effects: readonly Effect[]): CaseTransitionResult` trong store gọi reducer core bằng `caseDefinition` và `caseState`, cập nhật `caseState` chỉ khi `ok === true`.
- `connectCaseEngine(bus: EventBus<GameEventMap>, store: GameStore, definition: CaseDefinition): () => void` đăng ký `interaction:triggered`, tìm interaction theo ID trong definition, gọi `applyEffects`, cập nhật state và cleanup listener.
- HUD lấy title/total/evidence/objective từ `caseState` và `caseDefinition` selector; nếu có nhiều objective active thì chọn objective active đầu tiên theo thứ tự `definition.objectives`; không lưu bản sao có thể lệch trong Zustand.
- Giữ `interaction:triggered` payload `{ interactableId: string }`; `WorldScene` không import game-core/Zustand.

- [ ] **Bước 1: Viết test đỏ cho store projection và bridge**
  - Store khởi tạo từ definition; objective/evidence progress phản ánh core state; `interaction:triggered` trên objective note hoàn tất objective một lần; event từ ID không có effects không đổi case state; disconnect ngừng xử lý event.
  - Test canvas vẫn đúng một node/canvas khi store cập nhật HUD.
- [ ] **Bước 2: Chạy test để xác nhận fail**
  - `npx nx run @lexicon/game-web:test` → FAIL ở API/handler chưa có.
- [ ] **Bước 3: Chuyển store thành projection + UI transient state**
  - Zustand action gọi reducer đã có; không chép objective/evidence logic vào store.
- [ ] **Bước 4: Kết nối event bus tới core**
  - Đăng ký một listener có cleanup; handler resolve declarative effects từ loaded case definition.
- [ ] **Bước 5: Chuyển GameCanvas và HUD sang CaseDefinition**
  - Startup load một `CaseDefinition`; objective note hoàn tất objective ban đầu; sửa selector để HUD đọc từ state mới; giữ canvas mount ổn định.
- [ ] **Bước 6: Chạy test liên quan**
  - `npx nx run @lexicon/game-web:test` và `npm run test:e2e` → PASS; xác nhận prompt/pause/movement e2e cũ không hồi quy.
- [ ] **Bước 7: Commit**
  - `git commit -m "feat(game-web): connect case engine to interaction events"`

### Task 5: Toàn phase verification và memory handoff

**Files:**
- Sửa: `docs/ai/MEMORY.md`
- Kiểm tra: toàn monorepo và Phase 3 content/engine

- [ ] **Bước 1: Chạy kiểm tra bắt buộc**
  - `npm run lint`, `npm run test`, `npm run build`, `npm run format:check`, `npm run test:e2e`.
  - Backend không đổi nên không cần `dotnet build/test`.
- [ ] **Bước 2: Rà kết quả**
  - Chỉ ghi PASS theo output thực tế; sửa lỗi phát hiện trong phạm vi Phase 3 rồi chạy lại lệnh liên quan.
- [ ] **Bước 3: Cập nhật và kiểm tra memory**
  - Ghi commit kết quả, status Phase 3, verification, deferred work và next action; chạy `npm run memory:check`.
- [ ] **Bước 4: Commit handoff memory**
  - `git commit -m "docs: record Phase 3 case engine completion"`

## Thứ tự triển khai

Task 1 → Task 2 → Task 3 → Task 4 → Task 5. Mỗi task phụ thuộc contract/API task trước; không bắt đầu Phase 4 sau khi hoàn tất Phase 3.
