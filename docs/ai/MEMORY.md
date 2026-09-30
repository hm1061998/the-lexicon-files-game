---
schema_version: 1
updated_at: 2026-09-30T23:59:59+07:00
phase: phase-11c
status: blocked
result_commit: a4670bb
active_spec: docs/superpowers/specs/2026-09-29-phase-11-visual-polish-design.md
active_plan: docs/superpowers/plans/2026-09-30-phase-11c-concept-fidelity-and-cleanup.md
---

## Metadata

- Snapshot duy trì bằng Git; `result_commit` là commit code cuối đã hoàn tất của Phase 11C (Task 1–3); Task 4 đã bị dừng theo yêu cầu người dùng; mã `wip` của Task 4 (`9ee5011`, `7306b1d`) đã commit và push nhưng chưa test, chưa review.

## Current Phase

- Phase 11C — bám concept + dọn tồn đọng **đang thực hiện** trên `dev` (plan `2026-09-30-phase-11c-concept-fidelity-and-cleanup.md`, 6 task). Phase 0A–11B đã xong; người dùng tự merge `main`. Chưa bắt đầu Phase 12.

## Active Goal

- Hoàn tất Phase 11C: HUD/scene gần `docs/concept/ingame_main_office_hud.webp` (trong hệ 2D trục thẳng), rồi dọn tồn đọng test/asset/tài liệu và verification.

## Current Status

- Phase 11C tiến độ: Task 1 HUD chrome (`0f916c2`, sửa `2113a70`), Task 2 bong bóng prompt gắn vào vật + viền đỏ (`196cd85`, sửa `687b48f`), Task 3 độ bền engine (`a4670bb`) đã commit và qua review. Task 4 (tường ngăn, nhãn phòng `labels`, nội thất dày, minimap tường ngăn) **đã dừng theo yêu cầu người dùng** vì kết quả chưa đạt kỳ vọng; mã `wip` ở `9ee5011`/`7306b1d` (chưa chạy test, chưa review) đã push, nên coi là bản nháp chưa đảm bảo build/E2E. Task 5 (vệ sinh tồn đọng) và Task 6 (verification + memory) **chưa làm, chờ người dùng yêu cầu**.
- Điều khoản OpenAI cho ảnh nhân vật ChatGPT đã được chủ dự án xác nhận (chat 2026-09-30, commit `71ac432`); nhánh `dev` đã push lên `origin` (tới `9423fe4` + commit memory này).
- Phase 11B: manifest texture theo scene trong `packages/game-content`; tường thẳng + nội thất; ảnh evidence trong modal; paper overlay CSS; marker/terminal/hằng số/transcript/lint/test hook; sheet đi bộ 8x4 (tạm, sinh bằng code) + hoạt ảnh theo frame; minimap phím `M`. Gate PASS (lint/test/build/typecheck/format/E2E 67 x2 không flaky/memory/unittest 25); ledger `docs/ai/2026-09-30-phase-11b-verification.md` (có đối chiếu concept và sai lệch).
- Scene chưa giống concept về cấu trúc phòng (Task 4 bị dừng, người dùng chưa hài lòng — xem Phase 11D; concept isometric cắt lớp, game 2D trục thẳng nên vẫn khác cấu trúc).
- Font nội dung `Cambria, "Times New Roman", Georgia, serif`; đã xác nhận dấu thanh tiếng Việt hiển thị đúng.

## Completed

- Phase 0A–4 trong Git history; Phase 5 `f4ac2be`; Phase 6, 7 có ledger trong `docs/ai/`.
- Phase 8 `3c67c11`; Phase 9 (ledger `docs/ai/2026-09-29-phase-9-case-completion-verification.md`); Phase 10 `1eb5f5e..e222ce4`; Phase 11 `10a5865..9075670`.
- Phase 11B `cd1428f..62ed46e`: manifest, tường/nội thất, evidence art, overlay CSS, dọn deferred, walk animation, minimap, verification.

## In Progress

- Không có việc đang chạy. Phase 11C tạm dừng sau Task 3; Task 4 đã dừng, Task 5–6 chờ người dùng yêu cầu. Trước khi tiếp tục cần chạy `npm run test` và `npm run test:e2e` để biết mã `wip` Task 4 còn dùng được không (nếu không thì `git revert` hai commit `wip` hoặc làm lại theo Phase 11D).

## Active Decisions

- Tuân theo product truth docs/01–03 và `docs/architecture/ARCHITECTURE.md`; mâu thuẫn tài liệu thì hỏi. Spec và plan viết tiếng Việt (AGENTS.md). Chỉ npm + Nx, không thêm dependency nếu native đủ.
- Người dùng tự merge `dev` vào `main`; không hỏi hay đề xuất merge. Ưu tiên tối ưu token: subagent sonnet cho task, opus chỉ final review, prompt ngắn trỏ file brief, gộp task nhỏ.
- `game-core`/`learning-engine` TS thuần; UI qua store/event; không hardcode Case #001 trong React/Phaser; gameplay local-first, không API.
- Save case V4, IndexedDB `lexicon-game-saves` v1; `lexicon-learning` v1 (record V2); `lexicon-settings` v1. Case đóng: store chặn di chuyển, sổ tay, pause, minimap và ghi tiến độ. Playwright worker = 1; E2E cần dev server; commerce mặc định `free`.
- Font hệ thống, ngăn xếp serif; palette khóa theo `docs/art/06` §5; đỏ chỉ cho clue/evidence/objective/contradiction/marker.
- Art: ảnh AI do người dùng tạo, xử lý bằng `tools/art-codegen` (Python venv ngoài repo) ra PNG trong `assets/`; `assets/_incoming/` không commit; `paper_grain_cream_tile_1024.png` commit (script sinh đã mất, file là nguồn).
- Texture manifest = trường `textures` của scene JSON; `characterSheets`/`sharedTextures` ở `case.json` (CaseDefinition), đều trong `packages/game-content`; tải theo scene (`loadSceneTextures`); `loader.timeout` 15 s.
- Paper overlay world là CSS `.game-paper-overlay`; hoạt ảnh đi bộ không bị "Giảm chuyển động" tắt (phản hồi chức năng); anim key `actor_action_direction` (`player_walk_se`).
- Khung đi bộ hiện là sheet **tạm** sinh bằng code (`tools/art-codegen/make_walk_frames.py`); sheet thật thay cùng tên file theo `docs/art/07` §Walk sheet bằng `slice_walk_sheet.py`, không sửa code.
- Minor còn treo (ngoài phạm vi): input không khóa khi chuyển scene chờ tải texture (tới 15 s) nên prompt scene cũ có thể hiện; hook dev `requestTransition` bỏ qua store; 3 walk sheet NPC đã commit nhưng chưa dùng (`characterSheets` chỉ khai báo player); hoạt ảnh đi bộ chạy tại chỗ khi đẩy vào vật cản; `scene-layout.spec.ts` chậm (~1.5 phút), probe giữ phím yếu, cửa sổ 3 s không tiến triển có nguy cơ flaky; `paper_grain` 1.26 MB dùng làm nền CSS; minimap bán kính marker hardcode cho world ~2400, aria-label đơn giản, test overlap chỉ 1280x720; 404 texture E2E chưa assert placeholder; `loadSceneTextures` không settle nếu shutdown giữa chừng; `imageAsset`/`image` trùng trong schema evidence, thiếu test onError; prompt chưa có viền đỏ quanh vật; chưa có FPS GPU thật.

## Blockers

- Không có blocker.

## Next Actions

- **Chờ người dùng yêu cầu.** Không tự làm Task 5–6 của Phase 11C, không tự làm Phase 11D/Phase 12.
- Khi được yêu cầu: quyết định số phận mã `wip` Task 4 (kiểm test/E2E; giữ, sửa hoặc revert) rồi làm Phase 11D theo `docs/ai/2026-09-30-phase-11d-user-feedback-backlog.md` (phòng nhỏ hơn + nội thất logic, vật chứng trên bàn, cửa ra hành lang, tên NPC, NPC xoay hướng, nhịp thở).
- Sau đó Task 5 (vệ sinh: Ctrl/Alt/Meta cho WASD/E, aria minimap, paper texture nhỏ, bỏ sheet NPC không dùng, khung đi bộ có vung tay, triage minor Phase 10 cũ) và Task 6 (verification + đối chiếu concept + memory) của plan Phase 11C.
- Ledger SDD `.superpowers/sdd/2026-09-30-phase-11c-concept-fidelity-and-cleanup/progress.md` (git-ignored) có thể còn; nếu mất, dựa vào `git log` từ `5908b15`.
- Tạo walk sheet thật (8x4) theo `docs/art/07` §Walk sheet, chạy `slice_walk_sheet.py`, thay file cùng tên (tùy chọn); người dùng tự review/merge `dev`.

## Verification

- Phase 11B (`62ed46e`, code `db0a189`): lint, test (game-web 335), build, typecheck, format:check, memory:check, `git diff --check` PASS; E2E 67 passed hai lần liên tiếp; art-codegen unittest 25 OK. Backend không đổi. Đã xem ảnh chụp và đối chiếu concept: cùng tinh thần HUD, scene chưa giống (xem ledger).

## Latest Handoff

- Phiên sau đọc `AGENTS.md`, file này, ledger `docs/ai/2026-09-30-phase-11b-verification.md`, rồi `git log`/`git status`. Chờ người dùng chỉ định phase kế tiếp hoặc việc deferred; không tự làm Phase 12.

## Required Reading

- `AGENTS.md`, `apps/game-web/AGENTS.md`, `docs/ai/README.md`.
- `docs/superpowers/plans/2026-09-30-phase-11b-backlog-and-character-motion.md`; `docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md`; `docs/art/07_AI_ASSET_PROMPT_PACK.md`; `docs/concept/README.md`.
