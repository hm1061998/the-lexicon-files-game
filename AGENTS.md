# AGENTS.md — The Lexicon Files

Rule chung cho mọi coding agent (Codex, Claude Code, …). Rule theo khu vực nằm trong `apps/game-web/AGENTS.md` và `apps/api/AGENTS.md`.

## 1. Đọc trước khi làm

| File | Vai trò |
|---|---|
| `docs/01_GAME_DESIGN_DOCUMENT.md` | Product rules |
| `docs/02_ENGLISH_LEARNING_SYSTEM_DESIGN.md` | Learning rules |
| `docs/03_CASE_001_VERTICAL_SLICE_SPEC.md` | MVP content contract |
| `docs/04_CODEX_IMPLEMENTATION_ROADMAP.md` | Phase, Definition of Done |
| `docs/05_DOTNET_BACKEND_TECHNICAL_DESIGN.md` | Backend rules |
| `docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md` | Asset/scene/character contract |
| `docs/architecture/ARCHITECTURE.md` | Kiến trúc tổng hợp, dependency rules |
| `docs/concept/*.webp` | Visual target |

Không tự ý thay đổi product rule trong docs. Nếu thấy docs mâu thuẫn hoặc thiếu → hỏi, không đoán.

### AI project memory

Với công việc có thể ảnh hưởng code, plan, tiến độ, quyết định hoặc blocker: đọc `docs/ai/README.md` và `docs/ai/MEMORY.md`, sau đó reconcile với Git trước khi làm. Kết thúc phiên phải cập nhật memory theo protocol trong `docs/ai/README.md`; không lặp lại protocol tại đây.

## 2. Workflow (skills trong `.claude/skills` / `.agents/skills`)

Kiểm tra skill phù hợp **trước** khi phản hồi hoặc hành động (`using-superpowers`).

| Tình huống | Skill |
|---|---|
| Feature/hành vi mới, chưa rõ thiết kế | `brainstorming` → spec vào `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` |
| Có spec, bắt đầu một phase | `writing-plans` → plan vào `docs/superpowers/plans/YYYY-MM-DD-<phase>.md` |
| Thực thi plan | `subagent-driven-development` (có subagent) hoặc `executing-plans` |
| Các task độc lập | `dispatching-parallel-agents` |
| Viết code logic | `test-driven-development` — test trước, đặc biệt cho `game-core`, `learning-engine`, content validation, Domain/Application |
| Bug / test fail | `systematic-debugging` — tìm root cause trước khi sửa |
| React HUD / notebook / modal | `ui-ux-pro-max` (nhưng palette/typography theo docs/art/06, không theo gợi ý chung) |
| Trước khi báo "xong" | `verification-before-completion` |
| Review | `requesting-code-review` / `receiving-code-review` |
| Tách nhánh / kết thúc nhánh | `using-git-worktrees` / `finishing-a-development-branch` |

**Một phase một lần.** Không làm phase sau khi chưa được yêu cầu. Không giao cả 12 phase trong một lượt.

## 3. Package manager & monorepo (BẮT BUỘC)

- **Chỉ dùng npm** + **Nx** (chạy qua `npx nx` hoặc npm scripts). Monorepo = npm workspaces + Nx.
- **Cấm pnpm, yarn, bun**: không chạy `pnpm`/`yarn`/`bun`, không tạo `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `yarn.lock`, `bun.lockb`, `.pnpmfile.cjs`.
- Lockfile duy nhất: `package-lock.json` (commit vào repo).
- Thêm dependency: `npm install <pkg> -w <workspace>`; không sửa tay version rồi bỏ qua install.
- Dependency nội bộ khai báo `"*"` (npm workspaces), **không** dùng protocol `workspace:`.
- Task chạy qua Nx: `npx nx run-many -t lint test build`, `npx nx affected -t test`, `npx nx run <project>:<target>`.
- Không tự chuyển sang tool khác (Turborepo, Lerna, pnpm) dù docs roadmap có nhắc "Nx or pnpm" — quyết định đã chốt là npm + Nx.

## 4. Kiến trúc bắt buộc

1. `game-core`, `learning-engine` là TS thuần: **cấm** import React, Phaser, Zustand, DOM, IndexedDB.
2. Case content chỉ nằm trong `packages/game-content` (JSON + Zod). Không hardcode text/ID của Case #001 trong React/Phaser.
3. Phaser ↔ React chỉ qua typed event bus (`GameEventMap`) và Zustand store. React không gọi Phaser internals; Phaser không chứa learning logic.
4. Không duplicate state giữa Phaser / Zustand / IndexedDB (xem bảng state boundaries trong ARCHITECTURE.md).
5. Condition/Effect là discriminated union — **không `eval`**.
6. Gameplay không phụ thuộc API. Phaser scene không gọi backend.
7. Không global mutable singleton ngoài store được phê duyệt.
8. Scene phải cleanup listener khi shutdown/destroy.

## 5. Code rules

- TypeScript strict; không `any` nếu không có lý do ghi rõ trong comment.
- .NET: nullable enabled, warnings as errors.
- Không thêm dependency nếu native đủ dùng. Dependency mới phải nêu lý do.
- Keyboard shortcut bỏ qua khi focus ở `input` / `textarea` / `contenteditable`.
- Dev log prefix: `[CaseEngine] [Dialogue] [Objective] [Learning] [Save]`; giảm log ở production.
- Content load lỗi → thông báo cho developer đọc được, không im lặng chạy tiếp. Không crash trắng màn hình.

## 6. Product guardrails (không được vi phạm)

- Investigation first: không flow `Walk → Quiz → Reward`.
- Không energy, lives, timer ép trả lời, streak punishment, ads, animation "WRONG!".
- Sai → "This interpretation doesn't match the evidence." + gợi ý; chọn sai nghi phạm không reset progress.
- Tooltip từ vựng chỉ mở khi click. Hint giúp hiểu, không tự giải.
- Đỏ (`#A4412D` / `#743026`) chỉ dùng cho clue, evidence, objective, contradiction, selected node, map marker.
- Out of scope MVP: multiplayer, AI NPC, voice recognition, procedural case, SignalR, Redis.

## 7. Definition of Done (mỗi phase)

Chạy và **dán output** trước khi báo xong:

```bash
npm run lint
npm run test
npm run build
```
Backend (khi có thay đổi trong `apps/api`): `dotnet build` + `dotnet test`.

Báo cáo gồm: tóm tắt, file thay đổi, test thêm, lệnh đã chạy + kết quả, hạn chế còn lại. Không đánh dấu complete nếu chỉ có UI mock hoặc test chưa chạy.

## 8. Môi trường hiện tại

- Windows, Node 22, npm + Nx (npm workspaces).
- Chưa có .NET 10 SDK trên máy → nếu không build được backend, nói rõ, không tuyên bố đã pass.
- Repo chưa `git init`.
