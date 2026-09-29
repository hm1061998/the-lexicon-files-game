---
schema_version: 1
updated_at: 2026-09-29T23:59:59+07:00
phase: phase-11
status: complete
result_commit: 9075670
active_spec: docs/superpowers/specs/2026-09-29-phase-11-visual-polish-design.md
active_plan: docs/superpowers/plans/2026-09-29-phase-11-visual-polish.md
---

## Metadata

- Snapshot duy trì bằng Git; `result_commit` là commit code cuối của Phase 11 (sau đó chỉ có commit tài liệu/memory).

## Current Phase

- Phase 11 — Visual Polish (roadmap §30) **hoàn tất** trên `dev`. Phase 0A–11 đã xong; người dùng tự merge `main`. Chưa bắt đầu Phase 12.

## Active Goal

- Chờ chỉ đạo: Phase 12 chưa được yêu cầu. Việc còn lại của Phase 11 là các deferred minor (xem Active Decisions).

## Current Status

- Phase 11 A+B đã triển khai: token/palette, paper overlay, UI cổ điển, marker nổi, fade chuyển cảnh, pipeline asset (`tools/art-codegen`, `assets/`) và texture PNG đã xử lý tích hợp vào scene. Gate PASS (lint/test/build/typecheck/format/E2E 49/memory); ledger `docs/ai/2026-09-29-phase-11-visual-polish-verification.md`.
- Scene chưa giống concept: tường vẫn placeholder `ph_wall`, ít nội thất, không minimap. Art AI đã xử lý (gồm nhân vật ChatGPT, `public/assets/characters/**`) **đã commit trên `dev` cục bộ, chưa push**; chỉ `assets/_incoming/` (ảnh thô) giữ cục bộ. Xác nhận điều khoản OpenAI của chủ dự án là **bắt buộc trước merge/push**.
- Font nội dung đổi sang `Cambria, "Times New Roman", Georgia, serif` vì Georgia vẽ sai dấu thanh tiếng Việt trên Windows.

## Completed

- Phase 0A–4 trong Git history; Phase 5 `f4ac2be`; Phase 6, 7 có verification ledger trong `docs/ai/`.
- Phase 8 `3c67c11` (timeline, contradiction, Archive, save V3); Phase 9 (buộc tội, CASE CLOSED, save V4; ledger `docs/ai/2026-09-29-phase-9-case-completion-verification.md`); nút "Xem lại" evidence trong notebook `7ef61fd`.
- Phase 10 `1eb5f5e..e222ce4`: Settings (`lexicon-settings`), learning V2, áp dụng âm lượng/phụ đề/giảm chuyển động, test auto-save.
- Phase 11 `10a5865..9075670`: visual polish, pipeline art, tích hợp texture, sửa font nút pause, format file provenance; ledger Phase 11.

## In Progress

- Không có việc đang dở.

## Active Decisions

- Tuân theo product truth docs/01–03 và `docs/architecture/ARCHITECTURE.md`; mâu thuẫn tài liệu thì hỏi. Spec và plan viết tiếng Việt (AGENTS.md). Chỉ npm + Nx, không thêm dependency nếu native đủ.
- Người dùng tự merge `dev` vào `main`; không hỏi hay đề xuất merge. Ưu tiên tối ưu token: subagent sonnet cho task, opus chỉ final review, prompt ngắn trỏ file brief, gộp task nhỏ.
- `game-core`/`learning-engine` TS thuần; UI qua store/event; không hardcode Case #001 trong React/Phaser; gameplay local-first, không API.
- Save case V4, IndexedDB `lexicon-game-saves` v1; `lexicon-learning` v1 (record V2); `lexicon-settings` v1. Case đóng: store chặn di chuyển, sổ tay, pause và ghi tiến độ. Playwright worker = 1; E2E cần dev server; commerce mặc định `free`.
- Font: hệ thống, ngăn xếp serif (không dependency); palette khóa theo `docs/art/06` §5; đỏ chỉ cho clue/evidence/objective/contradiction/marker.
- Art: ảnh AI do người dùng tạo, xử lý bằng `tools/art-codegen` (Python venv ngoài repo, Pillow/numpy/scipy) ra PNG (không phải WebP) trong `assets/`; scene asset có trường tùy chọn `scale`. `assets/_incoming/` giữ cục bộ, không commit.
- Deferred minor (art): tường AI là tấm chéo không dùng được nên scene vẫn `ph_wall` — cần tạo lại ảnh tường; ảnh evidence opaque nền gỗ chưa dùng trong modal; chưa có animation đi bộ.
- Sai lệch chấp nhận: `TEXTURE_MANIFEST` nằm trong game-web (hardcode id Case #001, preload ~9.6 MB lúc boot); follow-up chuyển sang manifest theo scene trong `packages/game-content`.
- Deferred minor (code): paper overlay làm FPS giảm trên GL phần mềm (đo lại trên GPU thật, cân nhắc overlay rẻ hơn); marker vẽ trên ngực player ở terminal archive; terminal `depthBias -2` chưa giải thích; hằng `CHARACTER_FIGURE_HEIGHT` = 100 là số ma thuật.
- Deferred minor (cũ): on+Learning hiện transcript hai lần; thiếu test hook âm lượng/StrictMode boot; Esc/`unknownSuspect`/feedback đọc lại; warning lint cũ `GameCanvas.tsx` `initialSceneId`; test E2E reduced-motion chưa assert giá trị nền.

## Blockers

- Không có blocker.

## Next Actions

- **Trước merge/push:** chủ dự án xác nhận điều khoản đầu ra OpenAI cho ảnh nhân vật ChatGPT đã commit (nếu không đạt phải gỡ/thay).
- Người dùng review/merge `dev`; chờ yêu cầu Phase 12 (không tự bắt đầu).
- Tạo lại ảnh tường (không phải tấm chéo) theo `docs/art/07` rồi thay `ph_wall`.
- Chuyển texture manifest sang `packages/game-content` theo scene, tải theo scene.
- Đo lại FPS paper overlay trên GPU thật và xác nhận dấu tiếng Việt với Cambria.

## Verification

- Phase 11 (`9075670`): lint 0 lỗi; test game-web 286 (các package khác PASS từ cache Nx); build, typecheck, format:check, E2E 49, memory:check, `git diff --check` PASS. Đối chiếu concept bằng ảnh chụp đã xem: HUD/UI gần tinh thần concept, scene chưa giống (xem ledger).

## Latest Handoff

- Phiên sau đọc `AGENTS.md`, file này, ledger Phase 11, rồi `git log`/`git status`. Chờ người dùng chỉ định phase kế tiếp hoặc việc deferred; không tự làm Phase 12.

## Required Reading

- `AGENTS.md`, `apps/game-web/AGENTS.md`, `docs/ai/README.md`.
- `docs/superpowers/specs/2026-09-29-phase-11-visual-polish-design.md`; `docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md`; `docs/art/07_AI_ASSET_PROMPT_PACK.md`; `docs/concept/README.md`.
