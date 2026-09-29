---
schema_version: 1
updated_at: 2026-09-29T14:04:50+07:00
phase: phase-9
status: proposed
result_commit: c676982
active_spec: docs/superpowers/specs/2026-09-29-phase-9-case-completion-design.md
active_plan: docs/superpowers/plans/2026-09-29-phase-9-case-completion.md
---

## Metadata

- Snapshot duy trì bằng Git; `result_commit` là commit kết quả gần nhất trước lần cập nhật memory này.

## Current Phase

- Phase 9 — Case Completion (roadmap §28). Người dùng đã duyệt spec; plan đã tạo/commit và đang chờ review cùng lựa chọn cách thực thi. Chưa có code Phase 9.

## Active Goal

- Hoàn tất Case #001: buộc tội theo content/core, không mất tiến độ khi sai, đóng case đúng và hiện báo cáo case cùng chỉ số hồ sơ học tập.

## Current Status

- `dev` có spec `131122c` và plan `c676982`; `origin/dev` đang ở `3c67c11`. Phase 8 đã hoàn tất/push; Phase 9 artifacts đang ở local, chưa push.
- Phase 8: timeline/contradiction, Archive, save V3 migration, commerce provider trung lập mặc định `free`, notebook và E2E. Hoàn tất/push tại `3c67c11`.
- Phase 7 hoàn tất và push; user nghe audio và xác nhận test OK. Verification: `docs/ai/2026-09-29-phase-7-audio-listening-verification.md`.
- Phase 6 và Phase 5 hoàn tất; xem verification ledger tương ứng trong `docs/ai/`.

## Completed

- Phase 0A–4 đã có trong Git history.
- Phase 5 dialogue/NPC, validation, save V2 và UI/input; push `f4ac2be`.
- Phase 6 learning profile, notebook từ vựng, persistence riêng và recovery; verification `docs/ai/2026-09-28-phase-6-learning-engine-verification.md`.
- Phase 7 audio listening; verification và user audition đã được ghi nhận.
- Phase 8 spec/plan, implementation Task 1–6 và handoff đồng bộ với `origin/dev` tại `3c67c11`.
- Quy định spec và plan phải viết bằng tiếng Việt đã thêm vào `AGENTS.md` ở commit `3d6752d`.

## In Progress

- Phase 9 spec tại `docs/superpowers/specs/2026-09-29-phase-9-case-completion-design.md` đã được người dùng duyệt.
- Plan tại `docs/superpowers/plans/2026-09-29-phase-9-case-completion.md`, commit `c676982`; chờ người dùng review và chọn cách thực thi trước khi code.

## Active Decisions

- Tuân theo product truth trong docs/01–03 và dependency boundaries trong `docs/architecture/ARCHITECTURE.md`; khi tài liệu mâu thuẫn phải hỏi người dùng.
- Spec và implementation plan viết bằng tiếng Việt theo `AGENTS.md`.
- Dùng npm + Nx; không pnpm/yarn/bun. Không thêm dependency nếu native đủ dùng.
- `game-core`/`learning-engine` là TS thuần; UI gọi domain qua store/event boundary; không hardcode sự thật Case #001 trong React/Phaser.
- Gameplay local-first; không thêm API/backend cho Phase 9.
- Phase 9: user chọn hợp đồng kết luận trong case content, reducer thuần `game-core`, feedback sai riêng Case #001, không thay đổi state khi sai.
- Báo cáo Phase 9 dùng tiến độ case và chỉ số tổng hợp `LanguageProfile` hiện tại; phải ghi rõ số liệu học tập là toàn hồ sơ.
- Đề xuất Phase 9: save V4, giữ IndexedDB database version 1, di trú V1/V2/V3 và bảo toàn tiến độ.
- Commerce config Phase 8 trung lập, mặc định `free`; không paywall hoặc entitlement client-side.
- Playwright worker = 1 cho thao tác di chuyển theo frames.

## Blockers

- Chờ người dùng review plan Phase 9 và chọn cách thực thi; chưa bắt đầu code.

## Next Actions

- Người dùng review `docs/superpowers/plans/2026-09-29-phase-9-case-completion.md` và chọn native hoặc subagent-driven.
- Chỉ sau khi plan được duyệt mới dùng skill thực thi tương ứng.
- Chỉ làm Phase 9; không tiến sang phase khác nếu chưa được yêu cầu.
- Khi bàn giao, chạy các gate theo `AGENTS.md`, cập nhật verification và memory.

## Verification

- Spec Phase 9: người dùng duyệt; tự rà placeholder/nhất quán/phạm vi; `git diff --check` PASS trước commit `131122c`.
- Plan Phase 9: tự rà coverage, task interfaces, review focus và TDD; `git diff --check` PASS trước commit `c676982`.
- Phase 8 final: lint PASS (7 projects); test PASS (7 targets; game-web 173 tests); build PASS (147 modules; chunk-size warning); typecheck, format, E2E (36 tests/1 worker), memory check và `git diff --check` PASS. API/dependency/lockfile không đổi.
- Phase 7: lint, unit/content, build, typecheck, format, E2E (35 tests/1 worker), memory check và user audio audition PASS; push đã xác nhận.
- Backend checks chỉ cần khi Phase 9 sửa `apps/api`.

## Latest Handoff

- Phase 8 đã push và `dev` đồng bộ `origin/dev` tại `3c67c11`.
- Phase 9 spec đã được duyệt; plan commit local `c676982` và đang chờ user review/chọn execution method. Spec/plan chưa push; chưa có code.

## Required Reading

- `AGENTS.md`, `apps/game-web/AGENTS.md`, `docs/ai/README.md`.
- Active spec/plan theo metadata ở đầu file; plan Phase 9 chờ review.
- Docs/01–05, `docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md`, `docs/architecture/ARCHITECTURE.md` theo phạm vi phase.
- Phase 8 spec/plan cho save V3, reducer, content validation và ranh giới commerce.
