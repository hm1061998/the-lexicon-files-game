# Sổ tay Nhân vật Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans để triển khai inline theo lựa chọn Native đã lưu. Thực hiện từng task; theo dõi bằng checkbox (`- [ ]`).

**Goal:** Hiển thị hồ sơ và đúng lời khai đã ghi nhận trong tab Nhân vật, giữ kín nhánh chưa khám phá.

**Architecture:** Content sở hữu metadata tham chiếu node dialogue; GameState.flags hiện có quyết định khả năng xem lại. Selector thuần tạo hồ sơ, React dùng VocabularyText hiện có và callbacks learning hiện có; không lưu transcript riêng.

**Tech Stack:** TypeScript strict, Zod, React, Vitest, Playwright, npm + Nx; Node 22.

**Spec:** `docs/superpowers/specs/2026-10-01-notebook-people-design.md`.

**Trạng thái:** Plan mới lập, đã tự review; chờ người dùng review file này. Phản hồi trước khi file tồn tại không được tính là duyệt artifact này.

## Global Constraints

- Native inline trên dev; một gói People, không tự mở phase hoặc gói onboarding/pathfinding.
- Không thêm backend/dependency/save version hoặc mảng transcript/visitedNPC trong engine/store/persistence.
- Metadata optional; không metadata vẫn load/chạy bình thường. Không sửa text/audio/hash dialogue.
- recordedCondition chỉ positive flag(value:true), all/any không rỗng; writer setFlag(true) phải thuộc node/choice của chính tree, không completionFlag.
- Translation selector chỉ Settings; context ID `dialogue:${tree.id}:${node.id}:text`.
- Palette/typography theo art06; không đỏ trang trí cho status, không tự đánh giá NPC có tội.
- Giữ fix viewport; kiểm tra 1280×720 và 760×600, gồm tab Conclusion khi khả dụng.
- Git add đường dẫn cụ thể; giữ hai debug.log untracked. Result commit trước, memory commit kế tiếp. Không push plan chưa được xác nhận.

## Review Focus

1. Save David cũ có q3_read/completion/contradiction nhưng thiếu flag riêng: không đoán transcript, không mất progress — task 2/3/5.
2. Nhánh thường đã đọc rồi condition đổi: transcript cũ vẫn hiện, nhánh mới chỉ hiện khi ghi nhận riêng — task 3/5.
3. Tree không metadata hoặc chỉ mở/đóng entry Anna: không hồ sơ giả, không lỗi load — task 1/3/5.
4. Mở People nhiều lần: không inflate encounterCount, không mount node ẩn — task 4/5.
5. List dài và năm tab ở compact: Tab/Shift+Tab/Enter vẫn thấy control, document/canvas không cuộn — task 5.

## Cấu trúc file

| File | Trách nhiệm |
| --- | --- |
| `packages/shared-types/src/dialogue.ts`, `index.ts` | Contract và export NotebookStatementDefinition |
| `packages/game-content/src/schema/dialogue.ts` | Zod metadata optional |
| `packages/game-content/src/validation/notebookStatements.ts` (mới), `dialogueReferences.ts` | Kiểm tra recordedCondition/node/own-tree writer, tích hợp validator |
| `packages/game-content/src/schema/dialogue.test.ts` | Regression loader và lỗi metadata có path |
| `packages/game-content/cases/case-001/dialogues.json`, `src/index.test.ts` | Metadata authored và flag David riêng; kiểm tra content thực |
| `apps/game-web/src/notebook/selectNotebookPeople.ts`, `.test.ts` (mới) | Selector thuần và điều kiện hiển thị |
| `apps/game-web/src/notebook/NotebookPeoplePanel.tsx`, `.test.tsx` (mới) | Hồ sơ/lời khai; render node bằng VocabularyText |
| `apps/game-web/src/notebook/NotebookPanel.tsx`, `.test.tsx`, `notebook.css` | Thay empty People bằng component, giữ header/tab/scroll |
| `packages/shared-types/src/case.ts`, `packages/game-content/src/schema/ui.ts`, `ui.test.ts`, `packages/game-content/ui/vi.json` | Ba label UI từ content |
| `apps/game-web/e2e/notebook-people.spec.ts` (mới) | Journey, persistence, learning, viewport/focus |
| `docs/ai/2026-10-01-notebook-people-verification.md` (mới), `MEMORY.md` | Bằng chứng và handoff sau thực thi |

Không sửa GameCanvas/store/engine nếu interface callbacks hiện có đủ; nếu cần thay contract ngoài spec, dừng và làm rõ scope trước.

## Task 1: Contract và validation metadata

**Interfaces:** Xuất `NotebookStatementDefinition { readonly nodeId: string; readonly recordedCondition: Condition }`; thêm `DialogueTree.notebookStatements?: readonly NotebookStatementDefinition[] | undefined`. Helper `validateNotebookStatements(tree: DialogueTree, issues: string[]): void` trong file mới; caller giữ signature validateDialogueReferences hiện tại.

- [ ] Viết test `loads trees without notebook metadata`, `accepts positive own-tree node and choice flags` và table `rejects invalid notebook statement with path` trong dialogue.test.ts. Assertions: parse không metadata thành công; metadata hợp lệ được giữ; duplicate/missing node/wrong speaker/empty nodeId/unknown flag/foreign writer/completionFlag/false/empty all/empty any/nested forbidden condition đều throw ContentValidationError chứa `notebookStatements` và index entry.
- [ ] RED: `npx nx run @lexicon/game-content:test --skip-nx-cache`; metadata hợp lệ phải fail vì schema strict chưa nhận field. Lỗi import/fixture không hợp lệ không được tính RED.
- [ ] Thêm interface/export, schema optional dùng Condition schema hiện có, helper xác thực đệ quy và tích hợp validation. Writer thu từ cả node.effects và choice.effects; không thay cách xác thực completionFlag hiện có. Dùng path tree/node rõ ràng, không silently drop metadata.
- [ ] GREEN: chạy lại cùng lệnh; mọi test mới và cũ pass. `npm run typecheck` pass, không framework import vào shared-types/core.
- [ ] Commit riêng các file task 1: `feat: validate notebook statement metadata`.

## Task 2: Metadata Case 001 và hai flag David

**Interfaces:** Tiêu thụ contract task 1. Chỉ thêm setFlag authored; giữ timing và `david_q3_read` cũ. Không tạo migration hoặc field engine mới.

- [ ] Viết test `authors statement conditions in content order` và `records David branches independently without changing completion` trong game-content/src/index.test.ts. Assert metadata Anna/Leo entry dùng any ba q_read, answer1/2/3 dùng flag tương ứng; David entry/answer1/answer2/folder/confession dùng flags trong bảng spec. Assert answer3 và answer3_unlocked có flag riêng ở choice Tiếp tục cùng shared q3_read, completionCondition/text/audio giữ nguyên.
- [ ] RED: chạy content test không cache; test thiếu metadata/flag riêng fail với assertion cụ thể.
- [ ] Sửa dialogues.json theo bảng spec: `david_answer3_recorded` và `david_answer3_unlocked_recorded`, value:true; thứ tự metadata entry trước các answer, folder rồi confession. Không thêm visited flag Anna/Leo.
- [ ] GREEN: content test pass; parse toàn bộ Case 001 thành công. Ghi lại diff chỉ metadata/hai effect mới, không text/audio/node.condition/completionCondition.
- [ ] Commit: `feat: author recorded notebook statements for case 001`.

## Task 3: Selector hồ sơ thuần

**Interfaces:** File mới xuất `NotebookPerson` có `npc: NPCDefinition`, `treeId: string`, `status: 'inProgress' | 'complete'`, `statements: readonly DialogueNode[]`; tất cả readonly. Xuất `selectNotebookPeople(definition: CaseDefinition, state: GameState): readonly NotebookPerson[]`. Tiêu thụ metadata task 1/2 và `evaluateCondition(state, condition)` từ game-core.

- [ ] Viết selectNotebookPeople.test.ts với fixtures typed và assertions:
  - `hides fresh unrelated and metadata-free trees`: kết quả `[]` cho fresh, irrelevant flags và cây không metadata.
  - `shows partial Anna in authored order`: một q_read → chỉ Anna, entry + answer tương ứng; status inProgress; chưa ghi nhận không xuất hiện.
  - `completion never unlocks statements`: completion true chỉ đổi status complete của hồ sơ đã có statement; không thêm câu/NPC.
  - `keeps historical David and hides unlocked unread branch`: flag thường + contradiction → chỉ thường; thêm unlocked recorded → cả hai đúng thứ tự, dù node.condition thường giờ false.
  - `does not infer legacy q3 branch`: q3_read + contradiction + completion không flag riêng → cả hai answer3 vắng; các statement đã tách flag vẫn hiện.
  - `uses node references without mutating progress`: deep-freeze input; output node đúng reference; state flags/facts/objectives/evidence giữ nguyên; NPC/tree owner nối đúng và thứ tự NPC gốc giữ nguyên.
- [ ] RED: `npx nx run @lexicon/game-web:test --skip-nx-cache`; tạo skeleton selector trả [] để assertion partial/history fail, không lấy missing module làm RED.
- [ ] Implement selector: duyệt NPC content, nối tree.id và npcId, lọc metadata bằng recordedCondition, lấy node gốc. Không lọc lại node.condition; không hardcode Case ID hoặc gọi effects/store.
- [ ] GREEN: chạy lại frontend test; toàn bộ selector assertions pass.
- [ ] Commit: `feat: select discovered notebook people from recorded flags`.

## Task 4: UI People và callbacks learning

**Interfaces:** `NotebookPeoplePanel(props: NotebookPeoplePanelProps): JSX.Element`; props gồm `people: readonly NotebookPerson[]`, `catalogue: readonly VocabularyEntry[]`, `strings: UiStrings`, `translationMode: TranslationMode`, và ba callback `(vocabularyId: string, contextId: string) => void`: onEncounter/onInspect/onRevealTranslation. Parent truyền callbacks hiện có; không cần profile cho VocabularyText.

- [ ] Viết UI schema/SSR tests: `renders only recorded profiles and node text`, `renders status labels from content`, `keeps missing translation absent`, `uses existing empty state`. Assert tên/vai trò/node text đúng source, chưa ghi nhận không có DOM, Beginner chỉ translationVi đã authored, không mode selector/audio replay trong People. Thêm ba keys UiStrings/schema/content: `notebookStatementsHeading` = “Lời khai đã ghi nhận”, `notebookInterviewInProgress` = “Đang phỏng vấn”, `notebookInterviewComplete` = “Đã phỏng vấn xong”. Cập nhật fixture UiStrings typed hiện có cùng task.
- [ ] RED: chạy content/frontend tests không cache, assertion People vẫn empty hoặc thiếu label phải fail trước production change.
- [ ] Implement component hồ sơ semantic headings/list/status chữ và VocabularyText cho từng node được selector cho phép. Context đúng `dialogue:${person.treeId}:${node.id}:text`; chỉ pass text/translationVi/spans/catalogue từ content. Parent thay nhánh empty People bằng component; mode/callbacks giữ nguồn Settings/learning hiện có.
- [ ] CSS chỉ scoped notebook; giữ PaperPanel và fixed/clip/border-box, cho tabs wrap khi năm tab không đủ ngang. Không refactor các tab khác.
- [ ] GREEN: unit frontend/content và typecheck pass; không có string/ID Case hardcode trong UI. Browser ở task 5 kiểm chứng callbacks thật vì SSR không chạy useEffect.
- [ ] Commit: `feat: render recorded people statements in notebook`.

## Task 5: Browser regression và hoàn tất

**Interfaces:** E2E dùng runner hiện có, sceneTestData/journeyHelpers và fixtures save của suite; chọn NPC/choice theo content. Không thêm API debug production hoặc chép progress vào state runtime mới. Một worker khi chạy browser.

- [ ] Viết notebook-people.spec.ts trước chỉnh sửa bổ sung, chạy RED trên baseline People cũ bằng commit/worktree tham chiếu nếu cần; ghi rõ test mới nào fail do empty People, không vì timeout/server.
  - `records partial interview and survives reload`: fresh → mở/đóng Anna chưa hỏi → People empty; hỏi một câu, Tiếp tục → intro/câu đó, status dở; reload giữ đúng subset; hoàn tất câu còn lại → status xong.
  - `keeps branch history and legacy progress`: save fixtures q3/completion/contradiction thiếu flag riêng giữ objectives/facts/evidence, không hiện cả hai nhánh; tiếp tục dialogue nhánh reachable ghi đúng flag; fixture có cả hai recorded flags hiển thị cả hai dù condition cũ false. Assert folder/confession ẩn khi chưa recorded.
  - `reuses vocabulary context without encounter inflation`: ghi số contextsSeen/encounterCount từ profile persisted, mở/đóng People hai lần và reload → không tăng; mở nghĩa bằng click và Enter với context gốc. Node ẩn không ghi encounter. Settings Beginner/Learning/Immersion áp dụng; node thiếu translation không có bản dịch giả; không translation selector trong People.
  - `keeps focus and five tabs visible`: 1280×720 và 760×600, list dài từ flags recorded hợp lệ, Conclusion khả dụng; native Tab/Shift+Tab qua vocabulary/tab/Đóng, Enter mở nghĩa/đóng; focused element nằm trong panel và viewport, document/game-root scrollTop=0, panel có cuộn nội bộ. Kiểm tra chuột chọn People/Conclusion và Đóng.
- [ ] GREEN: `npx nx run @lexicon/game-web:test:e2e -- --workers=1 notebook-people.spec.ts viewport-focus.spec.ts dialogue.spec.ts learning.spec.ts settings.spec.ts journey.spec.ts`. Đối chiếu runner/file paths trước chạy; nếu file Settings thực tế tên khác dùng file hiện có tương ứng và ghi lệnh thực. Không sửa source/content khi browser đang chạy. Chỉ sửa lỗi thuộc scope sau khi xác định root cause, rồi chạy lại nhóm ảnh hưởng.
- [ ] Chạy `npm run lint`, `npm run test`, `npm run build`, `npm run typecheck`, `npm run format`, `npm run memory:check`; dán output vào báo cáo verification, phân biệt fresh/cache và mọi failure/rerun. Không backend nên không dotnet. Bundle advisory hiện có ghi limitation.
- [ ] Dùng skill requesting-code-review để một reviewer độc lập xem toàn bộ diff sau Native implementation; xử lý Critical/Important và chạy lại kiểm tra ảnh hưởng. Không tự dispatch nhiều vòng implementation/review per task.
- [ ] Tự kiểm coverage spec, ghi report nêu file/tests/commands/results/legacy limitation và reviewer findings; commit E2E/report cùng fixes đã verify: `test: verify notebook people progress and focus`.
- [ ] Memory commit kế tiếp dùng SHA result trước; status complete chỉ sau tất cả checks pass. Push dev theo yêu cầu đã lưu sau khi plan thực tế được duyệt và kết quả verified; ghi SHA push trong handoff, không add debug.log.

## Tự review và handoff

Đã đối chiếu spec mục 3–7 với task 1–5: contract/validation, bảng content/timing, selector/history/save cũ, UI/translation/context, browser/focus/DoD đều có owner và test. Năm Review Focus đều có assertions. Interface đầu ra task 3 thống nhất props task 4; task 5 không dựa SSR để chứng minh effects learning.

Chưa triển khai và chưa chạy test sản phẩm cho People. Sau người dùng review file plan này, giữ phương thức Native inline; không hỏi lại phương thức execution.
