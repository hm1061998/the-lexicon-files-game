# Kế hoạch triển khai sổ tay và bảng suy luận riêng

> **Cho coding agent:** dùng skill `executing-plans` để thực hiện từng task inline. Mỗi bước có checkbox; viết test RED trước code, kiểm tra GREEN và commit theo task. Chưa triển khai trước khi người dùng duyệt file plan.

**Mục tiêu:** biến sổ tay thành quyển sổ ghi chép bốn tab và tạo bảng suy luận riêng cho dòng thời gian, mâu thuẫn, kết luận theo hai ảnh đã duyệt.

**Kiến trúc:** selectors thuần dựng view từ `CaseDefinition`, `GameState`, `LanguageProfile`; React giữ lựa chọn thẻ tạm thời. Zustand giữ hai cờ modal loại trừ nhau và bọc ba reducer game-core hiện có. GameCanvas chỉ gắn hai layer, không remount canvas; cả hai modal chia sẻ vòng đời focus.

**Công nghệ:** React 18, TypeScript strict, Zustand 5, Vitest, Playwright/Chromium, CSS, npm + Nx, Node 22.

**Spec:** `docs/superpowers/specs/2026-10-01-notebook-deduction-ui-design.md` (đã được người dùng duyệt).

## Ràng buộc toàn cục

- Chỉ npm + Nx; không dependency, backend, thay save version hoặc chỉnh rules/content Case #001.
- Palette/art theo `docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md`; đỏ `#A4412D` / `#743026` chỉ cho clue/evidence/objective/contradiction/selected node/map marker.
- Text hiển thị từ `UiStrings` hoặc content. Tối thiểu 14px, nút 44 × 44px, focus visible, native Tab/Shift+Tab. Shortcut bỏ qua input/textarea/contenteditable và modifier keys.
- Chỉ nội dung đã khám phá. Không dùng `correctSuspectNpcId`, `TimelineEventDefinition.slotId`, `ContradictionDefinition.factIds` để hiển thị đáp án trước khi engine xác nhận.
- `debug.log` untracked phải được giữ; `git add` đường dẫn cụ thể. Native inline trên `dev` theo preference đã có.
- Mỗi task chạy test hẹp và `npm run typecheck` khi sửa TS; cuối gói chạy đầy đủ `npm run lint`, `npm run test`, `npm run build` và lưu output.
- PowerShell đặt `Path` đầu tiên tới `.superpowers/runtime/node-v22.23.3-win-x64`, `NX_DAEMON=false`, dùng `npm.cmd`/`npx.cmd` nếu Node hệ thống vẫn thiếu npm. Không cần cài dependency.

## Tập trung review

1. Save cũ David thiếu cờ nhánh answer3: không bịa lời khai khi chọn hồ sơ; test E2E fixture legacy ở Task 7.
2. Evidence collected nhưng không có `image`/NPC artwork không resolve: vẫn có nhãn, mô tả và nút xem lại; test selector Task 2 và render Task 4.
3. Context từ vựng malformed/stale: ẩn nhãn nguồn kỹ thuật, không mất từ hay progress; test Task 2 và Task 4.
4. Mở/chuyển modal khi dialogue/evidence/pause/case closed: không mở sai, không unlock movement hoặc remount canvas; test Task 3 và Task 7.
5. Dữ kiện vừa được mở khóa khi board đang mở: danh sách facts/edges cập nhật, không lộ fact cũ chưa mở; test selector Task 2 và browser Task 7.

## Sơ đồ file và ranh giới

| Đơn vị | File | Trách nhiệm |
| --- | --- | --- |
| Nhãn UI | `packages/shared-types/src/case.ts`, `packages/game-content/src/schema/ui.ts`, `packages/game-content/ui/vi.json` | Khóa/validate copy hai công cụ |
| Dữ liệu trình bày | `apps/game-web/src/investigation/selectInvestigationView.ts`, `resolveInvestigationArtwork.ts`, `resolveVocabularySources.ts` | Derived view, ảnh generic, nhãn context; không state mới |
| Modal | `apps/game-web/src/state/gameStore.ts`, `apps/game-web/src/investigation/useInvestigationDialogFocus.ts`, `apps/game-web/src/deduction/useDeductionShortcut.ts`, các shortcut hiện có | Loại trừ nhau, lock input, phím và focus |
| Sổ tay | `apps/game-web/src/notebook/NotebookPanel.tsx`, `NotebookPeoplePanel.tsx`, `NotebookEvidencePage.tsx`, `NotebookVocabularyPage.tsx`, `NotebookTimelinePage.tsx`, `notebook.css` | Bốn trang và layout sách |
| Bảng suy luận | `apps/game-web/src/deduction/DeductionBoard.tsx`, `TimelineWorkspace.tsx`, `ContradictionWorkspace.tsx`, `DeductionConnections.tsx`, `deduction.css` | Board và ba thao tác game-core qua callbacks |
| Tích hợp | `apps/game-web/src/game/GameCanvas.tsx`, `hud/KeyHints.tsx`, `pause/usePauseShortcut.ts`, `bridge/connectPresentationAudio.ts` | Gắn layer, nút chuyển, Esc và cue giấy |
| Regression | Tests tương ứng trong `src/**`, `apps/game-web/e2e/notebook-people.spec.ts`, `timeline.spec.ts`, `journey.spec.ts`, `viewport-focus.spec.ts`, file E2E mới | Hành vi + layout thật |

## Task 1: Nhãn và copy hai công cụ

**File:** sửa `packages/shared-types/src/case.ts`, `packages/game-content/src/schema/ui.ts`, `packages/game-content/ui/vi.json`, tests `packages/game-content/src/schema/ui.test.ts`.

**Interface:** thêm đúng các `UiStrings` keys `deductionBoard`, `openDeductionBoard`, `openNotebookFromBoard`, `notebookPeopleHeading`, `notebookEvidenceHeading`, `notebookVocabularyHeading`, `notebookVocabularyExamples`, `notebookVocabularySources`, `notebookRelatedPeople`, `deductionFactsHeading`, `deductionCluesHeading`, `deductionInstructions`, `deductionClearSelection`, `deductionRelationships`, `vocabularyStageUnknown`, `vocabularyStageRecognized`, `vocabularyStageUnderstood`, `vocabularyStageUsed`, `vocabularyStageMastered`. Dùng keys cũ cho Close, mode, timeline, contradiction, conclusion, evidence review và stage seen. Copy tiếng Việt không tự hứa kéo thả/xóa graph/âm thanh từ.

- [x] Viết test `loadUiStrings('vi')` trả đủ các key trên có nội dung và giữ nguyên feedback lỗi hiện có; test schema thiếu một key mới báo lỗi đọc được.
- [x] Chạy `npx nx run @lexicon/game-content:test -- --run src/schema/ui.test.ts`; quan sát RED do key chưa có.
- [x] Thêm type/schema/content đúng danh sách; không hardcode Case #001 trong React.
- [x] Chạy lại test trên và `npm run typecheck`; ghi GREEN.
- [x] Commit riêng `feat: add notebook and deduction UI labels` bằng `git add` đúng bốn file.

## Task 2: Derived view, ảnh và nguồn từ vựng

**File:** tạo `apps/game-web/src/investigation/selectInvestigationView.ts`, `resolveInvestigationArtwork.ts`, `resolveVocabularySources.ts` và tests cùng tên `.test.ts`.

**Interface:** `selectInvestigationView(definition: CaseDefinition, state: GameState): InvestigationView` trả các mảng readonly `people`, `evidence`, `facts`, `availableEvents`, `placedEvents`, `availableContradictions`, `confirmedContradictions`, `relationships`, cùng `conclusionAvailable` và `suspects`. `people` dùng `selectNotebookPeople`; evidence/facts/relationships chỉ có nguồn đã khám phá. `availableEvents` chỉ gồm `id,text,location,source,confidence` (không có `slotId`); `placedEvents` gồm `id,text,location,source,time`, sắp theo slot authored. `availableContradictions` chỉ gồm id để dispatch, còn `confirmedContradictions` gồm explanation để render sau xác nhận. `resolveInvestigationArtwork(definition: CaseDefinition, npcId: string): string | undefined` từ `characterSheets[npcId].idle.SW` → `sharedTextures`/scene textures có URL, bỏ texture key thiếu hoặc spritesheet. `resolveVocabularySources(definition: CaseDefinition, contextIds: readonly string[]): readonly string[]` map context `evidence:<id>:description` sang evidence name và `dialogue:<treeId>:<nodeId>:text` sang NPC name; bỏ id không resolve và loại trùng nhãn.

- [x] Viết test literal: state ban đầu không thấy Anna/Leo/David/fact ẩn; `anna_q1_read` chỉ cho lời khai Anna; thu thập `meeting_minutes` cho evidence/source liên quan hợp lệ; đặt `report_missing_21_05` cho hàng `21:05`; không lộ giờ của event khả dụng chưa đặt trong placedEvents. Test artwork từ manifest và fallback không có ảnh; context stale bị bỏ nhưng context hợp lệ có nhãn nguồn; thêm fact mới vào state sinh relationship tương ứng.
- [x] Chạy `npx nx run @lexicon/game-web:test -- --run src/investigation`; quan sát RED do selector chưa tồn tại.
- [x] Implement selector thuần, `readonly` và không sửa input. Dây nối có id đầu/cuối và quan hệ authored; không suy ra guilty/correctness. Sắp xếp theo content, không sort ID.
- [x] Chạy lại test và `npm run typecheck`; ghi GREEN.
- [x] Commit `feat: derive notebook and deduction views` đúng file mới.

## Task 3: Vòng đời modal và shortcut

**File:** sửa `apps/game-web/src/state/gameStore.ts`/`.test.ts`, `apps/game-web/src/notebook/useNotebookShortcut.ts`/test, `apps/game-web/src/pause/usePauseShortcut.ts`/test; tạo `apps/game-web/src/deduction/useDeductionShortcut.ts`/test và `apps/game-web/src/investigation/useInvestigationDialogFocus.ts`. Bài browser focus bổ sung Task 7.

**Interface:** store thêm `deductionOpen: boolean`, `toggleDeduction(): void`, `openDeduction(): void`, `closeDeduction(): void`, `openNotebook(): void`. `toggleNotebook()` giữ hành vi J nhưng có thể chuyển từ board sang notebook nguyên tử; `toggleDeduction()` tương tự với B. `inputLocked` tính cả hai. `handleDeductionShortcut(store,event)` dùng `shouldHandleShortcut(event,'b')`; `handleEscapeShortcut` ưu tiên dialogue → evidence → notebook → deduction → pause. Hook focus `useInvestigationDialogFocus(ref: RefObject<HTMLElement>): void` lấy control đầu, trap Tab trong dialog, restore previous/canvas focus trên cleanup, bỏ hidden/disabled/negative tabindex như notebook cũ.

- [x] Viết tests: B mở board và khóa movement, J chuyển board→notebook, B chuyển notebook→board, Escape đóng board trước Pause, editables/modifiers không trigger; pause/evidence/dialogue/closed-case chặn mở; reviewEvidence đóng modal; correct accusation đóng cả hai, wrong giữ state; `setNotebookTab` vẫn giữ legacy union ở task này để code cũ compile.
- [x] Chạy `npx nx run @lexicon/game-web:test -- --run src/state/gameStore.test.ts src/notebook/useNotebookShortcut.test.ts src/deduction/useDeductionShortcut.test.ts`; quan sát RED do board actions/handler vắng.
- [x] Implement store/shortcut/escape; sửa `submitAccusation` success set cả hai false. Không đưa UI selection vào persistence. Extract focus hook từ logic NotebookPanel hiện có, consumer board gắn ở Task 5.
- [x] Chạy lại tests, `npm run typecheck` và test pause; ghi GREEN.
- [x] Commit `feat: route notebook and deduction overlays` đúng file liên quan.

## Task 4: Quyển sổ bốn trang

**File:** sửa `apps/game-web/src/notebook/NotebookPanel.tsx`, `NotebookPeoplePanel.tsx`, `notebook.css`, tests của hai component; tạo `NotebookEvidencePage.tsx`, `NotebookVocabularyPage.tsx`, `NotebookTimelinePage.tsx`, `apps/game-web/src/investigation/RecordedStatements.tsx` khi chia lời khai chung. Sửa `NotebookTab` trong `gameStore.ts`, những test unit store có lựa chọn `conclusion` cũ, và cập nhật props caller trong `apps/game-web/src/game/GameCanvas.tsx` để typecheck. Board layer chưa gắn tới Task 6.

**Interface:** `NotebookPanel` giữ props caseDefinition/caseState/profile/mode/callbacks learning/review evidence, thêm `onOpenDeduction(): void`; bỏ props `onPlaceTimelineEvent`, `onSubmitContradiction`, `onSubmitAccusation`. `NotebookPeoplePanel` nhận hồ sơ chọn từ parent hoặc giữ selected state bên trong; chỉ render lời khai một người tại một thời điểm. `NotebookEvidencePage` chọn evidence chỉ từ discovered; `NotebookVocabularyPage` chọn vocabulary từ profile; `NotebookTimelinePage` chỉ nhận placedEvents. UI selection là local state; invalid selection fallback mục đầu hợp lệ, không phát case action. Đổi `NotebookTab` thành `'people' | 'evidence' | 'vocabulary' | 'timeline'` sau khi cập nhật mọi unit caller.

- [x] Viết render tests: notebook bốn tab, không nút submit contradiction/accusation/timelinePlace; chỉ người được chọn có lời khai VocabularyText và context gốc; evidence ảnh/mô tả/review button và người liên quan chỉ khi đã khám phá; evidence/NPC thiếu ảnh vẫn có tên và mô tả; word hiển thị stage và nguồn authored, fallback stale context; timeline chỉ event đã đặt và time authored. Viết E2E ngắn chọn qua các thẻ, đổi mode/reveal, giữ progress không đổi; chạy RED trước code.
- [x] Chạy unit bằng `npx nx run @lexicon/game-web:test -- --run src/notebook`, E2E mới chỉ lọc test notebook bằng `npx nx run @lexicon/game-web:test:e2e -- notebook-deduction.spec.ts -g "notebook"`; xác nhận RED đúng hành vi còn thiếu.
- [x] Tạo component nhỏ, giao diện sách hai trang CSS responsive, avatar generic từ Task 2. `VocabularyText` chỉ mount trang chi tiết đã chọn; key reveal theo selected vocabulary id và reset khi đổi mode. Giữ click-only tooltip.
- [x] Chạy unit, E2E hẹp và `npm run typecheck`; ghi GREEN. Các E2E cũ còn tham chiếu năm tab/board cũ chuyển ở Task 7.
- [x] Commit `feat: render four-page investigation notebook` đúng file sổ tay, shared statement view, test mới.

## Task 5: Bảng suy luận riêng

**File:** tạo `apps/game-web/src/deduction/DeductionBoard.tsx`, `TimelineWorkspace.tsx`, `ContradictionWorkspace.tsx`, `DeductionConnections.tsx`, `deduction.css` và tests `DeductionBoard.test.tsx`, `DeductionConnections.test.ts`; reuse `apps/game-web/src/conclusion/AccusationPanel.tsx`.

**Interface:** `DeductionBoard({caseDefinition,caseState,strings,onClose,onOpenNotebook,onPlaceTimelineEvent,onSubmitContradiction,onSubmitAccusation,onReviewEvidence})` dùng `selectInvestigationView` của Task 2. `TimelineWorkspace` giữ action state event/slot và feedback; `ContradictionWorkspace` giữ tối đa hai factIds, gọi `(contradictionId,factIds)` đúng engine, clear chỉ UI selection. `DeductionConnections` nhận `relationships` + ref surface, vẽ SVG không nhận pointer events; text danh sách quan hệ có cùng tên nguồn cho a11y. AccusationPanel chỉ mount khi conclusionAvailable.

- [x] Viết render tests: facts ẩn không có; chưa active không có submit conclusion; confirmed contradiction mới hiện explanation; facts/slot chưa chọn không lộ đáp án. Viết E2E tương tác board (keyboard chọn cặp và bấm Suy luận, `saved.state` chỉ đổi khi engine trả correct) trước khi board mount; lượt browser RED ở Task 6.
- [x] Chạy `npx nx run @lexicon/game-web:test -- --run src/deduction`; quan sát RED do board chưa tồn tại. Chạy browser hẹp mới và ghi RED do board chưa mount.
- [x] Implement board ba vùng, card/chi tiết, chọn facts, workspace timeline/contradiction, conclusion. Tái dùng feedback/hint hiện có. SVG nối theo selector, đo vị trí khi layout/scroll thay đổi; nếu API ResizeObserver không có, vẫn giữ danh sách relation chữ, không crash. Đừng vẽ nối ngẫu nhiên.
- [x] Chạy lại unit và `npm run typecheck`; ghi GREEN. E2E board GREEN sau khi Task 6 gắn layer.
- [x] Commit `feat: add separate deduction board` đúng file board/tests.

## Task 6: Gắn board vào game, HUD, Esc và audio

**File:** sửa `apps/game-web/src/game/GameCanvas.tsx`, `apps/game-web/src/hud/KeyHints.tsx`/test, `apps/game-web/src/bridge/connectPresentationAudio.ts`/test và `apps/game-web/src/pause/usePauseShortcut.ts` nếu popover interaction cần. Thêm E2E giao diện mới vào `apps/game-web/e2e/notebook-deduction.spec.ts`.

**Interface:** `DeductionLayer` đọc store/selectors, nối callbacks game-core y như NotebookLayer cũ; gọi `useDeductionShortcut(store)` một lần; HUD nút B; notebook header `onOpenDeduction`, board header `onOpenNotebook`; `connectPresentationAudio` phát cue `paper` cho đổi trạng thái board, không double-play khi chuyển overlay. Escape popover đang dùng capture listener và `stopPropagation`; kiểm tra cẩn thận để window handler không nhận cùng event đã dùng cho popover.

- [x] Viết E2E mở/đóng B qua HUD/phím, chuyển J/B giữa modal, Esc khi popover đang mở, focus/restore, một canvas, không autosave chỉ vì mở modal; board chọn cặp facts sai/đúng và đặt timeline event vẫn dispatch game-core; resize board giữ thẻ/nhãn quan hệ đọc được. Test audio bridge một cue cho một hành động. Quan sát RED trước tích hợp.
- [x] Gắn layer/shortcut/HUD/cue; tránh tạo store hoặc Phaser game mới khi modal thay đổi. Khi chuyển modal, focus cũ được thay bằng focus mới; Esc không bật pause ở cùng event.
- [x] Chạy unit HUD/audio/store và E2E mới; `npm run typecheck`; ghi GREEN.
- [x] Commit `feat: connect deduction board to game UI` đúng file tích hợp/tests.

## Task 7: Browser regression, visual QA, DoD và bàn giao

**File:** sửa `apps/game-web/e2e/notebook-people.spec.ts`, `timeline.spec.ts`, `journey.spec.ts`, `viewport-focus.spec.ts` và những test unit/fixture bị ảnh hưởng bởi UI mới. Tạo `docs/ai/2026-10-01-notebook-deduction-verification.md` và ảnh trong `docs/ai/playtests/2026-10-01-notebook-deduction/`. Cập nhật checkbox plan sau khi pass.

**Interface:** E2E mở bảng bằng B/HUD; mọi lựa chọn timeline/contradiction/conclusion qua board. Các assertion state/feedback/legacy giữ nguyên ý nghĩa; notebook tests đổi năm thành bốn tab và chọn đúng hồ sơ trước khi đọc lời khai. Tránh screenshot cố định là bằng chứng duy nhất: assert kích thước vùng, overflow, focus, nhãn và behavior.

- [x] Cập nhật E2E trước sửa integration bất kỳ còn thiếu, chạy để quan sát RED của luồng cũ. Giữ kiểm chứng save cũ/branch David, wrong→retry, closed/reload, Settings/learning callbacks.
- [x] Sửa test selectors cho hai giao diện; không làm yếu assertions hành vi/progress. Chạy nhóm browser `notebook-deduction.spec.ts notebook-people.spec.ts timeline.spec.ts journey.spec.ts viewport-focus.spec.ts learning.spec.ts settings.spec.ts dialogue.spec.ts` bằng một worker. Nếu fail, dùng systematic-debugging; rerun nguyên nhóm sau sửa cuối.
- [x] Chụp và tự xem notebook bốn tab + board ở 1280×720, 760×600, 390×844. Kiểm tra font, ảnh từ repo, card selected, focus/trap, cuộn/không tràn ngang, responsive, canvas. Sửa theo phát hiện và rerun các check liên quan.
- [x] Chạy `npm run format`, `npm run lint`, `npm run test`, `npm run build`, `npm run typecheck`, `npm run memory:check`; lưu exit code/output. Không sửa `apps/api` nên không cần dotnet. Nếu thay code sau check, chạy lại check bị ảnh hưởng.
- [x] Tự review diff theo spec mục 1–8, sau đó một reviewer độc lập cho gói cuối; sửa Critical/Important và verify lại. Báo cáo verification tiếng Việt gồm file, test, lệnh/output, hạn chế. Commit code/tests/spec/plan/report/screenshots trước; commit memory riêng trỏ `result_commit` là commit đó. Không push chỉ vì authorization push People trước.

## Điểm dừng

Plan này là bước kế tiếp sau spec đã duyệt. Người dùng cần xem file plan và xác nhận plan phản ánh đúng ý trước Task 1. Phương thức Native inline trên `dev` đã được chọn trước đó; giữ phương thức này, không hỏi lại lựa chọn execution trừ khi người dùng đổi ý.

## Kết quả thực thi

Người dùng đã duyệt plan và triển khai inline dev. Hoàn thành ngày 02/10/2026;38/38 E2E,536 frontend test,187 content test, lint/build/typecheck pass. Báo cáo: `docs/ai/2026-10-01-notebook-deduction-verification.md`. Một review độc lập; Important re-grade nút44 × 44 đã sửa bằng RED→GREEN; không deferred minor mới. Giữ commit local, không push theo authorization People cũ.
