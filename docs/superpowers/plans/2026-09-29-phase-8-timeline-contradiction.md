# Kế hoạch triển khai Phase 8 — Dòng thời gian và mâu thuẫn

> **Dành cho tác nhân triển khai:** BẮT BUỘC dùng `superpowers:subagent-driven-development` (khuyến nghị) hoặc `superpowers:executing-plans` để thực hiện plan theo từng task. Theo dõi các bước bằng checkbox (`- [ ]`).

**Mục tiêu:** Thêm dòng thời gian dựa trên nội dung case, tương tác xác nhận mâu thuẫn David, scene Archive tối thiểu, điều hướng có lưu scene và cổng cấu hình commerce trung lập, mà không làm mất tiến trình hiện có hay khóa nội dung.

**Kiến trúc:** Đưa định nghĩa và kết quả dòng thời gian/mâu thuẫn vào `shared-types`, xác thực nội dung và tham chiếu chéo trong `game-content`, rồi xử lý chuyển trạng thái thuần trong `game-core`. Zustand lưu case state cùng scene ID; bridge kiểu dữ liệu điều phối scene Phaser; sổ tay React hiển thị nội dung đã khám phá. Save schema mới chứa scene ID và tiến trình Phase 8; migration giữ nguyên dữ liệu cũ. Ở ranh giới khởi động ứng dụng, thêm `CommerceConfigProvider` có thể tiêm vào; provider mặc định trả cấu hình `free`, cấu hình sai hoặc lỗi tải cũng rơi về `free`. Cấu hình này chỉ là snapshot runtime, không tham gia save, case content, learning profile hay quyết định quyền truy cập.

**Công nghệ:** TypeScript strict, Zod, Vitest, React, Zustand, Phaser, IndexedDB hiện có, Playwright. Không thêm dependency.

**Spec:** `docs/superpowers/specs/2026-09-29-phase-8-timeline-contradiction-design.md`

## Ràng buộc chung

- Giữ `main_office` làm scene bắt đầu cho case mới.
- Giữ nguyên sự thật, dòng thời gian, hội thoại, lối chơi local-first và `evidenceTotal: 5` của Case #001.
- Phase 8 chỉ thêm Archive tối thiểu; không thêm scene khác, NPC/hội thoại mới, buộc tội hay kết thúc case của Phase 9.
- Chỉ hiển thị sự kiện có trong phần giới thiệu case hoặc được hỗ trợ bởi fact đã khám phá; chỉ cho chọn fact có trong `discoveredFactIds`.
- Sai vị trí hoặc sai cặp mâu thuẫn không thay đổi game state; người chơi được thử lại và không bị trừ tiến độ hay chi phí.
- Lưu scene ID hiện tại; khi khôi phục, dùng điểm spawn mặc định đã khai báo của scene. Không lưu tọa độ người chơi trong Phase 8.
- Migrate save schema V1/V2 mà không mất case state; giữ phiên bản IndexedDB hiện tại là `1`, trừ khi hợp đồng migration hiện có bắt buộc thay đổi.
- `game-core` không import React, Phaser, Zustand, DOM hoặc IndexedDB. React không gọi Phaser internals; scene phải gỡ listener khi shutdown/destroy.
- Giữ nội dung game trong `packages/game-content`; không hardcode ID/text Case #001 trong React/Phaser.
- Không đổi backend, learning system hoặc dependency.
- Chỉ định nghĩa hai mode `free` và `commercial` ở hợp đồng cấu hình; Phase 8 không kích hoạt hành vi trả phí. Cả hai mode đều giữ nguyên gameplay và toàn bộ nội dung khả dụng.
- Provider được tiêm tại app startup; provider mặc định dùng `free`. Lỗi tải, sai schema hoặc phiên bản cấu hình không hỗ trợ phải fallback `free` để game vẫn khởi động.
- Không lưu cấu hình trong save/case/learning profile; không thêm catalog, giá, entitlement, paywall, checkout, payment, subscription, refund, tài khoản, backend, remote/admin integration hoặc cổng khóa nội dung.
- Cấu hình phía client không phải nguồn xác thực giao dịch hay quyền truy cập; mọi khả năng thương mại tương lai cần nguồn sự thật ở server và nằm ngoài Phase 8.
- Giữ nguyên văn phản hồi sai `Something in the timeline is inconsistent.` và `This interpretation doesn't match the evidence.`.

## Trọng điểm cần review

- Gửi trực tiếp ID fact chưa khám phá hoặc ID task giả: core phải từ chối hoặc trả kết quả sai mà không sửa state.
- Sự kiện lấy từ phần giới thiệu case lúc 21:05: phải xuất hiện từ đầu, không cần evidence/fact và không tạo evidence mới.
- Scene/spawn đích không tồn tại hoặc lặp ID nội dung: content validation/build phải thất bại kèm đường dẫn lỗi.
- Save V1/V2 hợp lệ: phải giữ evidence, facts, flags và objective statuses, đồng thời mặc định scene về `main_office`; backup phải được tạo trước khi ghi migration. Save V3 hợp lệ khôi phục scene ID đã lưu.
- Tương tác terminal/cửa hoặc gửi lại lựa chọn đúng nhiều lần: không nhân đôi evidence, fact, objective progress hay kết quả mâu thuẫn; `evidenceTotal` vẫn là `5`.
- Commerce provider mặc định, provider được tiêm trả `commercial`, lỗi tải, config sai schema/phiên bản: lần lượt nhận đúng cấu hình hoặc fallback `free`, ứng dụng vẫn khởi động và không có nội dung/progress nào bị khóa.
- Commerce config không xuất hiện trong save record, case content hoặc learning profile; thêm provider không làm thay đổi reducer, content hay UI điều tra.

---

## Bản đồ file

| Khu vực | File tạo/sửa | Trách nhiệm |
|---|---|---|
| Hợp đồng | `packages/shared-types/src/scene.ts`, `case-engine.ts`, `index.ts` | Kiểu timeline, contradiction, spawn, transition và tiến trình case |
| Nội dung | `packages/game-content/src/schema/caseDefinition.ts`, `schema/scene.ts`, `loader/loadCaseDefinition.ts`, `loader/loadScene.ts`, `validation/validateRegisteredContent.ts`, `src/index.ts` | Parse, kiểm tra tham chiếu chéo và đăng ký scene/content |
| Case #001 | `packages/game-content/cases/case-001/case.json`, `objectives.json`, `evidences.json`, `facts.json`, `contradictions.json`, `scenes/main_office.json`, `scenes/archive.json`, `packages/game-content/ui/vi.json` | Khai báo mốc/sự kiện, fact, mục tiêu, chứng cứ, scene, lối đi và chuỗi UI |
| Core | `packages/game-core/src/timeline/placeTimelineEvent.ts`, `timeline/placeTimelineEvent.test.ts`, `contradiction/submitContradiction.ts`, `contradiction/submitContradiction.test.ts`, `src/index.ts`, `case/createCaseState.ts` | Chuyển trạng thái thuần và giá trị mặc định có thể lưu |
| Save và điều hướng | `apps/game-web/src/persistence/saveRepository.ts`, `saveMigration.ts`, các test tương ứng, `game/bootstrapGame.ts`, `game/GameCanvas.tsx`, `game/createGame.ts`, `game/scenes/WorldScene.ts`, `bridge/connectCaseEngine.ts`, `state/gameStore.ts` và các test tương ứng | Khôi phục scene, migration schema và chuyển scene qua typed event bus |
| Sổ tay | `apps/game-web/src/notebook/NotebookPanel.tsx`, `notebook.css`, `NotebookPanel.test.tsx` | Tab timeline, đặt sự kiện, chọn cặp fact và feedback truy cập được |
| Tích hợp | `apps/game-web/e2e/timeline.spec.ts` và `e2e/world.spec.ts` | Luồng hoàn chỉnh, tải lại, điều hướng và hồi quy thế giới |
| Commerce config | `apps/game-web/src/commerce/commerceConfig.ts`, `commerceConfig.test.ts`, `apps/game-web/src/game/GameCanvas.tsx` và test bootstrap liên quan | Hợp đồng provider trung lập, mặc định/fallback `free`, injection lúc khởi động; không khóa gameplay |

## Task 1: Khai báo hợp đồng và nội dung Case #001

**File:**

- Sửa: `packages/shared-types/src/scene.ts`
- Sửa: `packages/shared-types/src/case-engine.ts`, `packages/shared-types/src/index.ts`
- Sửa: `packages/game-content/src/schema/scene.ts`, `schema/caseDefinition.ts`, `loader/loadCaseDefinition.ts`, `loader/loadScene.ts`, `validation/validateRegisteredContent.ts`, `src/index.ts`
- Sửa: `packages/game-content/src/schema/scene.test.ts`, `schema/caseDefinition.test.ts`, `validation/validateRegisteredContent.test.ts`
- Sửa: `packages/game-content/cases/case-001/case.json`, `objectives.json`, `evidences.json`, `facts.json`, `contradictions.json`, `scenes/main_office.json`
- Tạo: `packages/game-content/cases/case-001/scenes/archive.json`
- Sửa: `packages/game-content/ui/vi.json`, `packages/game-content/src/schema/ui.ts`, `packages/shared-types/src/case.ts`, cùng test schema UI hiện có

**Giao diện dữ liệu:**

- `TimelineDefinition` có `slots` và `events`. Khai báo slot ID `20_00`, `20_18`, `20_27`, `20_29`, `20_32`, `20_36`, `20_40`, `20_45`, `21_05`; mỗi slot giữ giờ hiển thị tương ứng. Event ID lần lượt là `meeting_started`, `anna_exit_20_18`, `leo_exit_20_27`, `leo_outside_at_2029`, `david_entry_20_32`, `david_exit_20_36`, `leo_entry_20_40`, `meeting_ended_20_45`, `report_missing_21_05`. Dùng các fact ID hiện có cho hai event đã có; mỗi event khác dùng fact ID trùng event ID. Metadata mỗi event có nội dung, `slotId`, địa điểm, người liên quan, nguồn, confidence text và availability phân biệt bằng union: có sẵn từ đầu case hoặc cần danh sách `factIds`.
- `ContradictionDefinition` có ID `david_statement_vs_access_log`, đúng hai fact ID theo spec, giải thích đã soạn và objective ID `compare_david_statement` cần hoàn thành.
- `SceneDefinition` có `spawnPoints` được đặt tên, luôn có `default`. Main Office có thêm `from_archive`; Archive có thêm `from_office`. Asset tương tác có thể khai báo transition gồm `targetSceneId` và `targetSpawnId`.
- `CaseDefinition` chứa timeline và danh sách contradiction. `GameState` có danh sách ID event đã đặt và ID contradiction đã xác nhận, khởi tạo rỗng trong `createCaseState`.

**Các bước:**

- [ ] **Bước 1: Viết test schema thất bại** cho timeline/event/availability/contradiction/spawn/transition hợp lệ; ID trùng; mốc hoặc fact/evidence/objective/scene/spawn không tồn tại; cặp contradiction không có đúng hai fact; scene transition không có asset tương tác.
- [ ] **Bước 2: Chạy test xác nhận thất bại** bằng `npx nx test @lexicon/game-content`. Kỳ vọng test mới fail vì schema/field chưa được hỗ trợ.
- [ ] **Bước 3: Thêm type và schema** trong các file đã nêu. Giữ `.strict()`, dùng Zod discriminated union cho availability; báo lỗi tham chiếu với đường dẫn case/scene/field đọc được.
- [ ] **Bước 4: Đăng ký nội dung case**: chín mốc và event ID ở phần giao diện dữ liệu; tái sử dụng `meeting_started` và `leo_outside_at_2029`; thêm fact `anna_exit_20_18`, `leo_exit_20_27`, `david_entry_20_32`, `david_exit_20_36`, `leo_entry_20_40`, `meeting_ended_20_45`; event `report_missing_21_05` khả dụng từ đầu case. Khai báo cặp `david_statement_no_entry_after_20_00` + `david_entry_20_32` trong contradiction `david_statement_vs_access_log`; giữ `evidenceTotal` bằng `5`.
- [ ] **Bước 5: Thêm evidence/objectives và scene**: evidence `security_access_log` với đúng năm mục Anna Reed EXIT 20:18, Leo Tran EXIT 20:27, David Cole ENTRY 20:32, David Cole EXIT 20:36, Leo Tran ENTRY 20:40; objectives `check_security_records` (“Check the security records”) và `compare_david_statement` (“Compare David's statement with the evidence”) ở trạng thái active để core có thể hoàn tất đúng thời điểm. Thêm Archive placeholder có security terminal, cửa quay lại, spawn định danh; Main Office `hallway_door` đi tới `archive/from_office`, cửa Archive đi về `main_office/from_archive`. Gắn interaction terminal với effect cấp evidence và hoàn thành objective access log.
- [ ] **Bước 6: Bổ sung UI strings tiếng Việt** cho tab, slot, chọn/đặt, trạng thái trống, lỗi đặt timeline và gửi contradiction; cập nhật type/schema JSON đồng bộ.
- [ ] **Bước 7: Chạy test schema/content**: `npx nx test @lexicon/game-content`. Kỳ vọng toàn bộ test package pass, registered Case #001 parse được và có `evidenceTotal: 5`.
- [ ] **Bước 8: Commit** phần hợp đồng/content với thông điệp `feat(content): add Phase 8 timeline and Archive data`.

## Task 2: Viết chuyển trạng thái timeline và contradiction trong game-core

**File:**

- Tạo: `packages/game-core/src/timeline/placeTimelineEvent.ts`, `timeline/placeTimelineEvent.test.ts`
- Tạo: `packages/game-core/src/contradiction/submitContradiction.ts`, `contradiction/submitContradiction.test.ts`
- Sửa: `packages/game-core/src/case/createCaseState.ts`, `packages/game-core/src/index.ts`, `packages/game-core/src/case-engine.test.ts`

**Giao diện:**

```ts
placeTimelineEvent(
  definition: CaseDefinition,
  state: GameState,
  eventId: string,
  slotId: string,
): TimelinePlacementResult;

submitContradiction(
  definition: CaseDefinition,
  state: GameState,
  contradictionId: string,
  selectedFactIds: readonly string[],
): ContradictionResult;
```

- Kết quả placement/contradiction phân biệt lỗi ID không tồn tại với kết quả đúng/sai; kết quả sai giữ nguyên tham chiếu state và không phát domain event.
- Placement đúng thêm `eventId` đúng một lần. Event không khả dụng vì thiếu fact không được đặt. Slot sai cho phép thử lại.
- Contradiction chỉ xử lý khi cả hai fact đã khám phá. So sánh cặp không phụ thuộc thứ tự; khi đúng, lưu contradiction ID và dùng `applyEffects` để đặt flag `david_contradiction_found=true`, hoàn thành objective đã khai báo.

**Các bước:**

- [ ] **Bước 1: Viết test thất bại** cho placement đúng/sai/ID event sai/ID slot sai/event chưa khả dụng/gửi lại; availability từ đầu lúc 21:05; cặp đúng/sai/ID contradiction sai/fact ẩn/fact không xác định/đảo thứ tự/gửi lại; flag, objective và tính idempotent.
- [ ] **Bước 2: Chạy test mới** bằng `npx nx test @lexicon/game-core`; xác nhận các ca mới fail trước khi cài reducer.
- [ ] **Bước 3: Khai báo result/error types** trong `packages/shared-types/src/case-engine.ts`, export qua `index.ts`, rồi khởi tạo state Phase 8 rỗng trong `createCaseState`.
- [ ] **Bước 4: Cài đặt `placeTimelineEvent`** thuần, kiểm tra definition và state hiện tại trước khi trả state mới; không import lớp giao diện hoặc persistence.
- [ ] **Bước 5: Cài đặt `submitContradiction`** thuần; kiểm tra ID và `discoveredFactIds`, sau đó áp dụng effect flag/objective chỉ khi đúng.
- [ ] **Bước 6: Chạy test core** bằng `npx nx test @lexicon/game-core`. Kỳ vọng cả case đúng/sai/lặp và case ID không hợp lệ pass.
- [ ] **Bước 7: Commit** với `feat(game-core): add timeline and contradiction transitions`.

## Task 3: Lưu scene và điều hướng Main Office ↔ Archive

**File:**

- Sửa: `apps/game-web/src/persistence/saveRepository.ts`, `saveMigration.ts`, `saveRepository.test.ts`, `saveMigration.test.ts`
- Sửa: `apps/game-web/src/game/bootstrapGame.ts`, `bootstrapGame.test.ts`, `GameCanvas.tsx`, `createGame.ts`
- Sửa: `apps/game-web/src/state/gameStore.ts`, `gameStore.test.ts`, `apps/game-web/src/bridge/connectCaseEngine.ts`, test bridge tương ứng
- Sửa: `apps/game-web/src/game/scenes/WorldScene.ts`, `apps/game-web/src/game/bootstrapGame.test.ts` nếu test spawn thuộc bootstrap
- Sửa: `packages/shared-types/src/events.ts`, `apps/game-web/src/bridge/connectBusToStore.test.ts` nếu event được nối tại connector này

**Giao diện:**

- Save record hiện hành chuyển sang `schemaVersion: 3`, chứa `activeSceneId` và `GameState` mới; database IndexedDB giữ version `1`.
- `GameStoreState` chứa `activeSceneId`; `createGameStore` nhận scene ID ban đầu và cung cấp `transitionScene(sceneId: string, spawnId: string)` để kiểm tra scene/spawn rồi cập nhật state.
- `GameBootstrapResult` mang cả case state và scene ID. Save V1/V2 được nâng cấp lên V3; save cũ dùng `main_office`.
- Thêm typed event `scene:transitionRequested` với `{ sceneId: string; spawnId: string }`. `WorldOptions` cấp `CaseDefinition` cho `WorldScene`; scene resolve definition/spawn, cập nhật options trong Phaser registry rồi restart generic world scene. Bridge không gọi Phaser từ React.
- `SaveRepository.saveGameState(state: GameState, activeSceneId: string)` ghi cả case state và scene ID để scene transition kích hoạt autosave.

**Các bước:**

- [ ] **Bước 1: Viết test thất bại** cho save V3 round-trip; V1/V2 migration giữ evidence/facts/flags/objective statuses và đặt scene `main_office`; V3 khôi phục scene ID đã lưu; scene/spawn không hợp lệ được backup và yêu cầu recovery theo hợp đồng; database version không đổi.
- [ ] **Bước 2: Chạy migration tests** bằng `npx nx test @lexicon/game-web`; xác nhận test V3 và transition chưa có fail.
- [ ] **Bước 3: Thêm migration V2 → V3** trong `saveMigration.ts`; tái sử dụng validation state, bổ sung `timelineEventIds: []` và `contradictionIds: []`, kiểm tra scene ID đã đăng ký và giữ nguyên thứ tự backup trước khi ghi. Điều chỉnh V1 đi qua contract cũ rồi chuyển tiếp lên V3.
- [ ] **Bước 4: Đổi `SaveRecord`/repository** sang version 3, `LoadSaveResult.loaded` trả state + active scene; cập nhật mọi mock repository và assertion migration.
- [ ] **Bước 5: Viết test store/bootstrap thất bại** cho scene khởi đầu, chuyển tới scene/spawn hợp lệ, từ chối scene/spawn lạ, scene ID được phát hiện để autosave.
- [ ] **Bước 6: Bổ sung scene state và typed transition**: chỉ tra interaction trong scene hiện hành; terminal xử lý effect; cửa phát yêu cầu transition; sau khi store chấp nhận, Phaser đổi scene/spawn qua event bus.
- [ ] **Bước 7: Khởi động từ save**: chọn `SceneDefinition` theo active scene trong bootstrap; initial save dùng `DEFAULT_START`; scene đã lưu được dựng tại spawn mặc định; giữ một Phaser canvas và dọn listener khi scene bị restart.
- [ ] **Bước 8: Chạy test frontend** bằng `npx nx test @lexicon/game-web`. Kỳ vọng migration, store, bridge, autosave và scene lifecycle pass.
- [ ] **Bước 9: Commit** với `feat(game-web): persist scene navigation to Archive`.

## Task 4: Thêm cổng cấu hình commerce trung lập

**File:**

- Tạo: `apps/game-web/src/commerce/commerceConfig.ts`, `commerceConfig.test.ts`
- Sửa: `apps/game-web/src/game/GameCanvas.tsx`, `apps/game-web/src/game/bootstrapGame.ts`, `bootstrapGame.test.ts`

**Giao diện:**

```ts
export type CommerceConfig = {
  schemaVersion: 1;
  mode: 'free' | 'commercial';
};

export interface CommerceConfigProvider {
  load(): Promise<CommerceConfig>;
}
```

- Tạo provider mặc định tĩnh trả `{ schemaVersion: 1, mode: 'free' }`.
- `loadGameBootstrap` nhận provider tùy chọn với default provider ở trên; `GameCanvas` có thể tiêm provider thay thế. Bootstrap result mang snapshot runtime đã resolve để giữ rõ ranh giới khởi động; snapshot không thuộc `GameState`.
- Validate cấu hình tại boundary: `schemaVersion` phải bằng `1`, `mode` phải là `free` hoặc `commercial`. Nếu provider lỗi, trả dữ liệu sai cấu trúc hoặc version không được hỗ trợ, dùng snapshot `free` và tiếp tục khởi động game.
- Snapshot runtime không ghi vào IndexedDB/save, case content hay learning profile; không truyền vào reducer, scene, entitlement hoặc dữ liệu nội dung.
- `mode: 'commercial'` chỉ xác nhận khả năng nhận cấu hình thay thế trong tương lai; hiện tại không đổi UI, gameplay hoặc quyền truy cập. Không có cổng thanh toán hay khóa nội dung.

**Các bước:**

- [ ] **Bước 1: Viết test thất bại** trong `commerceConfig.test.ts` và `bootstrapGame.test.ts` cho provider mặc định trả `free`; provider được tiêm trả `commercial`; lỗi tải, mode/schema sai và version không hỗ trợ fallback về `free`; bootstrap vẫn khởi động; commercial không khóa case/evidence/progress; cấu hình không được thêm vào save/content/profile.
- [ ] **Bước 2: Chạy test mục tiêu** bằng `npx nx test @lexicon/game-web`; xác nhận các ca mới fail do chưa có hợp đồng/provider.
- [ ] **Bước 3: Thêm type, validator và default provider** trong `commerceConfig.ts`; giữ hợp đồng nhỏ, phiên bản hóa, không thêm dependency hoặc remote source.
- [ ] **Bước 4: Tiêm provider vào startup** qua `GameCanvas` và `loadGameBootstrap`; resolve đúng một snapshot mỗi lần khởi động, đưa snapshot vào `GameBootstrapResult`, chuyển lỗi/invalid về `free`, không trì hoãn khởi động hoặc khóa gameplay vì commerce config.
- [ ] **Bước 5: Chạy test app** bằng `npx nx test @lexicon/game-web`; kỳ vọng injection, fallback và không khóa gameplay pass.
- [ ] **Bước 6: Commit** với `feat(game-web): add provider-neutral commerce config seam`.

## Task 5: Thêm tab Dòng thời gian và giao diện mâu thuẫn trong sổ tay

**File:**

- Sửa: `apps/game-web/src/state/gameStore.ts`, `gameStore.test.ts` nếu thêm actions cho timeline/contradiction
- Sửa: `apps/game-web/src/notebook/NotebookPanel.tsx`, `notebook.css`, `NotebookPanel.test.tsx`
- Sửa: `packages/game-content/ui/vi.json`, `packages/game-content/src/schema/ui.ts`, `packages/shared-types/src/case.ts` nếu hoàn thiện thêm string còn thiếu từ Task 1

**Giao diện:**

- Thêm `timeline` vào `NotebookTab`; tab lấy label từ `UiStrings`, không đặt cứng text Case #001 trong React.
- `NotebookPanel` nhận state và callback typed cho placement/contradiction; danh sách event được lọc theo availability, card chỉ dùng dữ liệu case content.
- Hiển thị mốc theo thứ tự khai báo; người chơi chọn card sự kiện rồi mốc. Không đưa `slotId` đích hoặc target time vào nội dung hướng dẫn trước lần chọn.
- Danh sách fact mâu thuẫn lấy từ `discoveredFactIds`; submit gọi store/core. Sai dùng đúng hai chuỗi tiếng Anh của spec, kèm hint bản địa hóa không nêu đáp án.

**Các bước:**

- [x] **Bước 1: Viết test giao diện thất bại** cho label tab, mốc có thứ tự, chỉ hiện event khả dụng, sự kiện 21:05 từ đầu, không hiển thị fact ẩn, lựa chọn bằng bàn phím, focus nhìn thấy, feedback sai và trạng thái đúng đã lưu.
- [x] **Bước 2: Chạy `npx nx test @lexicon/game-web`** và xác nhận test tab/giao diện mới fail.
- [x] **Bước 3: Mở rộng store** để gọi hai reducer thuần và chỉ cập nhật state khi thành công; duy trì sự kiện đã đặt và contradiction đã lưu khi đổi tab/đóng mở notebook.
- [x] **Bước 4: Cài tab và nội dung UI** bằng `NotebookPanel`, semantic button/form controls có tên truy cập; danh sách event/fact lọc từ case state hiện tại.
- [x] **Bước 5: Thêm CSS** theo `notebook.css` hiện có: bố cục hồ sơ giấy, trục thời gian rõ, đỏ điều tra chỉ cho lựa chọn và mâu thuẫn đã xác nhận; trạng thái không chỉ phân biệt bằng màu.
- [x] **Bước 6: Chạy test UI** bằng `npx nx test @lexicon/game-web`; kỳ vọng keyboard, focus, hidden content, retry và completed state pass.
- [x] **Bước 7: Commit** với `feat(game-web): add timeline and contradiction notebook`.

## Task 6: Kiểm thử luồng tích hợp Phase 8 và hoàn tất gates

**File:**

- Tạo: `apps/game-web/e2e/timeline.spec.ts`
- Sửa: `apps/game-web/e2e/world.spec.ts` nếu cần assertion điều hướng/spawn
- Sửa test hồi quy ở các package bị tác động nếu các integration seam yêu cầu

**Các bước:**

- [ ] **Bước 1: Viết E2E thất bại** cho Main Office → Archive → thu thập Security Access Log → quay lại; objective/access fact; timeline placement sai rồi đúng; phát hiện lời khai David và fact 20:32; gửi contradiction; thấy challenge dialogue David; reload ở Archive và giữ scene/evidence/facts/timeline/flags/objectives.
- [ ] **Bước 2: Chạy E2E mục tiêu** bằng `npm run test:e2e` khi dev server Playwright có thể khởi động; xác nhận đúng luồng mới fail trước khi sửa lỗi tích hợp.
- [ ] **Bước 3: Sửa seam tích hợp** trong task sở hữu nếu E2E phát hiện sai khác; không đưa logic case vào Phaser/React và không thêm scope Phase 9.
- [ ] **Bước 4: Chạy các gate cuối**: `npm run lint`, `npm run test`, `npm run build`, `npm run typecheck`, `npm run format:check`, `npm run test:e2e`, `npm run memory:check`, `git diff --check`.
- [ ] **Bước 5: Kiểm tra nội dung cuối**: `validateRegisteredContent` pass; Case #001 vẫn có `evidenceTotal: 5`; không đổi dependency/lockfile/API; chỉ một Phaser canvas; không có lỗi console trong luồng E2E.
- [ ] **Bước 6: Commit** với `test(game-web): cover Phase 8 investigation flow`.

## Tự rà soát plan

- **Bao phủ spec:** Task 1 xử lý content/schema/Archive; Task 2 xử lý placement và contradiction; Task 3 xử lý typed navigation/save/migration; Task 4 xử lý config provider và fallback; Task 5 xử lý notebook/accessibility; Task 6 xác nhận luồng E2E và gates.
- **Độ rõ bước:** Mỗi bước có file hoặc lệnh cụ thể, tên transition, ID nội dung cần giữ và kết quả cần quan sát. Không để bước dạng “thêm validation phù hợp” hoặc “test các edge case” không nêu đầu vào.
- **Nhất quán kiểu:** `activeSceneId` là ID scene trong case definition; event điều hướng mang `sceneId` và `spawnId`; kết quả reducer không mutate đầu vào; state mới của timeline/contradiction được khởi tạo và migrate cùng `GameState`.
- **Trọng điểm review:** Sáu mục ở trên được ghim vào test ở Task 1–6; commerce fallback và invariant không khóa gameplay có test riêng ở Task 4.
- **Tỷ lệ:** Plan chia theo các ranh giới content/core/app UI/persistence đã có trong repo; chưa đưa code implementation vào plan.
