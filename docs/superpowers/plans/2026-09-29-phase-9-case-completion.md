# Phase 9 — Hoàn tất vụ án — Kế hoạch triển khai

> **For agentic workers:** REQUIRED SUB-SKILL: Sau khi người dùng duyệt plan và chọn cách thực thi, dùng `superpowers:executing-plans` cho phương án tự thực hiện hoặc `superpowers:subagent-driven-development` nếu người dùng chọn giao task cho subagent.

**Goal:** Triển khai buộc tội cuối cho Case #001, giữ nguyên tiến độ khi đoán sai, đóng case khi chọn David và hiển thị báo cáo điều tra/học tập có thể khôi phục sau reload.

**Architecture:** Case content khai báo các NPC có thể bị buộc tội, đáp án đúng và objective. `game-core` sở hữu reducer thuần; Zustand bọc reducer; React trình bày tab Kết luận và báo cáo. Save schema V4 lưu cờ đóng case và objective, còn bộ dựng báo cáo kết hợp `GameState` với `LanguageProfile` hiện tại.

**Tech Stack:** TypeScript strict, Zod, Vitest, React, Zustand, Phaser bridge hiện có, Playwright, IndexedDB, npm workspaces và Nx.

**Spec:** `docs/superpowers/specs/2026-09-29-phase-9-case-completion-design.md`

## Global Constraints

- Chỉ thực hiện Phase 9; không bắt đầu phase kế tiếp.
- Viết spec và plan bằng tiếng Việt.
- Dùng npm + Nx; không dùng pnpm, yarn hoặc bun; không thêm dependency/đổi lockfile.
- `game-core` và `learning-engine` không import React, Phaser, Zustand, DOM hoặc IndexedDB.
- React dùng store; không gọi Phaser internals. Không hardcode sự thật/ID/copy Case #001 trong React/Phaser.
- Chọn sai không đổi case state, không game over và không mất tiến độ.
- Feedback buộc tội sai giữ nguyên văn: `The evidence doesn't fully support this conclusion. Review the timeline.`
- Báo cáo phải ghi nhãn chỉ số `LanguageProfile` là tổng thể, không riêng Case #001.
- Save schema đích là V4; giữ IndexedDB database version `1`; bảo toàn và backup dữ liệu theo migration hiện có.
- Không thêm backend, thanh toán, XP, điểm quiz hoặc phần thưởng.
- Chạy các gate phase theo `AGENTS.md`: lint, test, build, typecheck, format, E2E, memory check và `git diff --check`.

## Bản đồ file

- **Hợp đồng và nội dung:** `packages/shared-types/src/case-engine.ts`, `packages/game-content/src/schema/caseDefinition.ts`, `packages/game-content/src/validation/dialogueReferences.ts`, `packages/game-content/cases/case-001/case.json`, `objectives.json`.
- **Core:** `packages/game-core/src/dialogue/reconcileDialogueProgress.ts`; thêm `packages/game-core/src/conclusion/submitAccusation.ts`.
- **Di trú:** `apps/game-web/src/persistence/saveMigration.ts`, `saveRepository.ts`; thêm snapshot lịch sử `packages/game-content/cases/case-001/save-v3.json` và hỗ trợ version trong `loadLegacySaveContract.ts`.
- **Điều tra UI:** `apps/game-web/src/state/gameStore.ts`, `apps/game-web/src/notebook/NotebookPanel.tsx`; thêm `apps/game-web/src/conclusion/AccusationPanel.tsx`.
- **Báo cáo UI:** thêm `apps/game-web/src/conclusion/buildCaseReport.ts` và `CaseSummaryScreen.tsx`; tích hợp trong `apps/game-web/src/game/GameCanvas.tsx`.
- **Localization:** `packages/shared-types/src/case.ts`, `packages/game-content/src/schema/ui.ts`, `packages/game-content/ui/vi.json`.
- **Kiểm thử tích hợp:** schema/core/store/component/persistence test bên cạnh module sở hữu; mở rộng `apps/game-web/e2e/timeline.spec.ts` cho hành trình hoàn chỉnh.

## Review Focus

1. **NPC lạ, trùng hoặc không nằm trong danh sách buộc tội:** content bị từ chối; reducer không đổi state. Kiểm tra ở Task 1–2.
2. **Buộc tội sai khi đã có nhiều tiến độ:** trả state bằng giá trị đầu vào, không tăng phạt và cho phép chọn lại. Kiểm tra ở Task 2 và E2E.
3. **Save V3 không có objective mới:** migration thêm trạng thái mặc định, giữ scene/facts/flags/timeline/contradictions và reconcile điều kiện David đã thú nhận. Kiểm tra ở Task 3.
4. **Hồ sơ học tập chưa có câu trả lời listening hoặc có mục từ với encounter count bằng 0:** accuracy hiện “chưa có dữ liệu”, số từ chỉ đếm mục đã gặp. Kiểm tra ở Task 5.
5. **Case đã đóng hoặc feedback khi chọn sai:** không mở lại điều tra/submit khác sau khi đóng; thông báo sai hiển thị nguyên văn và truy cập được bằng bàn phím/trình đọc màn hình. Kiểm tra ở Task 4–6.

---

### Task 1: Khai báo hợp đồng kết luận và điều kiện objective

**Files:**
- Modify: `packages/shared-types/src/case-engine.ts`, `packages/shared-types/src/index.ts`, `packages/shared-types/src/type-tests/case-engine.ts`
- Modify: `packages/game-content/src/schema/caseDefinition.ts`, `packages/game-content/src/validation/dialogueReferences.ts`
- Modify: `packages/game-content/cases/case-001/case.json`, `packages/game-content/cases/case-001/objectives.json`
- Test: `packages/game-content/src/schema/caseDefinition.test.ts`, `packages/game-content/src/loader/loadCaseDefinition.test.ts`

**Interfaces:**
- Produces `CaseConclusionDefinition { suspectNpcIds: readonly string[]; correctSuspectNpcId: string; objectiveId: string }` on `CaseDefinition.conclusion`.
- Produces optional `ObjectiveDefinition.activationCondition?: Condition`.
- Case #001 declares NPC IDs `anna`, `leo`, `david`; `correctSuspectNpcId: 'david'`; objective ID `submit_your_conclusion`.
- Objective activation condition requires `david_confession_read === true` and fact `david_took_report`.

- [ ] **Step 1: Viết test đỏ cho hợp đồng nội dung.** Trong `caseDefinition.test.ts`, thêm test chấp nhận kết luận hợp lệ; từ chối danh sách nghi phạm rỗng/trùng, đáp án đúng không thuộc danh sách và NPC không tồn tại. Thêm test objective `activationCondition` được parse và tham chiếu fact sai bị từ chối.
- [ ] **Step 2: Chạy test để xác nhận thất bại.** Chạy `npx nx test @lexicon/game-content --skip-nx-cache`; kỳ vọng test mới fail vì schema chưa có conclusion/activation condition.
- [ ] **Step 3: Thêm type, schema, cross-reference validation và dữ liệu Case #001.** Dùng strict Zod schema; không đưa luật chọn đúng/sai vào giao diện.
- [ ] **Step 4: Chạy test content và typecheck.** Chạy `npx nx test @lexicon/game-content --skip-nx-cache` và `npm run typecheck`; kỳ vọng PASS, Case #001 load hợp lệ.
- [ ] **Step 5: Commit task.** `feat(game-content): declare case conclusion contract`.

### Task 2: Objective activation và reducer buộc tội thuần

**Files:**
- Create: `packages/game-core/src/conclusion/submitAccusation.ts`, `submitAccusation.test.ts`
- Modify: `packages/game-core/src/dialogue/reconcileDialogueProgress.ts`, `packages/game-core/src/dialogue/dialogueRunner.test.ts`, `packages/game-core/src/index.ts`
- Modify: `packages/shared-types/src/case-engine.ts`, `packages/shared-types/src/index.ts`

**Interfaces:**
- Produces `submitAccusation(definition: CaseDefinition, state: GameState, suspectNpcId: string): AccusationResult`.
- `AccusationResult` thành công có `correct`, `state`, `events`; lỗi có mã `unknownSuspect`, `objectiveNotActive` hoặc `caseAlreadyClosed`.
- Reducer sai trả `{ ok: true, correct: false, state: inputState, events: [] }`. Kết luận đúng hoàn tất objective, đặt `flags.case_closed = true`; gửi lại đúng sau khi đóng trả thành công idempotent, không phát sự kiện mới.

- [ ] **Step 1: Viết test đỏ cho activation condition và reducer.** Test objective chỉ active sau khi có confession flag và fact; buộc tội sai giữ cùng state reference/equality; David hoàn tất objective/đặt cờ; NPC ngoài danh sách, objective chưa active và submit sai sau đóng bị từ chối; submit David lặp không phát event mới.
- [ ] **Step 2: Chạy test để xác nhận thất bại.** Chạy `npx nx test @lexicon/game-core --skip-nx-cache`; kỳ vọng API reducer chưa tồn tại và objective activation chưa được reconcile.
- [ ] **Step 3: Triển khai reconcile và reducer.** `reconcileDialogueProgress` kích hoạt objective bị khóa khi `activationCondition` đúng rồi mới hoàn tất objective active; reducer thuần kiểm tra candidate/availability và dùng `applyEffects` để commit kết quả đúng.
- [ ] **Step 4: Kiểm thử objective trên luồng dialogue Case #001.** Dùng state fixture có/không có `david_confession_read` và `david_took_report`; chỉ trường hợp đủ cả hai mới kích hoạt objective.
- [ ] **Step 5: Chạy core/content tests.** Chạy `npx nx test @lexicon/game-core --skip-nx-cache`, `npx nx test @lexicon/game-content --skip-nx-cache` và `npm run typecheck`; kỳ vọng PASS.
- [ ] **Step 6: Commit task.** `feat(game-core): add final accusation transition`.

### Task 3: Di trú save lên V4

**Files:**
- Modify: `apps/game-web/src/persistence/saveRepository.ts`, `saveMigration.ts`, `saveMigration.test.ts`, `saveRepository.test.ts`
- Modify: `packages/game-content/src/loader/loadLegacySaveContract.ts`, `loadLegacySaveContract.test.ts`, `packages/game-content/src/index.ts`
- Create: `packages/game-content/cases/case-001/save-v3.json`

**Interfaces:**
- Produces `SaveRecord.schemaVersion: 4`, `migrateVersion3Save(raw, definition): SaveRecord`, `migrateVersion2Save(...): SaveRecord`, `migrateVersion1Save(...): SaveRecord`.
- V3 historical contract liệt kê đúng objective IDs Phase 8 và các ID evidence/fact/timeline/contradiction hiện có; V4 validator yêu cầu đủ objective IDs mới.

- [ ] **Step 1: Viết test đỏ cho migration V3 và V4.** Bao phủ V3 thiếu objective mới, V3 đã có confession/fact để objective được mở, save cũ không confession giữ objective khóa, giữ scene/timeline/contradiction/progress, backup trước khi ghi, và lỗi backup/write giữ record nguồn.
- [ ] **Step 2: Chạy test để xác nhận thất bại.** Chạy `npx nx test @lexicon/game-web --skip-nx-cache` và `npx nx test @lexicon/game-content --skip-nx-cache`; kỳ vọng parser hiện chỉ chấp nhận V1/V2/V3 hiện hành.
- [ ] **Step 3: Thêm snapshot hợp đồng V3 lịch sử.** Mở rộng `loadLegacySaveContract` để trả hợp đồng V1/V2/V3 riêng theo `schemaVersion`, không suy lịch sử từ content mới.
- [ ] **Step 4: Chuyển repository/parser và migrator sang V4.** Đọc V1/V2/V3, validate bằng contract lịch sử, merge objective status mặc định, reconcile, backup raw rồi ghi V4; giữ IndexedDB version `1`.
- [ ] **Step 5: Chạy persistence/content tests.** Chạy `npx nx test @lexicon/game-web --skip-nx-cache`, `npx nx test @lexicon/game-content --skip-nx-cache` và `npm run typecheck`; kỳ vọng các V1/V2/V3 fixtures đều load V4 mà không mất state.
- [ ] **Step 6: Commit task.** `feat(game-web): migrate case saves to schema v4`.

### Task 4: Store và UI buộc tội

**Files:**
- Modify: `apps/game-web/src/state/gameStore.ts`, `gameStore.test.ts`
- Modify: `apps/game-web/src/notebook/NotebookPanel.tsx`, `NotebookPanel.test.tsx`
- Create: `apps/game-web/src/conclusion/AccusationPanel.tsx`, `AccusationPanel.test.tsx`
- Modify: `packages/shared-types/src/case.ts`, `packages/game-content/src/schema/ui.ts`, `packages/game-content/src/schema/ui.test.ts`, `packages/game-content/ui/vi.json`

**Interfaces:**
- Produces `GameStoreState.submitAccusation(suspectNpcId: string): AccusationResult` và `NotebookTab` value `conclusion`.
- `AccusationPanel` nhận `suspects`, `strings`, `onSubmit` typed callback; render không đọc `correctSuspectNpcId`.
- Thêm `UiStrings` keys: `conclusion`, `conclusionPrompt`, `conclusionSubmit`, `conclusionMismatch` (copy chính xác), `conclusionUnavailable`.

- [ ] **Step 1: Viết test đỏ cho store/UI.** Test store chỉ cập nhật khi đúng; chọn sai giữ `caseState`. Test tab chỉ xuất hiện khi objective active, lựa chọn bằng nút `aria-pressed`, submit đúng/sai hiển thị feedback nguyên văn và keyboard-operable.
- [ ] **Step 2: Chạy test để xác nhận thất bại.** Chạy `npx nx test @lexicon/game-web --skip-nx-cache`; kỳ vọng chưa có action/tab/component/chuỗi.
- [ ] **Step 3: Thêm store action và tab Kết luận.** Store gọi `submitAccusation` từ `game-core`, tab bị ẩn trước khi objective active và khi `case_closed` true; input gameplay bị khóa khi case đã đóng.
- [ ] **Step 4: Thêm AccusationPanel và chuỗi UI.** Danh sách hiển thị tên từ NPC content; sai hiển thị copy đã chốt với `role="status"`/`aria-live`, focus và lựa chọn không mất tiến độ.
- [ ] **Step 5: Chạy game-web/content tests và typecheck.** Kỳ vọng tất cả test mới cùng test sổ tay/store hiện có PASS.
- [ ] **Step 6: Commit task.** `feat(game-web): add case accusation screen`.

### Task 5: Projection và màn hình báo cáo

**Files:**
- Create: `apps/game-web/src/conclusion/buildCaseReport.ts`, `buildCaseReport.test.ts`
- Create: `apps/game-web/src/conclusion/CaseSummaryScreen.tsx`, `CaseSummaryScreen.test.tsx`
- Modify: `apps/game-web/src/game/GameCanvas.tsx`
- Modify: `packages/shared-types/src/case.ts`, `packages/game-content/src/schema/ui.ts`, `packages/game-content/src/schema/ui.test.ts`, `packages/game-content/ui/vi.json`

**Interfaces:**
- Produces `buildCaseReport(definition: CaseDefinition, state: GameState, profile: LanguageProfile): CaseReport`.
- `CaseReport` gồm `evidenceFound/evidenceTotal`, `keyContradictionFound`, `peopleInterviewed/peopleTotal`, `listeningTaskCompleted`, `vocabularyEncountered`, `vocabularyMastered`, `listeningAccuracyPercent: number | null`, `hintsUsed`.
- `keyContradictionFound` là true khi case có ít nhất một contradiction và mọi contradiction đã có trong `state.contradictionIds`; `listeningTaskCompleted` là true khi case có task và mọi completion flag đều true.
- `peopleTotal` đếm NPC có dialogue tree; `peopleInterviewed` đếm tree có completion flag true. Chỉ đếm từ có `encounterCount > 0`; listening accuracy làm tròn đến phần trăm nguyên; không có đáp án thì `null`.

- [ ] **Step 1: Viết test đỏ cho report projection.** Test metrics case lấy đúng flags/IDs; profile-wide vocabulary/hints/mastery; listening accuracy có/không mẫu; `encounterCount: 0` không được tính.
- [ ] **Step 2: Chạy test để xác nhận thất bại.** Chạy `npx nx test @lexicon/game-web --skip-nx-cache`; kỳ vọng module projection chưa tồn tại.
- [ ] **Step 3: Implement `buildCaseReport`.** Giữ hàm thuần, không ghi vào case save hoặc language profile.
- [ ] **Step 4: Viết test đỏ cho `CaseSummaryScreen`.** Xác nhận CASE CLOSED, các số liệu, nhãn toàn hồ sơ, và trạng thái chưa có dữ liệu listening.
- [ ] **Step 5: Implement màn hình và tích hợp `GameCanvas`.** Hiện màn hình khi cờ `case_closed` true (kể cả sau bootstrap/reload); không tạo action điều tra mới.
- [ ] **Step 6: Hoàn tất localization.** Bổ sung keys `caseClosed`, `caseReport`, `evidenceFound`, `keyContradiction`, `keyContradictionFound`, `keyContradictionMissing`, `peopleInterviewed`, `listeningTask`, `listeningTaskComplete`, `listeningTaskIncomplete`, `vocabularyEncountered`, `vocabularyMastered`, `listeningAccuracy`, `hintsUsed`, `overallProfile`, `noListeningData` vào `UiStrings`, Zod schema và `vi.json`.
- [ ] **Step 7: Chạy game-web/content tests và typecheck.** Kỳ vọng projection/screen tests cùng localization tests PASS.
- [ ] **Step 8: Commit task.** `feat(game-web): show case completion report`.

### Task 6: E2E hoàn chỉnh hành trình điều tra

**Files:**
- Modify: `apps/game-web/e2e/timeline.spec.ts`

**Interfaces:**
- Dùng đường đi đang kiểm chứng trong E2E Phase 8: Main Office → Archive/security log → timeline/mâu thuẫn → challenge David → confession → accusation/report.

- [ ] **Step 1: Mở rộng E2E hiện có để assert luồng mới.** Sau confession, xác nhận objective xuất hiện; gửi sai một lần và so sánh saved `state` trước/sau; buộc tội David; kiểm tra report metrics, không có console/page error, rồi reload và xác nhận báo cáo còn hiển thị.
- [ ] **Step 2: Chạy E2E để xác nhận hành vi tích hợp.** Chạy `npm run test:e2e`; kỳ vọng luồng mới thực hiện đúng từ đầu đến sau reload.
- [ ] **Step 3: Sửa seam tích hợp trong task sở hữu.** Nếu E2E lộ lỗi, sửa task/source component tương ứng rồi chạy lại E2E đến PASS.
- [ ] **Step 4: Commit task.** `test(game-web): cover case completion journey`.

### Task 7: Final gates, verification ledger và memory handoff

**Files:**
- Create: `docs/ai/2026-09-29-phase-9-case-completion-verification.md`
- Modify in a separate follow-up commit: `docs/ai/MEMORY.md`

- [ ] **Step 1: Chạy final gates.** Chạy `npm run lint`, `npm run test`, `npm run build`, `npm run typecheck`, `npm run format:check`, `npm run test:e2e`, `npm run memory:check` và `git diff --check`; xác nhận exit code của từng lệnh.
- [ ] **Step 2: Kiểm tra phạm vi cuối.** Xác nhận không sửa `apps/api`, không thêm dependency/lockfile, evidence total vẫn `5`, không có copy Case #001 hardcode trong React/Phaser.
- [ ] **Step 3: Ghi verification ledger.** Tạo `docs/ai/2026-09-29-phase-9-case-completion-verification.md` với output thật của các gate và cảnh báo.
- [ ] **Step 4: Commit verification ledger.** `docs(verification): record Phase 9 case completion gates`.
- [ ] **Step 5: Cập nhật và commit memory sau đó.** Đặt `result_commit` là commit verification; ghi Phase 9 complete/local hoặc pushed đúng theo Git thực tế, lưu final gates và next action.

## Tự rà soát plan

- **Độ phủ spec:** content/activation (Task 1–2); reducer/state (Task 2); migration V4 (Task 3); UI và localization (Task 4–5); report metrics/reload (Task 5–6); accessibility và full E2E (Task 4–6); gates/handoff (Task 7).
- **Input/failure review:** năm nhóm tại `Review Focus` đều có test ở task sở hữu; test sai kết luận xác minh state bất biến, còn test migration giữ backup khi ghi lỗi.
- **Tính nhất quán kiểu:** Task 1 khai báo `CaseConclusionDefinition`/`activationCondition`; Task 2 xuất `AccusationResult`/`submitAccusation`; Task 4 tiêu thụ reducer qua store; Task 5 nhận `CaseDefinition`, `GameState`, `LanguageProfile`.
- **Phạm vi:** chỉ Phase 9; không backend, commerce, dependency, thay đổi case truth hay Phase 10.
- **TDD:** từng module có test đỏ trước phần triển khai; task E2E xác nhận hành vi tích hợp; các final gates chạy sau khi toàn bộ task hoàn tất.
