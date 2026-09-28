# The Lexicon Files — Documentation Pack

> **Tagline:** Every word is a clue.

Bộ tài liệu này được thiết kế để đưa trực tiếp cho Codex triển khai một web game trinh thám 2.5D isometric kết hợp học tiếng Anh theo ngữ cảnh.

## Tài liệu

1. `01_GAME_DESIGN_DOCUMENT.md`
   - Tầm nhìn game
   - Core gameplay loop
   - World, progression, UI/UX, case structure
   - Quy tắc thiết kế để tránh biến game thành quiz app

2. `02_ENGLISH_LEARNING_SYSTEM_DESIGN.md`
   - Vocabulary, grammar, listening, reading, speaking
   - CEFR A1–C1
   - Spaced repetition
   - Adaptive difficulty
   - Learning telemetry
   - Hint/translation system

3. `03_CASE_001_VERTICAL_SLICE_SPEC.md`
   - Case mẫu “The Missing Report”
   - Map, NPC, evidence, dialogue
   - Timeline, contradiction, objective
   - Acceptance criteria cho vertical slice

4. `04_CODEX_IMPLEMENTATION_ROADMAP.md`
   - Kiến trúc kỹ thuật
   - Cấu trúc repo
   - Phase triển khai
   - Definition of Done
   - Prompt sử dụng Codex

5. `05_DOTNET_BACKEND_TECHNICAL_DESIGN.md`
   - Kiến trúc backend .NET
   - ASP.NET Core / EF Core / PostgreSQL
   - Auth, save sync, API conventions, testing, security

6. `art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md`
   - Character, scene và asset runtime contract
   - Camera, anchor, collider, depth, export và naming

7. `architecture/ARCHITECTURE.md`
   - Kiến trúc tổng hợp và dependency rules

8. `concept/*.webp`
   - Visual target; xem `concept/README.md` để biết giới hạn sử dụng

## Thứ tự ưu tiên khi tài liệu mâu thuẫn

Áp dụng tài liệu chuyên biệt cho đúng phạm vi của quyết định:

| Phạm vi | Nguồn authoritative |
|---|---|
| Product/gameplay rule | `01_GAME_DESIGN_DOCUMENT.md` |
| Learning rule | `02_ENGLISH_LEARNING_SYSTEM_DESIGN.md` |
| Case #001 truth, content và dialogue | `03_CASE_001_VERTICAL_SLICE_SPEC.md` |
| Phase, scope triển khai và Definition of Done | `04_CODEX_IMPLEMENTATION_ROADMAP.md` |
| Backend | `05_DOTNET_BACKEND_TECHNICAL_DESIGN.md` |
| Asset runtime, kích thước, anchor, collider và export | `art/06_PHASER_CHARACTER_SCENE_ASSET_MODEL_SPEC.md` |
| Dependency/import boundary | `architecture/ARCHITECTURE.md` |
| Package manager và agent workflow | `AGENTS.md` |

Ảnh trong `concept/` là visual target, không phải numeric runtime contract. Khi annotation trong ảnh khác tài liệu `art/06`, tài liệu `art/06` thắng. Nếu hai nguồn authoritative cùng phạm vi vẫn mâu thuẫn, dừng triển khai và yêu cầu làm rõ thay vì tự chọn.

## Stack đề xuất

```text
Monorepo: npm workspaces + Nx
Frontend shell/UI: React + TypeScript
Game engine: Phaser 3
State: Zustand
Build: Vite
Map editor: Tiled
Dialogue: custom JSON first, InkJS later if needed
Audio: Howler.js
Backend: ASP.NET Core (.NET 10)
API style: REST + OpenAPI
ORM: Entity Framework Core
Database: PostgreSQL + Npgsql
Auth: ASP.NET Core Identity/JWT when accounts are introduced
Realtime: SignalR only if a future feature requires it
Save local: IndexedDB
Realtime gameplay: not required for MVP
```

## Nguyên tắc quan trọng

- English phải là một phần của gameplay, không phải bài quiz rời rạc.
- Người chơi phá án bằng cách đọc, nghe, hiểu, đối chiếu và đặt câu hỏi bằng tiếng Anh.
- MVP chỉ tập trung một vertical slice hoàn chỉnh.
- Không thêm multiplayer, AI NPC, procedural case generation trong MVP.
- Ưu tiên testability, data-driven content và tách biệt engine/UI/content.
