# Phase 12 — Testing & Performance: kế hoạch triển khai

> **Cho agent thực thi:** BẮT BUỘC dùng `subagent-driven-development` (khuyến nghị) hoặc `executing-plans` để làm từng task. Mỗi bước dùng checkbox `- [ ]`.

**Mục tiêu:** Lấp khoảng trống unit/E2E của Case #001 và có báo cáo hiệu năng/leak có số đo, theo spec đã duyệt.

**Kiến trúc:** Đo trước (coverage v8, heap/texture/listener qua debug API), viết test theo TDD cho code thật chưa phủ, tách E2E hành trình thành các bước độc lập dùng chung helper, chỉ tối ưu điểm vượt ngưỡng đo được.

**Tech Stack:** TypeScript strict, Vitest 2.1.9, `@vitest/coverage-v8` (devDependency duy nhất), Playwright (Chromium), Nx + npm workspaces.

**Spec:** `docs/superpowers/specs/2026-10-01-phase-12-testing-performance-design.md`

## Ràng buộc chung

- Chỉ npm + Nx; thêm dependency bằng `npm install -D <pkg> -w <workspace>`; dependency mới duy nhất: `@vitest/coverage-v8@2.1.9`.
- `game-core`/`learning-engine` là TS thuần: cấm import React, Phaser, Zustand, DOM, IndexedDB. Condition/Effect là discriminated union, không `eval`.
- Không đổi product rule, asset đã duyệt, backend. Nợ Phase 11 nằm ngoài phạm vi.
- Không nới tolerance để ép test pass; E2E một worker; không dựa vào wall-clock cho assertion.
- Môi trường: `export PATH="$PWD/.superpowers/runtime/npm-shim:$PATH" NX_DAEMON=false`; Git cần `-c safe.directory=F:/work/the-lexicon-files-game`; chỉ `git add` theo đường dẫn cụ thể (giữ hai file `debug.log` untracked).
- Commit kèm dòng `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. Không push.
- Sau mỗi task chạy `npm run lint` cho package đã sửa; cuối phase chạy DoD đầy đủ (Task 7).

## Trọng tâm review

- Reducer/engine nhận ID không tồn tại hoặc trạng thái đã hoàn tất: phải trả lỗi có mã (`unknownEvidence`, `unknownObjective`, `objectiveAlreadyCompleted`, `objectiveNotActive`), không ném và không đổi state (Task 2).
- `applyEffects` gọi hai lần với cùng effect: idempotent, không tạo event trùng (Task 2).
- Mở nhiều lần cùng modal/chuyển cảnh liên tiếp: số texture, listener, heap không tăng đơn điệu (Task 6).
- Reload giữa hành trình: trạng thái save khớp từng bước (Task 5).
- Cảnh shutdown giữa lúc transition: không còn listener treo (Task 6).

---

### Task 1: Công cụ coverage và baseline

**Files:**
- Modify: `package.json` (root, devDependency), `packages/game-core/package.json`, `packages/learning-engine/package.json`
- Create: `packages/game-core/vitest.config.ts`, `packages/learning-engine/vitest.config.ts`, `docs/superpowers/specs/2026-10-01-phase-12-coverage-baseline.md`

**Interfaces:**
- Produces: script `test:coverage` ở hai package (`vitest run --coverage`), báo cáo text; file baseline ghi % statements/branches/functions/lines của từng package.

- [ ] **Step 1:** `npm install -D @vitest/coverage-v8@2.1.9 -w @lexicon/game-core -w @lexicon/learning-engine` (kiểm tra tên workspace đúng trong `package.json` mỗi package); xác nhận chỉ `package-lock.json` và hai `package.json` đổi.
- [ ] **Step 2:** Mỗi package tạo `vitest.config.ts` với `test.coverage = { provider: 'v8', include: ['src/**/*.ts'], exclude: ['src/**/*.test.ts', 'src/index.ts'], reporter: ['text'] }`, chưa có `thresholds`. Thêm script `"test:coverage": "vitest run --coverage"`.
- [ ] **Step 3:** Chạy `npx nx run @lexicon/game-core:test:coverage` (hoặc `npm run test:coverage -w ...`) cho cả hai package; chép bảng kết quả vào file baseline cùng danh sách file/dòng chưa phủ.
- [ ] **Step 4:** Xác nhận `npm run test` mặc định vẫn không chạy coverage và thời gian không đổi đáng kể.
- [ ] **Step 5:** Commit `chore: add vitest coverage tooling and phase 12 baseline`.

### Task 2: Test game-core cho code chưa phủ

**Files:**
- Create: `packages/game-core/src/condition/evaluateCondition.test.ts`, `packages/game-core/src/effect/applyEffects.test.ts`, `packages/game-core/src/objective/transitionObjective.test.ts`, `packages/game-core/src/case/createCaseState.test.ts`, `packages/game-core/src/dialogue/reconcileDialogueProgress.test.ts`
- Modify: code sản phẩm chỉ khi test lộ lỗi (sửa theo `systematic-debugging`).

**Interfaces:**
- Consumes: `evaluateCondition(state: GameState, condition: Condition): boolean`; `applyEffects(definition: CaseDefinition, state: GameState, effects: readonly Effect[]): CaseTransitionResult`; `activateObjective/completeObjective(definition, state, objectiveId)`; `createCaseState(definition): GameState`; `reconcileDialogueProgress(definition, state): CaseTransitionResult`. Fixture `definition` dùng lại dạng của `case-engine.test.ts`.
- Produces: test pass, không đổi API.

- [ ] **Step 1:** Viết `evaluateCondition.test.ts`: một test cho mỗi loại `hasEvidence`, `hasFact`, `objectiveCompleted`, `flag` (true/false/thiếu key), `all` (rỗng ⇒ true), `any` (rỗng ⇒ false), lồng `all` trong `any`.
- [ ] **Step 2:** Viết `applyEffects.test.ts`: đường lỗi `unknownEvidence`, `unknownFact`, `unknownObjective`, `objectiveAlreadyCompleted`, `objectiveNotActive` (mỗi lỗi trả `ok:false` và `state` giữ nguyên tham chiếu); idempotent (áp hai lần cùng effect ⇒ lần hai `events` rỗng và `state` cùng tham chiếu); fact tự mở theo chuỗi (unlock lan truyền qua vòng `do…while`); không mutate `state` đầu vào (so sánh deep-equal snapshot).
- [ ] **Step 3:** Viết `transitionObjective.test.ts` (kích hoạt `locked`→`active`, đã `completed` ⇒ lỗi, hoàn tất khi `locked` ⇒ `objectiveNotActive`), `createCaseState.test.ts` (objective đầu `active`, còn lại dùng `initialStatus ?? 'locked'`, mảng/flag rỗng), `reconcileDialogueProgress.test.ts` (đặt `completionFlag` khi điều kiện đúng, bỏ qua khi đã đặt, idempotent).
- [ ] **Step 4:** Chạy từng file: `npx nx run @lexicon/game-core:test -- <file>`; mỗi test mới phải **fail đúng lý do** trước nếu nhắm vào hành vi chưa có, hoặc pass ngay nếu chỉ khoá hành vi hiện có (ghi chú trong commit nếu phát hiện lỗi sản phẩm và cách sửa).
- [ ] **Step 5:** Chạy `npm run test:coverage -w @lexicon/game-core`; ghi lại số mới; commit `test: cover game-core condition, effect, objective and case state`.

### Task 3: Test learning-engine cho nhánh chưa phủ

**Files:**
- Modify: `packages/learning-engine/src/vocabulary/learningReducer.test.ts`
- Create (nếu baseline cho thấy `index.ts` có logic): `packages/learning-engine/src/index.test.ts` đã tồn tại — chỉ mở rộng.

**Interfaces:**
- Consumes: `createInitialLanguageProfile(): LanguageProfile`; `applyLearningAction(...)` phát `vocabularySeen`, `vocabularyInspected`, `translationRevealed`.

- [ ] **Step 1:** Từ baseline Task 1, liệt kê nhánh/dòng `learningReducer.ts` chưa phủ; viết một test cho mỗi nhánh (ví dụ: nhìn cùng từ nhiều lần không phát event trùng; revealed trước inspected; ID từ vựng không tồn tại).
- [ ] **Step 2:** Chạy file test, đảm bảo pass; sửa sản phẩm nếu lộ lỗi (theo `systematic-debugging`).
- [ ] **Step 3:** `npm run test:coverage -w @lexicon/learning-engine`; commit `test: cover remaining learning reducer branches`.

### Task 4: Chốt ngưỡng coverage

**Files:**
- Modify: `packages/game-core/vitest.config.ts`, `packages/learning-engine/vitest.config.ts`

- [ ] **Step 1:** Đọc coverage sau Task 2–3. Đặt `coverage.thresholds` mỗi package = giá trị đo làm tròn xuống bội số của 5, **tối thiểu** lines/statements 85 và branches 75; nếu chưa đạt mức tối thiểu thì quay lại bổ sung test (không hạ ngưỡng).
- [ ] **Step 2:** Chạy `npm run test:coverage -w ...` ở cả hai package ⇒ pass; hạ thử một test (tạm) để xác nhận ngưỡng có thể làm fail, rồi hoàn lại.
- [ ] **Step 3:** Thêm vào Nx target `test:coverage` (hoặc script root `npm run test:coverage`) chạy cả hai; commit `test: enforce coverage thresholds for core packages`.

### Task 5: Tách E2E hành trình theo bước roadmap

**Files:**
- Create: `apps/game-web/e2e/journeyHelpers.ts`, `apps/game-web/e2e/journey.spec.ts`
- Modify: `apps/game-web/e2e/timeline.spec.ts` (dùng helper chung, giữ test hiện có)

**Interfaces:**
- Produces trong `journeyHelpers.ts`: `openWorld(page): Promise<void>`; `interactAt(page, x, y, prompt, sceneSwap?): Promise<void>`; `saved(page): Promise<SavedRecord | undefined>`; `talkToDavid(page): Promise<void>`; kiểu `SavedRecord`. Chuyển nguyên hành vi từ `timeline.spec.ts` (không đổi chữ ký hiện có).

- [ ] **Step 1:** Chuyển các helper và kiểu từ `timeline.spec.ts` sang `journeyHelpers.ts`, import lại; chạy `npm run test:e2e -- --workers=1 e2e/timeline.spec.ts` ⇒ pass như trước.
- [ ] **Step 2:** Viết `journey.spec.ts` dùng `test.describe.serial` với một `page` dùng chung (tạo trong `beforeAll`, đóng trong `afterAll`), mỗi `test` là một bước: `start case`, `collect evidence`, `talk NPC`, `find security log`, `find contradiction`, `accuse David`, `complete case`, `reload preserves save`. Mỗi bước assert qua `saved(page)` (evidenceIds, discoveredFactIds, contradictionIds, flags, objectiveStatuses) bằng giá trị lấy từ test hiện có ở `timeline.spec.ts` (ví dụ `security_access_log`, `david_statement_vs_access_log`, `case_closed`).
- [ ] **Step 3:** Thêm kiểm tra `pageerror`/`console.error` rỗng ở `afterAll`.
- [ ] **Step 4:** Chạy `npm run test:e2e -- --workers=1 e2e/journey.spec.ts` ba lần liên tiếp ⇒ 8/8 pass cả ba.
- [ ] **Step 5:** Commit `test: split case journey e2e into roadmap steps`.

### Task 6: Đo hiệu năng và leak

**Files:**
- Modify: `apps/game-web/src/game/debug.ts` (kiểu `DebugApi`), `apps/game-web/src/game/scenes/WorldScene.ts` (hook debug quanh dòng ~521)
- Create: `apps/game-web/e2e/performance.spec.ts`, `docs/superpowers/specs/2026-10-01-phase-12-performance-report.md`
- Test: `apps/game-web/src/game/assetManifest.test.ts` (mở rộng cleanup)

**Interfaces:**
- Produces: `window.__lexiconDebug.textureCount(): number` (số texture trong `scene.textures`, bỏ qua `__DEFAULT/__MISSING/__WHITE`) và `listenerCount(): number` (tổng listener trên `scene.events` + `input`). Chỉ có trong bản dev/debug như API hiện tại.

- [ ] **Step 1:** Viết test đỏ trong `assetManifest.test.ts`: sau `shutdown` khi transition đang chờ texture, danh sách listener của scene rỗng và không có promise treo (mở rộng test `settles and cleans listeners on scene %s`). Chạy ⇒ ghi kết quả; sửa sản phẩm nếu fail.
- [ ] **Step 2:** Thêm `textureCount`/`listenerCount` vào `DebugApi` và `WorldScene` (không dùng cho logic game).
- [ ] **Step 3:** `performance.spec.ts` dùng `test.use({ launchOptions: { args: ['--js-flags=--expose-gc'] } })`. Quy trình: mở thế giới; `gc()`; đọc mốc `{heap: performance.memory.usedJSHeapSize, textures, listeners}`; lặp N=10 lượt (Office→Archive→Office bằng `requestTransition`, mở/đóng notebook); `gc()`; đọc lại. Ghi số vào `test.info().annotations`/console và vào báo cáo.
- [ ] **Step 4:** Chạy ba lần; quan sát độ nhiễu. Đặt assertion: `textures` và `listeners` sau = trước (chính xác); heap sau ≤ trước × (1 + biên). `biên` = max(độ nhiễu đo được × 2, 0.25), ghi lý do trong báo cáo. Không đặt biên rộng hơn để ép pass.
- [ ] **Step 5:** Đo asset: kích thước `dist/assets`, `public` (~19 MB), tổng bytes tải và thời gian tới `__lexiconDebug` sẵn sàng (từ `page.on('response')` + `performance.timing`). Ghi vào báo cáo. Quy tắc: nếu thời gian tải lạnh > 5 s hoặc bytes tải > 25 MB trên máy này thì mở thêm task (atlas/lazy/nén) và báo người dùng; nếu không, ghi "không cần" kèm số.
- [ ] **Step 6:** Commit `test: add leak and load performance measurements`.

### Task 7: Báo cáo, DoD và memory

**Files:**
- Create: `docs/superpowers/specs/2026-10-01-phase-12-verification.md`
- Modify: `docs/ai/MEMORY.md`

- [ ] **Step 1:** Chạy và dán output: `npm run lint`, `npm run test`, `npm run build`, `npm run test:coverage` (nếu đã thêm ở root), `npm run test:e2e -- --workers=1` (full), `npm run memory:check`. Nếu full E2E còn lỗi thuộc nợ Phase 11, ghi rõ và không tuyên bố xanh.
- [ ] **Step 2:** Viết báo cáo verification theo mẫu các file `*-verification.md`: tóm tắt, file đổi, test thêm, lệnh + kết quả, hạn chế còn lại, tham chiếu báo cáo hiệu năng.
- [ ] **Step 3:** Commit code + báo cáo; sau đó cập nhật `docs/ai/MEMORY.md` (phase-12, `result_commit` = commit trước, nợ Phase 11 còn nguyên) và commit riêng theo `docs/ai/README.md`.
