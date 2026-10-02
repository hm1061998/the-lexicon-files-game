# Màn hình mở đầu, briefing và hướng dẫn chơi cho Case #001

Ngày: 02/10/2026. Trạng thái: **đã duyệt (02/10/2026)**, gồm 5 quyết định mặc định ở §15. Plan: `docs/superpowers/plans/2026-10-02-intro-onboarding.md` (chờ duyệt). Chưa sửa code.

Phân loại theo `brainstorming`: **architectural** — thêm màn hình trước khi vào thế giới, thêm trường content `briefing`, nâng record learning lên V3 và đổi luồng boot của `GameCanvas`. Sau khi spec được duyệt mới chuyển sang `writing-plans`.

Backlog liên quan: `PR-01` trong `docs/product/2026-10-02-product-review-and-direction.md`.

## 1. Mục tiêu và nguồn yêu cầu

Người chơi mới mở game phải biết, trong khoảng một phút và không đọc tài liệu ngoài:

1. mình là ai (điều tra viên tập sự của IIB) và vụ án là gì;
2. việc đầu tiên nên làm;
3. cách di chuyển và tương tác bằng **cả bàn phím lẫn chuột**.

Người chơi quay lại (Continue) không bị chặn bởi intro hay gợi ý đã xem.

Nguồn:

- Yêu cầu người dùng ngày 02/10/2026: thêm intro mở đầu, lời chào và hướng dẫn cách chơi với case đầu tiên, theo đề xuất "ngắn, diegetic, không tutorial dài".
- `docs/ai/2026-10-01-player-playtest-feedback.md` — P2 "Khó hiểu hành động mở đầu và điều khiển chuột": chưa giải thích click xa để đi tới, click lại để tương tác; bản compact ẩn mục tiêu và hướng dẫn di chuyển.
- `docs/03_CASE_001_VERTICAL_SLICE_SPEC.md` §6 (Player Start, Chief message) và §17 (Tutorial Constraints: không modal tutorial dài, tutorial theo ngữ cảnh, hiện một lần).
- `docs/01_GAME_DESIGN_DOCUMENT.md` §2.3 Diegetic UI, §2.4 Player Agency ("không bị buộc làm tutorial quá dài").

## 2. Hiện trạng (đối chiếu code tại `08e115f`)

- `App.tsx` render thẳng `GameCanvas`; sau khi load content/save/learning/settings, `GameRoot` mount Phaser ngay. Không có màn hình tiêu đề, không có lựa chọn Continue / New.
- Lời nhắn của Chief trong docs/03 §6 **chưa có trong content** `packages/game-content/cases/case-001`. Người chơi chỉ thấy objective panel.
- `KeyHints` luôn hiện footer phím; `getInitialHudVisibility` ẩn minimap và objective khi viewport < 960×640, và CSS ẩn `hud-movement-hint` ở compact.
- Đã có một tutorial theo ngữ cảnh: `vocabularyTutorialSeen` trong `LearningRecordV2` + chuỗi `vocabularyTutorial` ("Nhấn vào từ được gạch chân để xem nghĩa."). Đây là tiền lệ cho việc lưu cờ hướng dẫn ở record cấp người chơi.
- Nhạc nền bắt đầu từ gesture tin cậy đầu tiên (`activateAmbientMusic` trong `GameCanvas`). Một cú click ở màn hình tiêu đề cung cấp gesture này một cách tự nhiên.
- `createFreshSaveAfterConfirmation` ghi đè save **không** tạo backup; hiện chỉ dùng cho save hỏng.
- Board có mục "Hồ sơ vụ việc" (`DeductionCaseFile`) hiển thị tiêu đề, objective đang active và hướng dẫn, đã phân trang bằng `ReadDocument`.

## 3. Các cách tiếp cận

| Cách | Mô tả | Đánh giá |
| --- | --- | --- |
| **A (chọn)** | Màn hình tiêu đề React **trước** khi mount thế giới; briefing là overlay giấy **sau** khi thế giới mount (input bị khóa); gợi ý theo ngữ cảnh dạng ghi chú nhỏ không chặn. | Tách rõ "chọn ván" khỏi "đang chơi"; New Case không phải remount thế giới đang chạy; người chơi thấy văn phòng phía sau tờ briefing nên vẫn có không khí. |
| B | Mọi thứ là overlay trên thế giới đã mount, kể cả màn hình tiêu đề. | Ít thay đổi provider, nhưng Phaser chạy dưới menu; New Case khi đang có save phải dựng lại store/world; khó kiểm soát input/audio. |
| C | Cutscene trong Phaser: Chief là NPC đứng trong scene, dùng dialogue runner. | Nhập vai nhất nhưng cần art nhân vật mới; dialogue tree bắt buộc `npcId`, `completionFlag`, kéo theo case rule và save. Vượt phạm vi. |

## 4. Luồng người chơi

```text
Lỗi content / Đang tải / Khôi phục save   (giữ nguyên như hiện tại, đứng trước)
        ↓
Màn hình tiêu đề
  ├─ [Tiếp tục điều tra]  (chỉ khi loadSave = loaded)  → mount thế giới, không briefing
  ├─ [Vụ án mới]
  │     ├─ có save: xác nhận ghi đè → backup save cũ → state mới
  │     ├─ lần đầu chơi (chưa có settings record): chọn mức hỗ trợ
  │     └─ mount thế giới → briefing → đóng → objective hiện → gợi ý "di chuyển"
  ├─ [Cách điều tra]   → trang hướng dẫn (§9)
  └─ [Cài đặt]         → các trường cài đặt dùng chung với Pause
```

Không có nút thoát game trong gói này (bản web).

## 5. Màn hình tiêu đề

- Nội dung: tên game "The Lexicon Files", tagline "Every word is a clue.", các nút theo §4. Chữ lấy từ `packages/game-content/ui/vi.json`.
- "Tiếp tục điều tra" là nút chính và nhận focus mặc định khi có save `loaded`; nếu không có save, "Vụ án mới" là nút chính. Nếu save đã `case_closed`, vẫn hiện Continue (người chơi xem lại báo cáo như hiện nay).
- "Vụ án mới" khi đã có save: hộp xác nhận trên cùng khung giấy, nội dung "Bắt đầu lại sẽ thay tiến độ vụ án hiện tại. Tiến độ từ vựng của bạn được giữ nguyên.", hai nút Bắt đầu lại / Hủy. Trước khi ghi state mới phải lưu save cũ vào store `backups` sẵn có. Learning record và settings **không** bị reset.
- "Cài đặt": tách phần trường cài đặt trong `PauseMenu` thành component dùng chung (vd. `SettingsFields`) để màn hình tiêu đề và Pause dùng cùng một nguồn. Vì vậy settings store được tạo ở `GameCanvas` (trước `GameRoot`) và truyền xuống; hành vi lưu/khôi phục settings giữ nguyên.
- Bàn phím: Tab/Shift+Tab qua các nút; Enter/Space kích hoạt; Esc chỉ đóng panel con (cài đặt, hướng dẫn, xác nhận). Các phím J/B/M/Esc của game không hoạt động vì thế giới chưa mount.
- Hình ảnh: nền giấy/sepia theo `docs/art/06`; không dùng màu đỏ (`#A4412D`/`#743026`) vì đỏ chỉ dành cho clue/evidence/objective/contradiction/selected node/map marker. Font ≥ 14px, vùng bấm ≥ 44×44px, không cuộn ở 1280×720, 760×600, 390×844.
- Màn hình tiêu đề không hiển thị gì về commerce trong gói này.

## 6. Chọn mức hỗ trợ (chỉ lần đầu)

- Hiện sau "Vụ án mới" khi `loadSettings` trả `missing` (chưa từng lưu settings). Người chơi có settings rồi thì bỏ qua bước này.
- Ba lựa chọn ánh xạ thẳng vào `TranslationMode` sẵn có, dùng đúng nhãn hiện tại trong `ui/vi.json` và mô tả khớp hành vi của `VocabularyText`:
  - Beginner — "Cơ bản: hiện bản dịch tiếng Việt của câu, nghĩa tiếng Việt khi bấm vào từ."
  - Learning — "Đang học: bấm vào từ để xem nghĩa tiếng Anh, mở nghĩa tiếng Việt khi cần." (focus mặc định, khớp `createDefaultSettings`)
  - Immersion — "Đắm chìm: chỉ tiếng Anh, kể cả phần giải nghĩa."
- Nếu hành vi của mode thay đổi trước khi triển khai, câu mô tả phải được sửa theo code, không ngược lại.
- Không phải bài kiểm tra trình độ, không gắn nhãn CEFR cho người chơi. Có nút "Dùng mặc định" (= Learning). Đổi lại được bất cứ lúc nào trong Cài đặt.

## 7. Briefing

### 7.1. Hình thức

Bản ghi nhớ giấy có tiêu đề IIB, người gửi "Chief" (đúng docs/03 §6; không đặt tên, không portrait trong gói này). Hiện dạng overlay trên thế giới vừa mount, phát paper cue sẵn có khi mở. Không giọng đọc trong gói này.

### 7.2. Nội dung Case #001 (tiếng Anh, ≤ 4 dòng)

| id | Text | translationVi | Từ gạch chân |
| --- | --- | --- | --- |
| `welcome` | Welcome to the International Investigation Bureau, Junior Investigator. | Chào mừng đến với Cục Điều tra Quốc tế, điều tra viên tập sự. | — |
| `incident` | A confidential report disappeared after last night's meeting. | Một bản báo cáo mật đã biến mất sau cuộc họp tối qua. | confidential, report, meeting |
| `first_step` | Start with the meeting room and speak to everyone who had access. | Hãy bắt đầu từ phòng họp và nói chuyện với tất cả những người có quyền ra vào. | meeting, access |
| `sign_off` | Read carefully. Every word is a clue. | Hãy đọc kỹ. Mỗi từ đều là một manh mối. | — |

- `incident` và `first_step` là nguyên văn docs/03 §6. `welcome` và `sign_off` là **text mới**: khi spec được duyệt, cập nhật docs/03 §6 trong cùng gói để docs/03 vẫn là nguồn authoritative của content Case #001.
- Chỉ dùng vocabulary đã có trong `vocabulary.json` (confidential, report, meeting, access). Không thêm từ mới vào catalogue.
- Briefing chỉ dẫn hướng đã có trong docs/03 ("meeting room", "everyone who had access"); không chỉ vị trí evidence hay gợi ý nghi phạm.

### 7.3. Tương tác

- Mở: tự động ngay sau khi thế giới mount **khi bắt đầu vụ án mới** (save `missing`, hoặc vừa xác nhận Vụ án mới). Continue không hiện briefing. Không lưu cờ "đã xem briefing"; nếu reload trước lần autosave đầu, briefing hiện lại — chấp nhận được.
- Trong lúc mở: khóa input thế giới như các modal khác; J/B/M bị chặn; focus trap; nút chính "Nhận hồ sơ" (≥ 44×44). Esc có cùng tác dụng (bỏ qua). Không timer, không tự chuyển trang.
- Từ gạch chân dùng đúng `VocabularyText` và các action `encounterContext` / `inspectVocabulary` / `revealTranslation` như dialogue/evidence; translation theo `TranslationMode` hiện tại. Nếu `vocabularyTutorialSeen` còn false, dòng tutorial từ vựng hiện ở briefing — briefing thành nơi đầu tiên dạy thao tác này, sau đó cơ chế cũ không hiện lại.
- Đóng: khôi phục focus về canvas; mở objective panel một lần ở mọi viewport (kể cả compact) — người chơi vẫn thu gọn được; bắt đầu gợi ý `move` (§8).
- Đọc lại: các dòng briefing được thêm ngay sau tiêu đề vụ án trong "Hồ sơ vụ việc" của bảng suy luận (`DeductionCaseFile`), dùng phân trang sẵn có.

### 7.4. Content schema

Thêm trường **tùy chọn** `briefing` vào `case.json`; case không có briefing thì bỏ qua bước 7 mà không lỗi.

```json
"briefing": {
  "from": "Chief, International Investigation Bureau",
  "lines": [
    {
      "id": "incident",
      "text": "A confidential report disappeared after last night's meeting.",
      "translationVi": "Một bản báo cáo mật đã biến mất sau cuộc họp tối qua.",
      "vocabularySpans": [{ "start": 2, "end": 14, "vocabularyId": "confidential" }]
    }
  ]
}
```

- Zod `.strict()`; `lines` 1–6 phần tử, `id` duy nhất; `translationVi` và `vocabularySpans` tùy chọn như dialogue node.
- Loader thêm context `briefing:<caseId>:<lineId>:text` vào `vocabularyContexts`, và `validateVocabularyReferences` kiểm span (biên, surface form, vocabularyId tồn tại) như evidence/dialogue. Content lỗi phải làm build fail như hiện nay.
- `shared-types`: `CaseBriefingDefinition` và `CaseDefinition.briefing?`. `game-core` không đổi.
- `parseLearningRecord` nhận danh sách context từ catalogue; context briefing mới là bổ sung. Plan phải xác minh record cũ vẫn parse được khi danh sách context có thêm id mới.

## 8. Gợi ý theo ngữ cảnh (coach note)

Ghi chú giấy nhỏ, **không chặn** thao tác, mỗi gợi ý chỉ hoàn thành một lần cho mỗi người chơi.

| id | Hiện khi | Hoàn thành khi | Nội dung (vi) |
| --- | --- | --- | --- |
| `move` | Briefing đóng, hoặc vào game (Continue) mà chưa hoàn thành | Người chơi di chuyển lần đầu do input (bàn phím hoặc click sàn), không tính vị trí spawn | Di chuyển bằng WASD hoặc phím mũi tên, hoặc click lên sàn để đi tới. |
| `interact` | Lần đầu có prompt tương tác (`interaction:nearby`) | `interaction:triggered` lần đầu | Nhấn E, hoặc click vào người/vật khi đã đứng gần, để tương tác. |
| `notebook` | `caseState.evidenceIds` lần đầu khác rỗng | Mở sổ tay lần đầu | Chứng cứ đã được ghi vào sổ tay. Nhấn J để xem lại. |
| `board` | `caseState.discoveredFactIds` lần đầu khác rỗng | Mở bảng suy luận lần đầu | Khi đã có dữ kiện, nhấn B để mở bảng suy luận: sắp dòng thời gian và tìm mâu thuẫn. |

Quy tắc:

- Tối đa một ghi chú hiện cùng lúc, thứ tự ưu tiên `move → interact → notebook → board`. Một gợi ý chưa đủ điều kiện hiện thì chờ; gợi ý đã hoàn thành không bao giờ hiện lại.
- Nếu hành động hoàn thành xảy ra trước khi gợi ý kịp hiện (vd. mở sổ tay trước khi nhặt evidence), gợi ý đó được đánh dấu hoàn thành và không hiện.
- Ẩn trong lúc có modal (dialogue, evidence, notebook, board, pause, briefing) và hiện lại khi modal đóng nếu chưa hoàn thành.
- `role="status"` + `aria-live="polite"`; không lấy focus; có nút "Đã hiểu" (≥ 44×44) để đánh dấu hoàn thành thủ công.
- Vị trí: phía trên `KeyHints` ở góc dưới, nằm trọn trong viewport ở 1280×720, 760×600, 390×844, không che prompt tương tác hay objective. Không dùng màu đỏ; tôn trọng `reducedMotion`.
- Gợi ý chỉ nói **cách thao tác**, không nói điều tra cái gì hay ở đâu.
- Logic chọn gợi ý là hàm thuần trong `apps/game-web` (vd. `selectCoachNote(progress, onboardingSeen, modalOpen)`), test được không cần Phaser. Phaser không chứa logic hướng dẫn. Điều kiện chỉ dùng event/state chung (`interaction:*`, `evidenceIds`, `discoveredFactIds`, cờ mở modal), không dùng id riêng của Case #001.

## 9. Trang "Cách điều tra"

- Mở từ màn hình tiêu đề và từ Pause menu (nút mới). Một tài liệu giấy phân trang bằng `ReadDocument`, không cuộn.
- Nội dung (vi, từ `ui/vi.json`):
  1. Điều khiển: bàn phím (WASD/mũi tên, E, J, B, M, Esc) và chuột (click sàn để đi, click người/vật khi đứng gần để tương tác, nút trên HUD).
  2. Vòng điều tra: Khám phá → Đọc/Nghe → Ghi vào sổ tay → Bảng suy luận (dòng thời gian, mâu thuẫn) → Kết luận.
  3. Học từ: click từ gạch chân để xem nghĩa; đổi mức hỗ trợ trong Cài đặt.
  4. Nguyên tắc: kết luận sai không làm mất tiến độ; gợi ý giúp hiểu, không giải hộ.
- Không chứa nội dung riêng của Case #001.

## 10. Lưu trữ

- **Learning record V2 → V3**: thêm `onboardingSeen: { move: boolean; interact: boolean; notebook: boolean; board: boolean }`. Giữ nguyên `vocabularyTutorialSeen`.
  - Lý do: đây đã là record cấp người chơi, có migration, backup và luồng khôi phục; đã chứa một cờ tutorial. Không đụng save của case (giữ save version) và không đụng settings (settings là preference, schema strict V1).
  - Migration V1/V2 → V3: nếu `vocabularyTutorialSeen === true` hoặc profile đã có bất kỳ tiến độ từ vựng → người chơi cũ: mọi cờ `onboardingSeen` = `true`. Ngược lại tất cả `false`.
  - Đã cân nhắc và loại: database IndexedDB riêng cho onboarding (thêm repository và luồng recovery mới); settings V2 (trộn tiến độ người chơi vào preference).
- Briefing không có cờ lưu (§7.3).
- Vụ án mới khi đã có save: thêm thao tác repository "backup rồi tạo state mới" (dùng store `backups` sẵn có). Không đổi `SAVE_DATABASE_VERSION`.

## 11. Ranh giới kiến trúc và file dự kiến

Danh sách chỉ để định hướng plan, plan sẽ chốt.

- `packages/shared-types`: `CaseBriefingDefinition`, `CaseDefinition.briefing?`, khóa `UiStrings` mới.
- `packages/game-content`: schema/loader/validation briefing, `cases/case-001/case.json`, `ui/vi.json` (+ schema `ui.ts`), test.
- `apps/game-web`:
  - luồng `GameCanvas`: thêm giai đoạn `title` trước `GameRoot`; nâng settings store lên `GameCanvas`;
  - màn hình mới: tiêu đề, chọn mức hỗ trợ, xác nhận vụ án mới, briefing memo, trang "Cách điều tra", coach note;
  - `pause/PauseMenu.tsx` tách `SettingsFields` và thêm nút "Cách điều tra";
  - `persistence/learningMigration.ts` (V3), `learningRepository`, `state/learningStore.ts` (action đánh dấu onboarding);
  - `persistence/saveRepository.ts` (backup khi bắt đầu lại);
  - `deduction/DeductionCaseFile.tsx` (thêm dòng briefing).
- `game-core`, `learning-engine`, Phaser scene: không đổi. Nếu cần biết "người chơi đã di chuyển do input", dùng `player:moved` sẵn có và so với vị trí spawn trong store; không thêm logic hướng dẫn vào Phaser.
- Tuân thủ `AGENTS.md` §4: text/ID của Case #001 chỉ nằm trong `game-content`; scene/listener cleanup; không global mutable singleton mới; không thêm dependency.

## 12. Guardrails

- Không modal tutorial nhiều bước, không bắt làm theo từng bước, không khóa tiến trình chờ hướng dẫn.
- Mọi thứ bỏ qua được: briefing (Esc / Nhận hồ sơ), mức hỗ trợ (Dùng mặc định), coach note (Đã hiểu hoặc cứ chơi).
- Không timer, không điểm, không phần thưởng/phạt gắn với hướng dẫn.
- Không lộ lời giải, vị trí evidence hay nghi phạm.
- Màu đỏ giữ đúng phạm vi guardrail.

## 13. Kiểm thử

**Unit (Vitest)**

- Schema briefing: hợp lệ; id trùng; > 6 dòng; span vượt biên/sai surface form/vocabularyId không tồn tại → lỗi đọc được. Case không có `briefing` vẫn load.
- Loader: context `briefing:case-001:<lineId>:text` có trong `vocabularyContexts`.
- Learning migration: V2 mới (chưa tutorial) → tất cả `false`; V2 đã có tutorial/tiến độ → tất cả `true`; V3 round-trip; field lạ bị từ chối như hiện nay.
- `selectCoachNote`: thứ tự ưu tiên, ẩn khi có modal, hoàn thành trước khi hiện, không hiện lại.
- Màn hình tiêu đề: Continue chỉ khi save `loaded`; xác nhận Vụ án mới gọi backup trước khi ghi; mức hỗ trợ chỉ khi settings `missing`.
- Briefing: khóa input, focus trap/restore, Esc đóng, translation theo mode, encounter/inspect gửi đúng context.

**E2E (Chromium)**

- Người chơi mới: tiêu đề → Vụ án mới → mức hỗ trợ → briefing → Nhận hồ sơ → objective hiện → gợi ý `move` mất sau khi di chuyển → `interact` → `notebook` → reload → gợi ý đã xong không hiện lại, không có briefing khi Continue.
- Có save: Vụ án mới → xác nhận → state về đầu, từ vựng giữ nguyên.
- 1280×720, 760×600, 390×844: tiêu đề, briefing, coach note không cuộn, control ≥ 44×44 nằm trong viewport.
- Board "Hồ sơ vụ việc" hiện dòng briefing.
- **Các spec E2E hiện có** đều giả định vào thẳng thế giới. Thêm một helper dùng chung đi qua tiêu đề + briefing bằng thao tác UI thật và cập nhật các spec dùng helper đó. Không thêm cửa sau trong bản production.

**Gate**: `npm run lint`, `npm run test`, `npm run build`, `npm run typecheck`, `npm run format:check`, `npm run memory:check` và nhóm E2E liên quan. Không có thay đổi `apps/api`.

## 14. Ngoài phạm vi

Giọng đọc cho Chief; Chief là NPC trong scene hoặc có portrait; cinematic; nhiều save slot; nút thoát/Electron/Steam; gamepad; ngôn ngữ UI ngoài tiếng Việt; telemetry onboarding; tùy chọn "hiện lại gợi ý"; màn hình rank/hồ sơ người chơi.

## 15. Quyết định cần người dùng chốt

Spec dùng giá trị mặc định dưới đây; người dùng có thể đổi khi review.

1. Briefing dạng **bản ghi nhớ giấy** (mặc định) hay cuộc gọi/hội thoại.
2. Chief **không tên, không portrait** (mặc định) hay đặt tên + vẽ portrait (cần art và cập nhật docs/03).
3. Duyệt hai câu mới `welcome` và `sign_off` (§7.2).
4. **Có** hỏi mức hỗ trợ ở lần chơi đầu (mặc định).
5. Lưu cờ onboarding trong **learning record V3** (mặc định).

## 16. Tiêu chí nghiệm thu

1. Mở game lần đầu thấy màn hình tiêu đề; không có save thì chỉ có Vụ án mới / Cách điều tra / Cài đặt.
2. Vụ án mới lần đầu → chọn mức hỗ trợ → briefing 4 dòng có từ gạch chân → đóng bằng nút hoặc Esc → objective hiện ở mọi viewport.
3. Bốn gợi ý `move/interact/notebook/board` xuất hiện đúng điều kiện, mỗi lần một gợi ý, không chặn thao tác, không hiện lại sau khi hoàn thành kể cả sau reload.
4. Continue vào thẳng thế giới tại vị trí đã lưu, không briefing.
5. Vụ án mới khi có save: có xác nhận, save cũ được backup, tiến độ từ vựng giữ nguyên.
6. "Cách điều tra" mở được từ tiêu đề và Pause, phân trang, không cuộn.
7. Người chơi cũ (record V2 có tiến độ) không thấy coach note sau khi nâng cấp.
8. Content briefing nằm trong `game-content`, validate khi build; không có text Case #001 trong React/Phaser.
9. Không vi phạm guardrail §12; gate §13 pass.
