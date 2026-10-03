# PR-04 công cụ soạn hội thoại bằng YAML — xác minh

Plan: `docs/superpowers/plans/2026-10-04-case-authoring-dialogue-yaml.md`. Spec: `docs/superpowers/specs/2026-10-04-case-authoring-dialogue-yaml-design.md`.

## Baseline (trước PR-04, commit 57d5ba2)

- `dialogues.json` Case #001: 19392 byte, SHA-256 `4cd6976fc17752f5…`; Case #002: 18547 byte, SHA-256 `9e672f55c8e13d3f…`. So sánh bằng nhau sâu với bản này.
- E2E đỏ có sẵn (17): `feedback-audio`, `feedback-navigation(-review)` ×3, `feedback-ui-controls`, `feedback-viewport` ×5, `hud` ×4, `learning`, `notebook-people`, `settings` (xem `2026-10-04-ui-investigation-desk-verification.md`).
- pytest đỏ có sẵn: `tools/art-codegen/test_chair_directions.py`.
- Dependency mới: `yaml` 2.9.1 (devDependency gốc).
