# Soạn hội thoại bằng YAML

`dialogues.json` của một case **được sinh ra** từ `packages/game-content/cases/<case>/dialogues/<tree-id>.yaml` (mỗi NPC một file, tên file = `dialogueTreeId` trong `npcs.json`). Không sửa tay `dialogues.json`: `npm run case:build -- <case-id> --check` (chạy trong `npm run test`) sẽ báo lệch.

## Quy trình

1. Viết hoặc sửa file YAML của cây.
2. `npm run case:build -- <case-id>`: biên dịch toàn bộ cây, in lỗi kèm `file:dòng:cột`, ghi `dialogues.json` nếu không có lỗi (có lỗi thì `dialogues.json` giữ nguyên).
3. `npm run test -w @lexicon/game-content` (Zod, validator tham chiếu) rồi `node .claude/skills/authoring-case-content/scripts/check-case-flow.mjs <case-id>`.
4. Đọc lại theo guardrail trong `SKILL.md`; giao `case-solvability-checker`.

Chuyển một case cũ có sẵn `dialogues.json` sang YAML: `npm run case:import -- <case-id>` (thêm `--force` để ghi đè YAML đã có).

## Mẫu một cây

```yaml
tree: anna_delivery # id cây
npc: anna # chủ cây, cũng là người nói mặc định
done: anna_interviewed # completionFlag
finish: [anna_address_question_done, anna_schedule_question_done] # tất cả cờ phải true
notes: # notebookStatements: node -> cờ (hoặc điều kiện) để node được ghi vào sổ
  checked_address: anna_address_checked_read
nodes:
  entry:
    say: 'I prepared the delivery for Harper & Co. What would you like to check?'
    vi: 'Tôi chuẩn bị chuyến giao hàng cho Harper & Co. Bạn muốn kiểm tra điều gì?'
    ask:
      - id: check_address
        say: 'What address did you check at 16:10?'
        vi: 'Bạn kiểm tra địa chỉ nào lúc 16:10?'
        to: checked_address
      - id: confirm_chat
        say: 'Your message says 14. Can you confirm that?'
        vi: 'Tin nhắn của bạn ghi số 14. Bạn xác nhận được không?'
        to: chat_confirmation
        needs: [evidence chat_messages]
  checked_address:
    say: 'I checked the [address] when I [signed] the [package] into the mail room.'
    vi: 'Tôi kiểm tra địa chỉ khi ký nhận gói hàng vào phòng thư.'
    do: [set anna_address_checked_read]
    ask:
      - id: continue
        say: Continue asking
        vi: Tiếp tục hỏi
        to: entry
        do: [set anna_address_question_done]
```

## Khóa

| Cấp | Khóa | Thành |
| --- | --- | --- |
| cây | `tree`, `npc`, `done` | `id`, `npcId`, `completionFlag` (bắt buộc) |
| cây | `finish` | `completionCondition`: danh sách cờ (tất cả `true`) hoặc dạng `needs`; bắt buộc |
| cây | `notes` | `notebookStatements`: `node: cờ` hoặc `node: <needs>` |
| cây | `entry` | `entryNodeId` (mặc định node đầu tiên) |
| cây | `nodes` | bảng `id node` -> node |
| node | `say`, `vi` | `text`, `translationVi` |
| node | `speaker` | `speakerId` (mặc định `npc`) |
| node | `needs`, `do` | `condition`, `effects` của node |
| node | `ask` | `choices`; không có `ask` thì node là `terminal` |
| node | `audio` | đi qua nguyên dạng (`url`, `textSha256`) |
| node | `spans: []` | giữ `vocabularySpans: []` (khóa có mặt, rỗng) của dữ liệu cũ |
| lựa chọn | `id`, `say`, `vi`, `to`, `needs`, `do` | `id`, `text`, `translationVi`, `nextNodeId`, `condition`, `effects` |

`do` (giữ đúng thứ tự): `set <cờ>`, `clear <cờ>` (đặt `false`), `give <evidenceId>`, `unlock <factId>`, `activate <objectiveId>`, `complete <objectiveId>`.

`needs`: danh sách `evidence <id>`, `fact <id>`, `objective <id>` (đã hoàn thành), `flag <cờ>` (đúng `true`), `no-flag <cờ>` (`false`). Một mục là điều kiện đơn; nhiều mục là "tất cả". Nhóm tường minh: `{ any: [...] }` hoặc `{ all: [...] }`, kể cả `all` một mục; nhóm lồng được trong danh sách.

Viết câu thoại trong **dấu nháy đơn** (`say: 'I checked the [address].'`): YAML hiểu câu bắt đầu bằng `[` là danh sách và hiểu `\[` trong nháy kép là ký tự thoát của YAML. Đặt nháy đơn quanh câu có `[từ]` hoặc `: `; viết `''` cho một dấu nháy đơn thật.

Từ vựng: viết `[từ]` trong `say` của **node** (lời của lựa chọn không đánh dấu từ vựng). Công cụ tra `vocabulary.json` theo `lemma` và `surfaceForms` (không phân biệt hoa thường), tự tính offset và bỏ ngoặc. Chọn tường minh bằng `[chữ|vocab_id]`. Ký tự `[` thật: `\[`.

## Mã lỗi và cách sửa

| Mã | Mức | Ý nghĩa và cách sửa |
| --- | --- | --- |
| `yaml-syntax` | lỗi | YAML sai cú pháp (thụt lề, dấu nháy, dấu hai chấm trong câu, câu bắt đầu bằng `[`: đặt câu trong dấu nháy đơn) |
| `duplicate-key` | lỗi | cùng một khóa (kể cả id node) viết hai lần trong một bảng |
| `unknown-key` | lỗi | khóa lạ; xem gợi ý "ý bạn là" |
| `bad-form` | lỗi | `do`/`needs` sai dạng, thiếu khóa bắt buộc, giá trị sai kiểu (id/say/to phải là chuỗi), `ask` không phải danh sách, id node là số nguyên (đặt tên có chữ), `spans` khác `[]`, `[ ]` trong lời lựa chọn |
| `unknown-node` | lỗi | `to` hoặc `entry` trỏ node không tồn tại |
| `duplicate-id` | lỗi | node hoặc lựa chọn trùng id trong cùng cây/node |
| `unknown-word` | lỗi | từ trong `[ ]` không có trong `vocabulary.json`: thêm mục hoặc bỏ ngoặc |
| `ambiguous-word` | lỗi | một chữ khớp nhiều mục: chọn bằng `[chữ\|id]` |
| `unknown-ref` | lỗi | evidence/fact/objective không có trong JSON của case |
| `missing-tree` | lỗi | NPC có `dialogueTreeId` nhưng thiếu file YAML |
| `unused-tree` | lỗi | có file `dialogues/*.yaml` mà không NPC nào trong `npcs.json` dùng |
| `tree-mismatch` | lỗi | `tree:` hoặc `npc:` trong file khác với `dialogueTreeId` / NPC trong `npcs.json` |
| `orphan-node` | cảnh báo | không lựa chọn nào trỏ tới node |
| `flag-never-set` | cảnh báo | cờ được đọc mà không nơi nào đặt (trong cây, các cây khác hoặc JSON của case) |
| `flag-never-read` | cảnh báo | cờ được đặt mà không điều kiện nào đọc |

Cảnh báo không làm build thất bại, nhưng đọc từng cái: cờ chỉ được đọc nhưng không ai đặt thường là lỗi gõ tên.
