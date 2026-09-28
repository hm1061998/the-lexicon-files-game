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

## Tài liệu

Xem [docs/README.md](docs/README.md). Lộ trình triển khai: [docs/04_CODEX_IMPLEMENTATION_ROADMAP.md](docs/04_CODEX_IMPLEMENTATION_ROADMAP.md).

Kiến trúc tổng hợp: [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md).

## Dành cho coding agent

- Rule chung: [AGENTS.md](AGENTS.md) (Claude Code đọc qua [CLAUDE.md](CLAUDE.md)).
- Rule theo khu vực: [apps/game-web/AGENTS.md](apps/game-web/AGENTS.md), [apps/api/AGENTS.md](apps/api/AGENTS.md).
- Skills: `.claude/skills` và `.agents/skills`. Spec/plan lưu tại `docs/superpowers/{specs,plans}`.
- Project memory: [docs/ai/README.md](docs/ai/README.md), trạng thái hiện hành tại [docs/ai/MEMORY.md](docs/ai/MEMORY.md).
