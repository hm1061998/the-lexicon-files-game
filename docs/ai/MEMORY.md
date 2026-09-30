---
schema_version: 1
updated_at: 2026-09-30T11:07:00+07:00
phase: phase-11d
status: in_progress
result_commit: ba337b9
active_spec: docs/ai/2026-09-30-phase-11d-user-feedback-backlog.md
active_plan: none
---

## Metadata

- Snapshot duy trì bằng Git; Phase 11C Task 5 commit `9ef78aa`, verification Task 6 commit `ba337b9`; memory commit kế tiếp. Task 4 WIP (`9ee5011`, `7306b1d`) chưa được xác nhận đạt yêu cầu, bố cục được xem lại trong Phase 11D.

## Current Phase

- Phase 11C Task 5–6 đã hoàn tất trên `dev`; Task 4 WIP được chuyển sang điều chỉnh trong Phase 11D, không được tính đạt. Đang bắt đầu thiết kế Phase 11D theo backlog tiếng Việt; spec cần người dùng duyệt trước khi lập plan. Phase 12 chưa bắt đầu.

## Active Goal

- Thiết kế rồi thực hiện Phase 11D theo `docs/ai/2026-09-30-phase-11d-user-feedback-backlog.md`: thu gọn/bố trí scene, đặt vật chứng trên bàn, đưa cửa lên tường, tên và hướng NPC, nhịp thở. Chờ duyệt spec rồi plan trước code.

## Current Status

- Phase 11C Task 1 HUD chrome (`0f916c2`, sửa `2113a70`), Task 2 prompt/outline (`196cd85`, sửa `687b48f`), Task 3 engine (`a4670bb`) đã commit. Task 4 layout WIP (`9ee5011`, `7306b1d`) chưa đạt mong đợi, chuyển sang 11D. Task 5 commit `9ef78aa`; Task 6 ledger `ba337b9`. Gate và so sánh ảnh ở `docs/ai/2026-09-30-phase-11c-verification.md`.
- Điều khoản OpenAI cho ảnh nhân vật ChatGPT đã được chủ dự án xác nhận (chat 2026-09-30, commit `71ac432`); các commit Phase 11C mới hiện chỉ ở local `dev`, chưa push.
- Phase 11B: manifest texture theo scene trong `packages/game-content`; tường thẳng + nội thất; ảnh evidence trong modal; paper overlay CSS; marker/terminal/hằng số/transcript/lint/test hook; sheet đi bộ 8x4 (tạm, sinh bằng code) + hoạt ảnh theo frame; minimap phím `M`. Gate PASS (lint/test/build/typecheck/format/E2E 67 x2 không flaky/memory/unittest 25); ledger `docs/ai/2026-09-30-phase-11b-verification.md` (có đối chiếu concept và sai lệch).
- Scene còn khác concept: game 2D trục thẳng, concept isometric; sàn rộng, nội thất thưa, meeting minutes cạnh bàn thay vì trên mặt bàn, cửa đứng trên sàn. Phase 11D backlog ghi đủ feedback.
- Font nội dung `Cambria, "Times New Roman", Georgia, serif`; đã xác nhận dấu thanh tiếng Việt hiển thị đúng.

## Completed

- Phase 0A–4 trong Git history; Phase 5 `f4ac2be`; Phase 6, 7 có ledger trong `docs/ai/`.
- Phase 8 `3c67c11`; Phase 9 (ledger `docs/ai/2026-09-29-phase-9-case-completion-verification.md`); Phase 10 `1eb5f5e..e222ce4`; Phase 11 `10a5865..9075670`.
- Phase 11B `cd1428f..62ed46e`: manifest, tường/nội thất, evidence art, overlay CSS, dọn deferred, walk animation, minimap, verification.
- Phase 11C Task 5 `9ef78aa` và Task 6 verification `ba337b9`; full evidence trong ledger.

## In Progress

- Phase 11D design đang chờ người dùng duyệt hướng tiếp cận trong chat. Chưa viết spec/plan và chưa sửa code Phase 11D.

## Active Decisions

- Tuân theo product truth docs/01–03 và `docs/architecture/ARCHITECTURE.md`; mâu thuẫn tài liệu thì hỏi. Spec và plan viết tiếng Việt (AGENTS.md). Chỉ npm + Nx, không thêm dependency nếu native đủ.
- Người dùng tự merge `dev` vào `main`; không hỏi hay đề xuất merge. Ưu tiên tối ưu token: subagent sonnet cho task, opus chỉ final review, prompt ngắn trỏ file brief, gộp task nhỏ.
- `game-core`/`learning-engine` TS thuần; UI qua store/event; không hardcode Case #001 trong React/Phaser; gameplay local-first, không API.
- Save case V4, IndexedDB `lexicon-game-saves` v1; `lexicon-learning` v1 (record V2); `lexicon-settings` v1. Case đóng: store chặn di chuyển, sổ tay, pause, minimap và ghi tiến độ. Playwright worker = 1; E2E cần dev server; commerce mặc định `free`.
- Font hệ thống, ngăn xếp serif; palette khóa theo `docs/art/06` §5; đỏ chỉ cho clue/evidence/objective/contradiction/marker.
- Art: ảnh AI do người dùng tạo, xử lý bằng `tools/art-codegen` (`.venv-art-codegen`, ignored) ra PNG trong `assets/`; `assets/_incoming/` không commit; `paper_grain_cream_tile_1024.png` là nguồn. Python unittest 35 pass; arm swing bị bỏ vì tay dính silhouette thân.
- Texture manifest = trường `textures` của scene JSON; `characterSheets`/`sharedTextures` ở `case.json` (CaseDefinition), đều trong `packages/game-content`; tải theo scene (`loadSceneTextures`); `loader.timeout` 15 s.
- Paper overlay world là CSS `.game-paper-overlay`; hoạt ảnh đi bộ không bị "Giảm chuyển động" tắt (phản hồi chức năng); anim key `actor_action_direction` (`player_walk_se`).
- Minor ngoài phạm vi còn lại: input trong lúc tải scene, hook dev `requestTransition` bỏ qua store, hoạt ảnh đi tại chỗ khi va chạm, prompt chưa có FPS GPU thật.

## Blockers

- Chờ người dùng duyệt hướng Phase 11D trước khi viết spec; đây là cổng thiết kế trong `.agents/skills/brainstorming/SKILL.md` và workflow AGENTS.md.

## Next Actions

- Duyệt hướng thiết kế Phase 11D trong chat.
- Sau khi duyệt hướng, viết spec tiếng Việt; xin duyệt spec trước khi lập plan.
- Viết và xin duyệt implementation plan Phase 11D trước khi code.
- Thực hiện Phase 11D theo từng nhóm trong plan; giữ 2D top-down, gameplay/content IDs và product rules ổn định.
- Phase 12 chờ chỉ đạo sau 11D.

## Verification

- Phase 11C Task 5/6 (`9ef78aa`, ledger `ba337b9`): lint, 381 tests, build, typecheck, format, memory, diff-check PASS; Python 35 OK; scene-layout 32/32 ×2; E2E 89/89 ×2. Backend không đổi. So sánh concept và sai lệch còn lại tại `docs/ai/2026-09-30-phase-11c-verification.md`.

## Latest Handoff

- Tiếp tục Phase 11D: chốt thiết kế với người dùng, sau đó spec review → plan review → implementation theo từng phase gate.

## Required Reading

- `AGENTS.md`, `apps/game-web/AGENTS.md`, `docs/ai/README.md`.
- `docs/superpowers/plans/2026-09-30-phase-11b-backlog-and-character-motion.md`; `docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md`; `docs/art/07_AI_ASSET_PROMPT_PACK.md`; `docs/concept/README.md`.
