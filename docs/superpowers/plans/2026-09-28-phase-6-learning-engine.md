# Phase 6 — Learning Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add contextual vocabulary inspection, translation modes, persistent vocabulary progress, and an accessible vocabulary notebook without interrupting investigation.

**Architecture:** Authored vocabulary and UTF-16 spans stay in validated `game-content`; pure reducers stay in `learning-engine`; an independent learning record/repository owns profile, mode, and tutorial progress. A learning store and reusable inline word control join existing evidence, dialogue, and notebook surfaces without changing Phaser or the case save.

**Tech Stack:** TypeScript strict, Zod, Zustand vanilla store, IndexedDB via existing `idb`, React, Vitest, Playwright, npm + Nx.

**Spec:** `docs/superpowers/specs/2026-09-28-phase-6-learning-engine-design.md`

## Global Constraints

- Do not edit Case #001 dialogue wording, case truth, evidenceTotal 5, or existing case save schemaVersion 2 / database version 1.
- Author the 20 target lemmas from docs/03 §15 in `packages/game-content`; never hardcode Case #001 IDs/copy in React or Phaser.
- The only implemented progression is unknown → seen from a unique vocabulary/context pair; inspection, translation, reload, and repeated renders never promote stages.
- Beginner / Learning / Immersion are the exact TranslationMode values; Learning is the default.
- `game-core` and `learning-engine` remain framework-free TypeScript; do not import React, Phaser, Zustand, DOM, IndexedDB, or `game-content` there.
- Keep learning profile/settings outside core `GameState` and the existing case save; a learning persistence failure leaves case play available in memory.
- Do not add dependencies or use package managers other than npm; keep local gameplay independent of the API.
- Use existing paper theme, font rules, focus conventions, input-lock behavior, and Investigation Red palette restriction.

## Review Focus

- Overlapping/out-of-range UTF-16 spans, punctuation, case changes, and inflected surface forms must fail content validation with a field path.
- A conditional or hidden dialogue node, unopened evidence, catalogue load, or React StrictMode remount must not count as a seen context.
- Reopening a seen context must be idempotent across profile reload; genuinely new contexts increment once and keep the highest achieved stage.
- Invalid/future learning records, unavailable IndexedDB, and backup/write failures must never replace the case save or silently overwrite raw learning data.
- Rapid mode/profile writes and keyboard popup interactions must preserve latest mode/counts, focus, overlays, and the single live Phaser canvas.

---

### Task 1: Vocabulary contracts, authored catalogue, and validation

**Files:**
- Create: `packages/shared-types/src/learning.ts`
- Create: `packages/game-content/cases/case-001/vocabulary.json`
- Create: `packages/game-content/src/schema/learning.ts`
- Create: `packages/game-content/src/schema/learning.test.ts`
- Create: `packages/game-content/src/validation/vocabularyReferences.ts`
- Create: `packages/game-content/src/validation/vocabularyReferences.test.ts`
- Modify: `packages/shared-types/src/index.ts`, `case-engine.ts`, `dialogue.ts`, `events.ts`
- Modify: `packages/game-content/src/schema/caseDefinition.ts`, `loader/loadCaseDefinition.ts`, `index.ts`, `validation/validateRegisteredContent.ts` and adjacent tests
- Modify: Case #001 evidence/dialogue JSON and all affected CaseDefinition fixtures

**Interfaces:**
- `VocabularyEntry`: id, lemma, partOfSpeech, CEFRLevel `A1 | A2 | B1 | B2 | C1`, definitionEn, translationVi, examples, optional synonyms, tags, authored surfaceForms.
- `VocabularySpan`: UTF-16 `start`, `end` half-open offsets, `vocabularyId`. `VocabularyContextDefinition = {id:string; vocabularyIds:readonly string[]}` is derived by the loader for each annotated evidence description and dialogue node text; IDs are `evidence:<evidenceId>:description` and `dialogue:<treeId>:<nodeId>:text`. Evidence description and dialogue node carry spans; evidence also carries vocabularyIds and descriptionVi; dialogue node/choice carry optional translationVi.
- `CaseDefinition.vocabulary: readonly VocabularyEntry[]` and derived `vocabularyContexts: readonly VocabularyContextDefinition[]`; loader reads `{ vocabulary: [...] }` and builds context refs from validated annotations without copying text.
- `VocabularyStage = 'unknown' | 'seen' | 'recognized' | 'understood' | 'used' | 'mastered'`; `VocabularyProgress` carries vocabularyId, stage, encounterCount, correctRecognitionCount, incorrectRecognitionCount, lastSeenAt ISO, optional nextReviewAt, and contextsSeen. `LanguageProfile` carries A2 `cefrEstimate`, five documented skill scores, vocabulary/grammar records, and documented assistance counters. These plus `TranslationMode`, LearningAction/DomainEvent, and typed LearningError are defined once in shared-types for Task 2.
- `GameEventMap` adds `'vocab:seen': {vocabularyId:string; contextId:string}`, `'vocab:inspected': {vocabularyId:string; contextId:string}`, and `'translation:opened': {vocabularyId:string; contextId:string}`.
- `parseCaseDefinition` consumes required `vocabularyRaw`; all existing fixtures explicitly pass `{ vocabulary: [] }`.
- `loadCaseDefinition('case-001')` includes authored catalogue. Export any new schema/validator that production loaders/build gate consume.

- [x] **1. Write failing type/schema/reference tests.** Name the cases for exact 20 target IDs/lemmas and required authored fields; valid `[start,end)` spans; duplicate ID/lemma/surface form within an entry; unknown vocabulary ID; noninteger, negative, reversed, out-of-bounds, overlapping spans; text mismatch; duplicate/missing evidence vocabularyIds; duplicate content references. Assert errors include source path and field path; the same surface spelling in two different entries is accepted because annotations name an explicit vocabularyId. Test case loader includes vocabulary and UI copy schema can express translation/notebook/mode/tutorial labels.
- [x] **2. Run content RED.** Run `npx nx run @lexicon/game-content:test -- --run`. Expected: new tests fail because vocabulary schema/loader/reference checks are not implemented; existing fixtures still type-check after they are updated only where the compiler identifies the new required field.
- [x] **3. Define shared learning types and typed domain events.** Export from `packages/shared-types/src/index.ts`; update type contract tests. Preserve CEFR vocabulary/example shape in docs/02 and the exact three TranslationMode values.
- [x] **4. Author the Case #001 vocabulary catalogue and annotations.** Add the 20 §15 lemmas with content IDs, CEFR, POS, English definition, Vietnamese translation, English examples, tags and authored surface forms for actual inflections in displayed text. Add exact spans only to existing Meeting Minutes description and dialogue node text; annotate choice translations for English choices. Keep all original English sentences, IDs, conditions, effects, and truth unchanged. Keep when evidence supplies vocabularyIds, require it to equal unique description span refs; omitted vocabularyIds is allowed when no vocabulary is annotated.
- [x] **5. Implement Zod schemas, reference/span validator, loader and registered-content build validation.** Validate offset boundaries against JavaScript string indices (UTF-16), exact substring vs lemma/surfaceForms case-insensitively, no overlap, no duplicates, and source paths. Do not use runtime stemming or mutate rendered content.
- [x] **6. Run content GREEN and typecheck.** Run `npx nx run @lexicon/game-content:test -- --run` and `npm run typecheck`. Expected: all content tests pass; every existing CaseDefinition fixture has an explicit vocabulary list; loader and registry agree.
- [x] **7. Commit.** `git add packages/shared-types packages/game-content && git commit -m "feat(content): add validated vocabulary catalogue"`

### Task 2: Pure learning profile and vocabulary progress reducer

**Files:**
- Create: `packages/learning-engine/src/profile/createInitialLanguageProfile.ts`
- Create: `packages/learning-engine/src/vocabulary/learningReducer.ts`
- Create: `packages/learning-engine/src/vocabulary/learningReducer.test.ts`
- Modify: `packages/learning-engine/src/index.ts`, `index.test.ts`

**Interfaces:**
- Consumes Task 1 `VocabularyEntry`, `VocabularyStage`, `VocabularyProgress`, `LanguageProfile`, `LearningAction`, `LearningDomainEvent`.
- `createInitialLanguageProfile(): LanguageProfile` initializes case target CEFR A2, all five skill scores at 0, empty vocabulary/grammar records, and four assistance counters at 0.
- `applyLearningAction(profile, catalogue, contexts, action, nowIso): { ok:true; profile:LanguageProfile; events:readonly LearningDomainEvent[] } | { ok:false; profile:LanguageProfile; error:LearningError }`.
- Actions: `encounterContext {vocabularyId,contextId}`, `inspectVocabulary {vocabularyId,contextId}`, `revealTranslation {vocabularyId,contextId}`. `LearningError` codes are `unknownVocabulary | unknownContext | contextVocabularyMismatch | contextNotSeen | translationUnavailable | invalidTimestamp | invalidAction`. No assessment actions in Phase 6.

- [x] **1. Write pure reducer RED tests.** Assert initial A2 baseline and zero counters; unseen selector semantics; first context creates seen/count1/context list/ISO lastSeen and one event; duplicate pair after retry leaves all fields/events unchanged; same vocabulary in a distinct context adds exactly one encounter without stage regression; inspect requires an encountered vocabulary/context, increments no encounter/stage and emits one inspect event; translation reveal increments translations only on explicit valid user action; unknown vocabulary/context IDs, a context that does not contain that vocabulary, impossible timestamps and invalid actions return the identical input profile and typed error; no mutation of input profile/catalogue.
- [x] **2. Run RED.** `npx nx run @lexicon/learning-engine:test -- --run`. Expected: missing initial-profile/reducer exports fail.
- [x] **3. Implement default profile and pure reducer.** Use caller-supplied timestamp only; only unique context pairs create seen progress. Never infer recognized/mastered or score from inspect/translation. Return structured-clone-safe plain values, typed errors/events, and original state on failure.
- [x] **4. Run GREEN and verify boundary.** `npx nx run @lexicon/learning-engine:test -- --run`; `npm run typecheck`. Expected: reducer tests pass and package has no browser/framework imports.
- [x] **5. Commit.** `git add packages/learning-engine && git commit -m "feat(learning): track contextual vocabulary encounters"`

### Task 3: Separate learning record repository and bootstrap

**Files:**
- Create: `apps/game-web/src/persistence/learningRepository.ts`
- Create: `apps/game-web/src/persistence/learningMigration.ts`
- Create: `apps/game-web/src/persistence/learningRepository.test.ts`
- Modify: `apps/game-web/src/persistence` test helpers only when an existing helper can be reused without changing case-save semantics

**Interfaces:**
- `LearningRecordV1 = { schemaVersion:1; profile:LanguageProfile; translationMode:TranslationMode; vocabularyTutorialSeen:boolean; updatedAt:number }`.
- `LearningLoadResult = {status:'loaded';record:LearningRecordV1} | {status:'missing';record:LearningRecordV1} | {status:'confirmation-required';reason:string} | {status:'memory-only';record:LearningRecordV1;error:string}`. `loadLearning(catalogue,contexts):Promise<LearningLoadResult>` validates any persisted context refs before return. `saveLearning(record):Promise<void>`. `createFreshLearningAfterConfirmation():Promise<LearningRecordV1>` backs up then atomically stores the reset default. Missing returns an in-memory default without writing.
- Uses separate IndexedDB `lexicon-learning`, DB version 1, `records` and `backups` stores. Fixed local key `local-profile`; do not touch `lexicon-game-saves`.
- Default missing-record mode is `learning`; no default write occurs until bootstrap completes.

- [x] **1. Write repository RED tests with an injected database factory.** Cover missing default/no pre-read overwrite, round-trip of profile/mode/tutorial, schema validation, wrong/future version backup and confirmation, backup before confirmed reset, backup/read/write/open errors without raw overwrite, case save database remains byte-for-byte unaffected.
- [x] **2. Run RED.** `npx nx run @lexicon/game-web:test -- --run src/persistence/learningRepository.test.ts`. Expected: missing repository exports fail.
- [x] **3. Implement strict record parser and independent IDB repository.** Reuse `idb`; validate stage/counters/time/context refs and vocabulary membership against current catalogue/derived context registry; backup raw before reset; return recoverable errors without throwing into case bootstrap. Keep DB name/version/key/store constants private and typed.
- [x] **4. Run GREEN.** `npx nx run @lexicon/game-web:test -- --run src/persistence/learningRepository.test.ts`. Expected: all migration/recovery cases pass and case-save tests do not change behavior.
- [x] **5. Commit.** `git add apps/game-web/src/persistence/learningRepository.ts apps/game-web/src/persistence/learningMigration.ts apps/game-web/src/persistence/learningRepository.test.ts && git commit -m "feat(persistence): save learning profile separately"`

### Task 4: Learning store, bootstrap integration, and learning events

**Files:**
- Create: `apps/game-web/src/state/learningStore.ts`
- Create: `apps/game-web/src/state/LearningStoreContext.tsx`
- Create: `apps/game-web/src/state/learningStore.test.ts`
- Create: `apps/game-web/src/persistence/connectLearningAutosave.ts`
- Create: `apps/game-web/src/persistence/connectLearningAutosave.test.ts`
- Create: `apps/game-web/src/learning/LearningRecoveryNotice.tsx` and `LearningRecoveryNotice.test.tsx`
- Modify: `apps/game-web/src/game/GameCanvas.tsx`, `GameStoreContext.tsx` only if provider nesting requires it, `apps/game-web/src/pause/usePauseShortcut.ts` and its existing unit test for popup-first Escape, `bridge/eventBus.ts` typing, `bridge/connectCaseEngine.ts` only to share existing validated node lifecycle—never to emit hidden dialogue contexts

**Interfaces:**
- `LearningStoreState = { profile:LanguageProfile; translationMode:TranslationMode; vocabularyTutorialSeen:boolean; activeWord:{vocabularyId:string;contextId:string}|null; error:string|null; dispatchLearning(action:LearningAction):void; setTranslationMode(mode:TranslationMode):void; markVocabularyTutorialSeen():void; setActiveWord(word:...|null):void }`.
- `createLearningStore({ catalogue, contexts, initialRecord, bus:EventBus<GameEventMap>, now? }): StoreApi<LearningStoreState>` wraps Task 2 reducer. Store persistence starts enabled for loaded/missing records and disabled for confirmation-required/memory-only. Cancel recovery switches to memory-only; confirmed reset calls the repository, re-enables persistence only after success, and never touches case save. Invalid actions preserve prior profile and set readable error; successful domain events emit through the injected typed event bus without re-running reducer during render. `now` defaults in the app adapter to ISO system time; tests inject a fixed clock.
- Store validates every action against the injected derived context registry. Store encounter entry point is called from visible reader lifecycle with an explicit stable contextId, never from preload/catalogue render. Shared component’s effect is idempotent even in StrictMode.
- Learning bootstrap failure produces a fresh memory-only profile plus a learning-specific warning or confirmation/reset panel while `GameCanvas` continues with already loaded case save. Cancel keeps learning in memory-only mode; confirm backs up then resets only learning.

- [x] **1. Write store/adapter RED tests.** Assert successful events once, duplicate rerender/reconnect emits no duplicate encounter, mode update preserves profile, inspect/translation update profile but not caseState, active popup is transient, out-of-scope errors visible, failed profile bootstrap does not reject `loadGameBootstrap` or disable case play; recovery notice cancel disables learning autosave, confirmation invokes only `createFreshLearningAfterConfirmation`, preserves the case state and enables learning autosave only on success. Assert autosave serializes writes and unsubscribes without writing when unchanged; an older queued snapshot can never overwrite a newer mode/profile.
- [x] **2. Run RED.** `npx nx run @lexicon/game-web:test -- --run src/state/learningStore.test.ts src/persistence/connectLearningAutosave.test.ts`. Expected: learning store/autosave modules absent.
- [x] **3. Implement provider/store and serialized autosave subscription.** Bootstrap both repositories independently; mount context/store per case session without remounting GameCanvas. Execute reducer in the store action only, bridge events once, serialize latest whole record, display persistence errors in a learning status channel and leave case save untouched.
- [x] **4. Run GREEN and regressions.** Run focused tests plus `npx nx run @lexicon/game-web:test -- --run src/App.test.tsx src/persistence/saveRepository.test.ts`. Expected: learning store passes; all case-save/boot contracts remain green.
- [x] **5. Commit.** `git add apps/game-web/src/state apps/game-web/src/persistence/connectLearningAutosave* apps/game-web/src/game/GameCanvas.tsx apps/game-web/src/bridge && git commit -m "feat(learning): add persistent learning store"`

### Task 5: Accessible inline vocabulary inspection and translation modes

**Files:**
- Create: `apps/game-web/src/vocabulary/VocabularyText.tsx`
- Create: `apps/game-web/src/vocabulary/VocabularyText.test.tsx`
- Create: `apps/game-web/src/vocabulary/vocabulary.css`
- Create: `apps/game-web/src/vocabulary/VocabularyLayer.tsx` if a shared layer is required for store selectors
- Modify: `apps/game-web/src/dialogue/DialogueView.tsx` and `DialogueLayer.tsx`
- Modify: `apps/game-web/src/evidence/EvidenceModal.tsx`
- Modify: `apps/game-web/src/notebook/NotebookPanel.tsx` and notebook styles/tests
- Modify: `apps/game-web/src/pause/PauseMenu.tsx` for mode control if no shared settings component exists
- Modify: `packages/shared-types/src/case.ts`, game-content UI string schema/tests and `packages/game-content/ui/vi.json`

**Interfaces:**
- `VocabularyText({ text, translationVi, spans, contextId, catalogue, mode, onEncounter(vocabularyId,contextId), onInspect(vocabularyId,contextId), onRevealTranslation(vocabularyId,contextId), onClose, returnFocusRef })` renders authored spans as native inline buttons and opens one contextual disclosure; it never scans or rewrites arbitrary word matches.
- Popup entry is keyed by `{vocabularyId,contextId}`. `descriptionVi`/`node.translationVi`/choice `translationVi` follow the exact three modes from spec. Choice remains one native choice button, never nests vocabulary controls.
- Notebook vocabulary selectors list only `Object.keys(profile.vocabulary)`; `unknown` catalogue entries stay undiscovered. User-facing values and tutorial copy come from `UiStrings` JSON.

- [x] **1. Write component RED tests.** With fixture lemma `leave` surface `left`, assert text segmentation retains whitespace/punctuation; click/Enter/Space opens definition; hover does not; keyboard focus is visible and focus returns to trigger/fallback when popup closes/disconnects; Beginner shows authored VI, Learning requires explicit reveal, Immersion keeps VI hidden while English definition works; duplicate spans cannot render twice; stage label does not imply mastery; unseen entry does not appear in notebook; mode select label/state accessible. Add `UiStrings` fields `vocabularyMode`, `vocabularyModeBeginner`, `vocabularyModeLearning`, `vocabularyModeImmersion`, `inspectVocabulary`, `revealTranslation`, `vocabularyMeaning`, `vocabularyContext`, `vocabularyStageSeen`, `vocabularyTutorial`, `vocabularyLearningError`, `vocabularyResetTitle`, and `vocabularyResetBody`.
- [x] **2. Run RED.** `npx nx run @lexicon/game-web:test -- --run src/vocabulary/VocabularyText.test.tsx`. Expected: component import/export fails.
- [x] **3. Implement reusable inline vocabulary reader and popup.** Render original text by slicing validated UTF-16 spans; bubble click to vocabulary layer without submitting choice/evidence or opening world interaction; let reader lifecycle dispatch unique context encounter and button activation dispatch inspect. Keep overlay inside reading panel/focus boundary. Use existing PaperPanel/theme/typography/focus helper; visible non-red underline and keyboard focus; controls at least 44px where feasible without disrupting inline sentence.
- [x] **4. Connect content surfaces/modes/tutorial/notebook.** Replace only rendering of existing evidence description and visible dialogue node text. Add authored translations below English in Beginner; allow explicit VI reveal in Learning; suppress all VI reading translations in Immersion. Add mode select to reading panels and PauseMenu; mode change closes word popup without changing case/profile progress. Show contextual first-inspect instruction once and retain tutorial flag. Replace vocabulary empty state with encountered entries and authored metadata/contexts; retain People/Evidence tab behavior. Escape closes popup before parent dialogue/evidence/notebook/pause; skip shortcuts while mode select is targeted.
- [x] **5. Run focused UI GREEN and typecheck.** `npx nx run @lexicon/game-web:test -- --run src/vocabulary/VocabularyText.test.tsx src/dialogue/DialogueView.test.tsx src/evidence/EvidenceModal.test.tsx src/notebook/NotebookPanel.test.tsx`; `npm run typecheck`. Expected: accessible interaction/modes pass and no case UI fixture loses required string fields.
- [x] **6. Commit.** `git add apps/game-web/src/vocabulary apps/game-web/src/dialogue apps/game-web/src/evidence apps/game-web/src/notebook apps/game-web/src/pause packages/shared-types/src/case.ts packages/game-content && git commit -m "feat(ui): add contextual vocabulary inspection"`

### Task 6: Browser persistence flows, regression verification, and handoff

**Files:**
- Create: `apps/game-web/e2e/learning.spec.ts`
- Modify: `apps/game-web/e2e/dialogue.spec.ts`, `hud.spec.ts` only if existing flows need expanded persisted vocabulary/control assertions
- Modify: `docs/ai/MEMORY.md`, this plan’s checkboxes, and `docs/ai/2026-09-28-phase-6-learning-engine-verification.md`

**Interfaces:** Uses Tasks 1–5; E2E reads authored JSON/profile IndexedDB fixture and inspects `local-profile` in the separate `lexicon-learning` database. No debug setters in production.

- [x] **1. Write E2E checks** for visible encounter from Meeting Minutes/Anna response only, no encounter from hidden conditional David node/unopened evidence, click/keyboard popup, hover no-inspect, explicit translation modes, notebook only encountered, reload preserves counts/stages/mode/tutorial, duplicate reopen dedupes, learning record corruption/read failure recovery leaves evidence/interview and one canvas intact, confirmed reset only resets learning, focus/Escape nesting and no browser console errors.
- [x] **2. Run focused E2E RED** using local Playwright browser with `npm run test:e2e -- --grep learning`. Expected: new learning flow assertions fail against current empty vocabulary UI/profile implementation.
- [x] **3. Implement/fix integration gaps** at store/context boundaries from real browser trace; never weaken assertions or alter Case #001 truth to satisfy test.
- [x] **4. Run all verification.** `npm run lint`; `npm run test`; `npm run build`; `npm run typecheck`; `npm run format:check`; `npm run test:e2e`; `npm run memory:check`; `git diff --check`. Expected: all commands exit 0, new E2E and prior dialogue/HUD/world tests pass, build gate validates full content. No `dotnet` commands because backend is unchanged.
- [ ] **5. Review whole diff.** Use `requesting-code-review`; inspect content references, profile DB recovery isolation, strict-mode deduplication, hidden context tracking, mode leakage and overlay focus. Fix Critical/Important findings test-first and rerun affected tests plus whole suite; ledger Minor findings.
- [ ] **6. Commit and update memory.** Commit implementation/report/plan checkboxes first; update `MEMORY.md` in a following commit with the implementation commit as `result_commit`. Keep commits local unless the user authorizes push.

## Plan Review Notes

- One plan is testable end-to-end: validation/content → pure learning core → repository → store/bootstrap → reading UI/notebook → browser reload/recovery. The repository and reducer contracts can be rejected independently before their consumers.
- Spec coverage includes all 20 catalog entries, visible-context events/dedupe, stage policy, counters, three modes, contextual tutorial, notebook, profile defaults, non-overwrite recovery, serialized autosave, keyboard/accessibility, and preserved case save.
- Interface chain is consistent: shared types → reducer → repository record → store/actions → `VocabularyText` → existing case/notebook surfaces. Backend, audio, review scoring and case truth stay outside scope.
- Review Focus tests are assigned: span malformed cases Task 1; hidden/StrictMode context Task 4; unique contexts Task 2; corrupt profile Task 3/6; rapid writes/modes and focus Task 4/5/6.

## Handoff

Phương án A trong spec đã được người dùng duyệt. Review plan và chọn cách thực thi trước khi bắt đầu implementation; mặc định đề xuất inline vì các thay đổi cùng chia sẻ content/type/store/persistence interfaces.
