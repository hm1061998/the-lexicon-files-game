# PR-04 — Công cụ soạn hội thoại bằng YAML: thiết kế

Trạng thái: chờ duyệt (04/10/2026). Gói PR-04 trong `docs/product/2026-10-02-product-review-and-direction.md` (RISK-4). Chỉ làm phần hội thoại; các file case khác giữ nguyên.

## 1. Mục tiêu và tiêu chí xong

Soạn một cây hội thoại mới mà không phải sửa JSON tay: người soạn (dev hoặc agent) viết một file YAML ngắn, một lệnh sinh `dialogues.json`, và lỗi tham chiếu được báo kèm dòng/cột trong YAML.

Tiêu chí xong:

1. `dialogues.json` của Case #001 và #002 được tái tạo **giống hệt** từ YAML (so JSON sau khi qua prettier, bỏ qua kiểu xuống dòng).
2. Một cây thoại mới viết bằng YAML qua được Zod, `validateRegisteredContent` và `check-case-flow.mjs`, không cần chạm vào JSON.
3. Mọi lỗi tham chiếu thường gặp (node, từ vựng, evidence/fact/objective, khóa lạ) báo `đường/dẫn.yaml:dòng:cột` kèm gợi ý.
4. Dữ liệu runtime không đổi: game vẫn đọc JSON; E2E của hai case xanh như trước.

## 2. Hiện trạng

- `dialogues.json` của một case khoảng 18–20 KB: mỗi node lặp `speakerId`, `terminal`, `choices[]`, `effects[]`, `vocabularySpans` với offset UTF-16 tính tay, thêm `completionCondition` và `notebookStatements` theo từng cây.
- Tập khả năng nhỏ và đóng: 6 loại Condition (`hasEvidence`, `hasFact`, `objectiveCompleted`, `flag`, `all`, `any`) và 5 loại Effect (`addEvidence`, `unlockFact`, `setFlag`, `activateObjective`, `completeObjective`). Case #001 có 3 cây/15 node (mọi node có `audio`), Case #002 có 3 cây/11 node.
- Kiểm tra hiện có: Zod (`schema/dialogue.ts`), `validation/dialogueReferences.ts` và `notebookStatements.ts` (thông báo theo đường dẫn JSON, không có dòng), `check-case-flow.mjs` (luồng chơi), `suggest-vocab-spans.mjs`.
- `tools/ai-memory` là mẫu một dự án Nx dạng `.mjs` kiểm thử bằng `node --test`.

## 3. Phương án

| | Mô tả | Chọn? |
| --- | --- | --- |
| A | Bộ biên dịch `.mjs` trong dự án Nx `tools/case-authoring`, tự bắt lỗi tham chiếu có dòng/cột, thư viện `yaml` làm devDependency | **Chọn** |
| B | Viết bằng TypeScript trong `game-content`, CLI qua `vite-node` | Không: `vite-node` chưa khai báo trực tiếp, thêm ma sát |
| C | YAML phản chiếu 1:1 JSON, không rút gọn | Không: không giảm công soạn |

## 4. Thiết kế

### 4.1 Tệp và lệnh

- Nguồn: `packages/game-content/cases/<case>/dialogues/<tree-id>.yaml`, mỗi cây một file. Đầu ra: `dialogues.json` (commit), trình tự cây theo thứ tự `npcs.json`.
- `npm run case:build -- <case-id>`: biên dịch toàn bộ cây của case.
- `npm run case:build -- <case-id> --check`: không ghi, thoát mã 1 nếu `dialogues.json` lệch YAML (chặn sửa tay JSON).
- `npm run case:import -- <case-id>`: chạy một lần, biên dịch ngược `dialogues.json` ra các file YAML (dùng để chuyển Case #001/#002). Từ chối ghi đè YAML đã có trừ khi có `--force`.
- Test drift của hai case chạy trong `npm run test` (target `test` của dự án).
- Ghi file luôn dùng `\n`; so sánh chuẩn hóa EOL; JSON ghi ra được định dạng bằng prettier để khớp `format:check`.

### 4.2 Cú pháp YAML

```yaml
tree: anna_delivery        # id cây
npc: anna                  # chủ cây, cũng là người nói mặc định
done: anna_interviewed     # completionFlag
finish: [anna_address_question_done, anna_schedule_question_done]
                           # completionCondition = tất cả cờ true; điều kiện tổng quát dùng needs-form (4.3)
notes:                     # notebookStatements: node -> điều kiện ghi sổ
  checked_address: anna_address_checked_read
entry: entry               # entryNodeId (mặc định: node đầu tiên)
nodes:
  entry:
    say: "I prepared the delivery for [Harper & Co]. What would you like to check?"
    vi: "Tôi chuẩn bị chuyến giao hàng cho Harper & Co. Bạn muốn kiểm tra điều gì?"
    ask:
      - { id: check_address, say: "What address did you check at 16:10?",
          vi: "Bạn kiểm tra địa chỉ nào lúc 16:10?", to: checked_address }
      - { id: confirm_chat, say: "Your message says 14. Can you confirm that?",
          vi: "Tin nhắn của bạn ghi số 14.", to: chat_confirmation,
          needs: [evidence chat_messages] }
  checked_address:
    say: "I checked the [address] when I [signed] the [package] into the mail room."
    vi: "Tôi kiểm tra địa chỉ khi ký nhận gói hàng vào phòng thư."
    do: [set anna_address_checked_read]
    ask:
      - { id: continue, say: "Continue asking", vi: "Tiếp tục hỏi", to: entry,
          do: [set anna_address_question_done] }
  closing:                 # không có ask -> terminal: true
    say: "That is everything I know."
    speaker: anna          # tùy chọn: người nói khác chủ cây
    audio: { url: /audio/case-001/anna/anna_initial__entry.wav, textSha256: "1f51da8b…" }
                           # trường lạ (audio): đi qua nguyên dạng
```

Quy tắc:

- **Node:** khóa `say` (→ `text`), `vi` (→ `translationVi`), `speaker` (→ `speakerId`, mặc định `npc`), `needs` (điều kiện vào node), `do` (effects của node), `ask` (lựa chọn), `audio` (đi qua). `terminal` suy ra: không có `ask` thì `true`, có thì `false`.
- **Lựa chọn:** `id`, `say`, `vi`, `to` (→ `nextNodeId`), `needs`, `do`.
- **Từ vựng:** `[từ]` trong `say`. Bộ biên dịch tra `vocabulary.json` của case theo `lemma` và `surfaceForms` (không phân biệt hoa thường), tính offset UTF-16 của đoạn đã bỏ dấu ngoặc, sinh `vocabularySpans`, rồi bỏ `[` `]` khỏi `text`. Một từ ứng với nhiều mục thì lỗi, liệt kê ứng viên; chọn bằng `[chữ|vocab_id]`. Ký tự `[` thật trong câu viết `\[`.
- **Điều kiện** (`needs`, luôn là danh sách chuỗi hoặc một nhóm): `evidence <id>`, `fact <id>`, `objective <id>` (đã hoàn thành), `flag <key>` (giá trị true), `no-flag <key>` (giá trị false). Danh sách một phần tử cho ra điều kiện đơn; nhiều phần tử cho ra `{type:'all'}`. Nhóm tường minh: `needs: { any: [...] }` hoặc `{ all: [...] }`, kể cả `all` chỉ một phần tử (để biên dịch ngược giữ đúng hình dạng).
- **Hiệu ứng** (`do`, danh sách chuỗi giữ **đúng thứ tự**): `set <key>`, `clear <key>` (setFlag false), `give <evidenceId>`, `unlock <factId>`, `activate <objectiveId>`, `complete <objectiveId>`.
- **Cây:** `finish` danh sách cờ (tất cả true) hoặc điều kiện tổng quát dùng `needs`-form; `notes` ánh xạ node → cờ (hoặc điều kiện) cho `recordedCondition`.

Chuyển hình dạng sang JSON là xác định và không mất thông tin, nên `case:import` (JSON→YAML) rồi `case:build` cho ra đúng JSON ban đầu.

### 4.3 Bắt lỗi

Mọi thông báo có dạng `đường/dẫn.yaml:dòng:cột  mã  mô tả` kèm dòng gợi ý khi có. Lỗi làm lệnh thoát mã 1; cảnh báo (`warn`) chỉ in. Danh sách kiểm tra:

| Mã | Mức | Kiểm tra |
| --- | --- | --- |
| `yaml-syntax` | lỗi | YAML sai cú pháp |
| `unknown-key` | lỗi | khóa lạ ở cây, node, lựa chọn; gợi ý khóa gần nhất |
| `bad-form` | lỗi | chuỗi `do`/`needs` sai dạng (động từ lạ, thiếu tham số) |
| `unknown-node` | lỗi | `to` hoặc `entry` trỏ node không tồn tại |
| `duplicate-id` | lỗi | node hoặc lựa chọn trùng id trong cây |
| `unknown-word` | lỗi | từ trong `[ ]` không có trong vocabulary |
| `ambiguous-word` | lỗi | nhiều mục vocabulary phù hợp; liệt kê id |
| `unknown-ref` | lỗi | evidence/fact/objective không có trong JSON của case (khi file tồn tại) |
| `orphan-node` | cảnh báo | node không ai trỏ tới |
| `flag-never-set` / `flag-never-read` | cảnh báo | cờ được đọc mà không ai đặt, hoặc đặt mà không ai đọc |

Sau biên dịch, lớp kiểm tra cuối vẫn là Zod, `validateRegisteredContent` (qua `npm run test -w @lexicon/game-content`) và `check-case-flow.mjs`; bộ biên dịch không thay thế chúng.

### 4.4 Thành phần

`tools/case-authoring/` (dự án Nx `case-authoring`, targets `test`, `lint`, `check`):

- `src/parseDialogueYaml.mjs`: đọc YAML bằng `yaml` (giữ vị trí dòng/cột của từng nút), trả cây đã có vị trí.
- `src/compileDialogue.mjs`: rút gọn → JSON (suy `terminal`, tra từ vựng, mở rộng `needs`/`do`).
- `src/decompileDialogue.mjs`: JSON → YAML (cho `case:import`).
- `src/checkDialogue.mjs`: các kiểm tra ở 4.3.
- `src/cli.mjs`: `build`, `build --check`, `import`.
- `test/*.test.mjs`: `node --test`.

Dependency mới: `yaml` (devDependency ở workspace công cụ), lý do: bài toán parse YAML đã có lời giải chuẩn (ngoặc kép, dấu hai chấm trong câu thoại, xuống dòng, vị trí dòng/cột); chỉ dùng lúc soạn, không vào bundle game.

### 4.5 Cập nhật tài liệu và skill

- `.claude/skills/authoring-case-content/` và `.agents/skills/authoring-case-content/` (sửa cả hai): thêm bước "viết YAML → `case:build` → `check-case-flow`" và `references/dialogue-yaml.md` (cú pháp, mã lỗi).
- `apps/game-web/AGENTS.md` không đổi; `AGENTS.md` gốc thêm một dòng trỏ tới skill.
- MEMORY: phase `pr-04-case-authoring`, ghi lệnh mới.

## 5. Mockup đầu ra của công cụ

Build thành công:

```
$ npm run case:build -- case-002
case-002  dialogues/anna_delivery.yaml   4 node  → ok
case-002  dialogues/leo_delivery.yaml    4 node  → ok
case-002  dialogues/david_delivery.yaml  3 node  → ok
wrote packages/game-content/cases/case-002/dialogues.json (3 cây, 11 node)
warn  dialogues/anna_delivery.yaml:31:5  flag-never-read  "anna_chat_confirmation_read" được đặt nhưng không có điều kiện nào đọc
Tiếp theo: npm run test -w @lexicon/game-content
```

Lỗi tham chiếu (số liệu minh họa):

```
$ npm run case:build -- case-002
dialogues/anna_delivery.yaml:18:21  unknown-node  "to: checked_adress" không có node nào tên này
    ý bạn là: checked_address ?
dialogues/anna_delivery.yaml:9:44   unknown-word  "[Harper]" không có trong vocabulary.json của case-002
    thêm mục vocabulary hoặc bỏ dấu [ ]
dialogues/leo_delivery.yaml:22:15       ambiguous-word  "[sign]" khớp 2 mục: sign, sign_off
    chọn bằng [sign|sign]
dialogues/leo_delivery.yaml:27:9        unknown-ref  "give chat_mesages" không có evidence này
    ý bạn là: chat_messages ?
3 lỗi... build bị hủy, dialogues.json không đổi
```

Kiểm tra lệch (cổng trong `npm test`):

```
$ npm run case:build -- case-001 --check
FAIL  case-001/dialogues.json khác bản sinh từ YAML (cây "david_statement", node "answer1", trường text)
      sửa YAML rồi chạy lại: npm run case:build -- case-001
```

Chuyển hai case cũ:

```
$ npm run case:import -- case-001
wrote dialogues/anna_initial.yaml, leo_initial.yaml, david_initial.yaml
verify: case:build tái tạo dialogues.json giống hệt (3 cây, 15 node) → ok
```

## 6. Kiểm thử

- Mỗi rút gọn (`needs`, `do`, `[từ]`, `terminal`, `entry`, `notes`, `finish`, `audio`) có test biên dịch và biên dịch ngược.
- Mỗi mã lỗi ở 4.3 có test đỏ-trước kèm vị trí dòng/cột đúng.
- Round-trip trên dữ liệu thật: `dialogues.json` của Case #001 và #002 → YAML → JSON là đồng nhất; chạy trong `npm test`.
- `case:build --check` fail khi sửa tay một ký tự trong `dialogues.json`.
- Sau chuyển: `npm run test -w @lexicon/game-content`, `check-case-flow.mjs` cho cả hai case, và E2E `journey`, `case-002`, `notebook-people`, `dialogue` xanh như trước.

## 7. Ngoài phạm vi

evidence, fact, objective, contradiction, listening, scene, vocabulary vẫn sửa JSON; không thêm loại Condition/Effect; không giao diện đồ họa hoặc bảng tính; không đổi cách game tải nội dung.

## 8. Rủi ro

- Kết thúc dòng trên Windows: ghi `\n`, so sánh chuẩn hóa EOL; `format:check` đã chạy qua prettier.
- Biên dịch ngược gặp dữ liệu không vừa cú pháp (ví dụ vocabulary span chồng nhau, hoặc đoạn không khớp bất kỳ `surfaceForm`): `case:import` dừng và báo vị trí thay vì đoán; xử lý bằng dạng tường minh `[chữ|vocab_id]` hoặc, nếu cần, mở rộng cú pháp bằng spec nhỏ.
- `yaml` phiên bản mới đổi thứ tự khóa: không ảnh hưởng vì thứ tự đầu ra do bộ biên dịch quyết định.
