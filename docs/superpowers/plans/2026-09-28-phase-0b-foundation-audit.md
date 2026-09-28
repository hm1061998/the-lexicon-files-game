# Phase 0B — Project Foundation Gap Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đưa repo đạt đủ Deliverables + Acceptance của Phase 0 (roadmap §19), để mọi lệnh DoD chạy thật trên mọi project chứ không chỉ `ai-memory`.

**Architecture:** Không thêm tính năng gameplay. Chỉ lấp khoảng trống scaffold: Nx targets cho từng package, Phaser mount tối thiểu trong React, backend health/OpenAPI/CORS có test, format đồng nhất.

**Tech Stack:** npm workspaces + Nx 21, Vite 5, React 18, Phaser 3.88, Vitest 2, Playwright, ASP.NET Core .NET 10, xUnit.

**Spec:** `docs/04_CODEX_IMPLEMENTATION_ROADMAP.md` §19 (Phase 0 — Project Foundation); kiến trúc theo `docs/architecture/ARCHITECTURE.md`.

## Audit (2026-09-28, commit `7f33b31`)

| Deliverable §19 | Trạng thái | Bằng chứng |
|---|---|---|
| workspace, base folders | ✅ | `apps/*`, `packages/*` có đủ thư mục (hầu hết chỉ `.gitkeep`) |
| Vite React | ✅ tối thiểu | `App.tsx` chỉ render text; `npm run build` PASS |
| Phaser integration | ❌ | `phaser` có trong dependency nhưng không có code nào dùng |
| TypeScript strict | ✅ | `npm run typecheck` PASS |
| ESLint | ⚠️ | `eslint.config.js` có, nhưng `npm run lint` chỉ chạy `ai-memory` — 6 project TS không có target `lint` |
| Prettier | ⚠️ | `.prettierrc.json` có; `prettier --check .` báo 242 file lệch format |
| Vitest | ⚠️ | `vitest.workspace.ts` có, nhưng không project TS nào có target `test`, 0 file test |
| Playwright | ⚠️ | `playwright.config.ts` có, `e2e/` rỗng |
| .NET solution 5 project | ✅ | `LexiconFiles.slnx` + Api/Application/Domain/Infrastructure/Tests |
| OpenAPI | ⚠️ | package có, `Program.cs` chưa đăng ký |
| health endpoint | ❌ | `Program.cs` chỉ `Build()` + `Run()` |
| xUnit | ⚠️ | package có, 0 test |
| PostgreSQL config skeleton | ⚠️ | Npgsql + `ConnectionStrings:Postgres` rỗng, chưa đăng ký DbContext |
| **`dotnet build`** | ❌ **FAIL** | `NU1903`: `Microsoft.OpenApi` 2.0.0 có lỗ hổng high (GHSA-v5pm-xwqc-g5wc), warnings-as-errors chặn restore |

Khác: `AGENTS.md` §8 đã lỗi thời (máy đã có .NET SDK 10.0.401, repo đã có git). `npm install` báo audit warnings (chỉ ghi nhận, không `audit fix --force`).

## Global Constraints

- Chỉ npm + Nx; dependency nội bộ `"*"`; thêm dependency bằng `npm install <pkg> -w <workspace>`.
- `game-core`, `learning-engine` cấm import React/Phaser/Zustand/DOM/IndexedDB.
- Không hardcode text/ID Case #001 ngoài `packages/game-content`.
- Phaser scene phải cleanup listener khi shutdown/destroy; React unmount phải `game.destroy(true)`.
- .NET: nullable enabled, warnings as errors — **không** tắt `TreatWarningsAsErrors` hay `NoWarn` NU1903 để lách.
- Không làm Phase 1 (world prototype, movement, map).

## Review Focus

- React StrictMode mount/unmount 2 lần → không được tạo 2 canvas Phaser (test e2e Task 3 đếm đúng 1 `canvas`).
- Package không có test thật → `vitest run` fail "No test files" → mỗi package phải có ≥1 smoke test (Task 2).
- CORS: origin không nằm trong `Cors:AllowedOrigins` không được nhận header `Access-Control-Allow-Origin` (test Task 1).
- `ConnectionStrings:Postgres` rỗng → app vẫn khởi động và `/health` trả 200, không crash (test Task 1).
- Prettier format hàng loạt không được đổi nội dung `docs/ai/MEMORY.md` làm `memory:check` fail (verify Task 4).

---

### Task 1: Backend build xanh + health/OpenAPI/CORS có test

**Files:**
- Modify: `apps/api/LexiconFiles.Api/LexiconFiles.Api.csproj`, `apps/api/LexiconFiles.Api/Program.cs`
- Create: `apps/api/LexiconFiles.Api/Endpoints/HealthEndpoints.cs`
- Create: `apps/api/LexiconFiles.Tests/Api/HealthEndpointTests.cs`
- Modify: `apps/api/LexiconFiles.Tests/LexiconFiles.Tests.csproj` (thêm `Microsoft.AspNetCore.Mvc.Testing` 10.0.x)

**Interfaces:**
- Produces: `GET /health` → 200 `{"status":"ok"}`; `GET /openapi/v1.json` → 200 (Development); `public partial class Program;` cho `WebApplicationFactory<Program>`.

- [ ] **Step 1:** Sửa NU1903: nâng `Microsoft.AspNetCore.OpenApi` lên bản 10.0.x mới nhất; nếu vẫn kéo `Microsoft.OpenApi` 2.0.0, thêm `PackageReference` trực tiếp tới bản đã vá theo advisory. Run `dotnet restore apps/api/LexiconFiles.slnx` → không còn NU1903.
- [ ] **Step 2:** Viết test fail trong `HealthEndpointTests`: `Health_ReturnsOk` (status 200, body `status == "ok"`), `OpenApi_DocumentIsServed` (env Development, 200), `Cors_AllowsConfiguredOrigin` (Origin `http://localhost:5173` → header có), `Cors_RejectsUnknownOrigin` (Origin `http://evil.test` → không header), `Startup_WithEmptyPostgres_StillHealthy`.
- [ ] **Step 3:** Run `dotnet test apps/api/LexiconFiles.slnx` → FAIL (404).
- [ ] **Step 4:** Implement `HealthEndpoints.MapHealthEndpoints(this IEndpointRouteBuilder app)`; trong `Program.cs`: `AddOpenApi()`, `MapOpenApi()` khi Development, CORS policy đọc `Cors:AllowedOrigins`, gọi `MapHealthEndpoints()`, thêm `public partial class Program;`. Không đăng ký DbContext (chưa có entity — YAGNI, để Phase backend).
- [ ] **Step 5:** Run `dotnet build apps/api/LexiconFiles.slnx` (0 warning) + `dotnet test` → PASS 5/5.
- [ ] **Step 6:** Commit `feat(api): add health, OpenAPI and CORS skeleton`.

### Task 2: Nx `lint` + `test` cho mọi project TS

**Files:**
- Modify: `package.json` của `packages/{game-content,game-core,learning-engine,shared-types,ui}` và `apps/game-web`
- Create: `packages/<pkg>/src/index.test.ts` (5 file), `apps/game-web/src/App.test.tsx`
- Create: `apps/game-web/vitest.config.ts` nếu cần môi trường `jsdom` (thêm `jsdom` + `@testing-library/react` `-w apps/game-web`, lý do: render test React)

**Interfaces:**
- Produces: script `"lint": "eslint src"` và `"test": "vitest run"` trong mỗi project → Nx tự suy ra target.

- [ ] **Step 1:** Thêm 2 script trên vào 6 `package.json`. Run `npm run test` → FAIL "No test files found" ở các package.
- [ ] **Step 2:** Viết smoke test: mỗi package `import * as mod from './index'` và `expect(mod).toBeTypeOf('object')`; `App.test.tsx` render `<App />` và assert có container root. Với `game-core`/`learning-engine` thêm test kiến trúc: đọc mọi file `src/**/*.ts` và assert không chứa `from 'react'|'phaser'|'zustand'|'idb'`.
- [ ] **Step 3:** Run `npm run lint` và `npm run test` → Nx liệt kê đủ 7 project, PASS.
- [ ] **Step 4:** Commit `test: add lint and test targets for all workspaces`.

### Task 3: Phaser mount tối thiểu trong React

**Files:**
- Create: `apps/game-web/src/game/createGame.ts`, `apps/game-web/src/game/scenes/BootScene.ts`, `apps/game-web/src/game/GameCanvas.tsx`
- Modify: `apps/game-web/src/App.tsx`
- Create: `apps/game-web/e2e/boot.spec.ts`

**Interfaces:**
- Produces: `createGame(parent: HTMLElement): Phaser.Game`; `<GameCanvas />` mount trong `useEffect`, cleanup `game.destroy(true)`; `BootScene` key `'Boot'`, `shutdown` gỡ mọi listener đã đăng ký.

- [ ] **Step 1:** Viết e2e `boot.spec.ts`: `app boots with exactly one Phaser canvas` — goto `/`, `expect(page.locator('canvas')).toHaveCount(1)`, không có console error.
- [ ] **Step 2:** Run `npm run test:e2e` → FAIL (0 canvas). (Nếu thiếu browser: `npx playwright install chromium` — hỏi người dùng trước vì là tải file.)
- [ ] **Step 3:** Implement 3 file trên; `BootScene` chỉ vẽ nền `#1b1a17`-tương đương theo docs/art/06, không text Case #001.
- [ ] **Step 4:** Run `npm run test:e2e` → PASS; `npm run build` → PASS.
- [ ] **Step 5:** Commit `feat(game-web): mount Phaser game from React`.

### Task 4: Prettier đồng nhất + `format:check`

**Files:** Modify: `package.json` (root), toàn repo (format); `.prettierignore` nếu cần loại `dist`, `apps/api/**/obj`, `package-lock.json`.

- [ ] **Step 1:** Thêm script `"format:check": "prettier --check ."`; tạo/điền `.prettierignore`.
- [ ] **Step 2:** Run `npm run format` rồi `npm run format:check` → PASS.
- [ ] **Step 3:** Run `npm run memory:check` + `npm run lint` + `npm run test` → PASS (Review Focus: memory không vỡ).
- [ ] **Step 4:** Commit riêng `style: apply prettier across repo` (commit chỉ format, không lẫn logic).

### Task 5: Acceptance Phase 0 + đồng bộ tài liệu

**Files:** Modify: `AGENTS.md` §8, `docs/ai/MEMORY.md`

- [ ] **Step 1:** Run và dán output: `npm install`, `npm run lint`, `npm run test`, `npm run build`, `npm run format:check`, `npm run test:e2e`, `dotnet build apps/api/LexiconFiles.slnx`, `dotnet test apps/api/LexiconFiles.slnx`; `npm run dev` khởi động được và trả trang tại `http://localhost:5173`.
- [ ] **Step 2:** Sửa `AGENTS.md` §8: ".NET SDK 10.0.401 đã cài", "repo đã dùng git (branch `dev`/`main`)".
- [ ] **Step 3:** Cập nhật `MEMORY.md` theo protocol `docs/ai/README.md` (phase `phase-0b`, kết quả verify, next action: xin phép bắt đầu Phase 1); run `npm run memory:check` → PASS.
- [ ] **Step 4:** Commit `docs: record Phase 0B foundation completion`.
