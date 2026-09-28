# Phase 5 — Kế hoạch triển khai Dialogue

> **Dành cho agent thực thi:** SUB-SKILL BẮT BUỘC: dùng `subagent-driven-development` hoặc `executing-plans` để thực hiện từng task. Các bước dùng checkbox để theo dõi. Plan đã được người dùng duyệt và chọn inline qua “dùng inline đi” ngày 2026-09-28.

**Mục tiêu:** ba NPC Anna/Leo/David nói chuyện được từ world prototype; conditions/effects chạy trong core và tiến độ interview sống qua reload.

**Kiến trúc:** game-content cung cấp NPC/tree/node/choice đã validate. game-core xử lý dialogue bằng transition thuần; Zustand giữ session transient và bọc runner, bridge giải NPC interaction, React hiển thị panel giấy. Flags/facts/objectives dùng autosave IndexedDB hiện có với migration version 1 → 2.

**Stack:** TypeScript strict, React, Phaser, Zustand, Zod, idb, Vitest, Playwright; npm workspaces + Nx; không thêm dependency.

**Spec:** `docs/superpowers/specs/2026-09-28-phase-5-dialogue-design.md` — phương án A đã duyệt.

## Ràng buộc chung

- Chỉ Phase 5: Main Office prototype chứa ba NPC; không dựng thêm scene/transition, contradiction detector, timeline, learning hoặc accusation.
- Giữ nguyên Case #001 truth và câu thoại tại docs/03 §10–§12; giữ `evidenceTotal: 5`, không đếm lời khai như evidence collectible.
- Core không import React/Phaser/Zustand/DOM/IndexedDB/content JSON. Không hardcode Case #001 ID/copy trong app hoặc core.
- Node/choice effects chỉ chạy qua transition, không chạy khi render hoặc đọc choices. Lỗi rollback cả session và state của thao tác.
- Save không chứa session/current node/focus/overlay; backup raw save trước migration, không overwrite dữ liệu lỗi.
- Input khóa khi dialogue/pause/evidence/notebook; shortcut bỏ qua input/textarea/contenteditable; Escape chỉ có một owner.
- Font ≥14 px, palette/typography theo docs/art/06 và tokens hiện có. Đỏ chỉ cho investigation accent; không thêm art/portrait mới.
- Trước execution dùng `using-git-worktrees` kiểm tra isolation. Quyết định checkout dev của Phase 4 không tự áp dụng cho phase mới; nếu người dùng chọn dev thì giữ nguyên lựa chọn đó.

## Trọng tâm review

1. Click choice cũ hoặc double-click sau chuyển node: không tiến thêm node hoặc áp dụng nhầm effect — Task 3/5.
2. Mở dialogue khi overlay/input đang khóa, kể cả event bus gửi trực tiếp: không chồng overlay/đổi progress — Task 5.
3. Save Phase 4 hợp lệ nhưng thiếu objective mới: migrate, không reset; backup/write failure giữ bản gốc — Task 4.
4. Flag contradiction vắng mặt, false hoặc true: đúng nhánh David, confession chỉ unlock sau câu hỏi Which folder — Task 2/3/7.
5. Focus trigger bị tháo khỏi DOM hoặc node đổi: focus vẫn trong panel, khi đóng có fallback game container — Task 6/7.

## Bản đồ file và interface

- `packages/shared-types/src/dialogue.ts`: contracts dialogue/session/result; export qua index.
- `packages/shared-types/src/case-engine.ts`: CaseDefinition thêm npcs/dialogues; FactDefinition thêm nguồn dialogue; ObjectiveDefinition thêm initialStatus/completionCondition.
- `packages/game-content/src/schema/dialogue.ts`, `validation/dialogueReferences.ts`: Zod và kiểm tra graph/reference; loader đọc npcs/dialogues.
- `packages/game-core/src/dialogue/dialogueRunner.ts`, `reconcileDialogueProgress.ts`: runner và projection interview/objective từ condition content.
- `apps/game-web/src/persistence/saveMigration.ts`: legacy validation/migration tách khỏi IndexedDB adapter.
- `apps/game-web/src/dialogue/DialogueView.tsx`, `DialogueLayer.tsx`, `dialogue.css`: UI dialogue; GameCanvas chỉ gắn layer.

Các contracts được chốt cho plan:

```ts
NPCDefinition = { id: string; name: string; role: string; dialogueTreeId: string };
DialogueChoice = { id: string; text: string; nextNodeId: string;
  condition?: Condition; effects?: readonly Effect[] };
DialogueNode = { id: string; speakerId: string; text: string;
  condition?: Condition; effects?: readonly Effect[];
  choices: readonly DialogueChoice[]; terminal: boolean };
DialogueTree = { id: string; npcId: string; entryNodeId: string;
  nodes: readonly DialogueNode[]; completionFlag: string; completionCondition: Condition };
DialogueSession = { treeId: string; npcId: string; nodeId: string; revision: number };
DialogueAction = { nodeId: string; revision: number; choiceId: string };
DialogueError = { code: 'unknownNpc' | 'unknownTree' | 'unknownNode' |
  'unknownChoice' | 'staleAction' | 'conditionNotMet' | 'effectFailed'; detail: string };
DialogueTransitionResult =
  { ok: true; state: GameState; session: DialogueSession; events: readonly CaseDomainEvent[] } |
  { ok: false; state: GameState; session: DialogueSession | null; error: DialogueError };
```

Readonly fields theo pattern shared-types. `speakerId` là NPC ID hợp lệ hoặc reserved ID `investigator`; nhãn investigator lấy từ UiStrings. `terminal: true` vẫn hiển thị text, không tự đóng; không có choices, nút đóng kết thúc session mà không chạy effects thêm. Entry không có condition; mỗi node khác có choices hoặc terminal để tránh dead end.

### Task 1: Contract và validation graph dialogue

**Files:** tạo `packages/shared-types/src/dialogue.ts`, `packages/game-content/src/schema/dialogue.ts` và `packages/game-content/src/validation/dialogueReferences.ts`, cùng tests; sửa shared-types/index.ts, case-engine.ts, scene.ts, type-tests/case-engine.ts; game-content/schema/caseDefinition.ts, scene.ts, loader/loadCaseDefinition.ts và tests; tạo `packages/game-content/cases/case-001/npcs.json` với mảng rỗng và đổi dialogues.json thành `{ "dialogues": [] }` trước author ở Task 2; cập nhật các fixture CaseDefinition bị ảnh hưởng. Các đường dẫn shared-types/game-core/game-content trong tasks tiếp theo đều tương đối với `packages/<package>/src`, trừ content `cases/` và `ui/`.

**Interfaces:** CaseDefinition có `npcs: readonly NPCDefinition[]`, `dialogues: readonly DialogueTree[]`; InteractionArea thêm `npcId?: string`; FactDefinition thêm `sourceDialogueIds?: readonly string[]`, sourceEvidenceIds có thể rỗng nhưng tổng nguồn phải ≥1. ObjectiveDefinition thêm `initialStatus?: 'locked' | 'active'`, `completionCondition?: Condition`. ParseCaseDefinition input thêm `npcsRaw` và `dialoguesRaw`, shape `{ npcs: [...] }` / `{ dialogues: [...] }`; registry truyền hai field bắt buộc, case tối giản dùng mảng rỗng.

- [x] **1. Viết test đỏ cho schema/references.** Assert lỗi có file/field cho duplicate NPC/tree/node/choice, thiếu owner/speaker/entry/target, entry có condition, terminal có choice, nonterminal không choice, effect/condition ID lạ, NPC scene tham chiếu sai và fact không có nguồn. Node IDs có thể trùng giữa hai trees; choice IDs chỉ cần unique trong một node. Kiểm tra evidence.relatedNpcIds nếu có. NPC interactions không có effects (tránh hai dispatch trong một interaction).
- [x] **2. Chạy đỏ:** `npx nx run @lexicon/game-content:test` — test mới FAIL đúng contract/validation chưa tồn tại.
- [x] **3. Cài contracts, schema và loader.** Validation references nằm trong file mới, không tăng một file caseDefinition thành mọi trách nhiệm. CompletionCondition của tree chỉ gồm all/any và flag true để tránh completion phụ thuộc vòng vào tree khác; mỗi leaf phải được setFlag true bởi choices của chính tree. Optional properties theo exactOptionalPropertyTypes của repo. Graph phải có đường tới các nodes cần thiết; cho phép response quay lại entry.
- [x] **4. Chạy xanh:** target trên và `npm run typecheck`; các fixture cập nhật npcs/dialogues rỗng phải giữ behavior cũ.
- [x] **5. Commit:** `feat(content): add validated dialogue contracts`.

### Task 2: Author ba NPC, branch flags và conditional David

**Files:** tạo cases/case-001/npcs.json; sửa dialogues.json, objectives.json, facts.json, scenes/main_office.json; sửa loader/schema tests. Tạo game-content/src/validation/validateRegisteredContent.ts và test; sửa src/index.ts, apps/game-web/vite.config.ts.

**Interfaces:** tree IDs `anna_initial`, `leo_initial`, `david_initial`, entry ID `entry`; tree.completionFlag là `anna_interviewed`, `leo_interviewed`, `david_interviewed`. Ba branch flags mỗi tree dùng `<npc>_q1_read`, `_q2_read`, `_q3_read`. Completion condition = all ba branch flags true. Objective mới `talk_to_everyone`, text `Talk to Anna, Leo, and David`, initialStatus active, completionCondition all ba interview flags true.

- [x] **1. Viết test đỏ content.** Load Case #001 assert đúng ba NPC/tree và copy docs/03 §10–§12; interaction anna/leo/david có npcId, radius 90; không tăng evidence count/total. Assert không choice tới confession nếu flag contradiction vắng/false, có choice challenge nếu true bằng cấu trúc condition đã author.
- [x] **2. Chạy đỏ:** `npx nx run @lexicon/game-content:test`.
- [x] **3. Author JSON.** Anna giữ `(800,1000)`, Leo `(1600,1100)`, David `(1850,900)`; origin `[0.5,0.88]`, texture ph_npc, collider footprint 30×18 theo Anna hiện có; không đè desk/note/spawn. Scene prompt lấy từ JSON. Câu trả lời là response node; choice `continue` text `Tiếp tục hỏi` về entry có setFlag branch đọc. Đóng sớm trước continue không đánh dấu branch. Entry David có hai biến thể q3 cùng text nhưng IDs khác/conditions đối nhau; missing flag được runner hiểu false. Continue từ cả hai q3 set david_q3_read. Challenge chỉ khi flag true; node collect_folder đặt flag `david_folder_statement_read`, choice `Which folder?` tới terminal confession đặt `david_confession_read`. Facts nguồn `david_initial`, unlockCondition theo hai flags đọc; thêm `david_statement_no_entry_after_20_00` từ flag đặt khi entry David hiển thị, không thay truth. Không thêm security evidence hoặc finale objective.
- [x] **4. Gắn build gate.** `validateRegisteredContent(loadCase = loadCaseDefinition, loadStrings = loadUiStrings): void` load tất cả case IDs đăng ký và UI strings; hai dependency có cùng signature với loader production, inject loader fixture trong test để xác nhận lỗi propagated. Export registry IDs từ loader, không duplicate danh sách case trong validator. Vite plugin `buildStart` gọi hàm này (import nguồn TS mà Vite config loader hỗ trợ), để production build fail trước bundling nếu dialogue hỏng. Không test bằng sửa file production.
- [x] **5. Chạy xanh:** content tests, `npx nx run @lexicon/game-web:build`; xác minh fixture target node lỗi làm validation throw, không cần để JSON hỏng trong commit.
- [x] **6. Commit:** `feat(content): author Case 001 dialogue trees`.

### Task 3: DialogueRunner pure và tiến độ interview/objective

**Files:** tạo game-core/src/dialogue/dialogueRunner.ts, reconcileDialogueProgress.ts và tests; sửa src/index.ts, case/createCaseState.ts, case-engine.test.ts.

**Interfaces:** `startDialogue(definition, state, npcId): DialogueTransitionResult`; `getAvailableChoices(definition, state, session): readonly DialogueChoice[]`; `chooseDialogueChoice(definition, state, session, action): DialogueTransitionResult`; `reconcileDialogueProgress(definition, state): CaseTransitionResult`. `closeDialogue` ở store chỉ bỏ session, không có transition nghiệp vụ. `createCaseState` giữ initialObjectiveId active; các objective khác dùng initialStatus hoặc locked.

- [x] **1. Viết test đỏ runner với tiny authored fixture.** Start entry effects chạy đúng một lần; lựa chọn không tồn tại/không đủ condition trả state/session gốc; action nodeId/revision cũ bị staleAction. Gộp choice effects rồi target node effects trong một applyEffects batch để effect sau lỗi rollback toàn thao tác. Target condition xét trên state trước effect batch; không cho effects tự bật điều kiện để vượt khóa.
- [x] **2. Chạy đỏ:** `npx nx run @lexicon/game-core:test`.
- [x] **3. Cài runner và progress.** Condition dialogue dùng helper riêng: flag missing = false, all/any recurse; leaves khác gọi evaluateCondition hiện có, không đổi semantics chung. `getAvailableChoices` kiểm tra cả choice/target conditions, không chạy effect. Session revision tăng mỗi transition; store dùng revision này để loại double-click cũ. Reconcile dùng applyEffects: trước đặt completionFlags đủ điều kiện nhưng chưa true, sau complete các active objectives có completionCondition true; không complete locked/completed, không phát lại flag/objective events. Reconcile sau start/choose và migration; nếu reconcile lỗi trả lỗi với state/session trước thao tác. Không cần framework hoặc mutable global.
- [x] **4. Viết test các flows tương đương bằng fixture core.** Chọn ba câu hỏi mỗi NPC và continue: objective chỉ completed sau đủ ba interviews; đóng response chưa continue không hoàn tất; đọc lại không events/state mới. Missing/false trả `Yes. I'm certain.`, true trả `...I may have gone in for a moment.`; mở/đặt contradiction chưa unlock confession, Which folder mới unlock fact cuối. Tree/NPC/flag IDs generic trong tests core; không import game-content ở game-core. App integration test Task 5 kiểm tra các assertions này với Case #001 thật.
- [x] **5. Chạy xanh:** core test target và content tests; xác nhận direct applyEffects completeObjective trùng vẫn giữ contract lỗi Phase 3, chỉ reconcile tránh phát effect trùng.
- [x] **6. Commit:** `feat(core): run dialogue with conditions and effects`.

### Task 4: Save schema 2 và migration bảo toàn Phase 4

**Files:** tạo apps/game-web/src/persistence/saveMigration.ts, saveMigration.test.ts và fixture legacy; sửa saveRepository.ts/tests, bootstrapGame.test.ts, connectAutosave.test.ts nếu record fixture version đổi.

**Interfaces:** SaveRecord.schemaVersion = 2. `migrateVersion1Save(raw: unknown, definition: CaseDefinition): SaveRecord` validate trước chuyển; legacy contract Case #001 version 1 nằm trong game-content/cases/case-001/save-v1.json, export loader `loadLegacySaveContract(caseId, version)` thay vì hardcode IDs trong adapter. Legacy contract ghi caseId/title/evidenceTotal, objective/evidence/fact IDs của Phase 4. `isGameState` version 2 tiếp tục strict exact keys/current definition. DB version vẫn 1 vì không đổi stores.

- [x] **1. Viết test đỏ migration.** Fixture v1 có meeting_minutes/meeting_started và objective cũ completed → v2 giữ nguyên, talk_to_everyone active, chưa interviewed. v1 unknown objective/status/evidence/fact, flags nonboolean/version lạ → reject; v2 unknown objective → reject. Giữ arbitrary boolean flags theo legacy contract Phase 4. Reconcile interview flags hợp lệ trong legacy flags nếu đã có, không tự sinh completed nếu thiếu branch flags.
- [x] **2. Chạy đỏ:** `npx nx run @lexicon/game-web:test`.
- [x] **3. Cài legacy validation/migration.** Legacy JSON được validate bằng Zod/content loader, không import JSON ở pure core. Validate record/version/timestamp và mọi legacy GameState fields trước thêm objective; objective mới lấy initialStatus/content. Reconcile bằng core, validate lại current schema. Không migrate bằng “chấp nhận subset objective bất kỳ”.
- [x] **4. Viết test adapter sequencing.** Assert `addBackup(raw)` trước `putSave(v2)`, loaded chỉ trả sau write xong; backup/write failure trả unavailable, không confirmation/new save và không thay original record. Malformed/version lạ vẫn backup → confirmation-required, chưa overwrite. Migration không được gọi fresh save flow.
- [x] **5. Gắn migration vào loadSave và chạy xanh.** Current v2 load giữ flow hiện có; v1 valid backup rồi persist migrated; saveGameState ghi v2. Khi migration unavailable, bootstrap memory-only/autosave disabled theo contract Phase 4; cảnh báo đọc được. Chạy app tests và content tests (legacy contract loader).
- [x] **6. Commit:** `feat(save): migrate dialogue progress without losing Phase 4 saves`.

### Task 5: Store/bridge và keyboard ownership

**Files:** sửa state/gameStore.ts/tests, bridge/connectCaseEngine.ts/tests, pause/usePauseShortcut.ts, notebook/useNotebookShortcut.ts/tests; tạo dialogue/store integration tests nếu cần để giữ gameStore.test nhỏ.

**Interfaces:** store thêm `dialogueSession: DialogueSession | null`, `dialogueError: string | null`, `startDialogue(npcId): void`, `chooseDialogue(action: DialogueAction): void`, `closeDialogue(): void`. Lỗi runner giữ state/session cũ và set error; error không đổi caseState. Bridge NPC đi qua startDialogue, evidence vẫn qua applyCaseEffects.

- [x] **1. Viết test đỏ bridge/store.** NPC event mở đúng tree; inputLocked thì event NPC/evidence không effects; mở dialogue khi pause/evidence/notebook không được; J không mở notebook khi dialogue; Escape đóng dialogue không pause. Action stale/double-click chỉ xử lý đầu tiên. Autosave đúng một lần cho state mới, zero cho session-only start/close và duplicate flags. Integration dùng Case #001 thật để xác nhận đủ ba nhánh/NPC hoàn tất talk_to_everyone, q3 David trước/sau flag và confession chỉ unlock david_took_report sau Which folder.
- [x] **2. Chạy đỏ:** `npx nx run @lexicon/game-web:test`.
- [x] **3. Cài actions và lock projection.** Dùng helper tính inputLocked từ paused/activeEvidenceId/notebookOpen/dialogueSession, không giữ logic khác nhau trong các actions. Từ chối mở overlay khác khi dialogue có session, kể cả programmatic action. closeDialogue xóa error và session, giữ caseState. usePauseShortcut vẫn là sole Escape owner; không thêm Esc listener trong DialogueView.
- [x] **4. Test cleanup và typing.** Unsubscribe bridge không nhận event tiếp; J/E/Escape ở input/textarea/contenteditable không bị chiếm; runner errors có detail developer-readable, console development prefix `[Dialogue]`. UI lỗi được Task 6 render.
- [x] **5. Chạy xanh:** app tests và `npm run typecheck`; commit `feat(game-web): connect NPC dialogue to the case store`.

### Task 6: DialogueView accessible và gắn GameRoot

**Files:** tạo dialogue/DialogueView.tsx, DialogueLayer.tsx, dialogue.css, DialogueView.test.tsx; sửa game/GameCanvas.tsx, shared-types/case.ts, game-content/schema/ui.ts/tests và ui/vi.json.

**Interfaces:** `DialogueView({ speakerName, speakerRole, node, choices, session, strings, error, onChoose, onClose, returnFocusRef })`; onChoose nhận DialogueAction; returnFocusRef trỏ game container. DialogueLayer đọc selectors và resolve speaker/tree/node bằng caseDefinition; GameRoot không giữ bản sao session. UiStrings thêm investigator=`Điều tra viên`, dialogue=`Lời khai`, dialogueError=`Không thể tiếp tục hội thoại.`; đóng dùng strings.close hiện có. Continue copy trong JSON dialogue.

- [x] **1. Viết test đỏ rendering/focus.** Speaker/role/text/choices đúng content, error visible role alert; button gửi nodeId/revision/choiceId snapshot khi render. Focus trap Tab/Shift+Tab; khi node đổi focus text có tabIndex -1 rồi Tab tới choice; terminal chỉ có close, không tự hoàn tất branch khi close. Trigger disconnect → returnFocusRef được focus khi unmount.
- [x] **2. Chạy đỏ:** app/content test targets.
- [x] **3. Cài panel giấy và layer.** Reuse PaperPanel/theme/getFocusTrapTarget; role dialog, aria-modal, labeled heading, paragraph lang en cho câu tiếng Anh. Focus restore effect chạy một lần mount/unmount, effect node-change riêng để không restore focus khi chuyển node. Game container tabIndex -1 và label từ strings; canvas instance/ref giữ ổn định. Không autofocus nhiều competing buttons hoặc aria-live toàn lịch sử.
- [x] **4. Chạy xanh:** app/content tests; kiểm tra viewport 1280×720 và 1920×1080, nội dung scroll được không giấu button/focus; reduced-motion nếu có transition. Giữ People/Vocabulary empty states và evidence UX.
- [x] **5. Commit:** `feat(ui): render keyboard-accessible dialogue panels`.

### Task 7: E2E, review và bàn giao Phase 5

**Files:** tạo apps/game-web/e2e/dialogue.spec.ts; sửa hud.spec.ts/world.spec.ts nếu fixtures/active objective expectations cần cập nhật; cập nhật checkbox plan và docs/ai/MEMORY.md sau commit implementation.

- [ ] **1. E2E ba NPC từ world.** Teleport bằng debug seam hiện có tới vị trí content, nhấn E, click ba câu hỏi và continue, verify flags/objective trong IndexedDB v2 sau autosave. Poll DB transaction hoàn tất trước reload; không dùng timeout cố định để giả định save xong. Canvas dataset marker còn nguyên qua các nodes. Theo dõi pageerror/console error từ đầu test.
- [ ] **2. E2E conditional David.** Dùng loaded definition/createCaseState để tạo fixture v2, set david_contradiction_found true, ghi qua IndexedDB trước reload. Không thêm debug setter/production UI. Verify challenge và Which folder trước confession; fixture false/missing không có confession. Migration E2E seed v1 hợp lệ, reload rồi notebook còn Meeting Minutes và save chuyển v2.
- [ ] **3. E2E input/focus.** Dialogue khóa WASD/E/J, Esc chỉ đóng dialogue rồi movement tiếp tục; focus trong panel qua Tab, close trả game container khi trigger là body; canvas không remount. Typing targets không chiếm shortcuts; đóng sớm và reload chưa interview completed.
- [ ] **4. Chạy verification thật.** Xác định npm runtime trước (không đổi package manager); nếu dependencies thiếu, npm ci theo lockfile và sandbox permissions, không thêm dependency. Chạy `npm run lint`, `npm run test`, `npm run build`, `npm run format:check`, `npm run test:e2e`, `npm run memory:check`, `git diff --check`; ghi output và exit code. Nếu môi trường chặn thì ghi hạn chế, không đánh dấu phase complete. Backend không đổi nên không chạy .NET.
- [ ] **5. Review toàn diff.** Dùng requesting-code-review theo execution mode được duyệt; kiểm tra rollback, condition gate, migration non-overwrite, stale choices, cleanup/focus và dependency boundaries. Sửa findings quan trọng test-first rồi rerun đúng checks chịu ảnh hưởng.
- [ ] **6. Commit và memory.** Commit implementation/checkboxes/verification trước; memory commit kế tiếp trỏ result_commit. Báo summary/files/tests/output/limitations. Push theo workflow người dùng đã giao; plan draft chưa duyệt không push.

## Bàn giao execution

Đề xuất **inline/native**: các tasks chia sẻ types/runner/content và save contract nên một người thực thi giúp giữ interface thống nhất. Người dùng đã duyệt plan và chọn inline; execution thực hiện trên checkout dev theo lựa chọn đã lưu. Rulings và verification được ghi trong ledger, rồi chuyển vào báo cáo bàn giao.
