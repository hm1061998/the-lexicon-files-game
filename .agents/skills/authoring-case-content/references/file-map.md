# Bản đồ file của một case

Thư mục: `packages/game-content/cases/<case-id>/`. Schema: `packages/game-content/src/schema/`. Kiểu: `packages/shared-types/src/case-engine.ts`.

| File | Khóa gốc | Nội dung | Ghi chú |
| --- | --- | --- | --- |
| `case.json` | object | `id`, `title`, `difficulty`, `startSceneId`, `sceneIds`, `evidenceTotal`, `initialObjectiveId`, `briefing`, `conclusion`, `timeline`, `sharedTextures`, `characterSheets`, `audio?` | Tối đa một case `recommendedForNewPlayers: true` |
| `objectives.json` | `objectives` | `id`, `text`, `initialStatus?`, `activationCondition?`, `completionCondition?` | Xem reconcile trong engine-semantics |
| `evidences.json` | `evidences` | `id`, `caseId`, `name`, `category`, `description`, `relatedFactIds`, `relatedNpcIds?`, `descriptionVi?`, `vocabularySpans?`, `image?` | `caseId` phải khớp |
| `facts.json` | `facts` | `id`, `text`, `sourceEvidenceIds`, `sourceDialogueIds?`, `unlockCondition` | Cần ít nhất một nguồn |
| `contradictions.json` | `contradictions` | `id`, `factIds: [a, b]`, `explanation`, `objectiveId` | Hai fact khác nhau |
| `listening-tasks.json` | `tasks` | `id`, `evidenceId` (audio), `audioAsset`, `transcript`, `question`, `options`, `correctOptionId`, `keywordHints`, `completionFlag`, `correctEffects` | |
| `npcs.json` | `npcs` | `id`, `name`, `role`, `dialogueTreeId` | Tree phải có `npcId` trùng |
| `dialogues.json` | `dialogues` (**sinh từ `dialogues/*.yaml`**, không sửa tay; xem `dialogue-yaml.md`) | tree: `id`, `npcId`, `entryNodeId`, `nodes`, `completionFlag`, `completionCondition`, `notebookStatements?` | Entry không có `condition`; node `terminal` không có choice và ngược lại |
| `vocabulary.json` | `vocabulary` | `id`, `lemma`, `partOfSpeech`, `cefr`, `definitionEn`, `translationVi`, `examples`, `tags`, `surfaceForms`, `synonyms?` | Span là offset UTF-16, phải khớp surface form |
| `scenes/<scene>.json` | object | `id`, `spawnPoints.default`, `assets[].interaction`, `assets[].cue`, `walls`, ... | Scene phải nằm trong `sceneIds`; start scene cần spawn `default` |

## `completionCondition` của tree

Chỉ được tham chiếu flag `value: true` do chính các choice của tree ghi, và không phải `completionFlag`. `notebookStatements[].recordedCondition` theo quy tắc tương tự (flag từ node hoặc choice cùng tree).

## Đăng ký case mới

1. Import từng JSON trong `packages/game-content/src/loader/loadCaseDefinition.ts` và thêm vào `caseRegistry`.
2. Thêm test schema cho case (mẫu `src/schema/case002Spine.test.ts`, `case002Scenes.test.ts`).
3. Chạy `npm run test -w @lexicon/game-content` và `check-case-flow.mjs`.
