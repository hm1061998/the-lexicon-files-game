# Kế hoạch triển khai màn hình tiêu đề, briefing và hướng dẫn chơi Case #001

> **Cho coding agent:** REQUIRED SUB-SKILL: dùng `subagent-driven-development` (có subagent) hoặc `executing-plans` theo lựa chọn của người dùng. Mỗi bước dùng checkbox, RED trước code, GREEN trước commit. Chưa triển khai trước khi người dùng duyệt file plan này.

**Mục tiêu:** người chơi mới thấy màn hình tiêu đề, nhận briefing của Chief, được gợi ý thao tác theo ngữ cảnh và mở lại được "Cách điều tra"; người chơi cũ vào thẳng game không bị chặn.

**Kiến trúc:** `GameCanvas` thêm giai đoạn `title` trước `GameRoot`; briefing là overlay khóa input trên thế giới đã mount; gợi ý là hàm chọn thuần + component không chặn, cờ "đã xem" nằm trong learning record V3. Briefing là content tùy chọn của case (`case.json`), validate bằng cơ chế vocabulary hiện có. `game-core`, `learning-engine` và Phaser scene không đổi.

**Công nghệ:** React 18, TypeScript strict, Zustand 5, Zod, idb, Vitest, Playwright, Node 22, npm + Nx. Không thêm dependency.

**Spec:** `docs/superpowers/specs/2026-10-02-intro-onboarding-design.md` (đã duyệt 02/10/2026, kể cả 5 quyết định mặc định ở §15). Baseline: `08e115f`. Backlog: `PR-01` trong `docs/product/2026-10-02-product-review-and-direction.md`.

## Ràng buộc toàn cục

- Font ≥ 14px, vùng bấm ≥ 44×44px; không cuộn ở 1280×720, 760×600, 390×844; control cần thiết nằm trong viewport.
- Màu đỏ `#A4412D` / `#743026` **không** dùng cho tiêu đề, briefing, coach note, trang hướng dẫn.
- Không modal tutorial nhiều bước; briefing, mức hỗ trợ, coach note đều bỏ qua được; không timer, không điểm, không lộ lời giải/vị trí evidence/nghi phạm.
- Text/ID Case #001 chỉ trong `packages/game-content`; React/Phaser không hardcode câu briefing. Chuỗi UI trong `packages/game-content/ui/vi.json` + `ui.ts` + `UiStrings`.
- Không đổi `SAVE_DATABASE_VERSION`, save schema, settings schema (V1 strict), transcript flags, case rules, backend. Không thêm dependency.
- Phaser không chứa logic hướng dẫn; coach note chỉ dùng event/state chung (`interaction:*`, `player:moved`, `evidenceIds`, `discoveredFactIds`, cờ mở modal), không dùng id riêng của Case #001.
- Listener/subscription phải cleanup khi unmount (StrictMode mount/unmount hai lần không nhân đôi hiệu ứng).
- Chỉ npm + Nx; `git add` file cụ thể; giữ `apps/game-web/debug.log` untracked; chưa push.
- Briefing hiện **chỉ** khi bắt đầu vụ án mới; Continue không briefing. Không có cờ lưu cho briefing.

## Tập trung review

1. Reload ngay sau Vụ án mới, trước autosave đầu: briefing hiện lại chấp nhận được, nhưng không được mất save cũ hoặc nhân đôi backup. Test Task 3/5.
2. Người chơi cũ nâng cấp V2 → V3 (có tiến độ từ vựng, hoặc chỉ có `vocabularyTutorialSeen`): không gợi ý nào hiện; record cũ được backup trước khi ghi. Test Task 2.
3. Hành động hoàn thành trước khi gợi ý kịp hiện (mở sổ tay trước khi có evidence, di chuyển trong lúc briefing): gợi ý được đánh dấu xong, không hiện muộn. Test Task 7.
4. Esc/J/B/M khi briefing đang mở: Esc đóng briefing và không bật Pause; J/B/M không mở gì; sau đóng, input mở lại. Test Task 6.
5. IndexedDB không dùng được (memory-only): màn hình tiêu đề vẫn chơi được, Continue không hiện, cờ onboarding giữ trong bộ nhớ, không crash. Test Task 5.

## Sơ đồ file

| Đơn vị | Đường dẫn | Trách nhiệm |
| --- | --- | --- |
| Content | `packages/shared-types/src/case-engine.ts` (kiểu briefing), `packages/shared-types/src/case.ts` (`UiStrings`), `packages/game-content/src/schema/caseDefinition.ts`, `src/validation/vocabularyReferences.ts`, `src/schema/ui.ts`, `ui/vi.json`, `cases/case-001/case.json` | Schema/loader/validate briefing, chuỗi UI |
| Learning V3 | `apps/game-web/src/onboarding/onboardingTypes.ts`, `src/persistence/learningMigration.ts`, `learningRepository.ts`, `connectLearningAutosave.ts`, `src/state/learningStore.ts` | Cờ `onboardingSeen`, migration, store action |
| Save | `apps/game-web/src/persistence/saveRepository.ts` | `startNewCase` backup rồi tạo state mới |
| Cài đặt/hướng dẫn | `apps/game-web/src/pause/SettingsFields.tsx`, `PauseMenu.tsx`, `apps/game-web/src/onboarding/HowToInvestigate.tsx` | Trường cài đặt dùng chung, trang "Cách điều tra" |
| Tiêu đề | `apps/game-web/src/title/` (`titleModel.ts`, `TitleScreen.tsx`, `SupportPicker.tsx`, `NewCaseConfirm.tsx`, `title.css`), `src/game/GameCanvas.tsx` | Luồng title → support → playing |
| Briefing | `apps/game-web/src/briefing/` (`BriefingMemo.tsx`, `briefing.css`), `src/state/gameStore.ts`, `pause/usePauseShortcut.ts`, `notebook/useNotebookShortcut.ts`, `deduction/useDeductionShortcut.ts` | Overlay khóa input, Esc |
| Coach | `apps/game-web/src/onboarding/` (`selectCoachNote.ts`, `useOnboardingSignals.ts`, `CoachNote.tsx`, `coach.css`) | Chọn gợi ý, tín hiệu, hiển thị |
| Board | `apps/game-web/src/deduction/DeductionCaseFile.tsx` | Dòng briefing trong Hồ sơ vụ việc |
| Kiểm chứng | `apps/game-web/e2e/journeyHelpers.ts`, các spec hiện có, `e2e/onboarding.spec.ts`, `docs/ai/` | Helper đi qua title/briefing, spec mới, báo cáo |

## Lệnh và môi trường

Đọc `AGENTS.md`, `apps/game-web/AGENTS.md`, `docs/ai/MEMORY.md`, spec; reconcile Git trước khi làm. Dùng Node 22 trong `.superpowers/runtime/node-v22.23.3-win-x64` và `NX_DAEMON=false` như `docs/ai/MEMORY.md` mô tả; chạy Nx bằng `node .../npm/bin/npx-cli.js nx ...` khi wrapper `npx.cmd` lỗi. Test hẹp: `npx vitest run <đường dẫn>` trong `apps/game-web` hoặc package tương ứng; không kết luận PASS khi 0 test chạy. Gate cuối: `npm run lint`, `test`, `build`, `typecheck`, `format:check`, `memory:check`.

### Task 1: Content briefing, chuỗi UI và docs/03

**Files:**
- Modify: `packages/shared-types/src/case-engine.ts`, `packages/shared-types/src/case.ts`, `packages/game-content/src/schema/caseDefinition.ts`, `packages/game-content/src/validation/vocabularyReferences.ts`, `packages/game-content/src/schema/ui.ts`, `packages/game-content/ui/vi.json`, `packages/game-content/cases/case-001/case.json`, `docs/03_CASE_001_VERTICAL_SLICE_SPEC.md` §6
- Test: `packages/game-content/src/schema/caseDefinition.test.ts`, `src/validation/vocabularyReferences.test.ts`, `src/schema/ui.test.ts`, `src/index.test.ts`

**Interfaces:**
- Produces (`shared-types`): `CaseBriefingLineDefinition { id: string; text: string; translationVi?: string; vocabularySpans?: readonly <cùng kiểu phần tử với DialogueNode.vocabularySpans>[] }`, `CaseBriefingDefinition { from: string; lines: readonly CaseBriefingLineDefinition[] }`, `CaseDefinition.briefing?: CaseBriefingDefinition`.
- Produces (`UiStrings`, đều `string`): `titleGame`, `titleTagline`, `titleContinue`, `titleNewCase`, `titleHowTo`, `titleSettings`, `titleBack`, `newCaseConfirmTitle`, `newCaseConfirmBody`, `newCaseConfirmAccept`, `supportTitle`, `supportBeginnerHint`, `supportLearningHint`, `supportImmersionHint`, `supportUseDefault`, `briefingTitle`, `briefingAccept`, `coachMove`, `coachInteract`, `coachNotebook`, `coachBoard`, `coachDismiss`, `howToTitle`, `howToControlsHeading`, `howToControlsBody`, `howToLoopHeading`, `howToLoopBody`, `howToWordsHeading`, `howToWordsBody`, `howToPrinciplesHeading`, `howToPrinciplesBody`, `pauseHowTo`.
- Produces (loader): `vocabularyContexts` có thêm `{ id: 'briefing:<caseId>:<lineId>:text', vocabularyIds }` cho mỗi dòng có span; `validateVocabularyReferences` nhận thêm `briefingContexts: readonly Context[]` (cùng dạng `dialogueContexts`) và báo lỗi với kind `briefing`.

- [ ] **Step 1: Viết test RED.** `caseDefinition.test.ts`: case hợp lệ có `briefing` load được và `definition.briefing.lines.length === 4`; case không có `briefing` vẫn load, `definition.briefing === undefined`; `lines` rỗng và 7 dòng bị từ chối; `id` dòng trùng bị từ chối; `vocabularySpans` với `vocabularyId` không tồn tại, span vượt biên, hoặc đoạn text không khớp surface form → issue chứa `briefing.` và id dòng; `vocabularyContexts` chứa `briefing:case-001:incident:text`. `ui.test.ts`: `loadUiStrings('vi')` có đủ các khóa trên, không rỗng. `index.test.ts`: `loadCaseDefinition('case-001').briefing.lines.map(l => l.id)` bằng `['welcome','incident','first_step','sign_off']`.
- [ ] **Step 2: Chạy RED** `npx vitest run src/schema src/validation src/index.test.ts` trong `packages/game-content`. Kỳ vọng FAIL (khóa/field chưa có).
- [ ] **Step 3: Implement schema.** `caseRawSchema` thêm `briefing` tùy chọn, `.strict()`: `from` min 1; `lines` 1–6 phần tử, mỗi dòng `{ id, text, translationVi?, vocabularySpans? }` dùng `vocabularySpanSchema`; refine `id` duy nhất. Loader copy `briefing` vào `CaseDefinition` (cạnh `conclusion`), thêm `briefingContexts` vào `validateVocabularyReferences` và vòng tạo `vocabularyContexts`.
- [ ] **Step 4: Implement nội dung.** `case.json` thêm `briefing` đúng 4 dòng ở bảng spec §7.2 (`from: "Chief, International Investigation Bureau"`); tính offset span bằng script rồi dán số, test Step 1 bắt sai offset: `incident` → `confidential`, `report`, `meeting`; `first_step` → `meeting`, `access`. Thêm các khóa UI tiếng Việt (câu chữ theo spec §5, §6, §8, §9; `supportBeginnerHint`/`supportLearningHint`/`supportImmersionHint` đúng ba câu ở spec §6), cập nhật `ui.ts`, `UiStrings`.
- [ ] **Step 5: Cập nhật docs/03 §6** thêm hai dòng `welcome` và `sign_off` vào "Chief message" (giữ nguyên hai dòng cũ), ghi chú đó là briefing.
- [ ] **Step 6: Chạy GREEN** cùng lệnh Step 2, cộng `npm run typecheck`, `npm run lint -w @lexicon/game-content`. Kỳ vọng PASS.
- [ ] **Step 7: Commit** `git add` các file trên; `feat: add optional case briefing content and onboarding strings`.

### Task 2: Learning record V3 và cờ onboarding

**Files:**
- Create: `apps/game-web/src/onboarding/onboardingTypes.ts`
- Modify: `apps/game-web/src/persistence/learningMigration.ts`, `learningRepository.ts`, `connectLearningAutosave.ts`, `apps/game-web/src/state/learningStore.ts` và mọi chỗ import `LearningRecordV2`
- Test: `learningMigration` (thêm `learningMigration.test.ts` nếu chưa có), `learningRepository.test.ts`, `connectLearningAutosave.test.ts`, `state/learningStore.test.ts`

**Interfaces:**
- Produces: `CoachNoteId = 'move' | 'interact' | 'notebook' | 'board'`; `COACH_NOTE_IDS: readonly CoachNoteId[]` theo đúng thứ tự ưu tiên đó; `OnboardingSeen = Record<CoachNoteId, boolean>`; `allOnboardingSeen(value: boolean): OnboardingSeen`.
- Produces: `LearningRecordV3 { schemaVersion: 3; profile; vocabularyTutorialSeen: boolean; onboardingSeen: OnboardingSeen; updatedAt: number }` thay `LearningRecordV2` (đổi tên ở mọi nơi); `createDefaultLearningRecord()` trả V3 với `allOnboardingSeen(false)`.
- Produces: `LearningStoreState.onboardingSeen: OnboardingSeen` và `markOnboardingSeen(id: CoachNoteId): void` (idempotent: không `set` khi đã `true`).

- [ ] **Step 1: Viết test RED.** Migration: V2 không tutorial và `profile.vocabulary` rỗng → `onboardingSeen` toàn `false`, `migrated: true`; V2 có `vocabularyTutorialSeen: true` → toàn `true`; V2 `vocabularyTutorialSeen: false` nhưng `profile.vocabulary` có mục → toàn `true`; V1 đi cùng quy tắc và vẫn trả `legacyTranslationMode`; V3 round-trip, `migrated: false`; V3 thiếu khóa, thừa khóa, giá trị không phải boolean → throw; field lạ ở V3 → throw "Unexpected learning record fields"; V1/V2 có `onboardingSeen` → throw. Repository: V2 hợp lệ được backup rồi `put` bản V3 (thứ tự: backup trước, put sau); lỗi ghi → `memory-only` với record V3 đã migrate. Autosave: record phát ra có `schemaVersion: 3` và `onboardingSeen`; snapshot đổi khi `markOnboardingSeen('move')` → một lần lưu. Store: ban đầu lấy từ `initialRecord`; `markOnboardingSeen` hai lần chỉ thông báo subscriber một lần.
- [ ] **Step 2: Chạy RED** `npx vitest run src/persistence src/state/learningStore.test.ts` trong `apps/game-web`. Kỳ vọng FAIL.
- [ ] **Step 3: Implement** `onboardingTypes.ts`; `parseLearningRecord` chấp nhận phiên bản 1–3, với `onboardingSeen` chỉ hợp lệ ở V3 (danh sách key cho phép phụ thuộc phiên bản như `translationMode` hiện nay), trả record V3, `migrated: version !== 3`. Cập nhật `connectLearningAutosave` (snapshot gồm `onboardingSeen`), `learningStore`, đổi tên kiểu ở các import còn lại.
- [ ] **Step 4: Cập nhật test hiện có** dùng `schemaVersion: 2` trong `learningRepository.test.ts` (dòng ~112, ~194) và `connectLearningAutosave.test.ts` (dòng ~29) cho khớp V3; fixture V2 cố ý giữ để kiểm migration.
- [ ] **Step 5: Chạy GREEN** lệnh Step 2 + `npm run typecheck`. Kỳ vọng PASS.
- [ ] **Step 6: Commit** `feat: store onboarding hints in learning record v3`.

### Task 3: Bắt đầu vụ án mới có backup

**Files:**
- Modify: `apps/game-web/src/persistence/saveRepository.ts`
- Test: `apps/game-web/src/persistence/saveRepository.test.ts`

**Interfaces:**
- Produces: `SaveRepository.startNewCase(caseId: string, definition: CaseDefinition): Promise<GameState>`. Nếu `getSave(caseId)` có dữ liệu → `addBackup({ caseId, createdAt, raw })` **trước** khi `saveGameState(createCaseState(definition), 'main_office')`; không có save → chỉ tạo mới, không backup. `caseId !== definition.id` → throw như `createFreshSaveAfterConfirmation`. Backup lỗi → throw và **không** ghi state mới.

- [ ] **Step 1: Viết test RED** với database giả ghi lại thứ tự gọi: có save → `['getSave','addBackup','putSave']`; không save → `['getSave','putSave']`; `addBackup` ném lỗi → promise reject và không có `putSave`; state trả về bằng `createCaseState(definition)`; `caseId` sai → reject.
- [ ] **Step 2: Chạy RED** `npx vitest run src/persistence/saveRepository.test.ts`. Kỳ vọng FAIL.
- [ ] **Step 3: Implement** `startNewCase` trong `createSaveRepository`, tái dùng cách chọn scene `main_office` của `createFreshSaveAfterConfirmation`.
- [ ] **Step 4: Chạy GREEN** lệnh Step 2. Kỳ vọng PASS.
- [ ] **Step 5: Commit** `feat: back up the old save when starting a new case`.

### Task 4: Trường cài đặt dùng chung và trang "Cách điều tra"

**Files:**
- Create: `apps/game-web/src/pause/SettingsFields.tsx`, `apps/game-web/src/onboarding/HowToInvestigate.tsx`
- Modify: `apps/game-web/src/pause/PauseMenu.tsx`
- Test: `pause/PauseMenu.test.tsx`, `pause/SettingsFields.test.tsx`, `onboarding/HowToInvestigate.test.tsx`

**Interfaces:**
- Produces: `SettingsFields({ strings }: { strings: UiStrings }): JSX.Element` — đúng các control hiện có (mode, volume, subtitles, reduced motion), đọc/ghi qua `useSettingsStore`; không chứa nút Resume.
- Produces: `HowToInvestigate({ learning, onClose }: { learning: InvestigationLearningProps; onClose(): void }): JSX.Element` — `ReadDocument` với bốn nhóm `heading + body` từ `howTo*`, có nút đóng; không chứa text Case #001.
- Consumes: `PauseMenu` thêm prop tùy chọn `onOpenHowTo?(): void`; khi có, hiện nút `strings.pauseHowTo` (≥ 44×44) trước nút Resume.

- [ ] **Step 1: Viết test RED.** `PauseMenu.test.tsx` hiện có vẫn PASS không sửa (hồi quy: slider, subtitles, reduced motion, mode); thêm: có `onOpenHowTo` thì HTML chứa `strings.pauseHowTo`, không có thì không. `SettingsFields.test.tsx`: render chứa đủ control như test PauseMenu cũ. `HowToInvestigate.test.tsx`: render chứa `howToControlsHeading`, `howToPrinciplesHeading` (trang đầu hoặc qua pager), nút đóng gọi `onClose`, không chứa `Case`/`Anna`/`Leo`/`David`.
- [ ] **Step 2: Chạy RED** `npx vitest run src/pause src/onboarding`. Kỳ vọng FAIL.
- [ ] **Step 3: Implement.** Tách khối control khỏi `PauseMenu` sang `SettingsFields` (không đổi DOM/nhãn để test cũ pass); `PauseMenu` dùng `SettingsFields`; focus trap hiện có phải bao nút mới. `HowToInvestigate` dựng `ReaderBlock` bằng `textBlock` như `DeductionCaseFile`.
- [ ] **Step 4: Chạy GREEN** lệnh Step 2 + `npm run typecheck`. Kỳ vọng PASS.
- [ ] **Step 5: Commit** `feat: share settings fields and add how-to-investigate page`.

### Task 5: Màn hình tiêu đề, chọn mức hỗ trợ và luồng khởi động

**Files:**
- Create: `apps/game-web/src/title/titleModel.ts`, `TitleScreen.tsx`, `SupportPicker.tsx`, `NewCaseConfirm.tsx`, `title.css`
- Modify: `apps/game-web/src/game/GameCanvas.tsx`, `apps/game-web/src/game/bootstrapGame.ts`
- Test: `title/titleModel.test.ts`, `title/TitleScreen.test.tsx`, `title/SupportPicker.test.tsx`, `game/bootstrapGame.test.ts`, `App.test.tsx`

**Interfaces:**
- Produces: `type SaveAvailability = 'loaded' | 'missing' | 'memory-only'`; `selectTitleActions(input: { save: SaveAvailability; settingsStatus: SettingsLoadResult['status'] }): { continue: boolean; newCase: boolean; howTo: true; settings: true; primary: 'continue' | 'newCase'; askSupportLevel: boolean }` — `continue` chỉ khi `save === 'loaded'`; `primary` là `continue` khi có, ngược lại `newCase`; `askSupportLevel` khi `settingsStatus === 'missing'`.
- Produces: `TitleScreen({ strings, actions, onContinue, onNewCase, onHowTo, onSettings })`, `SupportPicker({ strings, onChoose(mode: TranslationMode): void })` (ba nút Beginner/Learning/Immersion với nhãn `vocabularyMode*` + mô tả `support*Hint`, nút `supportUseDefault` chọn `Learning`; focus mặc định Learning), `NewCaseConfirm({ strings, onAccept, onCancel })`.
- Consumes: `bootstrapGame` trả thêm `saveAvailability: SaveAvailability` (`loaded` cho `status: 'ready'` có save thật; `missing`; `memory-only`) — cần phân biệt "ready từ save đã load" với "ready từ save missing"; thêm field `source: 'saved' | 'fresh'` vào kết quả `ready`.
- Produces: `GameRoot` nhận `startMode: 'continue' | 'new'`; `new` truyền `showBriefing` (dùng ở Task 6). Settings store được tạo ở `GameCanvas` (trước `GameRoot`) và truyền xuống.

- [ ] **Step 1: Viết test RED.** `titleModel`: `loaded` → `continue: true, primary: 'continue'`; `missing` → `continue: false, primary: 'newCase'`; `memory-only` → không Continue; `settingsStatus: 'missing'` → `askSupportLevel: true`; `'loaded'`/`'recovered'`/`'memory-only'` → `false`. `TitleScreen`: render chứa tên game, tagline, các nút theo `actions`, nút chính có `autofocus`/là phần tử đầu; không có Continue khi `continue: false`. `SupportPicker`: render ba mode + `supportUseDefault`; bấm "Dùng mặc định" gọi `onChoose('Learning')`. `bootstrapGame`: `source: 'saved'` khi load save, `'fresh'` khi missing. `App.test.tsx`: render lần đầu (save missing) hiện tiêu đề, **chưa** có canvas; sau "Vụ án mới" → chọn mức hỗ trợ → thế giới mount; với save loaded hiện nút Continue và bấm vào mount thế giới; Vụ án mới khi `loaded` hiện `NewCaseConfirm`, Hủy quay lại tiêu đề, Xác nhận gọi `repository.startNewCase` rồi mount (kiểm gọi đúng một lần). Memory-only: không crash, không có Continue, chơi được.
- [ ] **Step 2: Chạy RED** `npx vitest run src/title src/game/bootstrapGame.test.ts src/App.test.tsx`. Kỳ vọng FAIL.
- [ ] **Step 3: Implement** máy trạng thái trong `GameCanvas`: `'title' | 'support' | 'confirm' | 'settings' | 'howto' | 'playing'` (state cục bộ, không vào store game). Giữ nguyên các nhánh lỗi content/loading/`SaveRecoveryScreen` đứng **trước** tiêu đề. "Vụ án mới": nếu save `loaded` → `confirm` → `startNewCase`; nếu `askSupportLevel` → `support` → `settings.setTranslationMode(mode)` → `playing`; `GameRoot` đặt `key` theo lần bắt đầu để remount sạch. Cài đặt dùng `SettingsFields` bên trong khung giấy có nút `titleBack`; "Cách điều tra" dùng `HowToInvestigate` với `InvestigationLearningProps` dựng từ catalogue, strings, translation mode (không có learning store trước khi `GameRoot` mount → `onEncounter/onInspect/onRevealTranslation` là no-op ở tiêu đề). `PauseLayer` truyền `onOpenHowTo` và hiện `HowToInvestigate` (một overlay, đóng quay lại Pause; Esc đóng overlay trước, không đóng Pause); learning callbacks thật lấy từ learning store. CSS tiêu đề theo palette giấy, không đỏ, không cuộn ở ba viewport.
- [ ] **Step 4: Chạy GREEN** lệnh Step 2 + `npm run typecheck`. Kỳ vọng PASS.
- [ ] **Step 5: Commit** `feat: add title screen, support level picker and new-case confirmation`.

### Task 6: Briefing memo, khóa input và Esc

**Files:**
- Create: `apps/game-web/src/briefing/BriefingMemo.tsx`, `briefing.css`
- Modify: `apps/game-web/src/state/gameStore.ts`, `pause/usePauseShortcut.ts`, `notebook/useNotebookShortcut.ts`, `deduction/useDeductionShortcut.ts`, `game/GameCanvas.tsx`
- Test: `state/gameStore.test.ts`, `briefing/BriefingMemo.test.tsx`, `pause/usePauseShortcut` test hiện có, `notebook/useNotebookShortcut.test.ts`, `deduction/useDeductionShortcut.test.ts`

**Interfaces:**
- Produces: `GameStoreState.briefingOpen: boolean`; `closeBriefing(): void` (đặt `briefingOpen: false`, `objectiveVisible: true`, tính lại `inputLocked`); `createGameStore` nhận `initialBriefingOpen?: boolean` (mặc định `false`); `inputLocked(...)` tính cả `briefingOpen`.
- Produces: `BriefingMemo({ briefing, strings, vocabulary, translationMode, vocabularyTutorialSeen, onVocabularyTutorialSeen, onEncounter, onInspect, onRevealTranslation, onAccept, returnFocusRef })`. Tiêu đề `briefingTitle`, dòng `from`, các dòng bằng `VocabularyText` với `contextId = 'briefing:<caseId>:<lineId>:text'`, nút chính `briefingAccept` (autofocus, ≥ 44×44), focus trap theo `getFocusTrapTarget`, khôi phục focus về `returnFocusRef` khi đóng; mount phát `audio:cue` `paper` đúng một lần.
- Consumes (Task 5): `GameRoot.startMode === 'new'` và `caseDefinition.briefing` tồn tại → `initialBriefingOpen: true`.

- [ ] **Step 1: Viết test RED.** Store: `initialBriefingOpen: true` → `inputLocked === true`; `closeBriefing()` → `briefingOpen false`, `objectiveVisible true` kể cả khi khởi tạo ở viewport compact (`initialHudVisibility.objectiveVisible: false`), `inputLocked false` nếu không modal khác. Shortcut: với `briefingOpen`, `handleNotebookShortcut` ('j'), deduction ('b'), minimap ('m' qua `inputLocked`) **không** gọi toggle; `handleEscapeShortcut` đóng briefing, không `togglePause`, `preventDefault` được gọi. Memo: render có đủ `lines.length` dòng, từ gạch chân là `<button>` (mode Learning), mode Beginner hiện `translationVi`; bấm nút gọi `onAccept`; Esc trong memo cũng gọi đường đóng qua store (kiểm ở test shortcut, không nhân đôi). Case không có `briefing` → `GameRoot` không mở memo (test ở `App.test.tsx`).
- [ ] **Step 2: Chạy RED** `npx vitest run src/state src/briefing src/pause src/notebook src/deduction`. Kỳ vọng FAIL.
- [ ] **Step 3: Implement.** Store + shortcut: thêm điều kiện `briefingOpen` (Esc: nhánh đầu tiên). `BriefingLayer` trong `GameCanvas` dựng `BriefingMemo` khi `briefingOpen`, lấy `onEncounter/onInspect/onRevealTranslation` từ learning store như `EvidenceLayer`; tutorial từ vựng dùng `vocabularyTutorialSeen`/`markVocabularyTutorialSeen` hiện có. Overlay nằm trên canvas và dưới Pause.
- [ ] **Step 4: Chạy GREEN** lệnh Step 2 + `npm run typecheck`. Kỳ vọng PASS.
- [ ] **Step 5: Commit** `feat: show the case briefing memo on a new case`.

### Task 7: Gợi ý theo ngữ cảnh

**Files:**
- Create: `apps/game-web/src/onboarding/selectCoachNote.ts`, `useOnboardingSignals.ts`, `CoachNote.tsx`, `coach.css`
- Modify: `apps/game-web/src/game/GameCanvas.tsx` (gắn vào `Hud` hoặc cạnh `Hud`), `hud/hud.css` nếu cần chừa chỗ
- Test: `onboarding/selectCoachNote.test.ts`, `onboarding/useOnboardingSignals.test.ts`, `onboarding/CoachNote.test.tsx`

**Interfaces:**
- Produces: `type CoachProgress = { seen: OnboardingSeen; moved: boolean; nearbyShown: boolean; interacted: boolean; hasEvidence: boolean; hasFacts: boolean; notebookOpened: boolean; boardOpened: boolean; modalOpen: boolean }`.
- Produces: `completedNotes(progress: CoachProgress): CoachNoteId[]` — id chưa `seen` nhưng hành động đã xảy ra (`move`←`moved`, `interact`←`interacted`, `notebook`←`notebookOpened`, `board`←`boardOpened`); `selectCoachNote(progress: CoachProgress): CoachNoteId | null` — trả `null` khi `modalOpen`; ngược lại gợi ý đầu tiên theo `COACH_NOTE_IDS` mà chưa `seen`, chưa hoàn thành và đủ điều kiện hiện (`move`: luôn; `interact`: `nearbyShown`; `notebook`: `hasEvidence`; `board`: `hasFacts`); gợi ý chưa đủ điều kiện **không chặn** gợi ý sau nó.
- Produces: `useOnboardingSignals(bus, store, learning): CoachProgress` — theo dõi `player:moved` (baseline là sự kiện đầu tiên sau khi hook mount hoặc khi `briefingOpen` đóng; `moved` khi vị trí khác baseline > 8 đơn vị trong `coordinateSpace` đó), `interaction:nearby` → `nearbyShown`, `interaction:triggered` → `interacted`, `notebookOpen`/`deductionOpen` chuyển `true` → `notebookOpened`/`boardOpened`, `modalOpen` = paused || briefingOpen || dialogue || evidence || notebook || deduction. Mỗi khi `completedNotes` có phần tử, gọi `learning.markOnboardingSeen(id)`. Cleanup đầy đủ khi unmount.
- Produces: `CoachNote({ strings, noteId, onDismiss })` — `role="status"`, `aria-live="polite"`, không lấy focus, nút `coachDismiss` ≥ 44×44; chuỗi theo `coach*`.

- [ ] **Step 1: Viết test RED.** `selectCoachNote`: `seen` toàn `false`, mọi điều kiện `false` → `'move'`; `moved: true` → `completedNotes` chứa `'move'` và không chọn `'move'`; `modalOpen` → `null`; `move` đã seen + `nearbyShown: true` → `'interact'`; `hasEvidence` và chưa mở sổ tay → `'notebook'`; `notebookOpened: true` trước khi có evidence → `completedNotes` chứa `'notebook'` và `selectCoachNote` không bao giờ trả `'notebook'`; thứ tự `move→interact→notebook→board` khi nhiều điều kiện cùng đúng; toàn bộ `seen` → `null`. Hook (với bus/store giả): `player:moved` lần đầu không tính là di chuyển; lần thứ hai cách > 8 → `moved`; `moved` trong lúc briefing mở **không** được tính (baseline đặt lại khi briefing đóng); mở sổ tay → `markOnboardingSeen('notebook')` gọi đúng một lần; unmount rồi emit → không phản ứng, `bus` không còn listener (đếm listener). `CoachNote`: render chuỗi đúng cho từng id, bấm `coachDismiss` gọi `onDismiss`, không có `tabindex`/`autofocus`.
- [ ] **Step 2: Chạy RED** `npx vitest run src/onboarding`. Kỳ vọng FAIL.
- [ ] **Step 3: Implement** ba đơn vị; `CoachLayer` trong `GameCanvas` đặt phía trên `KeyHints`, ẩn khi `selectCoachNote` trả `null`; "Đã hiểu" gọi `markOnboardingSeen(noteId)`. CSS không dùng đỏ, tôn trọng `data-reduced-motion`, không che `InteractionPrompt`/objective ở ba viewport.
- [ ] **Step 4: Chạy GREEN** lệnh Step 2 + `npm run typecheck`. Kỳ vọng PASS.
- [ ] **Step 5: Commit** `feat: add contextual coach notes with persisted completion`.

### Task 8: Đọc lại briefing trên bảng suy luận

**Files:**
- Modify: `apps/game-web/src/deduction/DeductionCaseFile.tsx`
- Test: `apps/game-web/src/deduction/DeductionBoard.test.tsx` (hoặc `DeductionCaseFile.test.tsx` mới)

**Interfaces:**
- Consumes: `definition.briefing` (Task 1). Sau khối `case:title`, thêm một `textBlock` mỗi dòng với `id = 'briefing:' + line.id`, `contextId = 'briefing:<caseId>:<lineId>:text'`, `spans = line.vocabularySpans`; không có `briefing` thì giữ nguyên như hiện nay.

- [ ] **Step 1: Viết test RED.** Case có briefing → danh sách block của `DeductionCaseFile` chứa đúng 4 id `briefing:*` ngay sau `case:title`, trước `case:objective`; case không có briefing → không có block `briefing:*`; `contextId` đúng định dạng.
- [ ] **Step 2: Chạy RED** `npx vitest run src/deduction`. Kỳ vọng FAIL.
- [ ] **Step 3: Implement** thêm block; phân trang sẵn có lo phần dài.
- [ ] **Step 4: Chạy GREEN** lệnh Step 2. Kỳ vọng PASS.
- [ ] **Step 5: Commit** `feat: keep the briefing readable in the case file`.

### Task 9: E2E, helper chung và báo cáo

**Files:**
- Modify: `apps/game-web/e2e/journeyHelpers.ts` (`openWorld`) và mọi spec còn `page.goto('/')` rồi chờ `__lexiconDebug` (chạy `grep -n "goto('/'" e2e/*.ts` để lập danh sách; hiện có ~21 file chạm)
- Create: `apps/game-web/e2e/onboarding.spec.ts`, `docs/ai/2026-10-02-intro-onboarding-verification.md`
- Modify: `docs/ai/MEMORY.md`

**Interfaces:**
- Produces: `openWorld(page, options?: { mode?: 'auto' | 'new' | 'continue' })` — đi qua tiêu đề bằng thao tác UI thật: có nút Continue thì bấm (trừ `mode: 'new'`); ngược lại bấm Vụ án mới, chọn "Dùng mặc định" nếu hiện bộ chọn, bấm xác nhận nếu hiện, bấm `briefingAccept` nếu hiện; cuối cùng chờ `window.__lexiconDebug`. Không thêm cửa sau trong bản production. Các spec đã `goto('/')` sau khi reload dùng cùng helper.
- Spec cần seed gợi ý đã xem (để không che UI khi test chức năng khác): dùng helper `seedOnboardingSeen(page)` ghi record learning V3 toàn `true` vào IndexedDB `lexicon-learning` **trước** khi vào trang — chỉ ở E2E, qua `page.addInitScript`/evaluate, không phải mã sản phẩm.

- [ ] **Step 1: Viết `onboarding.spec.ts` RED** (Chromium, context sạch): (a) người chơi mới: tiêu đề → Vụ án mới → bộ chọn mức hỗ trợ → briefing 4 dòng → Esc đóng → objective hiện ở 760×600 → gợi ý `move` hiện, di chuyển bằng phím → mất; đứng gần vật → `interact` → nhấn E → mất; nhặt evidence → `notebook` → nhấn J → mất; reload → Continue → không briefing, gợi ý đã xong không hiện lại; (b) có save: Vụ án mới → xác nhận → evidence về 0, từ vựng giữ, IndexedDB `backups` tăng đúng 1; (c) người chơi cũ: ghi record learning V2 có `vocabularyTutorialSeen: true` rồi vào game → không gợi ý nào, record được nâng V3; (d) 1280×720, 760×600, 390×844: tiêu đề, briefing, coach note không cuộn (`scrollHeight <= clientHeight`), control ≥ 44×44 và nằm trong viewport; (e) bảng suy luận → "Hồ sơ vụ việc" có dòng briefing; (f) Pause → "Cách điều tra" mở, đóng, quay lại Pause; (g) không lỗi console.
- [ ] **Step 2: Chạy RED** `node apps/game-web/scripts/run-e2e.mjs onboarding.spec.ts` (theo cách `README`/memory đang dùng). Kỳ vọng FAIL.
- [ ] **Step 3: Cập nhật `openWorld`** và các spec còn vào thẳng thế giới; chạy lại từng spec bị chạm, sửa chỗ giả định cũ (ví dụ chờ canvas ngay sau `goto`).
- [ ] **Step 4: Chạy GREEN** `onboarding.spec.ts` và nhóm liên quan: `dialogue`, `journey`, `timeline`, `notebook-people`, `notebook-deduction`, `viewport-focus`, `settings`, `learning`, `hud`, `world`, `performance`. Kỳ vọng tất cả PASS; ghi số test/thời gian thực tế vào báo cáo, không tuyên bố full E2E nếu chưa chạy.
- [ ] **Step 5: Gate cuối** `npm run lint`, `npm run test`, `npm run build`, `npm run typecheck`, `npm run format:check`, `npm run memory:check`; dán output vào báo cáo cùng ảnh ba viewport (tiêu đề, briefing, coach note) lưu tại `docs/ai/playtests/2026-10-02-intro-onboarding/`.
- [ ] **Step 6: Báo cáo + memory.** Viết `docs/ai/2026-10-02-intro-onboarding-verification.md` (tóm tắt, file đổi, test thêm, lệnh + kết quả, hạn chế còn lại; nêu rõ chỉ Chromium Windows và nhóm E2E đã chạy). Cập nhật `docs/ai/MEMORY.md` theo protocol (status, `result_commit`, Next Actions ≤ 5; cập nhật cột trạng thái `PR-01` trong tài liệu sản phẩm). Commit code/báo cáo trước, memory ở commit kế tiếp.
- [ ] **Step 7: Commit** `test: verify intro onboarding flow end to end`.
