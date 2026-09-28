# Phase 6 — Learning Engine

Trạng thái: **đã duyệt — phương án A**. Người dùng chốt phương án A, duyệt plan sáu task và chọn thực thi inline. Implementation Phase 6 đang diễn ra trong managed worktree riêng, bắt đầu từ checkpoint plan `77846e1`; chưa push hoặc tích hợp vào `dev`.

Nguồn: docs/02 §§4–7, 11–12, 24–26, 29–31; docs/03 §15; roadmap §25; ARCHITECTURE.md. Không sửa product rules hoặc lời khai/truth đã author.

## 1. Mục tiêu và hiện trạng

Người chơi đọc evidence/lời khai tiếng Anh, chủ động bấm một từ được gạch chân để hiểu trong ngữ cảnh; các từ đã gặp xuất hiện trong sổ tay và vẫn còn sau refresh. Người chơi đổi mức hỗ trợ ngôn ngữ mà không bị ép trả lời quiz hoặc ngắt điều tra.

Hiện tại:

- packages/learning-engine/src/index.ts chỉ export rỗng; vocabulary.json là `{}` và loader chưa đọc file này.
- EvidenceDefinition có vocabularyIds tùy chọn nhưng chưa validate catalogue; chưa có VocabularyEntry/LanguageProfile contracts.
- Evidence description và dialogue node text hiển thị plain text; Notebook Vocabulary là empty state.
- Case save schema 2 lưu core GameState, IndexedDB database version 1. Chưa có learning profile/settings persistence.
- Phase 5 đã có accessible dialogue, input locks, shared Escape handler và no-remount canvas; cần giữ các behavior này.

## 2. Ba phương án

### A — Học qua content hiện có (đề xuất)

Author catalogue 20 từ Case #001, annotate từ trong Meeting Minutes và ba dialogue hiện có, popup click-only, ba translation modes, notebook và profile local-first. Trong gameplay Phase 6, từ chuyển unknown → seen; mở definition không được giả định là đã hiểu hoặc mastered. Các stage cao hơn giữ trong contract và chỉ tiến khi một phase sau cung cấp bằng chứng assessment thực.

Chi phí: không thể demo các stage recognized/understood/used/mastered bằng thao tác tra từ. Một số từ catalogue chưa có encounter trong prototype vì evidence/audio tương ứng chưa được triển khai.

### B — Thêm optional recognition review trong notebook

Có thể quan sát recognized bằng trả lời meaning check tự chọn. Tăng content/questions, correctness signals và UX ngoài loop điều tra hiện có. Learning docs cho phép optional review room, nhưng roadmap Phase 6 không yêu cầu review activity; chưa đề xuất mở scope này.

### C — Chỉ làm evidence trước, dialogue sau

Đơn giản hơn nhưng learning chưa gắn vào ba interviews đã chơi được. Tạo thêm lượt tích hợp sau và giảm coverage contextual reinforcement. Không đề xuất làm kết quả trọn Phase 6.

Các phần sau mô tả **phương án A chờ duyệt**. Điểm cần chốt là chỉ ghi nhận seen khi chưa có assessment; không suy diễn mastery từ số lần click hoặc hoàn thành interview.

## 3. Phạm vi

Bao gồm:

- Vocabulary definitions của đủ 20 lemmas trong docs/03 §15: meeting, client, early, leave, return, before, end, report, confidential, folder, access, security, entry, exit, log, receipt, purchase, outside, several, certain.
- Vocabulary annotations trong evidence description và dialogue node text hiện có; clickable words trong hai nơi này và evidence descriptions trong notebook.
- Beginner/Learning/Immersion; Learning mặc định.
- Profile/progress/assistance counters và các domain events cần cho phạm vi này, chạy local-first.
- Vocabulary notebook từ đã gặp, definitions/examples/context và stage thực tế; reload giữ profile/mode.
- Content validation/build gate, persistence recovery, accessibility và regression Phase 5.

Không triển khai audio/listening, grammar assessment, review activities, review scheduling/priority, hints bốn cấp, adaptive difficulty, CEFR estimation, case report, contradiction, accusation hoặc backend. Những phần đó thuộc tổng learning MVP hoặc phase sau, không phải acceptance riêng §25.

Không thêm evidence collectibles, đổi evidenceTotal=5 hoặc viết lời khai mới để ép đủ 20 từ xuất hiện. Catalogue đầy đủ khác với encountered progress; từ chưa xuất hiện không tự thêm notebook.

## 4. Content contracts

- CaseDefinition thêm vocabulary: readonly VocabularyEntry[]. Case loader đọc vocabulary.json shape `{ vocabulary: [...] }`.
- VocabularyEntry theo docs/02: id, lemma, partOfSpeech, cefr A1–C1, definitionEn, translationVi, examples, synonyms tùy chọn, tags. Thêm surfaceForms authored để map inflections/phrases như left → leave; không stemming tự đoán trong UI. Case #001 author translationVi và ít nhất một example cho mỗi entry; examples giải thích ngôn ngữ, không tiết lộ thêm case truth.
- Text annotations dùng VocabularySpan `{ start, end, vocabularyId }` theo chỉ số UTF-16 của chuỗi nguyên bản, range [start,end). Evidence thêm descriptionVocabularySpans; dialogue node thêm vocabularySpans. Chuỗi text hiện có giữ nguyên.
- Translation authored: evidence.descriptionVi, node.translationVi và choice.translationVi cho các choice tiếng Anh. Choice “Tiếp tục hỏi” đang là UI copy tiếng Việt được giữ nguyên và không cần dịch lại. Không gọi API dịch hoặc generate runtime.
- vocabularyIds trên evidence phải tồn tại trong catalogue và đúng tập vocabulary IDs của description spans, không duplicate. Dialogue spans tham chiếu cùng catalogue. Choice text vẫn là button lựa chọn nguyên khối; không đặt button tra từ bên trong button choice.
- Loader kiểm duplicate ID/lemma/surfaceForms trong từng entry, empty fields, spans không nguyên/ngoài range/overlap, unknown ID và substring không khớp lemma/surfaceForms (so sánh không phân biệt hoa thường, giữ punctuation ngoài span).
- Source context ID được resolve từ cấu trúc content: case/evidence/description hoặc case/tree/node/text. Node IDs vẫn local trong tree. Không lưu một bản sao sentence trong profile.
- Production build gate hiện có validate vocabulary, annotations và bản dịch của các reading surfaces được triển khai. Invalid content chỉ rõ file/field và fail build; không fallback im lặng.

## 5. Learning engine và tiến độ

- shared-types chứa CEFRLevel, VocabularyStage sáu mức, VocabularyEntry, VocabularyProgress, LanguageProfile, TranslationMode, LearningAction và LearningDomainEvent.
- learning-engine là TS thuần, chỉ phụ thuộc shared-types. Các functions nhận catalogue/profile/action/time qua tham số; không đọc clock, content JSON, DOM, store hoặc IndexedDB trực tiếp.
- Phase 6 actions: encounterContext, inspectVocabulary, revealTranslation. Settings mode đổi trong settings state; reducer không sửa core GameState.
- Encounter chỉ được gửi khi reading surface thực sự đang hiển thị: mở evidence, mở dialogue/node đã đủ condition hoặc xem Evidence tab. Không track lúc load catalogue, preload, hidden node, hidden branch hoặc unopened evidence.
- Một vocabulary/context pair chỉ ghi encounter một lần trong profile. Hai occurrences cùng lemma trong cùng context tính một; khác context tăng encounterCount và contextsSeen. Re-render/StrictMode/reload/reopen cùng context không farm counts hoặc stage. lastSeenAt là thời điểm nhận context mới gần nhất; timestamps ISO hợp lệ từ injected clock.
- Unknown entry chưa gặp không tồn tại trong progress map (selector trả unknown). Lần gặp đầu tạo seen; stage không giảm. Trong Phase 6 không có action nâng recognized/understood/used/mastered hoặc cộng recognition correctness.
- correctRecognitionCount/incorrectRecognitionCount giữ 0 cho profile mới; nextReviewAt optional, chưa schedule. Có thể deserialize các stage cao hợp lệ từ profile tương lai mà không tự hạ stage, nhưng không có UI/test fixture giả làm chứng cứ Phase 6 đã assessment.
- inspectVocabulary emit vocab_inspected; không tăng encounter thêm khi context đã ghi. revealTranslation emit translation_opened và tăng assistanceUsage.translations cho lần reveal do người dùng chủ động; click definition tiếng Anh không tính translation nếu bản dịch chưa hiển thị.
- Beginner tự hiện bản dịch là preference, không spam translation count mỗi render. Learning hiện EN trước, definition popup có nút hiện VI; chỉ action reveal mới tính. Immersion ẩn mọi bản dịch VI của reading content và vocabulary, nhưng vẫn tra definitionEn/examples được.
- Domain events vocab_seen/vocab_inspected/translation_opened trả cùng transition để adapter emit bus typed và tests quan sát. Profile lưu aggregate; chưa làm event-log vô hạn hoặc sync telemetry.
- Không tính skill scores, CEFR estimate hay mastery từ encounter/clicks. Basic profile dùng case target A2 làm bootstrap value của cefrEstimate, scores năm domain ban đầu 0 và các assistance counters 0; đó là default kỹ thuật chưa có assessment, không hiển thị như kết quả năng lực. Grammar progress map rỗng; không thêm grammar engine.
- Invalid vocabulary/context/time/action giữ profile cũ và trả lỗi typed. Inspect phải liên quan reading context đang mở hoặc entry đã encountered trong notebook; không inspect ID arbitrary để khám phá catalogue chưa gặp.

## 6. State, bridge và lifecycle

- Learning store độc lập giữ một LanguageProfile; settings giữ một TranslationMode. Game store tiếp tục giữ caseState và điều khiển overlay/input lock. Không duplicate profile trong core GameState hoặc Phaser.
- App adapter resolve context/spans từ validated content rồi gọi learning reducer. Profile mutations mới kích autosave; React selectors/render không mutate profile.
- Active word popup là transient state theo context/vocabulary ID; không persist focus, active word hoặc dialog position.
- Popup nằm trong reading panel hiện tại, không thêm overlay toàn màn hình cạnh tranh focus trap. Mỗi reading panel chỉ có một popup; đổi node/tab, close panel hoặc thay mode đóng popup.
- Inspect không phát interaction world hoặc chọn dialogue choice. Double click không tự reveal VI/đi qua node. Giữ revision guard và UI physical double-click guard Phase 5.
- Learning/settings updates không remount GameRoot/canvas hoặc reconnect Phaser scene. Các listeners/subscriptions được cleanup khi unmount/shutdown.
- J/E/WASD giữ locks hiện tại. Escape khi popup mở chỉ đóng popup; lần tiếp theo đóng parent panel; tiếp theo pause theo flow có sẵn. Sole Escape owner mở rộng theo ưu tiên này; typing targets và language select không giành shortcuts.

## 7. UI và translation modes

- Reuse PaperPanel/tokens/fonts; font ít nhất 14 px. Từ tra được gạch chân bằng mực/neutral, không dùng đỏ vì vocabulary không phải investigation accent.
- Word trigger là button inline styled như từ trong câu, tên accessible là surface word, có aria-expanded và quan hệ với popup. Enter/Space mở tương đương click; hover không mở hoặc ghi inspect.
- Popup hiển thị lemma, part of speech, definition EN, example, synonyms nếu có và VI theo mode/reveal. Không tự mở notebook hoặc có quiz/reward animation. Từ đã encountered tự có trong notebook, không cần nút Add.
- Dùng panel disclosure cạnh/dưới sentence trong flow layout để tránh che focus; có heading/close, focus vào popup khi mở rồi trả trigger khi đóng. Trigger disconnect thì focus về reading text/parent; trap cha tiếp tục quản lý các controls trong popup.
- Hiện contextual instruction “Click an underlined word to inspect it.” khi context đầu tiên có annotated word; ghi flag tutorial trong learning record để không hiện lại sau reload. Copy lấy từ game-content UI strings.
- Language mode control có nhãn rõ, xuất hiện trong PauseMenu và các reading panels (dialogue/evidence/notebook). Người chơi có thể đổi khi đang đọc; thao tác không đóng interview hoặc áp dụng case effects.
- Beginner: EN + bản dịch VI authored dưới text và dưới choice tiếng Anh; Learning: EN, click definition và reveal VI; Immersion: EN/definition EN, không translation VI. Bản dịch giữ nguyên ý, không mở lời khai/node chưa đủ condition.
- Vocabulary notebook chỉ list entries trong progress map. Hiển thị lemma/POS, definition, meaning VI theo mode, example, case/context đã gặp và stage labels từ UI strings. Không hiển thị scores hoặc invented pronunciation field; VocabularyEntry hiện chưa có pronunciation nên không thêm audio/IPA vào Phase 6.
- Empty state rõ khi chưa gặp từ; không show đủ catalogue để spoiler các từ/lời khai chưa đọc. Evidence/People tabs giữ behavior Phase 5.
- Kiểm viewport desktop 1280×720 và 1920×1080: long bilingual text/popup/notebook scroll được, không che controls/focus; không thêm animation bắt buộc.

## 8. Persistence và recovery

- Giữ case save schema 2 và database lexicon-game-saves version 1. Không gộp profile vào GameState hoặc làm migration case save chỉ vì learning.
- Tạo repository riêng trong app persistence, database lexicon-learning version 1, stores records và backups. Một local record key cố định chứa schemaVersion 1, LanguageProfile, TranslationMode, tutorial flag, updatedAt. Không cần user/account identifiers.
- Missing record tạo default profile/settings; bootstrap learning trước khi encounter events được chấp nhận. Không ghi default đè lên record chưa đọc xong.
- Validate exact record shape/version, vocabulary references, stage/counters/timestamps, contexts và mode. Wrong version/corrupt record: backup raw trước, hiển thị recovery action riêng cho learning. Chỉ reset learning record sau xác nhận rõ; không reset game save/evidence/interviews.
- Nếu DB open/read/backup/write lỗi, game vẫn điều tra được và learning dùng memory-only; có status warning rõ, không overwrite raw. Bấm cancel recovery cũng memory-only. Chưa có migration learning version khác vì schema đầu tiên; không nhận arbitrary future version.
- Profile/context catalogue hiện chỉ Case #001; validation rejects refs không hợp lệ của catalogue đã đăng ký, không tự lọc mất tiến độ. Multi-case catalogue compatibility là việc phải mở rộng trước khi thêm case mới.
- Autosave writes được serialize để snapshot cũ không ghi sau snapshot mới; profile, mode và tutorial flag lưu atomically trong một record. Rapid clicks/mode changes không rollback persistent state. Không save transient popup.
- Loading/error learning không làm case save hỏng hoặc bật fresh-case flow. Recovery confirmation UI có copy riêng để phân biệt phạm vi reset.

## 9. Verification và acceptance

- Content tests: đủ 20 target lemmas, required definitions/translations/examples, refs/duplicate/overlap/bounds/surface forms, branch translations không đổi condition/effect/copy/truth; build gate propagates invalid content.
- Pure engine tests: unknown→seen, context dedupe/new context, no promotion by clicks, immutable input, timestamps/invalid refs rollback, inspect/translation counters/events và no hidden encounters.
- Store/adapter tests: actual visible evidence/node only, reconnect/StrictMode idempotent, popup transient, no Phaser dependency, no caseState/profile duplication, mode không sửa progress hoặc case effects.
- Persistence tests: round trip profile/mode/tutorial; missing/corrupt/future version; backup-before-reset, failures no overwrite; sequential write ordering; case schema 1→2 migration Phase 5 vẫn pass.
- App/E2E: mở Meeting Minutes/Anna có underlined words; hover không inspect; click/Enter/Space popup; VI theo ba modes; Escape hai cấp và focus fallback; J/E/WASD locks; notebook chỉ encountered; reload giữ counts/stage/mode; unseen conditional David không track; canvas vẫn một instance và không console error.
- Negative E2E: hỏng learning record không mất case evidence/interview, chỉ reset learning qua confirmation; inspect nhiều lần không thành mastered.
- Chạy thực `npm run lint`, `npm run test`, `npm run build`, typecheck/format, E2E/memory checks, git diff --check trước báo implementation xong. Backend không đổi.

Acceptance Phase 6 phương án A: vocab_seen được track từ reading context; click word hiển thị definition; notebook/profile/mode còn sau refresh; không hardcode words trong UI; mọi stage được biểu diễn đúng contract, gameplay chỉ nâng stage khi có đủ bằng chứng (hiện tại tối đa seen).

## 10. Review và bước tiếp theo

Người dùng đã duyệt **phương án A/seen-only**, plan sáu task và chọn thực thi inline. Implementation Phase 6 đã hoàn thành trong managed worktree; verification và code review được ghi tại `docs/ai/2026-09-28-phase-6-learning-engine-verification.md`. Thay đổi hiện chỉ có trong local commits của worktree, chưa push hoặc tích hợp vào `dev`.
