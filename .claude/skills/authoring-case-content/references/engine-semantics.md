# Ngữ nghĩa engine liên quan đến content

Đối chiếu với code ngày 02/10/2026. Nếu code đổi, cập nhật file này và `scripts/check-case-flow.mjs`.

## Trạng thái (`createCaseState`)

- Objective `initialObjectiveId` → `active`; còn lại lấy `initialStatus` hoặc `locked`.
- Bắt đầu không có evidence, fact, flag, contradiction, timeline.

## `applyEffects` (game-core/src/effect/applyEffects.ts)

- Áp effect theo thứ tự trong batch. **Lỗi ở bất kỳ effect nào → trả state gốc**, mọi effect khác trong batch bị bỏ.
- Lỗi: evidence/fact/objective không tồn tại; `activateObjective` hoặc `completeObjective` lên objective đã `completed`; `completeObjective` lên objective không `active`.
- `activateObjective` lên objective đang `active` là no-op hợp lệ.
- Sau batch: lặp mở mọi fact có `unlockCondition` đúng cho đến khi ổn định.

## Điều kiện

- `evaluateCondition`: `flag` so sánh `flags[key] === value` (chưa đặt = `undefined`, khác `false`).
- `dialogueRunner.allowed` (điều kiện node, choice): `flag` coi chưa đặt là `false`; các loại khác dùng `evaluateCondition`.

## Hội thoại (`dialogueRunner`)

- Bắt đầu: node entry phải thỏa điều kiện; áp `entry.effects`, rồi `reconcileDialogueProgress`.
- Chọn choice: cần node hiện tại, choice và node đích đều thỏa điều kiện; áp `choice.effects + target.effects` thành **một batch**, rồi reconcile.
- Batch lỗi → `effectFailed`, người chơi đứng yên ở node cũ.

## `reconcileDialogueProgress` — chạy sau bước hội thoại, khi load save và trong `submitContradiction` (trước và sau khi hoàn thành so sánh); KHÔNG chạy sau khi nhặt evidence

1. Tree chưa có `completionFlag` mà `completionCondition` đúng → `setFlag completionFlag`.
2. Objective `locked` có `activationCondition` đúng → `active`.
3. Objective `active` có `completionCondition` đúng → `completed`.

Không chạy sau: interaction scene (`applyCaseEffects`), `answerListeningTask`, `submitContradiction`, `placeTimelineEvent`, `submitAccusation`.

## Interaction scene (apps/game-web/src/bridge/connectCaseEngine.ts)

- Ưu tiên: `npcId` (mở hội thoại) > `transition` (đổi scene) > `effects`.
- `interactionEligibility`: interaction có `addEvidence` bị ẩn khi đã có **bất kỳ** evidence nào trong đó.
- `cue.visibleWhen` chỉ ảnh hưởng hiển thị marker, không chặn tương tác.

## Listening (`answerListeningTask`)

- Trả lời đúng → áp `correctEffects` (một batch). `evidenceId` phải là evidence loại `audio`.

## Contradiction (`submitContradiction`)

- Cần cả hai fact đã mở. Đúng → batch `[setFlag david_contradiction_found, completeObjective objectiveId]`; objective phải `active`.
- Chọn sai → `correct: false`, state không đổi (không phạt).

## Timeline (`placeTimelineEvent`)

- Event `requiresFacts` chỉ đặt được khi đủ fact. Đặt sai slot → `correct: false`, không phạt.

## Accusation (`submitAccusation`)

- Nghi phạm phải thuộc `conclusion.suspectNpcIds`; `conclusion.objectiveId` phải `active`.
- Sai → state không đổi, được thử lại. Đúng → complete objective + `case_closed`.
