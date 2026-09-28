# The Lexicon Files

> Every word is a clue.

Web game trinh thám 2.5D isometric kết hợp học tiếng Anh theo ngữ cảnh.

## Cấu trúc

```text
apps/
  game-web/        React + Vite + Phaser 3 (client, local-first)
  api/             ASP.NET Core .NET 10 (modular monolith, optional cho vertical slice)
packages/
  shared-types/    Kiểu dữ liệu dùng chung
  game-core/       Case / Objective / Evidence / Dialogue / Save engine (framework-independent)
  learning-engine/ Vocabulary, spaced repetition, language profile
  game-content/    Content data-driven (cases/case-001/*.json, vocabulary, grammar)
  ui/              React UI components dùng chung
assets/            Art/audio theo docs/art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md
docs/              Tài liệu thiết kế (đọc docs/README.md trước)
tools/             Script hỗ trợ (content validation, asset pipeline...)
```

## Chạy môi trường phát triển

### Yêu cầu

- Node.js ≥ 22 và npm ≥ 10. **Chỉ dùng npm**, không dùng pnpm/yarn/bun (`preinstall` sẽ chặn).
- .NET SDK 10 (chỉ cần khi chạy backend `apps/api`).
- Trình duyệt Chromium cho Playwright (chỉ cần khi chạy e2e): `npx playwright install chromium`.

### Cài đặt

```bash
npm install
```

### Chạy game (frontend)

```bash
npm run dev
```

Mở <http://localhost:5173>. Điều khiển: **W/A/S/D** để di chuyển. Đi gần vật tương tác được sẽ hiện marker hình thoi đỏ.

Ở chế độ dev có debug hook `window.__lexiconDebug` (vị trí player, depth, vật đang ở gần) — không có trong bản build production.

### Chạy backend (tùy chọn)

Gameplay không phụ thuộc API. Khi cần chạy backend:

```bash
ASPNETCORE_ENVIRONMENT=Development dotnet run --project apps/api/LexiconFiles.Api
```

PowerShell: `$env:ASPNETCORE_ENVIRONMENT='Development'; dotnet run --project apps/api/LexiconFiles.Api`.

- Health check: <http://localhost:5000/health> → `{"status":"ok"}`
- OpenAPI (chỉ Development): <http://localhost:5000/openapi/v1.json>
- CORS cho phép origin trong `Cors:AllowedOrigins` (`appsettings.json`, mặc định `http://localhost:5173`).

### Kiểm tra (Definition of Done)

```bash
npm run lint
npm run test
npm run build
npm run format:check
npm run test:e2e
npm run memory:check
```

Backend: `dotnet build apps/api/LexiconFiles.slnx` và `dotnet test apps/api/LexiconFiles.slnx`.

Các lệnh khác: `npm run typecheck`, `npm run format` (tự format), `npm run affected` (chỉ chạy project bị ảnh hưởng), `npm run graph` (xem dependency graph Nx).

## Tài liệu

Xem [docs/README.md](docs/README.md). Lộ trình triển khai: [docs/04_CODEX_IMPLEMENTATION_ROADMAP.md](docs/04_CODEX_IMPLEMENTATION_ROADMAP.md).

Kiến trúc tổng hợp: [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md).

## Dành cho coding agent

- Rule chung: [AGENTS.md](AGENTS.md) (Claude Code đọc qua [CLAUDE.md](CLAUDE.md)).
- Rule theo khu vực: [apps/game-web/AGENTS.md](apps/game-web/AGENTS.md), [apps/api/AGENTS.md](apps/api/AGENTS.md).
- Skills: `.claude/skills` và `.agents/skills`. Spec/plan lưu tại `docs/superpowers/{specs,plans}`.
- Project memory: [docs/ai/README.md](docs/ai/README.md), trạng thái hiện hành tại [docs/ai/MEMORY.md](docs/ai/MEMORY.md).
