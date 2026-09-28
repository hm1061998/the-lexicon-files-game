---
schema_version: 1
updated_at: 2026-09-28T21:00:00+07:00
phase: phase-2
status: proposed
result_commit: f618bec
active_spec: docs/superpowers/specs/2026-09-28-phase-2-react-hud-integration-design.md
active_plan: docs/superpowers/plans/2026-09-28-phase-2-react-hud-integration.md
---

## Metadata

- Schema version 1; snapshot được duy trì bằng Git.

## Current Phase

- Phase 2 — React HUD Integration (roadmap §21); Phase 1 đã hoàn thành.

## Active Goal

- HUD React (objective, hồ sơ, prompt, key hints, pause) nối Phaser qua bus + Zustand.

## Current Status

- Spec Phase 2 đã duyệt; plan 5 task đã viết, chờ người dùng review và chọn cách thực thi.

## Completed

- Phase 0A, Phase 0B hoàn thành (xem Git history).
- Task 1 `c9dc6e3`: Zod scene schema, loader, `main_office.json`.
- Task 2 `326be6a`: typed event bus.
- Task 3 `cb1dccc`: system thuần input/direction/depth/interaction.
- Task 4 `bff9dd8`: WorldScene data-driven, placeholder texture, collision, depth, camera, debug hook dev, panel lỗi content.
- Task 5 `cc29bae`: InteractionTracker, marker đỏ, event nearby/cleared.
- Final fix `f618bec`: WASD không bị Phaser nuốt khi gõ input; counter debug chỉ ở dev.

## In Progress

- Không có hạng mục đang mở.

## Active Decisions

- WASD theo trục màn hình; placeholder hình học runtime (art thật ở Phase 11); Arcade Physics collider chữ nhật.
- Một `wall_back` ngang thay cho cặp tường trái/phải trong spec §4.
- `fps.panicMax: 0` để tránh Phaser cap delta lúc khởi động.
- Debug hook `window.__lexiconDebug` chỉ có ở dev (thêm `teleport`, `nearbyEvents`).
- Phase 2: UI tiếng Việt từ content; store Zustand per-mount là nguồn UI; key hints chỉ E và Esc.
- Deferred minor: registry cast chưa guard, `depthOf` trả NaN với id lạ, formatIssue thiếu expected/received, test không được tsc typecheck, CORS chưa test preflight.

## Blockers

- Không có blocker hiện tại.

## Next Actions

- Người dùng review plan Phase 2 và chọn Subagent-driven hoặc Native.

## Verification

- `npm run lint` — PASS 7 project.
- `npm run test` — PASS 7 project.
- `npm run build` — PASS; không có `__lexiconDebug` trong dist.
- `npm run format:check` — PASS.
- `npm run test:e2e` — PASS 10/10.
- `npm run memory:check` — PASS.

## Latest Handoff

- Phase 1 xong; HUD có thể nghe `interaction:nearby`/`interaction:cleared` từ bus tạo trong `GameCanvas`.

## Required Reading

- `AGENTS.md`
- `docs/superpowers/specs/2026-09-28-phase-1-game-world-prototype-design.md`
- `docs/superpowers/plans/2026-09-28-phase-1-game-world-prototype.md`
