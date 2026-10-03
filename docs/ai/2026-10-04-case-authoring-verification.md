# PR-04 công cụ soạn hội thoại bằng YAML — xác minh

Plan: `docs/superpowers/plans/2026-10-04-case-authoring-dialogue-yaml.md`. Spec: `docs/superpowers/specs/2026-10-04-case-authoring-dialogue-yaml-design.md`.

## Baseline (trước PR-04, commit 57d5ba2)

- `dialogues.json` Case #001: 19392 byte, SHA-256 `4cd6976fc17752f5…`; Case #002: 18547 byte, SHA-256 `9e672f55c8e13d3f…`. So sánh bằng nhau sâu với bản này.
- E2E đỏ có sẵn (17): `feedback-audio`, `feedback-navigation(-review)` ×3, `feedback-ui-controls`, `feedback-viewport` ×5, `hud` ×4, `learning`, `notebook-people`, `settings` (xem `2026-10-04-ui-investigation-desk-verification.md`).
- pytest đỏ có sẵn: `tools/art-codegen/test_chair_directions.py`.
- Dependency mới: `yaml` 2.9.1 (devDependency gốc).

## Kết quả (PR-04)

Công cụ: `tools/case-authoring` (`npm run case:build -- CASE [--check]`, `npm run case:import -- CASE [--force]`). Hội thoại viết ở `packages/game-content/cases/CASE/dialogues/TREE.yaml`; `dialogues.json` được sinh ra và canh bởi test drift trong `npm run test`. Cú pháp và mã lỗi: `.claude/skills/authoring-case-content/references/dialogue-yaml.md` (bản `.agents` giống hệt).

### Đã chạy

- `npm run lint`, `test` (dự án `case-authoring` 89 test, `game-content` 288), `build`, `typecheck`, `prettier --check .`, `memory:check`: xanh.
- Case #001 và #002: YAML → `dialogues.json` bằng nhau sâu với bản trước PR-04 (git 57d5ba2); `case:build --check` xanh; `check-case-flow.mjs` giống trước.
- E2E đầy đủ (trước đợt sửa theo review): 340 pass, 165 skipped, 17 đỏ = 17 đỏ có sẵn. Đợt sửa review chỉ chạm công cụ, skill và tài liệu (JSON nội dung không đổi).
- pytest: 70 pass, 1 đỏ có sẵn; `node --test build_peaks`: 6/6.

### Review độc lập (opus, toàn nhánh)

5 Important đã sửa bằng RED→GREEN: cache Nx có thể phát lại test drift sau khi sửa tay JSON (đã kiểm: sửa một ký tự thì test đỏ); `ask` sai kiểu thành node kết thúc im lặng; mục `ask` rỗng làm sập build; kiểu giá trị và id node là số nguyên làm đổi thứ tự node; `tree:`/`npc:` không khớp `npcs.json` và file YAML không NPC nào dùng. Các Minor rẻ (vị trí lỗi trong nhóm `needs` lồng, dấu `[` trong lời lựa chọn, cờ lạ và id kiểu đường dẫn, BOM, import có hoàn lại khi kiểm tra thất bại, v.v.) sửa cùng đợt. Minor còn lại: xem ledger.

### Hạn chế

- Chỉ phần hội thoại; evidence, fact, objective, contradiction, scene, vocabulary vẫn sửa JSON.
- `yaml` nằm ở `package.json` gốc vì `tools/` không phải npm workspace.
- Hai cảnh báo `flag-never-read` ở Case #002 là cờ thật sự không ai đọc (để tác giả quyết định).
