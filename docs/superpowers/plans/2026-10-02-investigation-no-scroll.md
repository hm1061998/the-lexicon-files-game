# Kế hoạch triển khai sổ tay và bảng suy luận không cuộn

> **Cho coding agent:** REQUIRED SUB-SKILL: dùng `executing-plans` thực hiện từng task Native inline trên dev theo lựa chọn đã có. Mỗi bước dùng checkbox, RED trước code, GREEN trước commit. Chưa triển khai trước khi người dùng duyệt file plan này.

**Mục tiêu:** hai overlay J/B luôn nằm trọn trong màn hình, đọc được toàn bộ nội dung bằng phân trang, với artwork SVG có chất liệu và hiệu ứng giấy tự nhiên.

**Kiến trúc:** phân trang ở game-web theo phép đo DOM không tương tác, giữ stable ID/offset và vocabulary context. React sở hữu state đọc/lựa chọn; adapter hiệu ứng chỉ trình bày. Notebook dùng mục lục/hồ sơ phân trang, board dùng bốn mặt làm việc; engine, discovery, save và modal routing giữ nguyên.

**Công nghệ:** React18, TypeScript strict, Zustand5, SVG, CSS, Vitest, Playwright, Node22, npm + Nx; khảo sát `page-flip` sau khi plan được duyệt.

**Spec:** `docs/superpowers/specs/2026-10-02-investigation-no-scroll-design.md` (đã duyệt). Baseline: spec01/10 và result8c734b5; không làm lại plan01/10 đã hoàn tất.

## Ràng buộc toàn cục

- Font ≥14px, vùng bấm ≥44×44px; không co toàn bộ UI, không chỉ giấu scrollbar/cắt nội dung. Header/đóng/thao tác chính nằm trong viewport.
- Viewport bắt buộc: 1280×720, 760×600, 390×844, 1280×540, 844×390. Đánh giá chiều cao thực tế, không chỉ breakpoint chiều rộng.
- Notebook đúng4tab; board4mặt Manh mối / Dòng thời gian / Đối chiếu / Kết luận. Giữ discovery/availability/đáp án thuộc engine.
- Palette/typography theo docs/art/06. SVG vật thể riêng; không dùng emoji/icon phẳng/pseudo-element để vẽ ghim/vòng/góc bìa. Trang trí không che chữ hoặc focus.
- Lật giấy450–650ms (chọn550ms); board180–250ms (chọn220ms). prefers-reduced-motion đổi trực tiếp. Một paper cue mỗi lần chuyển hợp lệ, qua audio hiện có.
- Không DOM trong game-core/learning-engine; không đổi transcript flags, Case001, save version, backend hoặc dependency ngoài `page-flip` nếu đạt gate Task4. Không thêm thư viện animation thứ hai.
- Nhãn UI từ game-content/shared-types; không hardcode text/ID case. Giữ legacy David, context vocabulary, Settings mode, evidence review/audio.
- J/B/Esc, native Tab/Shift+Tab, movement lock, một canvas. PageUp/PageDown bỏ qua editable/modifier và chỉ điều khiển tập trang active.
- UI đọc thuộc store đã có, tạm thời, không serialize trong save. Fact pair/event/slot/suspect giữ khi chuyển trang/mặt trong board.
- Chỉ npm + Nx; git add file cụ thể, giữ `apps/game-web/debug.log` untracked. Chưa push; approval People cũ không áp dụng.

## Tập trung review

1. Font/ảnh tải muộn và resize giữa trang: giữ neo ID/offset, không tràn hoặc quay về đầu. Test Task2/8.
2. Một lời khai rất dài có token từ vựng và bản dịch: đọc đủ, context/spans đúng, đo/ẩn không phát learning callback. Test Task1/2/7.
3. Chuyển mặt khi đã chọn dữ kiện/slot/nghi phạm rồi discovery đổi: giữ mục hợp lệ, bỏ mục mất availability, không đoán đáp án. Test Task6.
4. Chuyển liên tục, đóng giữa animation, StrictMode mount/unmount: không kẹt input, listener/DOM sạch, không gọi callback trang ẩn. Test Task4/8.
5. Màn hình thấp844×390 với popover/feedback dài: nội dung tiếp bằng trang, Esc/focus và nút đóng vẫn truy cập được. Test Task7/8.

## Sơ đồ file

| Đơn vị | Đường dẫn | Trách nhiệm |
| --- | --- | --- |
| Nhãn | `packages/shared-types/src/case.ts`, `packages/game-content/src/schema/ui.ts`, `packages/game-content/ui/vi.json` | Copy phân trang/mặt/bước, validate |
| Phân trang | `apps/game-web/src/investigation/pagination/` | Kiểu dữ liệu, ngắt text/span, đo DOM, neo, khung trang và pager |
| Artwork | `apps/game-web/src/investigation/art/` | SVG riêng, component, CSS bố trí/lớp |
| Hiệu ứng | `apps/game-web/src/investigation/pagination/PageTurnSurface.tsx`, `pageFlipAdapter.ts` | Adapter thuần trình bày, lifecycle/reduced-motion |
| Sổ | `apps/game-web/src/notebook/`, `src/state/gameStore.ts`, `src/game/GameCanvas.tsx` | Phân trang4tab, UI reading state tạm thời |
| Board | `apps/game-web/src/deduction/`, `src/conclusion/AccusationPanel.tsx` | Bốn mặt, lựa chọn controlled, các tập giấy |
| Popover | `apps/game-web/src/vocabulary/VocabularyText.tsx`, `InvestigationVocabularyPopover.tsx`, `vocabulary.css` | Popover hữu hạn/phân trang trong investigation |
| Kiểm chứng | `apps/game-web/e2e/investigation-pagination.spec.ts`, các regression hiện có, `docs/ai/` | No-scroll, đầy đủ nội dung, learning/gameplay, ảnh/output |

## Lệnh và môi trường

Đọc AGENTS/root/frontend, memory, spec và reconcile Git trước thực thi. Node22/npm10 có sẵn trong `.superpowers/runtime/node-v22.23.3-win-x64`; không thay Node hệ thống.

```powershell
$env:Path = (Join-Path (Get-Location) '.superpowers/runtime/node-v22.23.3-win-x64') + ';' + $env:Path
$env:NX_DAEMON = 'false'
$investigationNxCli = Join-Path (Get-Location) '.superpowers/runtime/node-v22.23.3-win-x64/node_modules/npm/bin/npx-cli.js'
```

Các lệnh dưới chạy từ root. Wrapper npx.cmd từng lỗi trên máy này nên dùng `node $investigationNxCli nx ...` (vẫn npm/Nx). Test hẹp RED/GREEN theo task, `npm.cmd run typecheck` khi thay TS. Nếu runner không nhận filter, xác minh invocation rồi chạy target test toàn project; không kết luận PASS khi0test.

### Task1: Hợp đồng nhãn và phân mảnh văn bản

**File tạo:** `src/investigation/pagination/pageTypes.ts`, `splitPageText.ts`, `splitPageText.test.ts` trong game-web. **Sửa:** shared-types/case.ts, game-content/schema/ui.ts, ui/vi.json và schema/ui.test.ts.

**Interface xuất:** `PageAnchor = { blockId: string; offset: number }`; `ReaderBlock = { kind:'text'; id:string; text:string; spans:readonly VocabularySpan[]; contextId:string|null } | { kind:'fixed'; id:string }`; `PageFragment = { blockId:string; start:number; end:number; spans:readonly VocabularySpan[] }`; `PageLayout = { pages:readonly (readonly PageFragment[])[] }`. Fixed fragment có start/end0, render theo id. `legalTextBreaks(text:string, spans:readonly VocabularySpan[]): readonly number[]`; `slicePageText(block:Extract<ReaderBlock,{kind:'text'}>, start:number, end:number): {text:string; spans:readonly VocabularySpan[]; contextId:string|null}`. Offset theo UTF16 giống VocabularySpan; các đầu/cuối không chia surrogate pair hoặc span.

- [ ] Viết test `preserves_text_context_and_whole_vocabulary_span`: nối slice bằng đúng text gốc, remap start/end, context gốc; câu dài, newline, emoji, chuỗi không khoảng trắng. Schema test các khóa mới bắt buộc và thiếu key báo lỗi.
- [ ] Chạy RED: `node $investigationNxCli nx run @lexicon/game-web:test -- --run src/investigation/pagination/splitPageText.test.ts` và target game-content:test lọc src/schema/ui.test.ts; phải fail vì export/key mới thiếu.
- [ ] Cài đặt hai hàm và types. Nhãn mới: pagePrevious/pageNext/pagePosition (template `{current}/{total}`), pagePreparing, notebookContents/notebookBackToContents, deductionCluesFace/deductionTimelineFace/deductionCompareFace/deductionConclusionFace, investigationBack/investigationCaseFile/investigationRelations/investigationReadFull/investigationResults, timelineConfirmSelection. Dùng nhãn hiện có nếu cùng nghĩa; định nghĩa template rõ trong type/schema.
- [ ] Chạy GREEN cùng tests và typecheck; kiểm tra schema parse catalogue thật, không thay text/ID gameplay.
- [ ] Commit `feat: define investigation pagination contracts` với đúng file task.

### Task2: Layout trang theo phép đo, pager và neo đọc

**Tạo trong game-web:** `src/investigation/pagination/paginateBlocks.ts`, `useMeasuredPages.ts`, `MeasuredPage.tsx`, `PageControls.tsx`, `pagination.css`, `paginateBlocks.test.ts`, `MeasuredPage.test.tsx`. **Sửa:** `src/investigation/useInvestigationDialogFocus.ts` nếu cần đăng ký tập trang active.

**Dùng:** types/hàm Task1. **Xuất:** `paginateBlocks(blocks:readonly ReaderBlock[], pageHeight:number, measure:(fragment:PageFragment)=>number): PageLayout`; `pageForAnchor(layout:PageLayout, anchor:PageAnchor): number`; `useMeasuredPages({blocks, viewportRef, measureRef, revision, anchor})` trả `{layout, pageIndex, ready, goToPage(index:number):void}`; `MeasuredPage` nhận blocks, anchor, onAnchorChange, renderFragment, renderMeasurement, strings và controlsLabel. `PageControls` nhận index/count/label/strings/onChange; controls bên ngoài vùng đo, không chen chiều cao khi đổi trang.

- [ ] Viết RED: mỗi fragment vừa pageHeight, toàn bộ text/fixed items có mặt theo thứ tự; text dài ngắt không chia span; empty state; `pageForAnchor` giữ cùng block/offset sau width change. DOM test đo không gọi encounter/inspect/reveal, trang ẩn không focus, pager clamp đầu/cuối. Fixture đo mock deterministic, browser ở Task8 chứng minh kích thước thật.
- [ ] Chạy RED target game-web:test lọc src/investigation/pagination.
- [ ] Implement packing theo measure DOM: binary search legal breaks cho text quá dài; không dùng ký tự cố định. Fixed item phải có renderer compact hữu hạn; item quá cao được chuyển thành text blocks/ảnh riêng ở consumer, không clip im lặng. Phép đo không interactive, cùng font/width/style, chờ document.fonts.ready/ảnh decode, ResizeObserver invalidation; zero-size chưa ready. Đóng popover trước đổi trang, giữ neo reflow, tránh vòng lặp observer. PageUp/PageDown đăng ký chỉ tập đang active; editable/modifier/popover guard.
- [ ] Chạy GREEN và typecheck; test font/ảnh load muộn invalidates đúng1layout, không reset neo. Empty content render thông báo trong trang, không giả total0 gây NaN.
- [ ] Commit `feat: paginate investigation reading surfaces`.

### Task3: Bộ SVG vật thể và bố trí lớp

**Tạo trong game-web:** `src/investigation/art/pushpin-brass.svg`, `pushpin-dark.svg`, `binder-ring.svg`, `notebook-corner.svg`, `paper-clip.svg`, `InvestigationDecoration.tsx`, `decoration.css`. **Tạo test:** `InvestigationDecoration.test.tsx`; browser screenshot coverage ở Task8.

**Interface:** `InvestigationDecoration({kind:'pushpin'|'ring'|'corner'|'clip', variant?:'brass'|'dark', className?:string}):JSX.Element`. Dùng SVG file qua img decorative alt="", aria-hidden, pointer-events:none, viewBox giữ tỷ lệ; không external refs hoặc global defs ID giữa instance. Vòng có phần sau/trước qua hai layer wrapper nếu cần, vẫn dùng artwork SVG.

- [ ] Viết RED render safety: không focusable, không intercept pointer, tất cả asset resolve, SVG không script/external resource, nhiều instance không xung đột; test kiểm tra cấu trúc không thay visual QA.
- [ ] Chạy RED target game-web:test lọc InvestigationDecoration.test.tsx.
- [ ] Vẽ SVG path/gradient/clip/bóng tiếp xúc/nét mòn nhẹ theo ảnh và palette. Ghim có khối đầu/thân kim, vòng cong kim loại/lỗ giấy, góc bìa nhiều lớp; giữ vật thể kích thước ổn định khi resize. Không thêm portrait hoặc dependency.
- [ ] Chạy GREEN/typecheck; preview ở kích thước thật và hai scale, xem ảnh để sửa độ dày nét/highlight/bóng trước commit. Gắn vào consumer ở Task5/6, không coi tồn tại SVG là hoàn tất hình ảnh.
- [ ] Commit `feat: add illustrated SVG investigation decorations`.

### Task4: Adapter lật giấy và quyết định thư viện

**Tạo trong game-web:** `src/investigation/pagination/pageFlipAdapter.ts`, `PageTurnSurface.tsx`, `PageTurnSurface.test.tsx`; **sửa:** pagination.css, package.json workspace và package-lock.json chỉ nếu tích hợp library đạt gate. **Tạo browser test trong:** e2e/investigation-pagination.spec.ts.

**Interface:** `PageTurnSurface({pageKey:string, direction:'forward'|'backward', children:ReactNode, onTurnComplete:()=>void, onPaperCue:()=>void}):JSX.Element`; `createPageFlipAdapter(host:HTMLElement, reducedMotion:boolean): { turn(direction:'forward'|'backward', done:()=>void):void; resize(width:number,height:number):void; destroy():void }`. Không làm chủ lựa chọn/trang nội dung; onPaperCue chỉ khi pageKey thực sự đổi do điều hướng, không lúc reflow/initial render.

- [ ] Viết RED: đổi pageKey550ms→complete1lần/cue1lần; reduced-motion không animate; rapid requests giữ trang cuối, close/unmount hủy callbacks; StrictMode cleanup, nội dung tương tác chỉ1instance, hidden callbacks0. Browser kiểm click vocabulary/nút, Tab và resize trong khi lật.
- [ ] Chạy RED unit target game-web:test và browser hẹp `node $investigationNxCli nx run @lexicon/game-web:test:e2e -- investigation-pagination.spec.ts -g "page turn adapter" --workers=1`.
- [ ] Khảo sát API/source chính thức và `npm.cmd view page-flip version license dist.unpackedSize` trước `npm.cmd install page-flip -w @lexicon/game-web`. Tích hợp lớp visual decor không mount live VocabularyText hai lần; semantic content React giữ một owner. Thử550ms, shadow cục bộ, chỉ góc giấy là gesture target. Adapter wrapper cleanup host riêng, không để destroy xóa root React. Gáy/bìa/vòng ở lớp cố định. Nếu gate fail do DOM ownership/focus/callback/resize, gỡ package bằng npm, dùng SVG/CSS transform550ms qua cùng interface, ghi giới hạn; không để dependency không dùng.
- [ ] GREEN tất cả gate, typecheck, browser; ghi quyết định library+evidence vào report nháp, không tự nhận page curl nếu chỉ rigid transform. Chỉ1paper cue khi turn hợp lệ; rapid navigation không chồng âm.
- [ ] Commit `feat: animate investigation paper page turns`.

### Task5: Sổ tay bốn tab không cuộn

**Sửa:** game-web/src/notebook/NotebookPanel.tsx, NotebookPeoplePanel.tsx, NotebookEvidencePage.tsx, NotebookVocabularyPage.tsx, NotebookTimelinePage.tsx, notebook.css, src/investigation/RecordedStatements.tsx, src/state/gameStore.ts, src/game/GameCanvas.tsx. **Tạo:** `src/notebook/notebookReadingState.ts`, `buildNotebookBlocks.ts`, `notebookReadingState.test.ts`. **Tests sửa/thêm:** NotebookPanel.test.tsx, NotebookPeoplePanel.test.tsx, gameStore.test.ts, e2e/notebook-people.spec.ts và investigation-pagination.spec.ts.

**Dùng:** Task1–4. **Xuất:** `NotebookReadingState = {caseId:string; tabs:Record<NotebookTab,{selectedId:string|null; view:'contents'|'detail'; contentsAnchor:PageAnchor|null; detailAnchor:PageAnchor|null}>}`; `createNotebookReadingState(caseId:string):NotebookReadingState`. Store có notebookReading và `setNotebookReading(reading:NotebookReadingState):void`, giữ cùng case qua close/tab, reset khi case thay; không serialize. NotebookPanel nhận reading/onReadingChange/onPaperCue thêm vào props hiện có.

- [ ] RED unit: chọn người/evidence/từ mở hồ sơ trang1, tab/mở lại giữ lựa chọn/neo, mode đổi reset reveal đúng, discovery stale clamp, case mới reset; snapshot save không thêm notebookReading. Browser:4tab dài đọc đủ qua trang,390 một trang có Back,760/1280 layout theo chiều cao, không scroll.
- [ ] Chạy RED targets game-web:test lọc src/notebook và gameStore.test.ts, browser hẹp "notebook paginated".
- [ ] Implement builders chuyển view/catalogue thành text/fixed blocks có stable ID, tách ảnh/header/statement/translation/sources thành trang hữu hạn. Hai trang khi fit, một trang mục lục hoặc chi tiết khi không fit; đo thực tế nội dung. Chỉ fragment visible render VocabularyText với context/spans gốc. RecordedStatements nhận các fragment đã chọn khi trong trang, giữ API mặc định cho consumer chưa đổi. Cập nhật UI reading qua store, không duplicate selectedId ở child. Thay CSS scroll và giả vòng/góc bằng SVGTask3, nội dung chữ không đặt trong SVG.
- [ ] GREEN units/typecheck/browser, legacy transcript, evidence review và learning modes; verify không phát callback cho phần đo/statement chưa đọc. Kiểm selected portrait không bị cắt đầu, ring layer đúng trong lúc lật.
- [ ] Commit `feat: turn notebook reading into paginated game UI`.

### Task6: Bảng ghim bốn mặt và lựa chọn controlled

**Sửa:** game-web/src/deduction/DeductionBoard.tsx, TimelineWorkspace.tsx, ContradictionWorkspace.tsx, DeductionConnections.tsx, deduction.css, src/conclusion/AccusationPanel.tsx. **Tạo:** `src/deduction/deductionUiReducer.ts`, `DeductionCluesFace.tsx`, `DeductionCaseFile.tsx`, `deductionUiReducer.test.ts`. **Tests:** DeductionBoard.test.tsx, DeductionConnections.test.ts, AccusationPanel.test.tsx và e2e/timeline.spec.ts/notebook-deduction.spec.ts/investigation-pagination.spec.ts.

**Interface:** `DeductionFace='clues'|'timeline'|'compare'|'conclusion'`; board owner giữ `{face, selectedNode:string|null, selectedFactIds:readonly string[], eventId:string|null, slotId:string|null, suspectId:string|null, feedback:string, anchors:Record<string,PageAnchor|null>}`. Reducer actions selectFace/selectNode/toggleFact/selectEvent/selectSlot/selectSuspect/setFeedback/clearFacts/reconcile (payload valid IDs). Workspace nhận selection/onSelectionChange controlled; không còn local duplicate selections. Callback engine signatures giữ nguyên.

- [ ] RED reducer/render: factpair giữ qua mặt/trang, tối đa2, event/slot/suspect giữ, reconcile chỉ drop invalid, sai không reset; confirmed-only explanations, conclusion availability; dây chỉ nối visible authored endpoints, quan hệ khác vẫn có tập đọc. Browser chọn fact trên2trang và event→slot→confirm.
- [ ] Chạy RED target game-web:test lọc src/deduction src/conclusion; E2E hẹp "board paginated" và timeline.spec.ts.
- [ ] Implement board face navigation220ms, frame cố định. Clues/card grid/casefile/detail/relations dùng MeasuredPage, three-zone chỉ khi đủ diện tích; không xếp dọc tất cả face. Timeline có bước event/slot/confirm + recorded view; compare có khay2mục/submit/clear fixed, full text/result paginated; conclusion controlled chooser. Dùng SVG ghim/clip, không ghim trang trí toàn màu đỏ. DeductionConnections theo visible page bounds, không scroll offset dependence mới. Chưa mount workspace inactive, state ở owner vẫn giữ.
- [ ] GREEN reducer/component/browser/typecheck; wrong→right engine, objective unlock/accuse/reload. Discovery đổi trong khi board mở test không lộ hidden data. Không đưa correctSuspectNpcId/slotId đáp án/factpair đúng vào UI.
- [ ] Commit `feat: organize deduction board into fixed paginated faces`.

### Task7: Popover hữu hạn, focus và âm giấy

**Tạo:** game-web/src/vocabulary/InvestigationVocabularyPopover.tsx, InvestigationVocabularyPopover.test.tsx. **Sửa:** VocabularyText.tsx/vocabulary.css, pagination/PageControls.tsx, investigation/useInvestigationDialogFocus.ts, game/GameCanvas.tsx, bridge/connectPresentationAudio.test.ts nếu cần kiểm cue.

**Interface:** VocabularyText thêm `presentation?:'default'|'investigation'`, default giữ luồng dialogue/evidence ngoài scope. InvestigationVocabularyPopover nhận entry/mode/strings/contextId/revealed/onReveal/onClose/anchorRect; render nội dung theo MeasuredPage và giữ cùng popup ID. GameCanvas cung cấp onPaperCue từ typed bus `audio:cue` đã có; không tạo audio singleton/eventbus mới.

- [ ] RED: long definition/example/synonyms/tutorial/translation844×390 đều có trang tiếp không tràn; Learning reveal đúng1lần contextgốc, Immersion không reveal, mode đổi reset; measurement callbacks0, only visible fragments encounter. Esc trả focus về token rồi mới đóngoverlay; PageUp khi popup mở chỉ đổi popup.
- [ ] Chạy RED target game-web:test lọc InvestigationVocabularyPopover.test.tsx và focus/audio tests; browser hẹp "popover no scroll".
- [ ] Implement bounded popup trong viewport và scope modal, measured read pages/actions fixed; đóng trước page navigation. Không portal ra ngoài focus trap trừ khi hook scope được cập nhật/test tương ứng. Chuẩn hóa PageUp guards/active pager. Page turn callbacks vào bus cue dùng audioSettings, giữ1cue atomic J/B cũ và không thêm cue initial render/reflow/boundary press.
- [ ] GREEN units/typecheck/browser; dialogue/learning/settings regressions mặc định vẫn pass, một canvas và inputLocked khi overlay. Check ảnh popup ở5viewport.
- [ ] Commit `feat: keep investigation vocabulary and controls within viewport`.

### Task8: Browser acceptance, review và handoff

**Tạo/sửa:** e2e/investigation-pagination.spec.ts, e2e/investigationFixture.ts (fixture dài chỉ test), notebook-deduction/notebook-people/timeline/journey/viewport-focus/learning/settings/dialogue specs, `docs/ai/2026-10-02-investigation-pagination-verification.md`, `docs/ai/playtests/2026-10-02-investigation-pagination/`, spec/plan trạng thái và docs/ai/MEMORY.md.

**Interface kiểm chứng:** helper `expectNoInvestigationScroll(page:Page, dialog:Locator):Promise<void>` đo text/control bounds và scroll offsets trước/sau wheel/touch/focus; không chỉ kiểm scrollbar CSS. Fixture dùng content derived trong test, không sửa runtimeCase001. Trang đo/animation decorative được loại khỏi semantic bounds nhưng phải nằm trong khung effect clipping.

- [ ] RED browser test matrix5viewport cho4tab+4face, fixture dài nhiều trang, một đoạn quá trang, translation sources. Duyệt các trang và nối text fragments theo offsets bằng text gốc; ảnh load chậm/font ready, resize khi đang đọc, reduced-motion, turn nhanh rồi close, keyboard/native focus, runtime discovery/legacy/save/reload. Fixture ảnh missing và text unbroken không làm trắng màn hình.
- [ ] Chạy RED hẹp các case mới để chứng minh từng acceptance chưa đạt; nếu task trước đã GREEN, không cố gây lỗi giả. Với failure thật dùng systematic-debugging trước sửa.
- [ ] Sửa lỗi có bằng chứng và chụp/xem ảnh actual5viewport cho4tab+4face, popup, long text và ảnh trong lúc page turn (layer). Kiểm1canvas, no encounter khi đo/ẩn. Một final reviewer độc lập theo executing-plans, read-only, có base/end/spec/plan/report; xử lý findings và ghi mọi ruling/cost. Không tự dispatch nhiều implementer vì đã chọn inline.
- [ ] Chạy `npm.cmd run lint`, `npm.cmd run test`, `npm.cmd run build`, `npm.cmd run typecheck`; chạy nhóm browser bằng `node $investigationNxCli nx run @lexicon/game-web:test:e2e -- investigation-pagination.spec.ts notebook-deduction.spec.ts notebook-people.spec.ts timeline.spec.ts journey.spec.ts viewport-focus.spec.ts learning.spec.ts settings.spec.ts dialogue.spec.ts --workers=1`. Lưu raw output, số tests/project/browser thực tế, ảnh và limitationlibrary/buildwarning. Không coi full suite toàn repo nếu chỉ chạy nhóm này. Không backendchange nên không dotnet.
- [ ] Khi tất cả acceptance pass, tick plan/spec implemented, commit result code/tests/report/ảnh; sau đó cập nhật memory với result_commit vừa tạo, chạy `npm.cmd run memory:check`, commit memory riêng. Giữ dev local, debug.log untracked; báo kết quả và hạn chế, không push nếu chưa có yêu cầu.

## Self-review và trạng thái

- Coverage: spec§3→Task2/5/6/7/8; §4→5; §5→6; §6→1/2/5/7; §7→4/7; §8→3/5/6/8; §9→tất cả; §10→8 và tests theo từng task.
- Types: PageAnchor/ReaderBlock/PageFragment/PageLayout ởTask1; consumer dùng cùng types. Controlled selection và UI reading chỉ một owner, không đổi game state boundary.
- Review focus5mục đều có test/task. Không còn placeholder hoặc bước thay thế bằng “handle edge cases”. Dependency quyết định theo gate có fallback cụ thể trong spec, không cài trước approval.
- Trạng thái: đã duyệt và thực thi Native inline trên dev (Task 1–8). Một review độc lập đã xử lý findings; chạy lại nhóm E2E 61/61. Kết quả, giới hạn và phần còn treo: `docs/ai/2026-10-02-investigation-pagination-verification.md`.
