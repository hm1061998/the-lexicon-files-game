# Phase 5 — Dialogue: verification và bàn giao

Spec/plan Phase 5 đã được người dùng duyệt; thực thi inline trên dev. Không triển khai Phase 6 hoặc backend.

## Kết quả

- Ba NPC Anna/Leo/David dùng dialogue JSON đã validate; runner TS thuần xử lý conditions/effects nguyên tử, stale actions và tiến độ interview/objective.
- Panel hội thoại theo theme giấy, có keyboard/focus trap, Escape, khôi phục focus và khóa gameplay qua store/bridge; canvas giữ nguyên instance.
- Save schema 2 migration từ schema 1, backup trước write, giữ evidence/objective cũ; session UI không lưu trong IndexedDB.
- Build validate toàn bộ registered content. Không thêm dependency và không sửa package-lock.json.

## Kiểm thử thêm

46 Vitest tests mới (baseline 158 → 204); 8 Playwright tests mới (21 → 29). Coverage gồm graph refs/conditions/effects, rollback và stale revisions, completion/objective, migration/recovery, overlay locks, render, conditional David, save/reload, focus/viewport và nhấp đúp vật lý. Memory tests giữ 30/30.

## Verification cuối

Các lệnh được chạy trên bản sửa review cuối. Exit code 0:

```text
npm run lint
NX   Successfully ran target lint for 7 projects

npm run test
Vitest: 204 passed; memory: 30 passed
NX   Successfully ran target test for 7 projects

npm run build
✓ 122 modules transformed.
✓ built in 8.71s
NX   Successfully ran target build for project @lexicon/game-web
```

npm run test:e2e: 29 passed (1.9m), exit 0. npm run memory:check PASS trước commit; kiểm lại sau cập nhật snapshot. npm run format:check và git diff --check PASS sau cập nhật tài liệu. Full logs và screenshot desktop được giữ tại `.superpowers/evidence/phase-5-dialogue/` (gitignored). Backend không đổi nên không chạy dotnet build/test.

## Review

Một lượt review độc lập toàn diff 813cbf8..1ff155a: một Important/P2, không Critical hoặc Minor. Nhấp đúp nút cuối có thể bấm lựa chọn mới ở cùng tọa độ, bỏ qua câu trả lời hoặc Which folder. Regression Playwright nhấp đúp với delay 120 ms FAIL trước fix, PASS sau guard click detail >1. Keyboard click detail 0 vẫn chạy; Enter/Space được kiểm chứng. Không dispatch lượt rereview; whole suite là gate sau fix.

## Quyết định thực thi

1. Dùng checkout dev hiện có theo lựa chọn đã lưu; chi phí nếu sai: commits Phase 5 nằm trực tiếp trên dev.
2. Thay helper Bash bằng PowerShell/Python ledger trên Windows; chi phí nếu sai: workflow bookkeeping được thích nghi với môi trường.
3. Revision tăng đơn điệu trong từng store để loại callback từ session đóng/mở lại; chi phí: counter transient bổ sung, không đổi save schema.
4. Playwright dùng một worker vì các canvas cạnh tranh làm checks movement theo frame không ổn định; chi phí: E2E lâu hơn.
5. E2E đọc authored JSON bằng Node fs do JSON import attributes ngoài Vite; chi phí: E2E không gọi loader Zod trực tiếp, được kiểm bằng content tests và build gate.
6. Khôi phục npm 10.9.7 cục bộ, npm ci từ lockfile, thêm System32 vào PATH và cho phép Playwright dừng server của nó; chi phí: cần PATH runtime này trong các phiên dùng cùng môi trường.
7. Contradiction discovery/accusation Phase 8 giữ ngoài Phase 5 theo spec đã duyệt; chi phí: branch David chưa tự mở qua gameplay thường.
8. NPC art/multi-room placement giữ prototype Main Office đã duyệt; chi phí: chưa phải art/layout vertical slice cuối.
9. Giữ runtime npm và logs/screenshots ở sibling folders gitignored trước khi xóa scratch plan; chi phí: dung lượng local ignored còn lại.

Không có Minor mới bị hoãn trong review Phase 5. Minor focus restoration của evidence Phase 4 vẫn nằm ngoài scope này.

## Hạn chế

- David contradiction=true được kiểm bằng save fixture; detector/finale thuộc phase sau.
- NPC dùng placeholder và Main Office prototype; People/Vocabulary giữ khung hiện có.
- Vite warning bundle >500 kB: JS 1,735.23 kB, gzip 416.27 kB; không chặn build.
- Commits giữ local trên dev; chưa push hoặc merge main.

## Files thay đổi

- `apps/game-web/e2e/dialogue.spec.ts`
- `apps/game-web/playwright.config.ts`
- `apps/game-web/src/bridge/connectCaseEngine.ts`
- `apps/game-web/src/dialogue/DialogueLayer.tsx`
- `apps/game-web/src/dialogue/DialogueView.test.tsx`
- `apps/game-web/src/dialogue/DialogueView.tsx`
- `apps/game-web/src/dialogue/dialogue.css`
- `apps/game-web/src/dialogue/dialogueStore.test.ts`
- `apps/game-web/src/game/GameCanvas.tsx`
- `apps/game-web/src/notebook/useNotebookShortcut.ts`
- `apps/game-web/src/pause/usePauseShortcut.ts`
- `apps/game-web/src/persistence/saveMigration.test.ts`
- `apps/game-web/src/persistence/saveMigration.ts`
- `apps/game-web/src/persistence/saveRepository.test.ts`
- `apps/game-web/src/persistence/saveRepository.ts`
- `apps/game-web/src/state/gameStore.ts`
- `apps/game-web/vite.config.ts`
- `docs/superpowers/plans/2026-09-28-phase-5-dialogue.md`
- `packages/game-content/cases/case-001/dialogues.json`
- `packages/game-content/cases/case-001/facts.json`
- `packages/game-content/cases/case-001/npcs.json`
- `packages/game-content/cases/case-001/objectives.json`
- `packages/game-content/cases/case-001/save-v1.json`
- `packages/game-content/cases/case-001/scenes/main_office.json`
- `packages/game-content/src/index.ts`
- `packages/game-content/src/loader/loadCaseDefinition.test.ts`
- `packages/game-content/src/loader/loadCaseDefinition.ts`
- `packages/game-content/src/loader/loadLegacySaveContract.ts`
- `packages/game-content/src/schema/caseDefinition.test.ts`
- `packages/game-content/src/schema/caseDefinition.ts`
- `packages/game-content/src/schema/dialogue.test.ts`
- `packages/game-content/src/schema/dialogue.ts`
- `packages/game-content/src/schema/scene.ts`
- `packages/game-content/src/schema/ui.ts`
- `packages/game-content/src/validation/dialogueReferences.ts`
- `packages/game-content/src/validation/validateRegisteredContent.test.ts`
- `packages/game-content/src/validation/validateRegisteredContent.ts`
- `packages/game-content/ui/vi.json`
- `packages/game-core/src/case-engine.test.ts`
- `packages/game-core/src/case/createCaseState.ts`
- `packages/game-core/src/dialogue/dialogueRunner.test.ts`
- `packages/game-core/src/dialogue/dialogueRunner.ts`
- `packages/game-core/src/dialogue/reconcileDialogueProgress.ts`
- `packages/game-core/src/index.ts`
- `packages/shared-types/src/case-engine.ts`
- `packages/shared-types/src/case.ts`
- `packages/shared-types/src/dialogue.ts`
- `packages/shared-types/src/index.ts`
- `packages/shared-types/src/scene.ts`
- `packages/shared-types/src/type-tests/case-engine.ts`
- `docs/ai/2026-09-28-phase-5-dialogue-verification.md`
- `docs/ai/MEMORY.md` (commit kế tiếp)
