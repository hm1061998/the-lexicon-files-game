---
schema_version: 1
updated_at: 2026-09-30T23:59:59+07:00
phase: phase-11b
status: complete
result_commit: 62ed46e
active_spec: docs/superpowers/specs/2026-09-29-phase-11-visual-polish-design.md
active_plan: docs/superpowers/plans/2026-09-30-phase-11b-backlog-and-character-motion.md
---

## Metadata

- Snapshot duy trì bằng Git; `result_commit` là commit code/verification cuối của Phase 11B (sau đó chỉ có commit tài liệu/memory).

## Current Phase

- Phase 11B — backlog Phase 11 + chuyển động nhân vật + minimap **hoàn tất** trên `dev` (plan `2026-09-30-phase-11b-backlog-and-character-motion.md`). Phase 0A–11B xong; người dùng tự merge `main`. Chưa bắt đầu Phase 12.

## Active Goal

- Chờ chỉ đạo: Phase 12 chưa được yêu cầu.

## Current Status

- Phase 11B: manifest texture theo scene trong `packages/game-content`; tường thẳng + nội thất; ảnh evidence trong modal; paper overlay CSS; marker/terminal/hằng số/transcript/lint/test hook; sheet đi bộ 8x4 (tạm, sinh bằng code) + hoạt ảnh theo frame; minimap phím `M`. Gate PASS (lint/test/build/typecheck/format/E2E 67 x2 không flaky/memory/unittest 25); ledger `docs/ai/2026-09-30-phase-11b-verification.md` (có đối chiếu concept và sai lệch).
- Scene vẫn chưa giống concept (thưa nội thất, không phòng phân vùng/nhãn phòng, control pause/sổ tay dùng style trình duyệt). Art AI (gồm nhân vật ChatGPT) đã commit trên `dev` cục bộ, chưa push; `assets/_incoming/` giữ cục bộ. Điều khoản OpenAI của chủ dự án là **bắt buộc trước merge/push**.
- Font nội dung `Cambria, "Times New Roman", Georgia, serif`; đã xác nhận dấu thanh tiếng Việt hiển thị đúng.

## Completed

- Phase 0A–4 trong Git history; Phase 5 `f4ac2be`; Phase 6, 7 có ledger trong `docs/ai/`.
- Phase 8 `3c67c11`; Phase 9 (ledger `docs/ai/2026-09-29-phase-9-case-completion-verification.md`); Phase 10 `1eb5f5e..e222ce4`; Phase 11 `10a5865..9075670`.
- Phase 11B `cd1428f..62ed46e`: manifest, tường/nội thất, evidence art, overlay CSS, dọn deferred, walk animation, minimap, verification.

## In Progress

- Không có việc đang dở.

## Active Decisions

- Tuân theo product truth docs/01–03 và `docs/architecture/ARCHITECTURE.md`; mâu thuẫn tài liệu thì hỏi. Spec và plan viết tiếng Việt (AGENTS.md). Chỉ npm + Nx, không thêm dependency nếu native đủ.
- Người dùng tự merge `dev` vào `main`; không hỏi hay đề xuất merge. Ưu tiên tối ưu token: subagent sonnet cho task, opus chỉ final review, prompt ngắn trỏ file brief, gộp task nhỏ.
- `game-core`/`learning-engine` TS thuần; UI qua store/event; không hardcode Case #001 trong React/Phaser; gameplay local-first, không API.
- Save case V4, IndexedDB `lexicon-game-saves` v1; `lexicon-learning` v1 (record V2); `lexicon-settings` v1. Case đóng: store chặn di chuyển, sổ tay, pause, minimap và ghi tiến độ. Playwright worker = 1; E2E cần dev server; commerce mặc định `free`.
- Font hệ thống, ngăn xếp serif; palette khóa theo `docs/art/06` §5; đỏ chỉ cho clue/evidence/objective/contradiction/marker.
- Art: ảnh AI do người dùng tạo, xử lý bằng `tools/art-codegen` (Python venv ngoài repo) ra PNG trong `assets/`; `assets/_incoming/` không commit; `paper_grain_cream_tile_1024.png` commit (script sinh đã mất, file là nguồn).
- Texture manifest = trường `textures`/`characterSheets` của scene JSON trong `packages/game-content`, tải theo scene (`loadSceneTextures`); `loader.timeout` 15 s.
- Paper overlay world là CSS `.game-paper-overlay`; hoạt ảnh đi bộ không bị "Giảm chuyển động" tắt (phản hồi chức năng); anim key `actor_action_direction` (`player_walk_se`).
- Khung đi bộ hiện là sheet **tạm** sinh bằng code (`tools/art-codegen/make_walk_frames.py`); sheet thật thay cùng tên file theo `docs/art/07` §Walk sheet bằng `slice_walk_sheet.py`, không sửa code.
- Minor còn treo (ngoài phạm vi): warning lint `GameCanvas.tsx` `initialSceneId`; E2E reduced-motion chưa assert nền; minimap bán kính marker hardcode cho world ~2400, aria-label đơn giản; test overlap minimap chỉ ở 1280x720; scene-layout E2E chậm (+1.5 phút); 404 texture E2E chưa assert placeholder; `loadSceneTextures` không settle nếu shutdown giữa chừng; `imageAsset`/`image` trùng trong schema evidence, thiếu test onError; hộp thoại prompt cần viền đỏ quanh vật; chưa có FPS GPU thật.

## Blockers

- Không có blocker.

## Next Actions

- **Trước merge/push:** chủ dự án xác nhận điều khoản đầu ra OpenAI cho ảnh nhân vật ChatGPT đã commit (nếu không đạt phải gỡ/thay).
- Người dùng review/merge `dev`; chờ yêu cầu Phase 12 (không tự bắt đầu).
- Tạo walk sheet thật (8x4) theo `docs/art/07` §Walk sheet, chạy `slice_walk_sheet.py`, thay file cùng tên.
- Làm giàu scene theo concept: nội thất dày hơn, phòng phân vùng/nhãn phòng, style lại select/slider/checkbox trong pause và sổ tay.
- Dọn các minor còn treo (xem Active Decisions).

## Verification

- Phase 11B (`62ed46e`, code `db0a189`): lint, test (game-web 335), build, typecheck, format:check, memory:check, `git diff --check` PASS; E2E 67 passed hai lần liên tiếp; art-codegen unittest 25 OK. Backend không đổi. Đã xem ảnh chụp và đối chiếu concept: cùng tinh thần HUD, scene chưa giống (xem ledger).

## Latest Handoff

- Phiên sau đọc `AGENTS.md`, file này, ledger `docs/ai/2026-09-30-phase-11b-verification.md`, rồi `git log`/`git status`. Chờ người dùng chỉ định phase kế tiếp hoặc việc deferred; không tự làm Phase 12.

## Required Reading

- `AGENTS.md`, `apps/game-web/AGENTS.md`, `docs/ai/README.md`.
- `docs/superpowers/plans/2026-09-30-phase-11b-backlog-and-character-motion.md`; `docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md`; `docs/art/07_AI_ASSET_PROMPT_PACK.md`; `docs/concept/README.md`.
