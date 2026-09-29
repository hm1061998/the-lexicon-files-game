# Phase 7 Audio / Listening — Kế hoạch triển khai

> **Dành cho agent thực thi:** BẮT BUỘC dùng `superpowers:executing-plans` để triển khai inline theo từng task. Theo dõi tiến độ bằng checkbox `- [ ]`.

**Mục tiêu:** Thêm phone recording của Leo vào luồng điều tra Case #001 để người chơi nghe/replay, trả lời câu hỏi vị trí và mở fact đúng; lưu telemetry nghe cục bộ, tương thích dữ liệu learning profile cũ.

**Kiến trúc:** Case content định nghĩa audio evidence, listening task, lựa chọn và effects; `game-core` xác định kết quả đáp án và `gameStore` áp dụng case state. Một controller Howler độc lập React quản lý playback tạm thời; evidence UI kết nối controller, learning store và game store qua typed interfaces hiện có. Recording được tạo một lần bằng Kokoro và đóng gói như asset tĩnh; không cần TTS hoặc API ở runtime.

**Tech Stack:** TypeScript strict, Zod, React, Zustand vanilla, Howler (đã cài), Vitest, Playwright, npm workspaces + Nx.

**Spec:** `docs/superpowers/specs/2026-09-29-phase-7-audio-listening-design.md`

## Ràng buộc chung

- Chỉ dùng npm + Nx; không thêm dependency nếu native đã đủ.
- Giữ `game-core` và `learning-engine` là TypeScript thuần; không import React, Phaser, DOM hoặc IndexedDB.
- Case content và listening task chỉ nằm trong `packages/game-content`; không hardcode nội dung Case #001 trong React/Phaser.
- Phaser/React giao tiếp qua typed event bus và Zustand store; không truy cập Phaser internals từ React.
- Không gọi backend trong gameplay; không dùng `eval`; không thêm global mutable singleton.
- Giữ local-first save; migration learning profile phải đọc được record schemaVersion 1 đã lưu trước Phase 7.
- Không autoplay, không giới hạn replay, không thu microphone, không phạt hoặc reset case khi trả lời sai.
- Phone recording giữ timestamp `20:29`, lời thoại chính xác theo spec và tổng `evidenceTotal: 5`.
- Đặt hotspot thử nghiệm trong scene `main_office` tại vị trí trống `(1200, 1280)`; không tạo scene Archive trong Phase 7.
- Chỉ bật case fact `leo_outside_at_2029` khi người chơi trả lời đúng; lựa chọn sai giữ nguyên case state.

## Tệp dự kiến

- `packages/shared-types/src/case-engine.ts`: interface listening options/task; thêm `CaseDefinition.listeningTasks` và kiểu kết quả submit.
- `packages/game-content/src/schema/caseDefinition.ts`, `src/loader/loadCaseDefinition.ts`, `cases/case-001/listening-tasks.json`: schema, registry và nội dung task; `evidences.json`, `facts.json`, `scenes/main_office.json`: audio evidence, fact và hotspot.
- `packages/game-core/src/listening/answerListeningTask.ts`: kiểm tra option/task và áp dụng effects đúng bằng `applyEffects`; `src/index.ts` export API.
- `apps/game-web/public/audio/case-001/leo-phone-recording.wav` và `leo-phone-recording.provenance.json`: recording tĩnh và hồ sơ nguồn/license.
- `apps/game-web/src/game/textures.ts`: placeholder recorder cho hotspot prototype trong Main Office.
- `apps/game-web/src/audio/audioController.ts`, `useAudioPlayback.ts`: controller Howler và React adapter.
- `packages/shared-types/src/learning.ts`, `packages/shared-types/src/case.ts`, `packages/learning-engine/src/vocabulary/learningReducer.ts`, `apps/game-web/src/persistence/learningMigration.ts`, `apps/game-web/src/state/learningStore.ts`: counters/aggregate timing và tương thích profile cũ.
- `apps/game-web/src/evidence/ListeningTaskPanel.tsx`, `evidence.css`, `EvidenceModal.tsx`, `GameCanvas.tsx`, `packages/game-content/ui/vi.json`, `packages/game-content/src/schema/ui.ts`: playback/task UI, mode hỗ trợ và UI strings tiếng Việt.
- Các test tương ứng dưới `packages/shared-types`, `packages/game-content`, `packages/game-core`, `packages/learning-engine`, `apps/game-web/src` và `apps/game-web/e2e/listening.spec.ts`.

## Review Focus

1. Một learning record schemaVersion 1 cũ không có listening telemetry phải đọc được với giá trị mặc định, giữ nguyên vocabulary/settings và không yêu cầu reset.
2. Task/option ID lạ, answer sai hoặc gửi lại đáp án sau khi hoàn thành không được thay đổi case state, thêm evidence/fact trùng hoặc ghi sai counter.
3. Howler báo lỗi, đóng modal giữa callback, hoặc mở lại cùng evidence không được để audio chạy nền hay cập nhật phiên mới.
4. Đổi Beginner/Learning/Immersion giữa playback không được lộ transcript/bản dịch trong Immersion; mở transcript/hint nhiều lần chỉ ghi đúng số lần theo hành động thực tế.
5. Thời gian tới fact chỉ được cộng đúng một lần cho đáp án đúng đầu tiên, đo từ lần play đầu trong phiên tới khi trả lời đúng; không lưu event log hoặc timestamp cá nhân.

---

### Task 1: Thêm model, schema và nội dung listening

**Tệp:**
- Sửa: `packages/shared-types/src/case-engine.ts`, `packages/shared-types/src/index.ts`, `packages/shared-types/src/type-tests/case-engine.ts`
- Sửa: `packages/game-content/src/schema/caseDefinition.ts`, `packages/game-content/src/loader/loadCaseDefinition.ts`
- Sửa: `packages/game-content/src/schema/caseDefinition.test.ts`, `packages/game-content/src/loader/loadCaseDefinition.test.ts`, `packages/game-content/src/validation/validateRegisteredContent.test.ts`
- Sửa: `packages/game-content/cases/case-001/evidences.json`, `facts.json`, `scenes/main_office.json`
- Tạo: `packages/game-content/cases/case-001/listening-tasks.json`
- Sửa test fixtures `apps/game-web/e2e/dialogue.spec.ts` và các literal `CaseDefinition` khác tìm được bằng `rg -n "CaseDefinition|evidencesRaw|factsRaw" packages apps`

**Interfaces:**
- Tạo `ListeningOption { readonly id: string; readonly text: string; readonly textVi?: string }`.
- Tạo `ListeningTaskDefinition { readonly id: string; readonly evidenceId: string; readonly audioAsset: string; readonly timestamp: string; readonly transcript: string; readonly transcriptVi?: string; readonly question: string; readonly questionVi?: string; readonly options: readonly ListeningOption[]; readonly correctOptionId: string; readonly keywordHints: readonly string[]; readonly completionFlag: string; readonly correctEffects: readonly Effect[] }`.
- Thêm `readonly listeningTasks: readonly ListeningTaskDefinition[]` vào `CaseDefinition`.
- Loader đọc `listening-tasks.json`; parser kiểm tra ID duy nhất, ít nhất hai option, `correctOptionId` thuộc options, evidence có category `audio`, path asset bắt đầu bằng `/audio/` và không chứa `..`, `completionFlag` không rỗng, effects và mọi cross-reference đều hợp lệ.
- Nội dung Case #001: evidence ID `leo_phone_recording`; task ID `leo_phone_recording_location`; fact ID `leo_outside_at_2029`; question `Where was Leo?`; options lần lượt `Inside the meeting room`, `Outside the meeting room`, `At home`; correct option ID `outside`; timestamp `20:29`; transcript theo spec; correct effect đặt flag `leo_phone_recording_understood=true`; fact unlock yêu cầu có audio evidence và flag này.
- Thêm scene interactable ID `phone_recording`, prompt tiếng Việt, effect `addEvidence(leo_phone_recording)`; dùng placeholder texture key `ph_audio_recorder` ở tọa độ `(1200, 1280)`.
- Giữ `evidenceTotal` là 5.

- [ ] **Bước 1: Viết test đỏ cho listening task content.** Trong `caseDefinition.test.ts`, kiểm tra thiếu task/audio source, task trỏ evidence không phải audio/ID không tồn tại, duplicate option ID, `correctOptionId` không có trong options và effect trỏ fact/evidence không tồn tại đều báo `ContentValidationError` có path dễ đọc.
- [ ] **Bước 2: Chạy focused test để xác nhận đỏ.**

Chạy: `npx nx run @lexicon/game-content:test -- --run src/schema/caseDefinition.test.ts src/loader/loadCaseDefinition.test.ts`

Kỳ vọng: test mới fail do schema/loader chưa nhận listening tasks.

- [ ] **Bước 3: Thêm types, schema, loader và nội dung Case #001.** Kiểm tra effects của hotspot qua validator hiện có; thêm placeholder `ph_audio_recorder` tối giản theo palette placeholder hiện có trong `textures.ts`.
- [ ] **Bước 4: Chạy focused test xanh và kiểm tra content đã load.**

Chạy: `npx nx run @lexicon/game-content:test -- --run src/schema/caseDefinition.test.ts src/loader/loadCaseDefinition.test.ts src/validation/validateRegisteredContent.test.ts`

Kỳ vọng: PASS; loader trả một task duy nhất liên kết `leo_phone_recording`; nội dung giữ `evidenceTotal: 5`.

- [ ] **Bước 5: Commit.**

```bash
git add packages/shared-types packages/game-content apps/game-web/e2e/dialogue.spec.ts
git commit -m "feat(content): add case listening task"
```

### Task 2: Xử lý đáp án listening trong game-core/store

**Tệp:**
- Tạo: `packages/game-core/src/listening/answerListeningTask.ts`, `answerListeningTask.test.ts`
- Sửa: `packages/game-core/src/index.ts`, `packages/game-core/src/index.test.ts`
- Sửa: `apps/game-web/src/state/gameStore.ts`, `gameStore.test.ts`

**Interfaces:**
- Tạo `ListeningAnswerResult`:
  - success: `{ readonly ok: true; readonly correct: boolean; readonly state: GameState; readonly events: readonly CaseDomainEvent[] }`;
  - invalid input: `{ readonly ok: false; readonly state: GameState; readonly error: { readonly code: 'unknownListeningTask' | 'unknownListeningOption'; readonly id: string } }`.
- Export `answerListeningTask(definition: CaseDefinition, state: GameState, taskId: string, optionId: string): ListeningAnswerResult` từ `@lexicon/game-core`.
- Bổ sung `answerListeningTask(taskId: string, optionId: string): ListeningAnswerResult` vào `GameStoreState`; store chỉ cập nhật `caseState` khi result thành công và `correct=true`.
- Đáp án sai trả `correct=false`, cùng state đầu vào và events rỗng. Đáp án đúng gọi `applyEffects(definition, state, task.correctEffects)`; áp dụng lặp phải idempotent.

- [ ] **Bước 1: Viết core tests đỏ.** Tên test: `answers the Leo task correctly and unlocks the authored fact`, `wrong answer leaves case state unchanged`, `unknown task and option return typed errors`, `repeating a correct answer does not duplicate events or facts`.
- [ ] **Bước 2: Chạy test đỏ.**

Chạy: `npx nx run @lexicon/game-core:test -- --run src/listening/answerListeningTask.test.ts`

Kỳ vọng: FAIL vì API chưa có.

- [ ] **Bước 3: Cài `answerListeningTask` bằng `applyEffects`; nối store action.** Không đặt logic đáp án hoặc fact trong React.
- [ ] **Bước 4: Chạy game-core và store tests.**

Chạy: `npx nx run @lexicon/game-core:test -- --run src/listening/answerListeningTask.test.ts src/case-engine.test.ts`; `npx nx run @lexicon/game-web:test -- --run src/state/gameStore.test.ts`

Kỳ vọng: PASS; wrong answer không tạo transition và transition đầu tiên đúng mở đúng fact.

- [ ] **Bước 5: Commit.**

```bash
git add packages/game-core apps/game-web/src/state/gameStore.ts apps/game-web/src/state/gameStore.test.ts
git commit -m "feat(core): resolve listening task answers"
```

### Task 3: Tạo audio asset và Howler controller

**Tệp:**
- Tạo: `apps/game-web/public/audio/case-001/leo-phone-recording.wav`
- Tạo: `apps/game-web/public/audio/case-001/leo-phone-recording.provenance.json`
- Tạo: `apps/game-web/src/audio/audioController.ts`, `audioController.test.ts`, `useAudioPlayback.ts`

**Interfaces:**
- `AudioPlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error'`.
- `AudioController = { getSnapshot(): AudioPlaybackState; subscribe(listener: () => void): () => void; play(): void; pause(): void; replay(): void; dispose(): void }`; `HowlFactory = (options: HowlOptions) => Howl`.
- `createAudioController(src: string, factory?: HowlFactory): AudioController`; factory injection chỉ phục vụ kiểm thử, production dùng Howler `Howl` đã khai báo.
- `useAudioPlayback(src: string)` trả snapshot state và các hàm play/pause/replay. Controller được dispose khi URL đổi hoặc component unmount.
- Tạo file WAV mono 24 kHz từ đúng transcript bằng Kokoro local inference. Ứng viên voice là preset English American `af_heart`; provenance phải pin model revision và ghi lại nguồn/license mà upstream công bố. Nếu không xác minh được quyền dùng preset cho asset phân phối, giữ asset ngoài build và ghi blocker thay vì commit audio chưa rõ quyền.

- [ ] **Bước 1: Viết controller tests đỏ với fake Howl.** Test: khởi tạo idle, play chuyển loading→playing, pause, replay seek 0 và play lại, end, load/play error, dispose stop/unload, callback muộn không đổi state sau dispose.
- [ ] **Bước 2: Chạy controller test đỏ.**

Chạy: `npx nx run @lexicon/game-web:test -- --run src/audio/audioController.test.ts`

Kỳ vọng: FAIL do controller chưa tồn tại.

- [ ] **Bước 3: Tạo asset Kokoro và provenance.** Nghe lại để xác minh chính xác câu thoại, phát âm “outside”, không có câu/chữ thừa; đo thời lượng và kích thước file. Không commit weights, package Python hoặc script build/runtime TTS vào monorepo.
- [ ] **Bước 4: Implement controller và React adapter.** Howler callback phải unsubscribe/stop/unload khi dispose; bỏ callback cũ; hỗ trợ retry bằng cùng controller hoặc controller mới theo URL.
- [ ] **Bước 5: Chạy controller tests xanh.**

Chạy: `npx nx run @lexicon/game-web:test -- --run src/audio/audioController.test.ts`

Kỳ vọng: PASS, kể cả dispose trong lúc đang playing/loading; hook cleanup được kiểm tra trong E2E khi đóng evidence.

- [ ] **Bước 6: Commit.**

```bash
git add apps/game-web/public/audio/case-001 apps/game-web/src/audio
git commit -m "feat(audio): add Leo recording playback"
```

### Task 4: Learning telemetry và listening task UI

**Tệp:**
- Sửa: `packages/shared-types/src/learning.ts`, `packages/shared-types/src/case.ts`, `packages/shared-types/src/index.ts`
- Sửa: `packages/learning-engine/src/vocabulary/learningReducer.ts`, `learningReducer.test.ts`, `src/index.test.ts`
- Sửa: `apps/game-web/src/persistence/learningMigration.ts`, `learningRepository.test.ts`, `apps/game-web/src/state/learningStore.ts`, `learningStore.test.ts`
- Tạo: `apps/game-web/src/evidence/ListeningTaskPanel.tsx`, `ListeningTaskPanel.test.tsx`
- Sửa: `apps/game-web/src/evidence/EvidenceModal.tsx`, `evidence.css`, `apps/game-web/src/game/GameCanvas.tsx`
- Sửa: `packages/game-content/ui/vi.json`, `packages/game-content/src/schema/ui.ts`, `packages/game-content/src/schema/ui.test.ts`

**Interfaces:**
- Mở rộng `LanguageProfile` bằng telemetry backward-compatible: `listening: { readonly subtitleUses: number; readonly correctAnswers: number; readonly incorrectAnswers: number; readonly totalTimeToExtractFactMs: number; readonly timedFacts: number }`.
- Bổ sung LearningAction `recordListeningEvent` với `event: 'replay' | 'subtitleUsed' | 'transcriptOpened' | 'hintUsed' | 'answerCorrect' | 'answerIncorrect'` và `elapsedMs?: number` chỉ cho `answerCorrect`.
- `applyLearningAction` cập nhật `assistance.audioReplays`, `hints`, `transcriptOpens` cho ba loại tương ứng; tăng `listening` counters cho subtitle/answer; chỉ đáp án đúng đầu tiên của một task cộng `elapsedMs` và `timedFacts`.
- `parseLearningRecord` chấp nhận profile V1 cũ thiếu field `listening`, trả profile đã normalize về các số 0; từ chối counter âm/không nguyên, elapsed âm/không hữu hạn.
- `ListeningTaskPanel` nhận `{ task, mode, completed, onAnswer, onTelemetry }`; thời gian đo tính từ lần playback start đầu trong modal tới lần trả lời đúng đầu tiên, tính bằng `performance.now()` và chỉ lưu tổng ms + số lượt đo.

- [ ] **Bước 1: Viết learning reducer/migration tests đỏ.** Test: mọi telemetry event tăng đúng field; `elapsedMs` không hợp lệ bị từ chối; record V1 cũ được normalize và giữ vocabulary/mode; `elapsedMs` chỉ được tính cho đáp án đúng.
- [ ] **Bước 2: Chạy focused tests đỏ.**

Chạy: `npx nx run @lexicon/learning-engine:test -- --run src/vocabulary/learningReducer.test.ts`; `npx nx run @lexicon/game-web:test -- --run src/persistence/learningRepository.test.ts`

Kỳ vọng: FAIL vì action và telemetry shape chưa có.

- [ ] **Bước 3: Implement action/reducer và normalize migration V1.** Không thay schemaVersion hoặc xóa dữ liệu người dùng; `createInitialLanguageProfile` khởi tạo listening telemetry bằng 0.
- [ ] **Bước 4: Chạy reducer, migration, autosave và learningStore tests.**

Chạy: `npx nx run @lexicon/learning-engine:test -- --run src/vocabulary/learningReducer.test.ts`; `npx nx run @lexicon/game-web:test -- --run src/persistence/learningRepository.test.ts src/persistence/connectLearningAutosave.test.ts src/state/learningStore.test.ts`

Kỳ vọng: PASS; old records round-trip sau normalize/save.

- [ ] **Bước 5: Viết SSR UI tests đỏ cho các mode của audio evidence.** Với `renderToString`, kiểm tra Beginner có transcript/subtitle và bản dịch, Learning có keyword nhưng ẩn transcript cho tới khi mở, Immersion không render transcript/bản dịch. Tương tác bàn phím/đáp án/replay/error/close cleanup được kiểm tra trong E2E, không thêm testing dependency.
- [ ] **Bước 6: Nối `ListeningTaskPanel` trong `EvidenceModal`/`EvidenceLayer`.** Chỉ render với audio evidence có task; không autoplay; mode dùng preference hiện tại; các event telemetry chuyển qua learning store; kết quả answer gọi game-store action; task hoàn tất đọc từ case flag.
- [ ] **Bước 7: Thêm UI strings tiếng Việt và chạy SSR evidence/UI tests.**

Chạy: `npx nx run @lexicon/game-web:test -- --run src/evidence/ListeningTaskPanel.test.tsx src/evidence/EvidenceModal.test.tsx src/state/gameStore.test.ts`; `npx nx run @lexicon/game-content:test -- --run src/schema/ui.test.ts`

Kỳ vọng: PASS; không transcript leak ở Immersion. E2E xác minh mismatch message hiển thị “This interpretation doesn't match the evidence.”

- [ ] **Bước 8: Commit.**

```bash
git add packages/shared-types packages/learning-engine apps/game-web/src/evidence apps/game-web/src/game/GameCanvas.tsx apps/game-web/src/state apps/game-web/src/persistence/learningMigration.ts apps/game-web/src/persistence/learningRepository.test.ts packages/game-content/ui/vi.json packages/game-content/src/schema/ui.ts packages/game-content/src/schema/ui.test.ts
git commit -m "feat(ui): add accessible listening investigation"
```

### Task 5: E2E, full verification và handoff

**Tệp:**
- Tạo: `apps/game-web/e2e/listening.spec.ts`
- Sửa nếu cần: `apps/game-web/e2e/learning.spec.ts`, `apps/game-web/e2e/dialogue.spec.ts`
- Tạo: `docs/ai/2026-09-29-phase-7-audio-listening-verification.md`
- Sửa: plan này để đánh dấu task xong; `docs/ai/MEMORY.md` trong commit handoff kế tiếp.

**Interfaces:** Dùng hotspot `phone_recording`, dialog/audio controls, case save `lexicon-game-saves` và learning profile `lexicon-learning` đã triển khai ở Task 1–4. E2E không thêm production debug setter.

- [ ] **Bước 1: Viết E2E listening test đỏ.** Kiểm tra người chơi teleport tới hotspot Main Office, mở audio evidence, không autoplay, play tới ended, replay, thấy hỗ trợ theo Beginner/Learning/Immersion, trả lời sai không đổi evidence/fact, nghe lại rồi chọn `Outside the meeting room`, fact `leo_outside_at_2029` mở, listening flag/case state và telemetry lưu sau reload, một canvas, không console error.
- [ ] **Bước 2: Chạy E2E đỏ.**

Chạy: `npm run test:e2e -- --grep listening`

Kỳ vọng: FAIL vì audio evidence/task chưa nối đủ trong gameplay.

- [ ] **Bước 3: Sửa integration gaps quan sát được trong browser trace.** Không nới test, không đổi câu trả lời/case truth, không làm task tự mở đúng đáp án.
- [ ] **Bước 4: Chạy E2E listening xanh, rồi toàn bộ E2E.**

Chạy: `npm run test:e2e -- --grep listening`; sau đó `npm run test:e2e`

Kỳ vọng: listening flow và toàn bộ browser suite PASS với một worker.

- [ ] **Bước 5: Rà soát thay đổi và chạy các gate phase.**

Chạy lần lượt: `npm run lint`; `npm run test`; `npm run build`; `npm run typecheck`; `npm run format:check`; `npm run test:e2e`; `npm run memory:check`; `git diff --check`.

Kỳ vọng: tất cả exit code 0; lưu output/kết quả thật vào `docs/ai/2026-09-29-phase-7-audio-listening-verification.md`. Không chạy .NET vì không sửa `apps/api`.

- [ ] **Bước 6: Commit verification, cập nhật plan checkboxes, rồi cập nhật `MEMORY.md` ở commit kế tiếp.** Ghi rõ source/license asset, test mới, output các gate, chunk/asset size, giới hạn còn lại. Chưa đánh dấu complete hoặc push trước khi toàn bộ kiểm tra và review cuối đạt.

```bash
git add apps/game-web/e2e docs/ai/2026-09-29-phase-7-audio-listening-verification.md docs/superpowers/plans/2026-09-29-phase-7-audio-listening.md
git commit -m "test(e2e): verify audio listening investigation"
```

## Ghi chú tự review

- Bao phủ đủ runtime, provenance/licensing, mode, retry/cleanup, answer/effects, telemetry, persistence tương thích, E2E và gate trong spec.
- Sự kiện sai/đúng và counter được chia ở game-core/learning-engine; UI chỉ hiển thị và điều phối qua store.
- Hotspot Main Office dùng phạm vi prototype đã được người dùng chọn; scene Archive và các ambience/SFX vẫn ngoài phase.
- `timedFacts` chỉ tăng khi đáp án đúng đầu tiên mở fact; thao tác sai/replay không cộng thời gian vào aggregate nhiều lần.
