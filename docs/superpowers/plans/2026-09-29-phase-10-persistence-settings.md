# Phase 10 — Persistence: Settings và kiểm chứng auto-save — Kế hoạch triển khai

> **For agentic workers:** REQUIRED SUB-SKILL: Sau khi người dùng duyệt plan và chọn cách thực thi, dùng `superpowers:executing-plans` (tự thực hiện) hoặc `superpowers:subagent-driven-development` (giao task cho subagent). Steps dùng checkbox (`- [ ]`).

**Goal:** Thêm Settings (chế độ dịch, âm lượng, phụ đề, giảm chuyển động) lưu trong IndexedDB riêng, di trú chế độ dịch khỏi hồ sơ học tập, áp dụng từng cài đặt và chứng minh auto-save/reload bằng test.

**Architecture:** Schema Zod + repository `lexicon-settings` trong `apps/game-web/src/persistence`; store Zustand vanilla per-mount `settingsStore` + context; hồ sơ học tập V2 bỏ `translationMode`; consumer đọc chế độ dịch từ settings store; Phaser nhận `MotionSource` chỉ-đọc; Howler nhận âm lượng qua hook React.

**Tech Stack:** TypeScript strict, Zod, Zustand, React 18, Phaser 3.88, Howler, idb, Vitest, Playwright, npm + Nx.

**Spec:** `docs/superpowers/specs/2026-09-29-phase-10-persistence-settings-design.md`

## Global Constraints

- Chỉ Phase 10; không save slot, chơi lại, đồng bộ đám mây, backend.
- npm + Nx; không thêm dependency, không đổi `package-lock.json` (Zod, idb, Howler đã có trong `@lexicon/game-web`).
- Database mới `lexicon-settings` version `1`, stores `records` (key `local-settings`) và `backups` (autoIncrement). Không đổi version `lexicon-game-saves`/`lexicon-learning`; không đổi save case V4.
- Mặc định: `translationMode: 'Learning'`, `volume: 80`, `subtitles: 'auto'`, `reducedMotion` = `prefers-reduced-motion` (false nếu không có `matchMedia`).
- Sau di trú, `translationMode` chỉ nằm trong Settings (không trùng state).
- Phaser không import React/Zustand; chỉ nhận `MotionSource { reducedMotion(): boolean }`.
- Chuỗi UI mới trong `packages/game-content/ui/vi.json` + `UiStrings` + schema UI; không hardcode trong React.
- Phím tắt bỏ qua khi focus ở `input`/`textarea`/`contenteditable`; control có nhãn, dùng được bằng bàn phím; font ≥ 14px; không thêm màu đỏ.
- Gate: `npm run lint`, `npm run test`, `npm run build`, `npm run typecheck`, `npm run format:check`, `npm run test:e2e`, `npm run memory:check`, `git diff --check`.

## Review Focus

1. **Thanh trượt âm lượng nhận phím mũi tên/W/A/S/D khi đang focus:** không được làm player di chuyển hay bật shortcut (input đã bị khóa khi pause — kiểm tra ở E2E Task 6 bằng gõ phím trong slider).
2. **Record settings có `volume: 101`, `80.5`, chuỗi, hoặc trường thừa:** bị coi là hỏng → backup + mặc định, không crash (unit Task 1).
3. **Người chơi Phase 9 có learning V1 với `translationMode: 'Immersion'` và chưa có settings:** sau nâng cấp vẫn Immersion; learning V2 không còn trường này (unit Task 2, E2E Task 6).
4. **Đổi giảm chuyển động khi marker đang hiện:** marker dừng ngay tại vị trí gốc, bật lại thì tiếp tục nổi (unit Task 4 `markerMotion`).
5. **Phụ đề `on` ở Immersion:** lời thoại tiếng Anh hiện, bản dịch không hiện; `subtitleUses` chỉ tăng một lần mỗi phiên (unit Task 4).

---

### Task 1: Schema và repository Settings

**Files:**
- Create: `apps/game-web/src/persistence/settingsSchema.ts`, `settingsSchema.test.ts`, `settingsRepository.ts`, `settingsRepository.test.ts`

**Interfaces:**
- Produces: `type SubtitlePreference = 'auto' | 'on' | 'off'`; `type SettingsV1 = { schemaVersion: 1; translationMode: TranslationMode; volume: number; subtitles: SubtitlePreference; reducedMotion: boolean }`; `createDefaultSettings(options?: { prefersReducedMotion?: boolean; translationMode?: TranslationMode }): SettingsV1`; `parseSettings(raw: unknown): SettingsV1` (throw khi hỏng); `detectPrefersReducedMotion(): boolean`.
- Produces: `type SettingsDatabase = { get(): Promise<unknown>; put(record: SettingsV1): Promise<void>; backup(raw: unknown): Promise<void> }`; `type SettingsLoadResult = { status: 'loaded' | 'missing' | 'recovered'; settings: SettingsV1; notice?: string } | { status: 'memory-only'; settings: SettingsV1; error: string }`; `createSettingsRepository(factory?): { loadSettings(seed: { translationMode?: TranslationMode }): Promise<SettingsLoadResult>; saveSettings(s: SettingsV1): Promise<void> }`.

- [ ] **Step 1: Test đỏ schema.** `accepts a valid record`; `defaults` (Learning, 80, auto, reducedMotion theo tham số); từ chối `volume` 101/−1/80.5/"80", `subtitles: 'always'`, `translationMode: 'Expert'`, trường thừa, `schemaVersion: 2`.
- [ ] **Step 2: Test đỏ repository** (fake `SettingsDatabase`): missing → mặc định có `translationMode` = seed và **đã ghi** record; loaded → trả nguyên; hỏng → backup raw trước, ghi mặc định, `status: 'recovered'` + notice; factory reject → `memory-only`; backup lỗi → `memory-only`, không ghi đè; `saveSettings` round-trip.
- [ ] **Step 3: Chạy** `npx nx test @lexicon/game-web --skip-nx-cache` → FAIL (module chưa có).
- [ ] **Step 4: Implement** Zod strict (`volume: z.number().int().min(0).max(100)`), `openDB('lexicon-settings', 1, …)` giống `learningRepository`.
- [ ] **Step 5: Chạy lại** → PASS; `npm run typecheck` PASS.
- [ ] **Step 6: Commit** `feat(game-web): add settings schema and repository`.

### Task 2: Hồ sơ học tập V2 bỏ `translationMode`

**Files:**
- Modify: `apps/game-web/src/persistence/learningMigration.ts`, `learningRepository.ts`, `learningRepository.test.ts`, `connectLearningAutosave.ts`, `connectLearningAutosave.test.ts`
- Test: `apps/game-web/src/persistence/learningMigration.test.ts` (tạo nếu chưa có)

**Interfaces:**
- Produces: `type LearningRecordV2 = { schemaVersion: 2; profile; vocabularyTutorialSeen; updatedAt }`; `parseLearningRecord(...)` trả `{ record: LearningRecordV2; legacyTranslationMode: TranslationMode | null; migrated: boolean }`; `LearningLoadResult` thêm `legacyTranslationMode: TranslationMode | null` ở nhánh `loaded`/`missing`/`memory-only`.
- Consumes: không.

- [ ] **Step 1: Test đỏ.** V1 hợp lệ → V2 không có `translationMode`, `legacyTranslationMode` = giá trị cũ, repository backup raw V1 **trước** khi ghi V2; lỗi ghi → giữ nguồn, trả lỗi như Phase 6; V2 đọc lại nguyên vẹn, `legacyTranslationMode: null`; V2 có trường `translationMode` → hỏng. Autosave ghi V2 không có `translationMode`.
- [ ] **Step 2: Chạy** test game-web → FAIL.
- [ ] **Step 3: Implement**; giữ đầy đủ validation profile hiện có; `createDefaultLearningRecord` trả V2.
- [ ] **Step 4: Chạy lại** → PASS (các test learning cũ cập nhật sang V2).
- [ ] **Step 5: Commit** `feat(game-web): move translation mode out of the learning record`.

### Task 3: Settings store, bootstrap và menu Tạm dừng

**Files:**
- Create: `apps/game-web/src/state/settingsStore.ts`, `settingsStore.test.ts`, `SettingsStoreContext.tsx`, `apps/game-web/src/persistence/connectSettingsAutosave.ts`, `connectSettingsAutosave.test.ts`
- Modify: `apps/game-web/src/state/learningStore.ts` (bỏ `translationMode`/`setTranslationMode`), `LearningStoreContext.tsx`, `apps/game-web/src/game/GameCanvas.tsx`, `apps/game-web/src/pause/PauseMenu.tsx` (+ test), `apps/game-web/src/dialogue/DialogueLayer.tsx`, `DialogueView.tsx`, `apps/game-web/src/evidence/EvidenceModal.tsx`, `apps/game-web/src/notebook/NotebookPanel.tsx` và test liên quan
- Modify: `packages/shared-types/src/case.ts`, `packages/game-content/src/schema/ui.ts`, `ui.test.ts`, `packages/game-content/ui/vi.json`

**Interfaces:**
- Consumes: `SettingsV1`, `createSettingsRepository` (Task 1); `legacyTranslationMode` (Task 2).
- Produces: `createSettingsStore(initial: SettingsV1): SettingsStore` với state `settings: SettingsV1`, `notice: string | null` và action `setTranslationMode`, `setVolume(v)` (clamp 0–100, làm tròn), `setSubtitles`, `setReducedMotion`; `SettingsStoreProvider`, `useSettingsStore(selector)`; `connectSettingsAutosave(store, save, onError): () => void` (chỉ ghi khi `settings` đổi, theo thứ tự).
- UI keys mới: `settingsVolume` ("Âm lượng"), `settingsSubtitles` ("Phụ đề bản ghi"), `settingsSubtitlesAuto` ("Theo chế độ dịch"), `settingsSubtitlesOn` ("Luôn hiện"), `settingsSubtitlesOff` ("Tắt"), `settingsReducedMotion` ("Giảm chuyển động"), `settingsRecovered` ("Cài đặt bị lỗi nên đã khôi phục mặc định."), `settingsUnavailable` ("Không lưu được cài đặt; thay đổi chỉ áp dụng trong phiên này.").

- [ ] **Step 1: Test đỏ.** Store: giá trị khởi tạo, `setVolume(120)` → 100, `setVolume(33.4)` → 33; autosave: đổi volume ghi 1 lần, set cùng giá trị không ghi. PauseMenu (`renderToString`): có `<input type="range" min="0" max="100" step="5">` có nhãn `settingsVolume`, select phụ đề 3 lựa chọn, checkbox giảm chuyển động, select chế độ dịch hiện có. UI strings test cho 8 key.
- [ ] **Step 2: Chạy** test game-web/content → FAIL.
- [ ] **Step 3: Implement store/context/autosave;** `GameCanvas` nạp learning → settings (seed `legacyTranslationMode`) trước khi render game; `status: 'memory-only'` → không autosave settings, hiện `settingsUnavailable`; `recovered` → hiện `settingsRecovered` (`role="status"`).
- [ ] **Step 4: Chuyển consumer** chế độ dịch sang `useSettingsStore`; learning store không còn `translationMode`.
- [ ] **Step 5: Thêm control vào PauseMenu.** Slider hiển thị `${volume}%`.
- [ ] **Step 6: Chạy** test game-web/content, typecheck, `npm run test:e2e` → PASS (chế độ dịch vẫn hoạt động như cũ).
- [ ] **Step 7: Commit** `feat(game-web): add persisted settings store and pause controls`.

### Task 4: Áp dụng âm lượng, phụ đề và giảm chuyển động

**Files:**
- Create: `apps/game-web/src/evidence/transcriptVisibility.ts`, `transcriptVisibility.test.ts`, `apps/game-web/src/audio/useMasterVolume.ts`, `apps/game-web/src/game/systems/markerMotion.ts`, `markerMotion.test.ts`
- Modify: `apps/game-web/src/evidence/ListeningTaskPanel.tsx` (+ test), `apps/game-web/src/game/createGame.ts`, `apps/game-web/src/game/scenes/WorldScene.ts`, `apps/game-web/src/game/GameCanvas.tsx`, CSS gốc của app (`hud.css` hoặc file global đang import ở root)

**Interfaces:**
- Consumes: `useSettingsStore` (Task 3).
- Produces:
  - `resolveTranscriptVisibility(mode: TranslationMode, subtitles: SubtitlePreference): { transcriptShown: boolean; transcriptToggle: boolean; translationShown: boolean; translationWithTranscript: boolean }` — bảng: `auto` = Phase 7; `on` = transcript hiện mọi mode, bản dịch hiện ở Beginner, ở Learning hiện cùng khi mở bằng nút, Immersion không; `off` = không tự hiện, nút ở Beginner/Learning, Immersion không có gì.
  - `ListeningTaskPanel` nhận prop `subtitles`; `subtitleUsed` telemetry khi `transcriptShown` lúc phát lần đầu (một lần mỗi phiên).
  - `useMasterVolume(volume: number): void` gọi `Howler.volume(volume / 100)` khi giá trị đổi.
  - `type MotionSource = { reducedMotion(): boolean }` export từ `createGame.ts`; `createGame(parent, { …, motion: MotionSource })`.
  - `markerMotion(previous: boolean, next: boolean): 'pause' | 'resume' | 'none'`; `WorldScene.update` gọi, pause tween + đặt lại `y` về vị trí gốc khi `pause`.
  - Root `.game-root[data-reduced-motion="true"] * { animation: none !important; transition: none !important; }`.

- [ ] **Step 1: Test đỏ.** `resolveTranscriptVisibility` đủ 9 tổ hợp; `markerMotion` 4 tổ hợp; ListeningTaskPanel `on` + Immersion hiện transcript, không bản dịch; `off` + Beginner có nút `listeningShowTranscript`, không tự hiện.
- [ ] **Step 2: Chạy** → FAIL.
- [ ] **Step 3: Implement** helper và tích hợp; `GameCanvas` truyền `motion = { reducedMotion: () => settingsStore.getState().settings.reducedMotion }`, gọi `useMasterVolume`, đặt `data-reduced-motion`.
- [ ] **Step 4: Chạy** test game-web, typecheck, E2E listening → PASS.
- [ ] **Step 5: Commit** `feat(game-web): apply volume, subtitle and reduced-motion settings`.

### Task 5: Kiểm chứng trigger auto-save

**Files:**
- Modify: `apps/game-web/src/persistence/connectAutosave.test.ts`

**Interfaces:** Consumes `connectAutosave`, `createGameStore` (hiện có). Không đổi code production trừ khi test lộ lỗi (khi đó sửa đúng nguồn và ghi rõ).

- [ ] **Step 1: Viết test** theo từng trigger qua action store thật: evidence (`applyCaseEffects addEvidence`), objective (`completeObjective`), dialogue flag (`setFlag` qua dialogue hoặc effect), scene (`transitionScene`), contradiction (`submitContradiction` đúng). Mỗi trigger → đúng 1 lần `save(state, sceneId)` với snapshot đúng. UI-only (`toggleNotebook`, `setPaused`, `setNearby`, `openEvidence`) → 0 lần. Sau disconnect → 0 lần.
- [ ] **Step 2: Chạy** → kỳ vọng PASS ngay (kiểm chứng hành vi đã có); nếu fail, dùng `systematic-debugging`, sửa nguồn, ghi ruling.
- [ ] **Step 3: Commit** `test(game-web): cover autosave triggers`.

### Task 6: E2E reload tổng hợp và lỗi storage

**Files:**
- Create: `apps/game-web/e2e/settings.spec.ts`

**Interfaces:** Dùng debug hook và pattern đọc IndexedDB như `timeline.spec.ts`.

- [ ] **Step 1: Viết E2E.**
  - `settings and progress survive reload`: Esc → đặt chế độ Immersion, âm lượng 40, phụ đề "Luôn hiện", bật giảm chuyển động; focus slider rồi nhấn `ArrowLeft`/`d` → player không di chuyển; đóng; thu bản ghi của Leo; qua Archive; reload → giá trị menu giữ nguyên, record `lexicon-settings` đúng, evidence + scene còn, mở lại bản ghi qua notebook "Xem lại" thấy lời thoại tiếng Anh nhưng không có bản dịch, không console error.
  - `legacy learning V1 translation mode is preserved`: seed `lexicon-learning` với record V1 `translationMode: 'Immersion'` trước khi app chạy, không có settings → menu hiện Immersion; record learning thành V2 không có `translationMode`.
  - `corrupt settings recover to defaults`: seed `lexicon-settings` với `{ schemaVersion: 1, volume: 999 }` → thông báo `settingsRecovered`, âm lượng 80, game chơi được.
- [ ] **Step 2: Chạy** `npm run test:e2e` → PASS toàn bộ; lỗi tích hợp sửa ở task sở hữu.
- [ ] **Step 3: Commit** `test(game-web): cover settings persistence journeys`.

### Task 7: Final gates, verification ledger, memory

**Files:** Create `docs/ai/2026-09-29-phase-10-persistence-settings-verification.md`; Modify `docs/ai/MEMORY.md` (commit riêng).

- [ ] **Step 1:** Chạy đủ gate trong Global Constraints sau `npx nx reset`; ghi exit code.
- [ ] **Step 2:** Kiểm tra phạm vi: không sửa `apps/api`, không đổi lockfile/dependency, version DB cũ không đổi, save V4 không đổi.
- [ ] **Step 3:** Ghi verification ledger với output thật; commit `docs(verification): record Phase 10 persistence gates`.
- [ ] **Step 4:** Cập nhật memory (phase-10 complete, commit, gate, next action chờ Phase 11); `memory:check` PASS; commit.

## Tự rà soát plan

- **Độ phủ spec:** §3 schema/DB (Task 1); §4 di trú/không trùng state (Task 2–3); §5 từng cài đặt (Task 3–4); §6 kiểm chứng (Task 5–6); §8 gate (Task 7).
- **Review Focus:** 5 mục đều có test ở task sở hữu.
- **Kiểu nhất quán:** `SettingsV1`/`SubtitlePreference` (Task 1) dùng ở Task 3–4; `legacyTranslationMode` (Task 2) dùng ở Task 3; `MotionSource` (Task 4) chỉ ở `createGame`/`WorldScene`.
- **Phạm vi:** không save slot/backend/dependency; save V4 giữ nguyên.
