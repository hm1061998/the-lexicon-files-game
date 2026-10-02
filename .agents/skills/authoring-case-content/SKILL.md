---
name: authoring-case-content
description: Use when creating or editing a Lexicon Files case under packages/game-content/cases (case.json, dialogues, evidences, facts, objectives, contradictions, listening tasks, vocabulary, scenes), registering a new case, or when a case cannot be finished, an objective never activates, a contradiction or accusation is rejected, or dialogue choices silently do nothing.
---

# Soạn nội dung case (The Lexicon Files)

## Tổng quan

Case là **dữ liệu**, engine là **chung**. Zod và validator đã bắt lỗi cú pháp và tham chiếu ID. Chúng **không** bắt lỗi luồng chơi: objective không bao giờ mở, batch effect bị bỏ cả cụm, tiến độ chỉ cập nhật khi người chơi nói chuyện lại. Skill này bù phần đó.

**Nguyên tắc cốt lõi:** mọi thay đổi case phải qua được cả ba lớp kiểm tra — schema/validator, mô phỏng luồng chơi (`check-case-flow.mjs`), và đọc lại theo guardrail. Không sửa engine để chiều một case nếu content giải quyết được (PR-03); nếu buộc phải sửa, ghi vào báo cáo engine-generality trước khi commit.

## Khi nào dùng

- Viết case mới, thêm/sửa hội thoại, evidence, fact, objective, contradiction, timeline, listening task, vocabulary.
- Đăng ký case vào `loadCaseDefinition.ts` (import JSON + `caseRegistry`).
- Triệu chứng: case không kết thúc được; accusation báo `objectiveNotActive`; contradiction đúng mà không ghi nhận; choice bấm không có tác dụng (`effectFailed`); objective "tự hoàn thành" chỉ sau khi nói chuyện lại với NPC.

**Không dùng cho:** code engine trong `game-core` (dùng `test-driven-development`), UI React/Phaser, asset art/audio (`create-game-assets`, `audio-design`).

## Quy trình

1. **Đọc hợp đồng:** docs/03 (mẫu Case #001), spec của case trong `docs/superpowers/specs/`, `references/engine-semantics.md`.
2. **Thiết kế giấy trước JSON:** bảng sự thật (ai, lúc nào, ở đâu), danh sách evidence → fact → contradiction → nghi phạm. Mỗi kết luận đúng phải suy ra được **chỉ từ** evidence và lời khai; red herring phải có lời giải thích hợp lý.
3. **Viết JSON** theo `references/file-map.md`. ID dạng `snake_case`; tree id **duy nhất toàn dự án** (vd. `anna_delivery`, không dùng lại `anna_initial`) vì learning context `dialogue:<treeId>:<nodeId>:text` chưa gắn caseId (F-2).
4. **Kiểm tra:**
   ```bash
   npm run test -w @lexicon/game-content          # Zod + validator tham chiếu
   node .claude/skills/authoring-case-content/scripts/check-case-flow.mjs <case-id>
   node .claude/skills/authoring-case-content/scripts/suggest-vocab-spans.mjs <case-id>
   ```
   `check-case-flow` thoát mã 1 khi có `ERROR`. Mọi `WARN` phải được xử lý hoặc ghi lý do chấp nhận trong báo cáo.
5. **Đọc lại theo guardrail** (bảng dưới) và mức CEFR khai báo trong `difficulty.cefrRange`.
6. **Review độc lập:** giao agent `case-solvability-checker` (chỉ đọc) trước khi báo xong.

## Bẫy engine thường gặp (chi tiết: `references/engine-semantics.md`)

| Bẫy | Hệ quả | Cách tránh |
| --- | --- | --- |
| `completeObjective` khi objective còn `locked` hoặc đã `completed` | **Cả batch** (kể cả `addEvidence`, `setFlag` cùng cụm) bị bỏ; choice báo `effectFailed` mãi | Chỉ complete objective chắc chắn `active`; tách effect, hoặc dùng `completionCondition` |
| `activationCondition` / `completionCondition` của objective | Chỉ được đánh giá **sau một bước hội thoại** (hoặc khi load save), không sau khi nhặt evidence, trả lời listening hay nộp contradiction | Để bước cuối cùng mở objective là một node/choice hội thoại, hoặc chấp nhận và ghi rõ; `check-case-flow` báo `delayed-reconcile` |
| Contradiction nộp đúng | Engine `completeObjective(contradiction.objectiveId)`; objective đó phải `active` lúc nộp, nếu không bị từ chối | `activationCondition` của objective so sánh phải thỏa trước khi cả hai fact có mặt |
| Accusation | Cần `conclusion.objectiveId` đang `active` | Mở objective kết luận bằng điều kiện đạt được qua hội thoại |
| `flag` với `value: false` | Trong objective/fact: `undefined !== false` nên **không bao giờ đúng** nếu chưa có `setFlag false`. Trong hội thoại: flag chưa đặt được coi là `false` | Không dùng `value: false` ngoài điều kiện node/choice hội thoại |
| Fact | Tự mở ngay khi `unlockCondition` đúng sau bất kỳ batch nào; `unlockFact` chỉ là cổng phụ | Viết `unlockCondition` chính xác; fact phải có nguồn (`sourceEvidenceIds`/`sourceDialogueIds`) |
| Interaction có cả `transition` và `effects` | `effects` bị bỏ qua (thứ tự ưu tiên: `npcId` > `transition` > `effects`) | Tách thành hai asset |
| Interaction nhặt evidence | Bị ẩn sau khi đã có evidence đó | Không đặt effect quan trọng khác chung batch với `addEvidence` đã có từ nguồn khác |
| `submitContradiction` luôn ghi flag `david_contradiction_found` | Flag legacy của Case #001 | Không đọc flag này trong case mới |

## Guardrail nội dung (AGENTS.md §6, docs/01–02)

- Điều tra trước: không chuỗi Walk → Quiz → Reward; câu hỏi ngôn ngữ phải phục vụ điều tra.
- Sai → "This interpretation doesn't match the evidence." + gợi ý; chọn sai nghi phạm không reset tiến độ, không chữ "WRONG!".
- Hint giúp hiểu (định hướng → ngôn ngữ → đơn giản hóa → mạnh), không tự giải.
- Text/ID chỉ nằm trong `game-content`; không hardcode trong React/Phaser.
- Câu tiếng Anh đúng mức `cefrRange`; `translationVi` tự nhiên, không dịch máy từng chữ; vocabulary có `cefr`, `definitionEn`, ví dụ.
- Không bịa audio/voice: case không khai báo `audio` thì không node nào có `audio` (F-3).

## Sai lầm hay gặp

- Chỉ chạy `npm run test` rồi báo xong → luồng chơi chưa được kiểm.
- Copy cây hội thoại từ Case #001 giữ nguyên tree id hoặc flag (`anna_q1_read`) → trùng context học, trùng flag.
- `evidenceTotal` lệch số evidence thật: hiện là quy ước của Case #001 (5 vs 3), case mới nên khớp.
- Thêm loại Condition/Effect mới để tiện viết → đó là thay đổi engine, cần spec riêng.
