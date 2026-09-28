---
schema_version: 1
updated_at: 2026-09-28T14:44:00+07:00
phase: phase-3
status: in_progress
result_commit: 7f9ca6b
active_spec: docs/superpowers/specs/2026-09-28-phase-3-case-engine-design.md
active_plan: none
---

## Metadata

- Schema version 1; snapshot được duy trì bằng Git.

## Current Phase

- Phase 3 — Case Engine (roadmap §22).

## Active Goal

- Hoàn thiện thiết kế và triển khai Phase 3 Case Engine theo spec, sau khi người dùng duyệt spec và plan.

## Current Status

- Phase 2 hoàn thành bằng subagent-driven, đã push `dev`; người dùng tự merge `main`.
- Phase 3 design spec đã được tạo ở `7f9ca6b`, sau đó được chuyển sang tiếng Việt theo yêu cầu người dùng; đang chờ user review spec trước khi viết plan.

## Completed

- Phase 0A, 0B, 1 hoàn thành (xem Git history).
- Task 1 `a12768a`: content case summary, objectives, `ui/vi.json`, scene `prompt`.
- Task 2 `3e570c2`: GameEventMap (prompt, triggered), Zustand store per-mount, `connectBusToStore`.
- Task 3 `40f3fdb`, `332d2a2`: primitive `PaperPanel`/`Keycap`/palette CSS, HUD components, PauseMenu + focus trap.
- Task 4 `74ad5e4`: GameCanvas tích hợp HUD, Esc pause (`usePauseShortcut`), Phaser input lock, phím E emit `interaction:triggered`, 6 e2e mới.

## In Progress

- Phase 3: spec đã commit; chưa có implementation plan hoặc code.

## Active Decisions

- WASD theo trục màn hình; placeholder hình học runtime (art thật ở Phase 11); Arcade Physics collider chữ nhật.
- UI tiếng Việt lấy từ content; key hints chỉ E và Esc cho tới khi có J/M.
- Phaser nhận `InputLockSource { isInputLocked() }`, không import Zustand.
- Esc chỉ do `usePauseShortcut` xử lý; PauseMenu chỉ giữ focus trap Tab.
- `interaction:triggered` chưa có handler — Phase 3/4 gắn case engine.
- Phase 3 content Case #001 giữ tối thiểu: initial objective hiện có, một evidence/fact mẫu và scene Main Office; chưa điền corpus đầy đủ.
- Data contracts ở `shared-types`, Zod/JSON/loader ở `game-content`, pure reducer ở `game-core`; app bridge/store chỉ chiếu state, Phaser chỉ emit typed event.
- Spec và plan cần người dùng duyệt phải được viết bằng tiếng Việt để người dùng đọc.
- Deferred minor: `useBusToStore` là dead code; `:focus-visible` global nằm trong hud.css; stale WorldScene có thể emit nearby 1 frame khi StrictMode remount nếu spawn trong radius; palette.css/palette.ts đồng bộ tay; thiếu `loadUiStrings.test.ts`; registry cast chưa guard; `depthOf` NaN; test không được tsc typecheck; CORS chưa test preflight.

## Blockers

- Không có blocker hiện tại.

## Next Actions

- Người dùng review `docs/superpowers/specs/2026-09-28-phase-3-case-engine-design.md`.
- Khi được duyệt, viết implementation plan Phase 3 rồi chờ user review/chọn execution method.

## Verification

- Latest verified phase: Phase 2. Phase 3 design has not been implemented or verified yet.

- `npm run lint` — PASS 7 project.
- `npm run test` — PASS 7 project (game-web 57 unit).
- `npm run build` — PASS; không có `__lexiconDebug` trong dist.
- `npm run format:check` — PASS.
- `npm run test:e2e` — PASS 16/16.
- `npm run memory:check` — PASS.

## Latest Handoff

- Phase 2 xong; Phase 3 nối `interaction:triggered` vào case engine và thay nguồn objective/evidence trong store.

## Required Reading

- `AGENTS.md`
- `docs/superpowers/specs/2026-09-28-phase-2-react-hud-integration-design.md`
- `docs/superpowers/plans/2026-09-28-phase-2-react-hud-integration.md`
