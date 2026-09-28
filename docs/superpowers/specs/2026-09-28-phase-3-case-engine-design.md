# Phase 3 — Thiết kế Case Engine

Trạng thái: người dùng đã chọn ranh giới package cách 2 ngày 2026-09-28; đang chờ duyệt spec. Triển khai roadmap `docs/04_CODEX_IMPLEMENTATION_ROADMAP.md` §22. Ranh giới kiến trúc theo `docs/architecture/ARCHITECTURE.md` §§1–4 và `AGENTS.md` gốc.

## 1. Mục tiêu và tiêu chí nghiệm thu

Xây nền tảng content-driven cho Case #001 và case engine thuần framework để khởi tạo state, kích hoạt/hoàn thành objective, đánh giá condition và mở fact. Case data không nằm trong React hoặc Phaser.

Tiêu chí nghiệm thu:

- `game-content` nạp và validate một case hoàn chỉnh từ các file JSON đã đăng ký, bao gồm tham chiếu giữa case, scene, evidence, fact và objective.
- `game-core` nhận definition đã validate qua tham số và tạo state transition cùng domain event; không import content JSON hoặc framework UI/runtime.
- Objective state và fact mà HUD hiển thị lấy từ game state/reducer, không bị nhân đôi thành giá trị khởi tạo riêng trong React store.
- Unit test bao phủ content hợp lệ/không hợp lệ, đánh giá condition, chuyển trạng thái objective, mở fact và kiểm tra import không phụ thuộc framework.
- Content Case #001 được giữ tối thiểu: objective khởi đầu hiện có, một cặp evidence/fact đại diện và tham chiếu scene Main Office. Đây là dữ liệu để kiểm tra contract/test, chưa phải bộ content đầy đủ của vertical slice.

## 2. Ranh giới package

Giữ chiều phụ thuộc hiện tại:

```text
shared-types  ←  game-content (Zod + JSON)
      ↑
  game-core
      ↑
 apps/game-web (bridge/store/HUD)
```

- `packages/shared-types` định nghĩa contract framework-free cho case, evidence, fact, objective, condition, effect, game state và domain event.
- `packages/game-content` sở hữu Zod schema, validate tham chiếu giữa các file, JSON Case #001 đã đăng ký và loader lắp thành `CaseDefinition`.
- `packages/game-core` sở hữu việc đánh giá condition và state transition thuần. Core nhận `CaseDefinition`; không import `game-content`, JSON, React, Phaser, Zustand, DOM hoặc IndexedDB.
- `apps/game-web` xử lý `interaction:triggered`, gọi core transition và đồng bộ state kết quả vào Zustand store theo từng lần mount. Phaser chỉ phát typed bus event; không chứa case logic.

## 3. Data contract và validation

Định nghĩa các shared type chỉ đọc (readonly):

- `CaseDefinition`: phần contract case thuộc Phase 3 gồm ID/tiêu đề, scene, evidence, fact, objective và `initialObjectiveId`. Các trường rộng hơn như NPC dialogue, contradiction và conclusion sẽ được thêm ở phase tương ứng trong roadmap.
- `EvidenceDefinition`: ID, case ID, tên, category, mô tả và danh sách fact liên quan; metadata asset/NPC/vocabulary tùy chọn theo game design document.
- `FactDefinition`: ID, nội dung, evidence nguồn và điều kiện mở khóa `Condition`.
- `ObjectiveDefinition`: ID và nội dung hiển thị. Trạng thái runtime (`locked`, `active`, `completed`) thuộc `GameState`; effect điều khiển việc chuyển trạng thái, không dùng callback trong content.
- `Condition`: discriminated union trong roadmap gồm `hasEvidence`, `hasFact`, `objectiveCompleted`, `flag`, `all`, `any`.
- `Effect`: discriminated union trong roadmap gồm `addEvidence`, `unlockFact`, `setFlag`, `activateObjective`, `completeObjective`.

`game-content` parse từng file bằng Zod strict rồi validate tham chiếu chéo: case ID, objective ban đầu, evidence/fact/objective ID, evidence nguồn của fact, scene ID, và các ID được nhúng trong condition/effect. Content sai phải ném `ContentValidationError` kèm nguồn và field path dễ đọc; không được âm thầm bỏ bản ghi lỗi.

Loader trả về một `CaseDefinition` đã lắp ghép cho engine. Loader không để lộ object JSON thô và engine không tự tìm file content.

## 4. State và hành vi engine

`createCaseState(definition)` tạo `GameState` mới: objective đầu tiên active, objective còn lại locked, evidence/fact/flag ban đầu rỗng. Collection trong state dùng array/record có thể serialize, không dùng mutable global state.

Engine thuần theo dạng `(state, input) → { state, events }`:

- `evaluateCondition(state, condition)` đánh giá đệ quy toàn bộ condition union; `all` rỗng trả true, `any` rỗng trả false.
- `applyEffects(state, effects)` áp dụng effect theo thứ tự rồi kiểm tra điều kiện mở fact trên state kết quả. Lặp lại effect đã đạt trạng thái tương ứng phải idempotent.
- Chỉ kích hoạt objective đã biết và chưa completed. Chỉ hoàn thành objective đang active. ID hoặc transition không hợp lệ trả kết quả lỗi có kiểu và không làm state thay đổi một phần.
- Fact chỉ mở một lần khi condition đúng; kết quả có domain event để consumer cập nhật HUD/notebook projection về sau.
- `addEvidence` là effect thuần của core để toàn bộ Effect union đã khai báo có thể thực thi. Phase này chưa thêm modal/notebook thu thập evidence cho người chơi và chưa nối mọi interactable evidence; các phần đó thuộc Phase 4.

Domain event được trả về cùng transition, không truy cập trực tiếp event bus. App bridge có thể phát event sau khi cập nhật state. Engine không đọc thời gian, random, browser storage hay Phaser object.

## 5. Tích hợp ứng dụng

Thay các giá trị objective/evidence khởi tạo độc lập trong HUD store bằng projection từ case state đã khởi tạo. Store tiếp tục được tạo theo từng lần mount `GameCanvas`. Thêm effect khai báo trong content cho interaction của objective note; app-side handler tra effect đó khi nhận `interaction:triggered` rồi gọi `game-core`. Phaser chỉ phát ID interactable, không biết case definition hay effect.

Trong phase này, objective note của Case #001 minh họa luồng objective/effect; cặp evidence/fact mẫu dùng để kiểm tra loader và unlock trong unit test. Scene JSON vẫn là scene definition được content loader lắp vào case definition. Không bao gồm evidence modal React, notebook, persistence, dialogue UI hoặc toàn bộ investigation progression.

## 6. Xử lý lỗi

- Lỗi parse/tham chiếu content dùng `ContentValidationError` và hiển thị được cho developer qua startup error surface hiện có.
- Input engine có tham chiếu ID không tồn tại trong definition phải báo lỗi rõ ràng và giữ nguyên state.
- Lặp unlock/add phải idempotent, không thêm ID hoặc domain event trùng.
- Strict schema và TypeScript exhaustive switch chặn condition/effect variant không biết; không dùng `eval` hoặc dispatch function bằng chuỗi tùy ý.

## 7. Kiểm thử

Vitest test đặt trong package tương ứng:

- `shared-types`: contract có thể import/sử dụng và public export ổn định.
- `game-content`: fixture hợp lệ, field sai và tham chiếu chéo hỏng; trọng tâm gồm initial objective không tồn tại, evidence nguồn bị thiếu và ID trong condition/effect không hợp lệ.
- `game-core`: khởi tạo mới, condition lá/all/any, effect theo thứ tự, quy tắc activate/complete, fact mở khi condition đúng, idempotency và state không đổi nếu transition không hợp lệ.
- `game-web`: interaction event gọi app handler, state projection cập nhật HUD và Phaser canvas vẫn mount khi store đổi.
- Giữ kiểm tra import framework-free trong `game-core`.

DoD của phase theo `AGENTS.md` gốc: chạy `npm run lint`, `npm run test`, `npm run build`; đồng thời chạy `npm run format:check`, `npm run test:e2e` và `npm run memory:check` như Phase 2. Ghi output thực tế trong plan/handoff; không tuyên bố pass nếu chưa chạy.

## 8. Ranh giới phạm vi

Bao gồm: shared data contract, content schema/loader, case state thuần cùng condition/effect/objective/fact behavior, fixture Case #001 tối thiểu và bridge/store projection cần cho luồng objective event.

Để sau: bộ evidence/fact/objective Case #001 đầy đủ, evidence modal/notebook, authoring đầy đủ cho interactable-evidence, dialogue runner, learning engine, contradiction, timeline, save/persistence và backend/API.
