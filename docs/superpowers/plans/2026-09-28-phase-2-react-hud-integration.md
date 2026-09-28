# Phase 2 — React HUD Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** HUD React tiếng Việt (objective, hồ sơ, prompt, key hints, pause) đè lên canvas Phaser, nối qua event bus + Zustand store, không re-render canvas.

**Architecture:** Content case/objective/UI strings (Zod) ở `game-content`; store Zustand vanilla tạo per-mount trong `GameCanvas`, truyền qua context; hàm thuần `connectBusToStore` đồng bộ bus → store; Phaser nhận một nguồn đọc-only `inputLocked`; component HUD đọc store bằng selector.

**Tech Stack:** TypeScript strict, Zod 3.25, Zustand 5 (`zustand/vanilla` + `useStore`), React 18, Phaser 3.88, Vitest 2, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-28-phase-2-react-hud-integration-design.md`

## Global Constraints

- Chỉ npm + Nx; không thêm dependency (Zustand, Zod đã có).
- Chữ hiển thị lấy từ content (`ui/vi.json`, case/objectives JSON, scene `prompt`); không hardcode chuỗi tiếng Việt hay ID Case #001 trong `apps/game-web/src` / `packages/ui/src` (trừ test/e2e).
- Không global singleton: bus và store tạo trong effect/memo của `GameCanvas`.
- React không truy cập `Phaser.Game`/scene; Phaser không import React/Zustand — nhận interface `InputLockSource = { isInputLocked(): boolean }`.
- Palette: Paper Cream `#D8C5A4`, Light Beige `#CDBA97`, Ink Black `#2A2521`, Dark Brown `#3E342B`; đỏ `#A4412D` **chỉ** cho vòng tròn/viền objective (và marker Phaser đã có).
- Font ≥ 14px; `:focus-visible` rõ; modal có focus trap.
- Phím tắt (E, Esc) bỏ qua khi focus ở `input`/`textarea`/`contenteditable`; Phaser `addKey(..., false)` để không nuốt ký tự.
- Mọi listener (bus, window keydown, Phaser key) gỡ khi unmount/shutdown.

## Review Focus

- StrictMode mount 2 lần → không còn 2 listener Esc trên `window` (e2e Task 4: Esc một lần mở đúng 1 dialog, Esc lần nữa đóng).
- Đang pause mà player đứng trong radius → bấm E không phát `interaction:triggered` (e2e Task 4).
- Đang pause, bấm Tab liên tục → focus không thoát khỏi dialog (unit Task 3 `getFocusTrapTarget`).
- Gõ Esc trong một input của trang → không mở pause (unit Task 4 `shouldHandleShortcut`).
- `evidenceTotal` = 0 hoặc objective không tồn tại → content fail có path, không crash HUD (unit Task 1).

---

### Task 1: Content case, objectives, UI strings và scene prompt

**Files:**
- Create: `packages/shared-types/src/case.ts`; Modify `packages/shared-types/src/index.ts`, `packages/shared-types/src/scene.ts` (`InteractionArea` thêm `prompt: string`)
- Create: `packages/game-content/src/schema/case.ts`, `packages/game-content/src/schema/ui.ts`, `packages/game-content/src/loader/loadCase.ts`, `packages/game-content/src/loader/loadUiStrings.ts`
- Modify: `packages/game-content/src/schema/scene.ts`, `packages/game-content/src/index.ts`, `packages/game-content/tsconfig.json` (include `ui/**/*.json` nếu đặt ở `packages/game-content/ui/`)
- Modify: `packages/game-content/cases/case-001/case.json`, `objectives.json`, `scenes/main_office.json`; Create `packages/game-content/ui/vi.json`
- Test: `packages/game-content/src/schema/case.test.ts`, `ui.test.ts`, bổ sung `scene.test.ts`, `loader/loadCase.test.ts`

**Interfaces:**
- Produces (`shared-types`): `type CaseSummary = { id: string; title: string; evidenceTotal: number; initialObjective: { id: string; text: string } }`; `type UiStrings = { objectiveHeading: string; caseFile: string; interact: string; pause: string; paused: string; resume: string }`; `InteractionArea.prompt: string`.
- Produces (`game-content`): `loadCaseSummary(caseId: string): CaseSummary`, `loadUiStrings(locale: 'vi'): UiStrings`, `parseCaseSummary(caseRaw: unknown, objectivesRaw: unknown, source: string): CaseSummary`, `parseUiStrings(raw: unknown, source: string): UiStrings`. Lỗi → `ContentValidationError`.

- [ ] **Step 1:** Test fail:
  - `case.test.ts`: `accepts case-001` (title `"The Missing Report"`, `evidenceTotal === 5`, `initialObjective.text === "Tìm hiểu điều gì đã xảy ra với bản báo cáo"`); `rejects unknown initialObjectiveId` (issue chứa `initialObjectiveId`); `rejects negative evidenceTotal` (issue chứa `evidenceTotal`); `rejects non-integer evidenceTotal`.
  - `ui.test.ts`: `accepts vi strings` (`objectiveHeading === "Mục tiêu hiện tại"`); `rejects missing key` (xóa `resume` → issue chứa `resume`); `rejects empty string`.
  - `scene.test.ts`: `rejects interaction without prompt` (issue chứa `prompt`).
  - `loadCase.test.ts`: `loads case-001 summary`; `unknown case throws ContentValidationError`.
- [ ] **Step 2:** `npx nx run @lexicon/game-content:test` → FAIL.
- [ ] **Step 3:** Implement schema `.strict()`, `evidenceTotal: z.number().int().min(0)`, chuỗi `z.string().min(1)`. Dữ liệu:
  - `case.json`: `{ "id": "case-001", "title": "The Missing Report", "evidenceTotal": 5, "initialObjectiveId": "find_what_happened" }`
  - `objectives.json`: `{ "objectives": [{ "id": "find_what_happened", "text": "Tìm hiểu điều gì đã xảy ra với bản báo cáo" }] }`
  - `main_office.json` interaction `prompt`: `objective_note` "Đọc ghi chú", `anna` "Nói chuyện với Anna", `hallway_door` "Ra hành lang".
  - `ui/vi.json`: `objectiveHeading` "Mục tiêu hiện tại", `caseFile` "Hồ sơ", `interact` "Tương tác", `pause` "Tạm dừng", `paused` "Đã tạm dừng", `resume` "Tiếp tục".
- [ ] **Step 4:** Test → PASS; `npm run typecheck` → PASS (game-web còn compile vì `prompt` chỉ thêm vào type content).
- [ ] **Step 5:** Commit `feat(content): add case summary, objectives, UI strings and scene prompts`.

### Task 2: Event, store và bridge

**Files:**
- Modify: `packages/shared-types/src/events.ts`
- Create: `apps/game-web/src/state/gameStore.ts`, `apps/game-web/src/state/GameStoreContext.tsx`, `apps/game-web/src/bridge/connectBusToStore.ts`, `apps/game-web/src/bridge/useBusToStore.ts`
- Modify: `apps/game-web/src/game/systems/interaction.ts` (`InteractableArea` thêm `prompt: string`), `InteractionTracker.ts`, `apps/game-web/src/game/scenes/WorldScene.ts` (đưa `asset.interaction.prompt` vào area)
- Test: `apps/game-web/src/state/gameStore.test.ts`, `apps/game-web/src/bridge/connectBusToStore.test.ts`, cập nhật `InteractionTracker.test.ts`, `interaction.test.ts`

**Interfaces:**
- Consumes: `CaseSummary` (Task 1).
- Produces:
  - `GameEventMap`: `'interaction:nearby': { interactableId: string; prompt: string }`, `'interaction:cleared': Record<string, never>`, `'interaction:triggered': { interactableId: string }`.
  - `type GameState` đúng spec §4; `type GameStore = StoreApi<GameState>`; `createGameStore(init: { caseSummary: CaseSummary }): GameStore`.
  - `GameStoreProvider({ store, children })`, `useGameStore<T>(selector: (s: GameState) => T): T` (throw nếu thiếu provider).
  - `connectBusToStore(bus: EventBus<GameEventMap>, store: GameStore): () => void`; `useBusToStore(bus, store): void` (effect bọc hàm trên).
  - `InteractionTracker` emit `interaction:nearby` với `{ interactableId, prompt }` từ area.

- [ ] **Step 1:** Test fail:
  - store: `initializes from case summary` (`caseTitle`, `currentObjective.text`, `evidenceCollected === 0`, `evidenceTotal === 5`, `nearby === null`, `paused === false`, `inputLocked === false`); `setNearby stores id and prompt`; `togglePause flips paused and inputLocked`; `setPaused(false) unlocks input`.
  - bridge: `nearby event sets store.nearby`; `cleared event resets nearby`; `disconnect stops syncing` (emit sau khi gọi hàm trả về → store không đổi).
  - tracker: `emits nearby with prompt`.
- [ ] **Step 2:** `npx nx run @lexicon/game-web:test` → FAIL.
- [ ] **Step 3:** Implement bằng `createStore` từ `zustand/vanilla`; `inputLocked` luôn bằng `paused` ở Phase 2.
- [ ] **Step 4:** Test → PASS; `npm run test:e2e` → PASS (hành vi Phase 1 giữ nguyên).
- [ ] **Step 5:** Commit `feat(state): add game store and bus-to-store bridge`.

### Task 3: Component HUD và PauseMenu

**Files:**
- Create: `packages/ui/src/theme/palette.ts`, `packages/ui/src/primitives/PaperPanel.tsx`, `packages/ui/src/primitives/Keycap.tsx`; Modify `packages/ui/src/index.ts`, `packages/ui/tsconfig.json` (exclude thêm `src/**/*.test.tsx`)
- Create: `apps/game-web/src/hud/{ObjectivePanel,CaseProgress,InteractionPrompt,KeyHints,Hud}.tsx`, `apps/game-web/src/hud/hud.css`, `apps/game-web/src/pause/PauseMenu.tsx`, `apps/game-web/src/pause/focusTrap.ts`
- Test: `apps/game-web/src/hud/hud.test.tsx`, `apps/game-web/src/pause/focusTrap.test.ts`, `packages/ui/src/primitives/primitives.test.tsx`

**Interfaces:**
- Consumes: `useGameStore`, `GameState` (Task 2); `UiStrings` (Task 1).
- Produces:
  - `packages/ui`: `PALETTE` (các hex trong Global Constraints + `investigationRed`), `PaperPanel({ as?, className?, children })`, `Keycap({ children })`.
  - Mỗi HUD component nhận `strings: UiStrings` qua prop (không đọc JSON trực tiếp) và đọc state bằng `useGameStore`.
  - `Hud({ strings })` render 4 component; root `className="hud"` (`position:absolute; inset:0; pointer-events:none`).
  - `PauseMenu({ strings, onResume })`: `role="dialog" aria-modal="true" aria-labelledby`, nút resume `autoFocus`.
  - `getFocusTrapTarget(focusables: readonly T[], active: T | null, shift: boolean): T | null` — thuần: Tab ở phần tử cuối → phần tử đầu; Shift+Tab ở đầu → cuối; ngoài danh sách → đầu; danh sách rỗng → null.

- [ ] **Step 1:** Test fail (render bằng `renderToString` trong `GameStoreProvider` với store thật):
  - `ObjectivePanel shows heading and objective text`; `CaseProgress shows 0/5 with caseFile label`; `InteractionPrompt renders nothing when nearby is null`; `InteractionPrompt shows [E] and prompt when nearby` (và `role="status"`); `KeyHints lists E and Esc with labels` (không có `J`/`M`); `PauseMenu is a modal dialog with resume button`.
  - focusTrap: 5 trường hợp trong Interfaces.
  - primitives: `PaperPanel renders children`; `Keycap renders key label`.
- [ ] **Step 2:** Test → FAIL.
- [ ] **Step 3:** Implement. CSS: font-size ≥ 14px, `:focus-visible { outline: 2px solid <Dark Brown>; outline-offset: 2px }`; vòng tròn objective viền `#A4412D`; prompt ở `bottom: 96px` giữa; key hints `bottom: 16px`.
- [ ] **Step 4:** Test → PASS; lint → PASS.
- [ ] **Step 5:** Commit `feat(hud): add HUD components and pause menu`.

### Task 4: Tích hợp GameCanvas, pause, phím E và e2e

**Files:**
- Modify: `apps/game-web/src/game/GameCanvas.tsx`, `apps/game-web/src/game/createGame.ts`, `apps/game-web/src/game/scenes/WorldScene.ts`, `apps/game-web/src/game/debug.ts`, `apps/game-web/src/App.test.tsx`, `apps/game-web/e2e/world.spec.ts`
- Create: `apps/game-web/src/pause/usePauseShortcut.ts`, `apps/game-web/src/pause/shouldHandleShortcut.ts` + `shouldHandleShortcut.test.ts`, `apps/game-web/e2e/hud.spec.ts`

**Interfaces:**
- Consumes: mọi thứ Task 1–3; `isTypingTarget` (Phase 1 `systems/input.ts`).
- Produces:
  - `createGame(parent, { scene, bus, input: InputLockSource })`; `type InputLockSource = { isInputLocked(): boolean }` export từ `createGame.ts`.
  - `WorldScene.update`: nếu `input.isInputLocked()` → velocity 0, không gọi tracker, bỏ qua E. Phím E: `keyboard.addKey('E', false)`, `JustDown` + tracker.current ≠ null + không khóa + `!isTypingTarget(document.activeElement)` → emit `interaction:triggered { interactableId }`.
  - `LexiconDebug.triggeredEvents(): number` (đếm trong DEV như `nearbyEvents`).
  - `shouldHandleShortcut(event: { key: string; target: Element | null }, key: string): boolean` — đúng key và `!isTypingTarget(target)`.
  - `usePauseShortcut(store)`: window `keydown` Esc → `togglePause()`; gỡ khi unmount.
  - `GameCanvas`: load scene + case summary + UI strings trong một `useMemo` (lỗi → panel lỗi như Phase 1); `useMemo` tạo store + bus; effect tạo game (deps `[scene, bus, store]`) và `connectBusToStore`; render `<div className="game-root">` = `<div ref=container/>` + `<GameStoreProvider><Hud/>{paused && <PauseMenu/>}</GameStoreProvider>`. `input = { isInputLocked: () => store.getState().inputLocked }`.

- [ ] **Step 1:** Unit test fail `shouldHandleShortcut`: Escape trên body → true; Escape trên `{tagName:'INPUT'}` → false; key khác → false. `App.test.tsx`: `renders HUD with objective text` (mock createGame như cũ; chuỗi objective xuất hiện trong `renderToString`).
- [ ] **Step 2:** E2E fail `hud.spec.ts`:
  - `prompt appears near the note and disappears when leaving` — giữ `d` 800 ms → thấy text "Đọc ghi chú"; giữ `a` 1500 ms → không còn.
  - `canvas is not remounted by HUD updates` — `document.querySelector('canvas').dataset.marker = 'x'`, vào/ra radius 2 lần → vẫn 1 canvas có `data-marker="x"`.
  - `Esc pauses and blocks movement` — Esc → `getByRole('dialog')` hiện, focus ở nút "Tiếp tục"; giữ `d` 500 ms → x không đổi; Esc → dialog ẩn; giữ `d` 500 ms → x tăng.
  - `E near the note triggers interaction once` — vào radius, bấm `e` → `triggeredEvents() === 1`; Esc rồi bấm `e` → vẫn 1.
  - `HUD shows objective and case progress` — thấy "Tìm hiểu điều gì đã xảy ra với bản báo cáo" và "0/5".
  - `Esc typed in a page input does not pause` — inject input, focus, Esc → không có dialog.
- [ ] **Step 3:** `npm run test:e2e` → FAIL.
- [ ] **Step 4:** Implement.
- [ ] **Step 5:** `npm run test:e2e` → PASS toàn bộ (Phase 1 + Phase 2); `npx nx run @lexicon/game-web:test` → PASS; `npm run build` → PASS, `grep -r "__lexiconDebug" apps/game-web/dist` rỗng.
- [ ] **Step 6:** Commit `feat(game-web): integrate HUD, pause and interact key`.

### Task 5: Definition of Done + memory

**Files:** Modify `docs/ai/MEMORY.md`

- [ ] **Step 1:** Chạy và ghi output: `npm run lint`, `npm run test`, `npm run build`, `npm run format:check`, `npm run test:e2e`, `npm run memory:check`.
- [ ] **Step 2:** Cập nhật `MEMORY.md` (phase-2 complete, commit, verification, next action: chờ người dùng yêu cầu Phase 3); `npm run memory:check` → PASS.
- [ ] **Step 3:** Commit `docs: record Phase 2 completion`.
