# Phase 2 — Thiết kế React HUD Integration

Trạng thái: đã duyệt trong chat ngày 2026-09-28. Triển khai roadmap `docs/04_CODEX_IMPLEMENTATION_ROADMAP.md` §21. Kế thừa Phase 1 (`docs/superpowers/specs/2026-09-28-phase-1-game-world-prototype-design.md`). Rule: `docs/architecture/ARCHITECTURE.md` §4, `apps/game-web/AGENTS.md`, palette `docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md` §5.

## 1. Mục tiêu và tiêu chí thành công

HUD React đè lên canvas Phaser, hiển thị objective hiện tại, tiến độ hồ sơ, prompt tương tác và key hints; có pause menu khóa di chuyển. Phaser ↔ React chỉ qua event bus có kiểu và Zustand store.

Acceptance (roadmap §21):

- đến interactable → UI prompt hiện;
- rời xa → prompt biến mất;
- React không rerender Phaser canvas.

## 2. Quyết định (đã xác nhận với người dùng)

| Chủ đề | Quyết định |
|---|---|
| Ngôn ngữ UI | Tiếng Việt cho chữ giao diện cố định và nhãn prompt. Chuỗi nằm trong content (`ui/vi.json`, scene JSON), không hardcode trong React. |
| Dữ liệu HUD | Content tối thiểu của Case #001 (case + objective đầu tiên) + Zustand store. Phase 3 thay nguồn bằng case engine, component HUD không đổi. |
| Kết nối | Store Zustand là nguồn duy nhất cho UI; `bridge/` đồng bộ bus → store; Phaser chỉ đọc `inputLocked`. |
| Key hints | Chỉ hiện phím đang hoạt động: E (Tương tác), Esc (Tạm dừng). J/M/Tab thêm khi tính năng có thật. |
| Ngoài phạm vi | Xử lý `interaction:triggered` (Phase 3/4), notebook, bản đồ nhỏ, evidence modal, dialogue, save, âm thanh, chọn ngôn ngữ. |

## 3. Content (`packages/game-content`)

- `cases/case-001/case.json`: `{ "id": "case-001", "title": "The Missing Report", "evidenceTotal": 5, "initialObjectiveId": "find_what_happened" }`. Tiêu đề lấy theo spec Case #001 ("CASE 001 — THE MISSING REPORT").
- `cases/case-001/objectives.json`: `{ "objectives": [{ "id": "find_what_happened", "text": "Tìm hiểu điều gì đã xảy ra với bản báo cáo" }] }` (spec Case #001 §6).
- Scene interaction thêm trường bắt buộc `prompt: string` (không rỗng). Main Office: `objective_note` → "Đọc ghi chú", `anna` → "Nói chuyện với Anna", `hallway_door` → "Ra hành lang".
- `ui/vi.json`: `objectiveHeading` "Mục tiêu hiện tại", `caseFile` "Hồ sơ", `interact` "Tương tác", `pause` "Tạm dừng", `paused` "Đã tạm dừng", `resume` "Tiếp tục".
- Zod schema + loader cho từng file: `loadCaseSummary(caseId)`, `loadUiStrings(locale)`. Validation: `initialObjectiveId` phải tồn tại trong objectives; `evidenceTotal` là số nguyên ≥ 0. Lỗi → `ContentValidationError` (như Phase 1) và panel lỗi trong `GameCanvas`.

`CaseSummary` = `{ id, title, evidenceTotal, initialObjective: { id, text } }` (type ở `shared-types`).

## 4. State (`apps/game-web/src/state/gameStore.ts`)

`createGameStore(init: { caseSummary: CaseSummary })` trả Zustand vanilla store (`zustand/vanilla`), tạo một lần mỗi lần mount `GameCanvas`, truyền xuống qua React context — không singleton.

```ts
type GameState = {
  caseTitle: string;
  currentObjective: { id: string; text: string } | null;
  evidenceCollected: number;   // 0 ở Phase 2
  evidenceTotal: number;
  nearby: { id: string; prompt: string } | null;
  paused: boolean;
  inputLocked: boolean;        // = paused ở Phase 2; Phase sau thêm modal/dialogue
  setNearby(n: { id: string; prompt: string } | null): void;
  togglePause(): void;
  setPaused(p: boolean): void;
};
```

## 5. Bridge (`apps/game-web/src/bridge`)

- `GameEventMap` bổ sung `'interaction:triggered': { interactableId: string }` và payload `interaction:nearby` thêm `prompt: string`.
- `useBusToStore(bus, store)`: `nearby` → `setNearby({ id, prompt })`; `cleared` → `setNearby(null)`; gỡ listener khi unmount.
- Phaser đọc `store.getState().inputLocked` mỗi frame (không subscribe React). Khi khóa: velocity 0, không cập nhật `InteractionTracker`, phím E bị bỏ qua.
- Phím E (Phaser, `addKey('E', false)` để không nuốt ký tự trong input): khi `nearby !== null` và không khóa → emit `interaction:triggered`.
- Esc do React xử lý (listener trên `window`, bỏ qua khi đang focus `input`/`textarea`/`contenteditable`) → `togglePause()`.

## 6. HUD (`apps/game-web/src/hud`, `apps/game-web/src/pause`)

- Layout: `GameCanvas` render `<div class="game-root">` chứa container canvas và lớp HUD `position: absolute; inset: 0; pointer-events: none` (từng panel bật `pointer-events: auto` khi cần). Canvas chỉ được tạo trong effect mount; HUD đọc store bằng `useStore(store, selector)` nên thay đổi state không làm re-render container canvas.
- `ObjectivePanel` (trên trái): tiêu đề `objectiveHeading`, vòng tròn rỗng + text objective (đỏ `#A4412D` chỉ cho vòng tròn/viền objective).
- `CaseProgress` (trên phải): biểu tượng hồ sơ, `caseFile` + `evidenceCollected/evidenceTotal`.
- `InteractionPrompt`: khi `nearby` → hộp `[E] <prompt>` ở giữa phía dưới; `role="status"`, `aria-live="polite"`.
- `KeyHints` (cạnh dưới): `E — Tương tác`, `Esc — Tạm dừng`.
- `PauseMenu`: modal `role="dialog" aria-modal="true"`, tiêu đề `paused`, nút `resume` được focus khi mở, focus trap (Tab/Shift+Tab xoay vòng trong modal), Esc hoặc nút → đóng.
- Style: nền Paper Cream `#D8C5A4` / Light Beige `#CDBA97`, chữ Ink Black `#2A2521`, viền Dark Brown `#3E342B`; font ≥ 14px; `:focus-visible` rõ ràng. Không dùng màu đỏ ngoài objective. Component dùng chung (panel giấy, keycap) đặt ở `packages/ui`.

## 7. Xử lý lỗi

Content case/objective/ui sai → `ContentValidationError` → panel lỗi đọc được (như Phase 1), không trắng màn hình. Thiếu khóa chuỗi UI → Zod fail khi load.

## 8. Kiểm thử

Unit (Vitest):
- schema: case hợp lệ; `initialObjectiveId` không tồn tại → fail kèm path; `evidenceTotal` âm → fail; ui strings thiếu khóa → fail; scene interaction thiếu `prompt` → fail.
- store: giá trị khởi tạo từ `CaseSummary`; `setNearby`; `togglePause` bật/tắt `paused` và `inputLocked`.
- `useBusToStore`: nearby → store có `{id, prompt}`; cleared → null; unmount gỡ listener (emit sau unmount không đổi store). Test hook bằng `react-dom/server` không đủ — dùng một bus + store thật và gọi logic đồng bộ tách ra thành hàm thuần `connectBusToStore(bus, store): () => void`; hook chỉ bọc hàm này trong effect.
- HUD render (`renderToString`): ObjectivePanel chứa text objective; CaseProgress chứa `0/5`; InteractionPrompt rỗng khi `nearby = null` và chứa `[E]` + prompt khi có; PauseMenu có `role="dialog"`.

E2E (Playwright, qua debug hook Phase 1):
- đi vào radius `objective_note` → thấy "Đọc ghi chú"; đi xa → prompt biến mất;
- canvas không bị mount lại: gắn `data-marker` vào element canvas, đi vào/ra radius 2 lần, element vẫn còn marker và vẫn đúng 1 canvas;
- Esc → dialog "Đã tạm dừng" hiện, focus ở "Tiếp tục"; giữ D 500 ms → x không đổi; Esc → đóng, giữ D → x tăng;
- đứng gần note, bấm E → `window.__lexiconDebug.triggeredEvents()` = 1 (bổ sung vào debug hook);
- ObjectivePanel hiển thị "Tìm hiểu điều gì đã xảy ra với bản báo cáo", CaseProgress hiển thị "0/5".

## 9. Definition of Done

`npm run lint`, `npm run test`, `npm run build`, `npm run format:check`, `npm run test:e2e` pass và có ghi lại output; AI memory được cập nhật.
