# Phase 4 — Evidence & Notebook: Kế hoạch triển khai

> **Dành cho agent thực thi:** Bắt buộc dùng `superpowers:executing-plans` để triển khai plan này tuần tự. Mỗi bước dùng checkbox (`- [ ]`) để theo dõi.

**Mục tiêu:** Hoàn thiện luồng thu thập một evidence mẫu, đọc/xem lại trong notebook và khôi phục state đó sau khi tải lại.

**Kiến trúc:** `game-core` tiếp tục sở hữu evidence IDs; bridge đưa interaction qua reducer và phát hiện evidence mới để mở modal. Repository IndexedDB có version và backup save không hợp lệ; bootstrap nạp state trước khi mount Phaser, còn Zustand giữ UI state tạm thời và projection. React render EvidenceModal/notebook từ content + store, Phaser chỉ nhận input lock và phát event.

**Công nghệ:** TypeScript strict, React, Zustand vanilla, Phaser, `idb` đã có sẵn, Zod/content JSON, Vitest và Playwright. Không thêm dependency.

**Spec:** `docs/superpowers/specs/2026-09-28-phase-4-evidence-notebook-design.md`

## Ràng buộc chung

- Chỉ một evidence đại diện cho Case #001; không mở rộng đủ năm evidence trong phase này.
- ID và nội dung evidence hiển thị lấy từ `packages/game-content`; không hardcode Case #001 trong React hoặc Phaser.
- `game-core` là nguồn chân lý của state nghiệp vụ; UI transient không nằm trong save.
- Phaser chỉ phát typed interaction event; React không gọi Phaser internals.
- Save dùng IndexedDB qua `idb`, có schema version; save lỗi phải được backup, migration được hỗ trợ phải thử, không ghi đè bằng save mới nếu chưa có xác nhận người dùng.
- Modal có focus trap, điều khiển được bằng bàn phím và khóa gameplay input; shortcut bỏ qua `input`, `textarea`, `contenteditable`.
- Chỉ dùng npm + Nx; không thêm dependency nếu thư viện/native hiện có đáp ứng.

## Trọng tâm review

1. Tương tác evidence lặp: không duplicate ID/domain event, không mở modal lần nữa, không autosave một transition rỗng.
2. Save hỏng hoặc schema version không hỗ trợ: giữ nguyên dữ liệu bằng backup, thử migration có hỗ trợ, không tự tạo/ghi đè save mới. Test ở Task 3 và Task 4.
3. IndexedDB không khả dụng hoặc ghi thất bại: hiện cảnh báo đọc được, giữ state trong bộ nhớ và không làm crash game. Test ở Task 3 và Task 4.
4. Khởi động khi save hợp lệ: khôi phục state trước khi tạo Phaser; canvas chỉ mount một lần. Test ở Task 4 và Task 6.
5. Modal/notebook và shortcut: Escape đóng overlay ưu tiên trước khi pause; J/E/Esc không chiếm phím từ trường nhập; đóng overlay giải phóng input lock. Test ở Task 5 và Task 6.

---

### Task 1: Gắn evidence mẫu vào content của scene

**Files:**
- Sửa: `packages/game-content/cases/case-001/scenes/main_office.json`
- Test: `packages/game-content/src/loader/loadCaseDefinition.test.ts`

**Interfaces:**
- Dùng contract `SceneAssetDefinition.interaction.effects` và effect `{ type: 'addEvidence', evidenceId: string }` hiện có.
- Loader phải trả scene `main_office` có interactable ID `meeting_minutes`, tham chiếu tới evidence hiện có cùng ID.

- [ ] **Bước 1: Viết test content thất bại trước khi sửa JSON**

Thêm test `Case #001 exposes meeting_minutes as a collectible scene interaction`; assert rằng loader trả asset `meeting_minutes`, interaction có prompt khác rỗng và effects chứa đúng `{ type: 'addEvidence', evidenceId: 'meeting_minutes' }`.

- [ ] **Bước 2: Chạy test để xác nhận thất bại**

Chạy `npx nx run @lexicon/game-content:test` từ root. Kết quả mong đợi: target FAIL ở test mới vì scene chưa có asset/interact effect.

- [ ] **Bước 3: Thêm interactable content tối thiểu**

Trong `main_office.json`, thêm asset `meeting_minutes` dùng texture placeholder `ph_note`, đặt tại `(1000, 1100)` để test có thể teleport player vào bán kính interaction, và effect `addEvidence` trỏ tới evidence JSON hiện có. Giữ `evidenceTotal: 5` như contract vertical slice; không thêm evidence khác.

- [ ] **Bước 4: Chạy content test**

Chạy lại lệnh ở Bước 2. Kết quả mong đợi: target PASS và loader không báo lỗi cross-reference.

### Task 2: Thêm UI state cho evidence và notebook vào store/bridge

**Files:**
- Sửa: `apps/game-web/src/state/gameStore.ts`
- Sửa: `apps/game-web/src/state/gameStore.test.ts`
- Sửa: `apps/game-web/src/bridge/connectCaseEngine.ts`
- Sửa: `apps/game-web/src/bridge/connectCaseEngine.test.ts`

**Interfaces:**
- Mở rộng `createGameStore` để nhận `initialState?: CaseState`; nếu bỏ qua thì tiếp tục gọi `createCaseState(caseDefinition)`.
- Thêm `activeEvidenceId: string | null`, `notebookOpen: boolean`, `notebookTab: 'people' | 'evidence' | 'vocabulary'` và action `openEvidence(id)`, `closeEvidence()`, `toggleNotebook()`, `setNotebookTab(tab)`.
- `connectCaseEngine(bus, store, definition)` giữ signature hiện tại; chỉ gọi `openEvidence(id)` cho domain event `evidenceAdded` trong transition thành công. Duplicate interaction không được mở modal.
- `inputLocked` luôn phản ánh `paused || activeEvidenceId !== null || notebookOpen`; mọi action mở/đóng state liên quan phải cập nhật giá trị nhất quán.

- [ ] **Bước 1: Viết test store thất bại**

Trong `gameStore.test.ts`, thêm test hydrate state đã truyền vào; thêm test UI state mặc định; thêm test mở/đóng evidence/notebook, đổi tab và input lock; thêm test mở evidence lần hai không đổi state UI nếu cùng ID.

- [ ] **Bước 2: Chạy test store để xác nhận thất bại**

Chạy `npx nx run @lexicon/game-web:test`. Mong đợi: target FAIL ở các test mới do API/action chưa tồn tại.

- [ ] **Bước 3: Viết test bridge thất bại**

Trong `connectCaseEngine.test.ts`, xác nhận tương tác `meeting_minutes` gọi transition và mở evidence modal đúng ID; tương tác lặp giữ modal đóng sau khi đã đóng và không thêm evidence/event lần hai.

- [ ] **Bước 4: Chạy test bridge để xác nhận thất bại**

Chạy `npx nx run @lexicon/game-web:test`. Mong đợi: target FAIL ở test mới vì bridge chưa ánh xạ domain event sang UI action.

- [ ] **Bước 5: Cập nhật store và bridge tối thiểu**

Thêm state/action đã nêu; cho phép inject `initialState`; trong bridge chỉ mở modal từ `evidenceAdded` mới. Không chuyển logic engine sang Zustand và không lưu UI state trong `CaseState`.

- [ ] **Bước 6: Chạy test store và bridge**

Chạy `npx nx run @lexicon/game-web:test`. Mong đợi: toàn bộ test app PASS.

### Task 3: Tạo repository IndexedDB có version, validation và backup

**Files:**
- Tạo: `apps/game-web/src/persistence/saveRepository.ts`
- Tạo: `apps/game-web/src/persistence/saveRepository.test.ts`

**Interfaces:**
- `SaveRecord`: `{ schemaVersion: 1; caseId: string; state: GameState; updatedAt: number }`.
- `SaveRepository` có `loadSave(caseId, definition)`, `saveGameState(state)` và `createFreshSaveAfterConfirmation(caseId, definition)`; `loadSave` trả một trong `{ status: 'missing' }`, `{ status: 'loaded'; state: GameState }`, `{ status: 'confirmation-required'; reason: string }`, `{ status: 'unavailable'; error: string }`.
- `createSaveRepository(openDatabase = openDB): SaveRepository` cho phép inject IndexedDB factory trong test; `GameCanvas` tạo repository một lần, còn việc mở DB chỉ diễn ra khi gọi phương thức repository, không mở DB lúc import module.
- `createFreshSaveAfterConfirmation` tạo và lưu state mới; chỉ được gọi từ action xác nhận rõ ràng trên UI.
- IndexedDB database tên `lexicon-game-saves`, version 1; object store `saves` keyed bởi `caseId` và `backups` keyed bởi ID backup; dùng `idb` đã cài.

- [ ] **Bước 1: Viết test load/save cơ bản thất bại**

Thêm test `returns missing when no record exists`, `round-trips only the GameState fields`, và `preserves caseId and schemaVersion`; dùng một IndexedDB test double inject qua factory để không thêm dependency.

- [ ] **Bước 2: Chạy test để xác nhận thất bại**

Chạy `npx nx run @lexicon/game-web:test`. Mong đợi: target FAIL ở test mới vì module/API chưa có.

- [ ] **Bước 3: Viết test dữ liệu save lỗi/version lạ thất bại**

Thêm test `backs up malformed state before requiring confirmation` và `does not overwrite unsupported schemaVersion`; assert backup chứa raw record, trạng thái trả về là `confirmation-required` và bản save gốc chưa bị thay. Validate đúng `caseId`, `caseTitle`, `evidenceTotal`, danh sách evidence/fact không trùng và chỉ chứa ID đã định nghĩa, objective keys/status khớp definition, flags là record boolean.

- [ ] **Bước 4: Viết test lỗi IndexedDB thất bại**

Thêm test load/save khi `openDB` reject; assert load trả `unavailable` có thông tin lỗi, save reject để caller hiển thị cảnh báo, không gọi tạo save mới.

- [ ] **Bước 5: Cài repository typed và schema validation**

Dùng `idb` transaction để mở database `lexicon-game-saves` version 1, đọc/ghi save theo `caseId`, lưu bản raw vào backups trước khi báo save không hợp lệ. Validate version/case ID/state theo Bước 3 trước khi trả `loaded`; triển khai switch migration chỉ cho version đã hỗ trợ và không sửa record cũ trước khi migration thành công. Phase này chưa có save legacy: version không hỗ trợ sẽ yêu cầu xác nhận tạo save mới.

- [ ] **Bước 6: Chạy test repository**

Chạy `npx nx run @lexicon/game-web:test`. Mong đợi: toàn bộ test app PASS, bao gồm trường hợp IDB unavailable và không overwrite.

### Task 4: Bootstrap từ save và autosave transition nghiệp vụ

**Files:**
- Sửa: `apps/game-web/src/game/GameCanvas.tsx`
- Sửa: `apps/game-web/src/game/GameCanvas.test.tsx` (tạo nếu chưa có)
- Tạo: `apps/game-web/src/persistence/connectAutosave.ts`
- Tạo: `apps/game-web/src/persistence/connectAutosave.test.ts`
- Sửa: `apps/game-web/src/state/gameStore.ts`
- Sửa: `packages/shared-types/src/case.ts`
- Sửa: `packages/game-content/src/schema/ui.ts`
- Sửa: `packages/game-content/src/schema/ui.test.ts`
- Sửa: `packages/game-content/ui/vi.json`

**Interfaces:**
- `GameCanvas` bootstrap content/save bất đồng bộ trước khi render `GameRoot`; `GameRoot` nhận `initialState: CaseState` và khởi tạo store bằng state này.
- `connectAutosave(store, saveGameState, onError): () => void` subscribe Zustand; gọi save khi tham chiếu `caseState` thay đổi sau transition, không gọi cho state UI hoặc transition idempotent; tuần tự hóa các lần ghi để save cũ không hoàn tất sau save mới; unsubscribe khi unmount.
- Thêm store state/action lỗi persistence có thể hiển thị, nhưng action này không đổi `caseState`.

- [ ] **Bước 1: Viết test autosave thất bại**

Test `autosaves only when caseState changes`, `does not autosave UI-only changes`, `does not autosave duplicate evidence`, `serializes writes in state order`, `reports save failures without losing in-memory state`, và `unsubscribes on cleanup`.

- [ ] **Bước 2: Chạy test autosave để xác nhận thất bại**

Chạy `npx nx run @lexicon/game-web:test`. Mong đợi: target FAIL ở test mới vì module chưa tồn tại.

- [ ] **Bước 3: Viết test bootstrap thất bại**

Test thứ tự `load save → create store from restored state → mount canvas`; test save missing dùng `createCaseState`; test save invalid hiển thị xác nhận và không mount Phaser trước khi người dùng xác nhận; test IDB unavailable hiển thị cảnh báo đọc được nhưng vẫn cho phép gameplay trong bộ nhớ. Thêm các `UiStrings`/Zod keys `saveUnavailable`, `saveWriteFailed`, `saveRecoveryTitle`, `saveRecoveryBody`, `createFreshSave`, `cancel` và UI test cho cảnh báo lỗi lưu/xác nhận tạo save mới.

- [ ] **Bước 4: Chạy test bootstrap để xác nhận thất bại**

Chạy `npx nx run @lexicon/game-web:test`. Mong đợi: target FAIL ở test mới vì GameCanvas đang bootstrap đồng bộ.

- [ ] **Bước 5: Cài autosave và bootstrap**

Gắn `connectAutosave` trong effect của `GameRoot`, cleanup subscription khi unmount. Đổi `GameCanvas` thành các trạng thái loading, game, storage warning và confirmation-required; chỉ mount Phaser khi đã có `CaseState` để khôi phục hoặc người dùng xác nhận tạo mới. Khi lưu thất bại, giữ state trong store và hiển thị cảnh báo không che gameplay.

- [ ] **Bước 6: Chạy test autosave/bootstrap và bridge hiện có**

Chạy `npx nx run @lexicon/game-web:test`. Mong đợi: toàn bộ test app PASS; test xác nhận canvas chỉ tạo sau khi restore xong.

### Task 5: Xây EvidenceModal, notebook và keyboard flow

**Files:**
- Tạo: `apps/game-web/src/evidence/EvidenceModal.tsx`
- Tạo: `apps/game-web/src/evidence/evidence.css`
- Tạo: `apps/game-web/src/evidence/EvidenceModal.test.tsx`
- Tạo: `apps/game-web/src/notebook/NotebookPanel.tsx`
- Tạo: `apps/game-web/src/notebook/notebook.css`
- Tạo: `apps/game-web/src/notebook/NotebookPanel.test.tsx`
- Tạo: `apps/game-web/src/notebook/useNotebookShortcut.ts`
- Tạo: `apps/game-web/src/notebook/useNotebookShortcut.test.ts`
- Sửa: `apps/game-web/src/game/GameCanvas.tsx`
- Sửa: `apps/game-web/src/pause/usePauseShortcut.ts`
- Sửa: `apps/game-web/src/hud/KeyHints.tsx`
- Sửa: `apps/game-web/src/hud/hud.test.tsx`
- Sửa: `packages/shared-types/src/case.ts`
- Sửa: `packages/game-content/src/schema/ui.ts`
- Sửa: `packages/game-content/src/schema/ui.test.ts`
- Sửa: `packages/game-content/ui/vi.json`

**Interfaces:**
- `EvidenceModal` nhận `evidence: EvidenceDefinition` và `onClose(): void`; hiển thị name/description từ content, có `role="dialog"`, `aria-modal`, focus trap và nút đóng.
- `NotebookPanel` nhận `caseDefinition`, `caseState`, `activeTab`, `onSelectTab(tab)`, `onClose()`; danh sách Evidence chỉ chiếu các ID trong `caseState.evidenceIds`; People/Vocabulary hiện empty state.
- Thêm `UiStrings`/Zod keys `notebook`, `evidence`, `people`, `vocabulary`, `close`, `notebookEmptyPeople`, `notebookEmptyVocabulary`, `evidenceEmpty` và `openNotebook`; nội dung tiếng Việt đặt ở `packages/game-content/ui/vi.json`.
- `J` do `useNotebookShortcut` xử lý qua `shouldHandleShortcut`; Escape vẫn có một owner: modal/notebook đóng trước, chỉ toggle pause khi không có overlay.

- [ ] **Bước 1: Viết test component thất bại**

Test modal hiển thị đúng evidence theo content, giữ focus trong dialog, đóng bằng nút; test notebook chỉ hiện evidence đã discovered, chọn tab, thể hiện People/Vocabulary empty state và nút đóng.

- [ ] **Bước 2: Chạy test component để xác nhận thất bại**

Chạy `npx nx run @lexicon/game-web:test`. Mong đợi: target FAIL ở test mới do components chưa tồn tại.

- [ ] **Bước 3: Viết test keyboard thất bại**

Test `J toggles notebook when focus is not typing`, `J is ignored in input/textarea/contenteditable`, `Escape closes evidence/notebook before pausing`, `Escape in typing target does nothing`; assert đóng overlay giải phóng `inputLocked`.

- [ ] **Bước 4: Chạy test keyboard để xác nhận thất bại**

Chạy `npx nx run @lexicon/game-web:test`. Mong đợi: target FAIL ở test mới.

- [ ] **Bước 5: Thêm UI strings, components và shortcut**

Thêm UI strings và Zod validation cho tab/modal; render modal và notebook trong `GameRoot` bằng store selectors; giữ visual theo paper/notebook patterns hiện có và palette tokens của `@lexicon/ui`. Dùng focus trap đã có ở `src/pause/focusTrap.ts`. Esc đóng evidence rồi notebook theo thứ tự, nếu không overlay thì xử lý pause như hiện nay; không thêm listener Esc thứ hai.

- [ ] **Bước 6: Chạy test UI, shortcut và content strings**

Chạy `npx nx run @lexicon/game-web:test` và `npx nx run @lexicon/game-content:test`. Mong đợi: cả hai target PASS.

### Task 6: Xác minh end-to-end, accessibility/input lock và Definition of Done

**Files:**
- Sửa: `apps/game-web/e2e/hud.spec.ts`
- Sửa: `apps/game-web/e2e/world.spec.ts`
- Có thể sửa: `apps/game-web/src/game/GameCanvas.tsx` hoặc UI styles nếu E2E phát hiện lỗi.

**Interfaces:**
- E2E dùng debug API hiện tại `window.__lexiconDebug` và không gọi Phaser internals từ React.
- Không đổi package manager; không sửa backend.

- [ ] **Bước 1: Thêm E2E cho collect/modal/notebook**

Test đi tới asset `meeting_minutes`, nhấn E, xác nhận modal có đúng tên/mô tả content, canvas vẫn chỉ một instance, movement dừng; nhấn Escape, mở notebook bằng J và xác nhận evidence xuất hiện. Nhấn E lần nữa sau đóng modal để xác nhận không modal trùng/duplicate.

- [ ] **Bước 2: Thêm E2E persistence qua reload**

Test dùng context IndexedDB sạch, thu evidence, reload, xác nhận notebook vẫn liệt kê evidence và modal không tự bật khi restore. Thêm trường hợp IndexedDB bị chặn nếu Playwright browser context cho phép cấu hình ổn định; nếu không, giữ kiểm chứng unavailable ở unit test Task 3/4.

- [ ] **Bước 3: Thêm E2E shortcut và focus/input lock**

Xác nhận J mở/đóng notebook, input nhận ký tự J/E/Escape mà không bị shortcut chiếm, movement không tiếp tục khi overlay mở và được khôi phục khi đóng.

- [ ] **Bước 4: Chạy E2E Phase 4**

Chạy `npm run test:e2e` từ root theo workflow repo. Mong đợi: toàn bộ E2E Phase 1–4 PASS, không có console/page error.

- [ ] **Bước 5: Chạy Definition of Done toàn repo**

Chạy lần lượt `npm run lint`, `npm run test`, `npm run build`, `npm run format:check`, `npm run test:e2e`, `npm run memory:check`. Ghi output thật vào handoff/memory; nếu npm script không chạy trong môi trường hiện tại, dùng Nx/Node CLI tương đương theo đúng lệnh có sẵn trong repo và ghi rõ hạn chế, không báo PASS thay thế.

- [ ] **Bước 6: Tự review diff và trạng thái Git**

Chạy `git diff --check`, rà lại spec §1–§5 với test/task tương ứng, xác nhận `git status` chỉ chứa thay đổi Phase 4. Sau review và xác nhận DoD, commit Phase 4 implementation; cập nhật AI memory ở commit kế tiếp theo protocol.

## Bàn giao

- Thực thi inline trên nhánh `dev` hiện tại theo lựa chọn của người dùng; không tạo worktree/nhánh mới.
- Chỉ tiến hành sau khi người dùng duyệt plan này.
- Sau khi hoàn tất và đã cập nhật memory, push `dev` theo yêu cầu đã giao; báo commit, output verification, và mọi hạn chế còn lại.
