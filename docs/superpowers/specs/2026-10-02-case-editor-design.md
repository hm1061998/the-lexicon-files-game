# Công cụ soạn case (Case Editor) — thiết kế

Ngày: 02/10/2026. Trạng thái: **chờ duyệt spec**. Sau khi duyệt mới chuyển sang `writing-plans`.

Phân loại theo `brainstorming`: **architectural** — app mới trong monorepo, đổi cách đăng ký case trong `game-content`.

Backlog: `PR-04` trong `docs/product/2026-10-02-product-review-and-direction.md` (RISK-4: "Chưa có công cụ soạn case; `dialogues.json` một case đã ~20 KB viết tay").

## 1. Mục tiêu và nguồn yêu cầu

**Mục tiêu:** người viết kịch bản **không biết code** soạn và sửa được một case trọn vẹn qua giao diện, không mở file JSON. Đầu ra vẫn là đúng các file JSON hiện có trong `packages/game-content/cases/<caseId>/`; Git vẫn là nguồn sự thật.

**Thành công khi:**

1. Người viết tạo được một case mới (ví dụ Case #003 trong `docs/narrative/2026-10-02-story-bible-season-1.md`) từ khung scene có sẵn, đến mức `check-case-flow` báo phá được và validator không còn lỗi, mà không sửa JSON tay.
2. Mở Case #001 hoặc #002 rồi xuất lại mà không sửa gì → mọi file **giống hệt từng byte** với bản trong Git.
3. Mọi lỗi chặn đều hiện bằng vị trí dễ hiểu (tiếng Việt) và đưa được người viết tới đúng ô cần sửa.
4. Không thêm loại Condition/Effect, không đổi schema content, không đổi luật sản phẩm, gameplay không phụ thuộc công cụ.

**Quyết định của người dùng trong phiên brainstorming (02/10/2026):**

- Hướng 1: công cụ chạy trên máy, ghi ra JSON; backend .NET không tham gia.
- Phạm vi: toàn bộ case **trừ bản đồ** (vị trí đồ vật, va chạm, tường, cửa).
- Hội thoại soạn dạng **danh sách thẻ + chạy thử**, không phải sơ đồ node kéo-thả hay cú pháp văn bản.
- Người dùng: **người viết kịch bản không biết code** (vẫn chạy trên máy có repo).
- Dựng thành **app riêng `apps/case-editor`** (React + Vite), không nằm trong `game-web`.

Nguồn: `docs/01_GAME_DESIGN_DOCUMENT.md` §11–§20, `docs/03_CASE_001_VERTICAL_SLICE_SPEC.md`, `docs/superpowers/specs/2026-10-02-case-002-design.md`, `docs/ai/2026-10-02-case-002-engine-generality.md`, `AGENTS.md` §3–§4, skill `authoring-case-content`.

## 2. Ngoài phạm vi

- Sửa hình học scene: vị trí, collision, footprint, tường, label, texture, spawn point (vẫn sửa JSON hoặc giữ nguyên khung đã sao chép).
- Sinh giọng đọc (`tools/audio-codegen`) và ảnh evidence (`tools/art-codegen`). Công cụ chỉ chọn đường dẫn asset đã có.
- Thao tác Git (commit, branch, push). Người viết xuất file, lập trình viên xem diff và commit.
- Nhiều người sửa cùng lúc, tài khoản, quyền; backend `apps/api`.
- Dịch tự động/AI; kiểm tra chính tả.
- Chạy công cụ ngoài máy dev, đóng gói phát hành, mobile.
- Loại Condition/Effect mới, field schema mới.

## 3. Hiện trạng liên quan

- Một case gồm `case.json`, `objectives.json`, `evidences.json`, `facts.json`, `contradictions.json`, `listening-tasks.json`, `npcs.json`, `dialogues.json`, `vocabulary.json`, `scenes/*.json` (Case #002: ~85 KB). Parse bằng Zod trong `packages/game-content/src/schema/*` (`parseCaseDefinition`), kiểm tra tham chiếu trong `src/validation/*`.
- Đăng ký case: `src/loader/loadCaseDefinition.ts` import tay từng file JSON của từng case vào `caseRegistry`; `REGISTERED_CASE_IDS = Object.keys(caseRegistry)`.
- Bằng chứng được nhặt qua **điểm tương tác trong scene**: asset `type: "interactable"` có `interaction.prompt`, `interaction.effects` (ví dụ `addEvidence`) hoặc `interaction.transition`, và `cue`.
- `vocabularySpans` dùng offset ký tự `start`/`end` gõ tay; skill có `scripts/suggest-vocab-spans.mjs`.
- `check-case-flow.mjs` (trong `.claude/skills/authoring-case-content/scripts/`, mirror ở `.agents/skills`) mô phỏng mọi hành động người chơi, có `--json` và `--cases-dir`.
- `game-core` có dialogue runner thuần TS: `startDialogue`, `getAvailableChoices`, `chooseDialogueChoice`.
- File case trong Git là LF, định dạng Prettier (`.prettierrc.json`: printWidth 100, `endOfLine: auto`).
- Stack sẵn có: React 18, Vite 5, Vitest 2, Playwright 1.48, Zod 3, npm workspaces + Nx.

## 4. Kiến trúc

```text
apps/case-editor                      (npm run editor → http://localhost:5174)
 ├─ src/ui/*        React: trang đầu, khung làm việc, các mục, bảng Kiểm tra
 ├─ src/model/*     module thuần TS (không React, không Node): ID, câu mẫu condition/effect,
 │                  span từ vựng, bảng tham chiếu, dịch lỗi, chuẩn hoá node kết thúc
 └─ server/*        Vite plugin (middleware Node, chỉ ở dev server)
      ├─ caseFiles   đọc/ghi packages/game-content/cases/<id>/
      ├─ drafts      .case-editor/drafts/<id>.json (gitignore)
      ├─ validate    gọi parseCaseDefinition + validator của @lexicon/game-content
      ├─ flowCheck   chạy check-case-flow.mjs --json --cases-dir <thư mục tạm>
      └─ registry    gọi script sinh caseRegistry.generated.ts
```

Ranh giới:

- `apps/case-editor` phụ thuộc `@lexicon/game-content`, `@lexicon/game-core`, `@lexicon/shared-types`. **Không package nào phụ thuộc ngược lại** vào case-editor; `game-web` không import gì từ đây.
- `src/model/*` thuần, test được bằng Vitest không cần DOM/Node FS.
- Server chỉ chấp nhận đường dẫn nằm trong `packages/game-content/cases/` và `.case-editor/drafts/`; từ chối `..`, đường dẫn tuyệt đối khác; chỉ lắng nghe `localhost`.
- Không có build production để triển khai. Target `build` của app chỉ để typecheck/bundle kiểm tra trong CI.

### 4.1. Mô hình dữ liệu trong editor

- Bản nháp (`CaseDraft`) giữ **đúng cấu trúc JSON hiện tại** của từng file (`{ case, objectives, evidences, facts, contradictions, listeningTasks, npcs, dialogues, vocabulary, scenes }`), không đặt định dạng trung gian. Trạng thái giao diện (mục đang mở, chế độ nâng cao) không nằm trong bản nháp.
- Thứ tự key và thứ tự phần tử được giữ nguyên khi sửa; phần tử mới thêm vào cuối mảng; object mới tạo theo thứ tự key giống phần tử đã có trong cùng file (hoặc thứ tự khai báo schema nếu file rỗng).

### 4.2. Luồng lưu

1. **Mở:** case đã đăng ký (đọc từ thư mục case) hoặc bản nháp còn dở. Nếu có cả hai và bản nháp cũ hơn file trong thư mục, hỏi người viết dùng bản nào.
2. **Lưu nháp tự động:** 3 giây sau thay đổi cuối, ghi `.case-editor/drafts/<id>.json`. Nháp sai/thiếu vẫn lưu được.
3. **Xuất vào game:** chỉ bật khi không còn lỗi 🔴. Ghi từng file bằng `JSON.stringify` + Prettier (cấu hình repo), LF, newline cuối file; chỉ ghi file có nội dung thay đổi. Sau khi ghi: chạy lại validate + flow check trên file thật và hiện kết quả; nếu case mới thì chạy script đăng ký (§4.3).
4. Ghi file theo kiểu an toàn: ghi file tạm cùng thư mục rồi đổi tên.

### 4.3. Đăng ký case bằng file sinh (thay đổi engine duy nhất)

- Tách `caseRegistry` khỏi `loadCaseDefinition.ts` sang `packages/game-content/src/loader/caseRegistry.generated.ts`, nội dung là các import JSON và object registry giống hệt cấu trúc hiện tại.
- Script `tools/case-registry` (Nx project, Node) quét `packages/game-content/cases/*/case.json`, đọc `sceneIds` để liệt kê file scene, sinh file trên theo thứ tự id case. Có chế độ `--check` (exit 1 nếu file đã commit lệch với file sinh) để chạy trong `test`/CI.
- `loadCaseDefinition.ts` import từ file sinh; hành vi, `REGISTERED_CASE_IDS` và thứ tự case không đổi. Test hiện có của `game-content` và E2E chọn case phải xanh không sửa kỳ vọng.

### 4.4. Chơi thử

Nút **Chơi thử** mở `http://localhost:5173` (dev server `game-web`, người dùng tự chạy `npm run dev`; nếu không kết nối được thì hiện hướng dẫn). Người viết chọn case ở màn chọn vụ án như người chơi. Không thêm tham số URL hay đường tắt vào game.

## 5. Màn hình

Giao diện tiếng Việt, kiểu công cụ gọn (không dùng phong cách diegetic của game), desktop ≥1280 px. Chuỗi UI của editor nằm trong `apps/case-editor/src/ui/strings.vi.ts`, không trộn vào `game-content/ui/vi.json`.

### 5.1. Trang đầu

- Danh sách case (lấy từ catalogue `game-content` + bản nháp chưa xuất), hiện tiêu đề, độ khó, CEFR, trạng thái ("Đã xuất" / "Có nháp chưa xuất" / "Chỉ là nháp").
- **Tạo case mới:** tiêu đề, id gợi ý (`case-003` tiếp theo), tier, CEFR từ–đến, số phút, mô tả `summaryVi`, chọn **khung scene** (sao chép toàn bộ scene, `sharedTextures`, `characterSheets` của #001 hoặc #002). Các interactable của khung giữ vị trí nhưng xoá `effects`/`cue` gắn evidence cũ; cửa (`transition`) giữ nguyên. NPC, evidence, fact… bắt đầu rỗng.

### 5.2. Khung làm việc

Cột trái: các mục. Giữa: form. Phải: bảng **Kiểm tra** luôn hiện (§6).

| Mục | Nội dung |
|-----|----------|
| Tổng quan | tiêu đề, `difficulty`, `briefing` (tối đa 6 dòng), `startSceneId`, `initialObjectiveId`, `evidenceTotal` (gợi ý = số evidence), nghi phạm và thủ phạm (`conclusion`) |
| Nhân vật | `npcs`: tên, vai trò; cây hội thoại tạo kèm |
| Bằng chứng | `evidences`: tên, loại, mô tả song ngữ, ảnh (chọn từ asset có sẵn), sự thật liên quan, NPC liên quan |
| Sự thật | `facts`: câu, nguồn evidence/hội thoại, điều kiện mở |
| Mâu thuẫn | `contradictions`: chọn đúng 2 sự thật, giải thích, mục tiêu |
| Mục tiêu | `objectives`: câu, trạng thái ban đầu, điều kiện kích hoạt, điều kiện hoàn thành |
| Timeline | `timeline.slots` (giờ HH:MM), `timeline.events` (câu, slot, địa điểm, người, nguồn, độ tin cậy, mở từ đầu / cần sự thật) |
| Hội thoại | §5.3 |
| Từ vựng | `vocabulary`: lemma, từ loại, CEFR, nghĩa Anh, nghĩa Việt, ví dụ, dạng xuất hiện (`surfaceForms`), tags; cảnh báo khi id trùng case khác mà nội dung khác (F-5) |
| Điểm tương tác | theo scene: liệt kê interactable; sửa `prompt`, chọn hành động (nhặt evidence / nói chuyện với NPC / sang scene–spawn), `cue` tự suy theo hành động; không sửa vị trí |
| Bài nghe | `listeningTasks`; chỉ hiện khi case có hoặc người viết bật; `audioAsset` chọn từ file có sẵn |

### 5.3. Hội thoại

- Chọn NPC → danh sách thẻ node theo thứ tự trong file; thẻ entry đánh dấu rõ.
- Mỗi thẻ: người nói, câu thoại + `translationVi`, điều kiện hiện thẻ, hiệu ứng khi tới thẻ, các lựa chọn. Mỗi lựa chọn: câu + dịch, **"Dẫn tới → [thẻ ▼ / + thẻ mới]"**, điều kiện, hiệu ứng.
- `terminal` tự suy: thẻ không có lựa chọn là kết thúc. Khi xuất, giá trị luôn khớp số lựa chọn (thoả refine của schema).
- `completionFlag`, `completionCondition`, `notebookStatements` sửa trong phần "Cài đặt cây hội thoại".
- **Chạy thử:** panel dùng `startDialogue` / `getAvailableChoices` / `chooseDialogueChoice` của `game-core` trên bản nháp. Có danh sách bật/tắt giả lập: evidence đang có, fact đã biết, mục tiêu đã xong, flag. Hiệu ứng của lựa chọn cập nhật giả lập khi chạy. Không ghi gì ra file.

### 5.4. Điều kiện và hiệu ứng bằng câu mẫu

- Condition: "đã có bằng chứng […]", "đã biết sự thật […]", "đã xong mục tiêu […]", "đánh dấu [flag] là [đúng/sai]", nhóm "**tất cả** / **một trong** các điều sau" (lồng được). Ánh xạ 1–1 với 6 loại trong `caseEngine.ts`.
- Effect: "thêm bằng chứng […]", "mở sự thật […]", "đặt đánh dấu [flag] = […]", "kích hoạt mục tiêu […]", "hoàn thành mục tiêu […]".
- Dropdown chỉ liệt kê id đang có trong case; flag gợi ý từ flag đã dùng trong case cộng flag engine (`case_closed`, `david_contradiction_found`), được gõ flag mới.

### 5.5. Từ vựng trong câu

- Bôi đen đoạn chữ trong ô tiếng Anh → menu "Gắn từ vựng → [chọn từ có sẵn / tạo từ mới]". Công cụ ghi `start`/`end` (đơn vị UTF-16 như chuỗi JS, khớp game hiện tại).
- Gợi ý tự động: chỗ khớp `surfaceForms` của từ đã khai báo mà chưa gắn, hiện gạch chân chấm; một click để gắn.
- Khi câu đổi: mỗi span tìm lại đoạn chữ cũ gần vị trí cũ nhất; tìm thấy thì cập nhật offset, không thấy thì bỏ span và hiện cảnh báo 🟡 "đã gỡ từ X vì câu đã đổi".
- Áp dụng cho mọi field có `vocabularySpans`: dòng briefing, mô tả evidence, node hội thoại.

### 5.6. Tham chiếu và đổi tên

- ID tự sinh từ tên (chữ thường, `_`, bỏ dấu tiếng Việt), thêm hậu tố `_2`, `_3` nếu trùng trong cùng loại. ID chỉ hiện và sửa được ở **chế độ nâng cao**.
- Mỗi evidence/fact/objective/NPC/node/từ vựng có khối "Được dùng ở đâu" liệt kê nơi tham chiếu (bấm để tới).
- Xoá thực thể đang được tham chiếu: hộp xác nhận liệt kê các chỗ sẽ bị lỗi; không tự xoá tham chiếu.
- Đổi ID (nâng cao): cập nhật mọi tham chiếu trong case, kể cả `cue.evidenceId` và `interaction.effects` trong scene. Không đổi ID của case đã xuất có save người chơi mà không cảnh báo (save/learning record dùng id).

## 6. Bảng Kiểm tra và thông báo lỗi

Chạy lại sau mỗi thay đổi (debounce 1 giây) trên bản nháp; flow check chạy trên bản sao bản nháp ghi vào thư mục tạm qua `--cases-dir`.

| Mức | Nguồn | Hệ quả |
|-----|-------|--------|
| 🔴 Chặn | lỗi Zod từ `parseCaseDefinition`, lỗi validator tham chiếu, ERROR của `check-case-flow`, id case trùng | khoá nút Xuất |
| 🟡 Cảnh báo | WARN của `check-case-flow`, thiếu `translationVi`, từ vựng khai báo nhưng không gắn ở đâu, span bị gỡ, `evidenceTotal` khác số evidence | không chặn |

- **Dịch vị trí:** đường dẫn issue (ví dụ `dialogues[0].nodes[3].choices[1].nextNodeId`) đổi thành "Hội thoại Anna › thẻ 'checked_address' › lựa chọn 2 › Dẫn tới", kèm nút **Đi tới** mở đúng mục và focus ô.
- **Dịch câu lỗi:** từ điển tiếng Việt cho các message đã biết (ví dụ "terminal nodes must have no choices…", "must reference exactly two distinct fact IDs", lỗi tham chiếu không tồn tại). Message chưa có trong từ điển hiện nguyên văn tiếng Anh kèm vị trí, **không bị ẩn**.
- **Kết luận phá án:** dòng đầu bảng: "Phá được vụ án: **Có** — nhặt được 6/6 bằng chứng, mở được 2/2 mâu thuẫn, mở được kết luận" hoặc "**Chưa** — …" với finding đầu tiên của flow check.
- Content load lỗi (file hỏng, JSON không parse được) → thông báo rõ file và dòng, không màn trắng (`AGENTS.md` §5).

## 7. Kiểm thử

- **Unit (Vitest, `src/model`)**: sinh và chống trùng ID; condition/effect ↔ câu mẫu (mọi loại, lồng `all`/`any`); tính lại span khi sửa câu (giữ, dịch, gỡ); dịch đường dẫn issue cho mọi file; bảng tham chiếu và đổi tên (kể cả scene); suy `terminal`; sao chép khung scene (xoá effect evidence, giữ cửa).
- **Roundtrip:** nạp Case #001 và #002 → xuất ra thư mục tạm → so sánh byte với file trong repo: giống hệt.
- **Server (Vitest, Node)**: đọc/ghi trong thư mục tạm; từ chối đường dẫn ngoài phạm vi; lưu nháp; từ chối xuất khi còn lỗi 🔴; ghi atomic; chỉ ghi file thay đổi.
- **Đăng ký case**: test script sinh registry từ thư mục fixture; `--check` chạy trong target `test` của `game-content` (hoặc project script) để CI bắt file sinh lệch; test và E2E hiện có xanh không đổi kỳ vọng.
- **E2E (Playwright, Chromium, project riêng của case-editor)**:
  1. Tạo case mới từ khung #002 → thêm NPC, evidence, fact, mâu thuẫn, mục tiêu, gắn evidence vào điểm tương tác → bảng Kiểm tra hiện lỗi → sửa → Xuất → kiểm tra file được ghi (thư mục cases trỏ tới thư mục tạm qua biến môi trường) và kết luận "Có".
  2. Mở Case #002 → Xuất không sửa → không file nào thay đổi.
  3. Gắn từ vựng bằng bôi đen, sửa câu, span được cập nhật.
- **DoD** theo `AGENTS.md` §7: `npm run lint`, `npm run test`, `npm run build`, `npm run format:check`, `npm run memory:check`; E2E case-editor; E2E `game-web` liên quan chọn case (vì registry đổi). Không đổi `apps/api`.

## 8. Tài liệu

- `apps/case-editor/README.md` (tiếng Việt, cho người viết): cài đặt một lần, `npm run editor`, quy trình nháp → kiểm tra → xuất → báo dev commit, chơi thử, các lỗi hay gặp.
- Cập nhật skill `authoring-case-content` (cả `.claude` và `.agents`) và `references/file-map.md`: đăng ký case qua script thay vì sửa tay `loadCaseDefinition.ts`.
- Cập nhật `README.md` gốc (mục lệnh) và `docs/ai/MEMORY.md` theo protocol.

## 9. Rủi ro

| Rủi ro | Giảm thiểu |
|--------|-----------|
| Xuất lại làm đổi định dạng file, diff rác | Test roundtrip byte; giữ thứ tự key; chỉ ghi file thay đổi |
| Editor và game hiểu dữ liệu khác nhau | Không có validator riêng: dùng chính `parseCaseDefinition`, validator và `game-core` runner |
| `check-case-flow` mirror theo commit cũ, lệch engine | Ghi rõ trong bảng Kiểm tra là heuristic; validator Zod vẫn là cổng chặn chính; lệch → cập nhật skill |
| Đổi registry làm vỡ game | Cấu trúc registry giữ nguyên; test + E2E chọn case; `--check` trong CI |
| Người viết đổi ID case đã có save | Chỉ ở chế độ nâng cao, có cảnh báo |
| Span từ vựng lệch với ký tự đặc biệt/emoji | Offset UTF-16 như game; test với dấu nháy cong, `é`, `&` |
| Phạm vi lan sang sửa bản đồ | §2; khung scene sao chép nguyên; vị trí không sửa được trong UI |
| Mount Windows CRLF / git lock (MEMORY) | Ghi LF cố định; ghi atomic; không chạy git từ editor |

## 10. Quyết định mặc định (xin duyệt cùng spec)

1. Cổng dev server editor: `5174`; script gốc `npm run editor` → `nx run @lexicon/case-editor:dev`.
2. Thư mục nháp `.case-editor/drafts/` ở gốc repo, thêm vào `.gitignore`.
3. Script đăng ký case đặt ở `tools/case-registry` (Nx project giống `tools/ai-memory`).
4. Thứ tự mặc định khi tạo mới: Tổng quan → Nhân vật → Bằng chứng → Sự thật → Mâu thuẫn → Mục tiêu → Hội thoại → Điểm tương tác → Timeline → Từ vựng; không ép, chỉ là thứ tự cột trái.
5. Không dùng thư viện UI/form nặng; React + CSS module. Dependency mới chỉ khi plan nêu lý do.
6. Triển khai chia task theo thứ tự: registry sinh → model thuần → server → khung UI + Tổng quan/Bằng chứng/Sự thật → Kiểm tra → Hội thoại + chạy thử → Điểm tương tác/Timeline/Từ vựng/Bài nghe → E2E + tài liệu.
