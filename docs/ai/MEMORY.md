---
schema_version: 1
updated_at: 2026-09-29T23:59:00+07:00
phase: phase-11
status: proposed
result_commit: 21c879c
active_spec: docs/superpowers/specs/2026-09-29-phase-11-visual-polish-design.md
active_plan: docs/superpowers/plans/2026-09-29-phase-10-persistence-settings.md
---

## Metadata

- Snapshot duy trì bằng Git; `result_commit` là commit kết quả gần nhất trước lần cập nhật memory này. `active_plan` vẫn trỏ plan Phase 10 vì **chưa có plan Phase 11**.

## Current Phase

- Phase 11 — Visual Polish (roadmap §30). Phase 0A–10 đã hoàn tất trên `dev`; người dùng tự merge `main`.

## Active Goal

- Phần A: visual polish bằng code (token, paper overlay, UI cổ điển, chuyển cảnh, sửa marker). Phần B: tích hợp art AI do người dùng tạo.

## Current Status

- Spec Phase 11 Phần A đã viết (`docs/superpowers/specs/2026-09-29-phase-11-visual-polish-design.md`), **chờ người dùng duyệt**; sau đó lập plan tiếng Việt bằng writing-plans. Chưa có code Phase 11.
- Art: đã có `docs/art/07_AI_ASSET_PROMPT_PACK.md` (STYLE_LOCK + prompt 3 mức ưu tiên) và `assets/PROVENANCE.md`; thư mục `assets/_incoming/` chờ người dùng bỏ ảnh AI vào, chưa có ảnh nào.
- Gate cuối Phase 10 (commit `e222ce4`): lint/test/build/typecheck/format/E2E 40 PASS; xem `docs/ai/2026-09-29-phase-10-persistence-settings-verification.md`.

## Completed

- Phase 0A–4 trong Git history; Phase 5 `f4ac2be`; Phase 6, 7 có verification ledger trong `docs/ai/`.
- Phase 8 `3c67c11` (timeline, contradiction, Archive, save V3); Phase 9 (buộc tội, CASE CLOSED, save V4; ledger `docs/ai/2026-09-29-phase-9-case-completion-verification.md`); nút "Xem lại" evidence trong notebook `7ef61fd`.
- Phase 10 `1eb5f5e..e222ce4`: Settings (`lexicon-settings`), learning V2, áp dụng âm lượng/phụ đề/giảm chuyển động, test auto-save; `translationMode` chỉ còn trong Settings.

## In Progress

- Chờ người dùng duyệt spec Phase 11 Phần A. Song song, người dùng tự tạo ảnh bằng app AI miễn phí theo `docs/art/07` (phiên khác/tay người dùng).

## Active Decisions

- Tuân theo product truth docs/01–03 và `docs/architecture/ARCHITECTURE.md`; mâu thuẫn tài liệu thì hỏi. Spec và plan viết tiếng Việt (AGENTS.md). Chỉ npm + Nx, không thêm dependency nếu native đủ.
- Người dùng tự merge `dev` vào `main`; không hỏi hay đề xuất merge. Ưu tiên tối ưu token: subagent sonnet cho task, opus chỉ final review, prompt ngắn trỏ file brief, gộp task nhỏ.
- `game-core`/`learning-engine` TS thuần; UI qua store/event; không hardcode Case #001 trong React/Phaser; gameplay local-first, không API.
- Save case V4, IndexedDB `lexicon-game-saves` v1; `lexicon-learning` v1 (record V2); `lexicon-settings` v1; hợp đồng lịch sử `cases/case-001/save-v*.json`. Case đóng: store chặn di chuyển, sổ tay, pause và ghi tiến độ.
- Font: hệ thống, ngăn xếp serif (không dependency); palette khóa theo `docs/art/06` §5; đỏ chỉ cho clue/evidence/objective/contradiction/marker.
- Art: người dùng tạo ảnh thủ công bằng công cụ AI miễn phí. Máy chưa có khóa API tạo ảnh và trợ lý không nhập khóa thay người dùng; Intel UHD, 16 GB RAM, không Python nên không chạy Stable Diffusion cục bộ; Pollinations bị loại (401, giới hạn, giấy phép mờ). Tải file từ dịch vụ bên thứ ba cần người dùng cho phép.
- Phase 11 chia A (code, không cần ảnh) và B (tích hợp ảnh; spec/plan chỉ lập sau khi có ảnh trong `assets/_incoming/`). Placeholder giữ cho asset không đạt.
- Playwright worker = 1; E2E cần dev server; commerce config mặc định `free`, không paywall.
- Deferred minor: marker tương tác chưa từng nổi (tween bị `updateNearby` ghi đè từ Phase 1 — Phase 11 A sẽ sửa); on+Learning hiện transcript hai lần; thiếu test hook âm lượng/StrictMode boot; Esc/`unknownSuspect`/feedback đọc lại; palette.css↔palette.ts đồng bộ tay (Phase 11 A thêm test); warning lint cũ `GameCanvas.tsx` `initialSceneId`.

## Blockers

- Không có blocker cho Phần A. Phần B bị chặn tới khi người dùng đưa ảnh vào `assets/_incoming/`.

## Next Actions

- Người dùng duyệt (hoặc sửa) spec Phase 11 Phần A → lập plan bằng writing-plans → thực thi (đề xuất subagent-driven, tiết kiệm token).
- Khi có ảnh: đọc `docs/art/07` mục 5–6 và spec Phase 11 §5 để tách nền, chuẩn hóa, tích hợp (Phần B).
- Chỉ làm Phase 11; không tự tiến sang Phase 12.

## Verification

- Phase 10 (`e222ce4`, sau `npx nx reset`): lint 0 lỗi; test game-web 266, game-content 94, game-core 49; build 162 modules; typecheck, format, E2E 40, memory check, `git diff --check` PASS.
- Sau đó chỉ thêm tài liệu/asset khung: spec Phase 11, `docs/art/07`, `assets/PROVENANCE.md`; chưa chạy lại gate cho các commit tài liệu ngoài `memory:check` và `git diff --check`.

## Latest Handoff

- Phiên sau đọc `AGENTS.md`, file này, spec Phase 11, rồi `git log`/`git status`. Hỏi người dùng đã duyệt spec chưa và đã có ảnh trong `assets/_incoming/` chưa; không tự bắt đầu code khi spec chưa duyệt.

## Required Reading

- `AGENTS.md`, `apps/game-web/AGENTS.md`, `docs/ai/README.md`.
- `docs/superpowers/specs/2026-09-29-phase-11-visual-polish-design.md`; `docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md`; `docs/art/07_AI_ASSET_PROMPT_PACK.md`; `docs/concept/README.md`.
